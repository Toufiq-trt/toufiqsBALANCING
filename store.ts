
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

const normalizeAC = (val: string) => String(val || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
const normalizeHeader = (val: string) => String(val || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') { cell += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { cell += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ',') { row.push(cell.trim()); cell = ''; }
      else if (char === '\r' || char === '\n') {
        row.push(cell.trim());
        if (row.some(c => c !== '')) result.push(row);
        row = []; cell = '';
        if (char === '\r' && next === '\n') i++;
      } else { cell += char; }
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
    // Rule Change: Expiry is 3 months from receive date
    date.setMonth(date.getMonth() + 3);
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
        const updatedList = [...prev];
        
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const rowMap: Record<string, string> = {};
          headers.forEach((h, idx) => { rowMap[h] = rowData[idx] || ''; });

          let acRaw = (rowMap['accountnumber'] || rowMap['account'] || rowMap['acno'] || rowMap['ac'] || rowMap['accountno'] || rowMap['accno'] || rowMap['acnumber'] || rowMap['dpsslip'] || rowMap['dpsno'] || rowMap['slipno'] || rowMap['slno'] || rowMap['serial'] || '').trim();
          if (!acRaw && rowData[0] && /^\d+$/.test(rowData[0].trim())) { acRaw = rowData[0].trim(); }
          if (!acRaw) continue;

          const acNorm = normalizeAC(acRaw);
          const targetCategory = (category === 'MASTER_DATA' ? (rowMap['category'] || 'DEBIT CARD').toUpperCase() : category) as InventoryCategory;
          
          const rawDelivered = (rowMap['delivered'] || '').trim();
          const sheetIsDelivered = rawDelivered !== '';
          let sheetDeliveryDate = undefined;
          if (sheetIsDelivered) {
            const parsed = new Date(rawDelivered);
            sheetDeliveryDate = !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : today;
          }

          const existingIndex = updatedList.findIndex(item => normalizeAC(item.accountNumber) === acNorm && item.category === targetCategory);

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
            // STICKY TRASH: If item is ALREADY trashed, do not un-trash it via sync
            if (existingItem.isTrashed) continue;

            const finalDelivered = existingItem.isDelivered || sheetIsDelivered;
            const finalDeliveryDate = sheetIsDelivered ? sheetDeliveryDate : existingItem.deliveryDate;

            updatedList[existingIndex] = { ...existingItem, ...itemData, isDelivered: finalDelivered, deliveryDate: finalDeliveryDate };
          } else {
            updatedList.push({ id: crypto.randomUUID(), isDelivered: sheetIsDelivered, deliveryDate: sheetIsDelivered ? sheetDeliveryDate : undefined, isTrashed: false, ...itemData as InventoryItem });
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
      await syncFromGoogleSheet(MASTER_SHEET_ID, 'MASTER_DATA' as any);
      for (const cat of CATEGORIES) { await syncFromGoogleSheet(SHEET_CONFIG[cat].id, cat); }
      setIsInitializing(false);
    };
    init();
  }, [syncFromGoogleSheet]);

  const deliverItem = (id: string, date: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, isDelivered: true, deliveryDate: date } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addItem = (item: any) => {
    setItems(prev => {
      const rcvDate = item.receiveDate || new Date().toISOString().split('T')[0];
      const newItem: InventoryItem = { ...item, id: crypto.randomUUID(), isDelivered: false, isTrashed: false, receiveDate: rcvDate, customerName: (item.customerName || 'UNKNOWN').toUpperCase(), destroyDate: calculateDestroyDate(rcvDate) };
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
          return { ...item, ...updates, customerName: (updates.customerName || item.customerName).toUpperCase(), destroyDate: calculateDestroyDate(newRcvDate) };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Rule Change: Silent delete to Trash Bin. 
  // confirmation only on permanent delete from trash bin.
  const trashItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, isTrashed: true } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const restoreItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, isTrashed: false } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteItemPermanently = (id: string) => {
    if (!window.confirm("WARNING: This will permanently erase the record from local storage. Syncing will NOT restore it. Proceed?")) return;
    setItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const getFullStats = () => {
    // Only count non-trashed items for dashboard stats
    const activeItems = items.filter(i => !i.isTrashed);
    return CATEGORIES.map(cat => {
      const catItems = activeItems.filter(i => i.category === cat);
      const delivered = catItems.filter(i => i.isDelivered).length;
      const received = catItems.length;
      return { category: cat, received, delivered, balance: received - delivered, destruction: 0 };
    }).concat([{
      category: 'TOTAL',
      received: activeItems.length,
      delivered: activeItems.filter(i => i.isDelivered).length,
      balance: activeItems.filter(i => !i.isDelivered).length,
      destruction: 0
    }] as any);
  };

  return { items, isInitializing, deliverItem, addItem, updateItem, trashItem, restoreItem, deleteItemPermanently, getFullStats, syncFromGoogleSheet };
};
