import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, InventoryCategory } from './types';
import { CATEGORIES } from './constants';

const STORAGE_KEY = 'toufiq_balancing_v4';
const MASTER_SHEET_ID = '1h7Nmn8alVoWNE_vn3690-yWMvRcXs93_9VXONaAA4po';

const SHEET_CONFIG: Record<InventoryCategory, { id: string }> = {
  'DEBIT CARD': { id: '1e_22aHpRoJYBe9J0ohT-PzwHmXGhrOtNlsQeOVHg67M' },
  'CHEQUE BOOK': { id: '1cakIYc79gR-YVnqKe4-i8J95AEuIKa4Q' },
  'DPS SLIP': { id: '1Ah7wHvJDbzAF9VUJLlBs6YHKfInY6ZWeXlmyZtlUj9Q' },
  'PIN': { id: '1voTnPN_6crhBoev-5mLg9pLRMREWp7alpMNM8SwhL6k' }
};

/**
 * Normalizes account numbers by removing all non-alphanumeric characters.
 * This ensures "123-456", "123 456", and "123456" are treated as the same record.
 */
const normalizeAC = (val: string) => String(val || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

/**
 * Standardizes header names for reliable mapping.
 */
const normalizeHeader = (val: string) => 
  String(val || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\r' || char === '\n') {
        row.push(cell.trim());
        if (row.some(c => c !== '')) result.push(row);
        row = [];
        cell = '';
        if (char === '\r' && next === '\n') i++;
      } else {
        cell += char;
      }
    }
  }
  row.push(cell.trim());
  if (row.some(c => c !== '')) result.push(row);
  return result;
};

export const useInventoryStore = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isInitializing, setIsInitializing] = useState(true);

  const calculateDestroyDate = (receiveDate: string) => {
    const date = new Date(receiveDate);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    date.setFullYear(date.getFullYear() + 3);
    return date.toISOString().split('T')[0];
  };

  const syncFromGoogleSheet = useCallback(async (sheetId: string, category: InventoryCategory | 'MASTER_DATA') => {
    try {
      const sheetName = category === 'MASTER_DATA' ? 'master data' : category.toLowerCase();
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fetch failed for ${category}`);
      
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      if (rows.length < 2) return { success: true };

      const headers = rows[0].map(h => normalizeHeader(h));
      const today = new Date().toISOString().split('T')[0];
      
      setItems(prev => {
        // Deep copy of current state to prevent mutation issues
        const updatedList = [...prev];
        
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const rowMap: Record<string, string> = {};
          headers.forEach((h, idx) => { rowMap[h] = rowData[idx] || ''; });

          // Extract Account Number with wide variety of fallback headers
          let acRaw = (
            rowMap['accountnumber'] || rowMap['account'] || rowMap['acno'] || 
            rowMap['ac'] || rowMap['accountno'] || rowMap['accno'] || 
            rowMap['acnumber'] || rowMap['dpsslip'] || rowMap['dpsno'] || 
            rowMap['slipno'] || rowMap['slno'] || rowMap['serial'] || ''
          ).trim();

          // Fallback to first column if it's numeric and headers fail
          if (!acRaw && rowData[0] && /^\d+$/.test(rowData[0].trim())) {
            acRaw = rowData[0].trim();
          }
          
          if (!acRaw) continue;

          // Normalized for matching
          const acNorm = normalizeAC(acRaw);
          const targetCategory = (category === 'MASTER_DATA' 
            ? (rowMap['category'] || 'DEBIT CARD').toUpperCase() 
            : category) as InventoryCategory;
          
          // Delivery status check from 'DELIVERED' column
          const rawDelivered = (rowMap['delivered'] || '').trim();
          const sheetIsDelivered = rawDelivered !== '';
          let sheetDeliveryDate = undefined;
          
          if (sheetIsDelivered) {
            const parsed = new Date(rawDelivered);
            sheetDeliveryDate = !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : today;
          }

          // Search for existing item with normalized AC and category
          const existingIndex = updatedList.findIndex(item => 
            normalizeAC(item.accountNumber) === acNorm && 
            item.category === targetCategory
          );

          const rawRcvDate = (rowMap['receivedate'] || rowMap['date'] || rowMap['rcvdate'] || '').trim();
          let rcvDate = today;
          if (rawRcvDate) {
            const parsed = new Date(rawRcvDate);
            if (!isNaN(parsed.getTime())) rcvDate = parsed.toISOString().split('T')[0];
          }
          
          const itemData: Partial<InventoryItem> = {
            accountNumber: acRaw,
            customerName: (rowMap['customername'] || rowMap['name'] || rowMap['customer'] || rowMap['client'] || 'UNKNOWN').toUpperCase(),
            phoneNumber: (rowMap['phonenumber'] || rowMap['phone'] || rowMap['mobile'] || rowMap['contact'] || '').trim(),
            address: (rowMap['address'] || rowMap['location'] || rowMap['addr'] || '').trim().toUpperCase(),
            receiveDate: rcvDate,
            category: targetCategory,
            destroyDate: calculateDestroyDate(rcvDate)
          };

          if (existingIndex > -1) {
            const existingItem = updatedList[existingIndex];
            
            // STICKY PERSISTENCE: If item is ALREADY delivered locally OR via sheet, keep it delivered.
            // This prevents "un-delivering" items on refresh if the sheet row isn't updated yet.
            const finalDelivered = existingItem.isDelivered || sheetIsDelivered;
            
            // Prioritize sheet's delivery date if it exists, else keep local date.
            const finalDeliveryDate = sheetIsDelivered ? sheetDeliveryDate : existingItem.deliveryDate;

            updatedList[existingIndex] = { 
              ...existingItem, 
              ...itemData,
              isDelivered: finalDelivered,
              deliveryDate: finalDeliveryDate
            };
          } else {
            // New record addition
            updatedList.push({
              id: crypto.randomUUID(),
              isDelivered: sheetIsDelivered,
              deliveryDate: sheetIsDelivered ? sheetDeliveryDate : undefined,
              ...itemData as InventoryItem
            });
          }
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        return updatedList;
      });

      return { success: true };
    } catch (e) {
      console.error(`Sync Engine Error [${category}]:`, e);
      return { success: false };
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // Step 1: Sync from Master Registry
      await syncFromGoogleSheet(MASTER_SHEET_ID, 'MASTER_DATA' as any);
      // Step 2: Sync from individual Category Clusters
      for (const cat of CATEGORIES) {
        await syncFromGoogleSheet(SHEET_CONFIG[cat].id, cat);
      }
      setIsInitializing(false);
    };
    init();
  }, [syncFromGoogleSheet]);

  const deliverItem = (id: string, date: string) => {
    setItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, isDelivered: true, deliveryDate: date } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addItem = (item: any) => {
    setItems(prev => {
      const rcvDate = item.receiveDate || new Date().toISOString().split('T')[0];
      const newItem: InventoryItem = { 
        ...item, 
        id: crypto.randomUUID(), 
        isDelivered: false, 
        receiveDate: rcvDate,
        customerName: (item.customerName || 'UNKNOWN').toUpperCase(),
        destroyDate: calculateDestroyDate(rcvDate) 
      };
      const updated = [...prev, newItem];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateItem = (id: string, updates: any) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newRcvDate = updates.receiveDate || item.receiveDate;
          return { 
            ...item, 
            ...updates, 
            customerName: (updates.customerName || item.customerName).toUpperCase(),
            destroyDate: calculateDestroyDate(newRcvDate) 
          };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    if (!window.confirm("PERMANENT ACTION: Purge this record from local persistence?")) return;
    setItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const getFullStats = () => {
    return CATEGORIES.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const delivered = catItems.filter(i => i.isDelivered).length;
      const received = catItems.length;
      return { category: cat, received, delivered, balance: received - delivered, destruction: 0 };
    }).concat([{
      category: 'TOTAL',
      received: items.length,
      delivered: items.filter(i => i.isDelivered).length,
      balance: items.filter(i => !i.isDelivered).length,
      destruction: 0
    }] as any);
  };

  return { items, isInitializing, deliverItem, addItem, updateItem, deleteItem, getFullStats, syncFromGoogleSheet };
};
