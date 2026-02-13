
import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, InventoryCategory, CategoryStats, User } from './types';
import { CATEGORIES } from './constants';

const STORAGE_KEY = 'securevault_inventory_data';
const MASTER_SHEET_ID = '1h7Nmn8alVoWNE_vn3690-yWMvRcXs93_9VXONaAA4po';

const SHEET_CONFIG: Record<InventoryCategory, { id: string }> = {
  'DEBIT CARD': { id: '1e_22aHpRoJYBe9J0ohT-PzwHmXGhrOtNlsQeOVHg67M' },
  'CHEQUE BOOK': { id: '1cakIYc79gR-YVnqKe4-i8J95AEuIKa4Q' },
  'DPS SLIP': { id: '1Ah7wHvJDbzAF9VUJLlBs6YHKfInY6ZWeXlmyZtlUj9Q' },
  'PIN': { id: '1voTnPN_6crhBoev-5mLg9pLRMREWp7alpMNM8SwhL6k' }
};

export const useInventoryStore = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const calculateDestroyDate = (receiveDate: string) => {
    const date = new Date(receiveDate);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    date.setFullYear(date.getFullYear() + 3);
    return date.toISOString().split('T')[0];
  };

  const parseCSV = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') { currentCell += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else { currentCell += char; }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const syncFromGoogleSheet = useCallback(async (sheetId: string, category: InventoryCategory | 'MASTER_DATA') => {
    try {
      const sheetName = category === 'MASTER_DATA' ? 'master data' : category.toLowerCase();
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fetch Error: ${response.status}`);
      const csvText = await response.text();
      
      const rows = parseCSV(csvText);
      if (rows.length < 2) return { success: true, count: 0 };

      const rawHeaders = rows[0].map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
      const batchEntries: Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        const rowMap: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => { rowMap[h] = rowData[idx] || ''; });

        const accountNumber = (rowMap['accountnumber'] || rowMap['account'] || rowMap['acno'] || '').trim();
        const customerName = (rowMap['customername'] || rowMap['name'] || '').trim().toUpperCase();
        const phoneNumber = (rowMap['phonenumber'] || rowMap['phone'] || '').trim();
        const address = (rowMap['address'] || rowMap['location'] || '').trim().toUpperCase();
        const rawReceiveDate = rowMap['receivedate'] || rowMap['date'] || '';
        const itemCategory = (rowMap['category'] || (category === 'MASTER_DATA' ? '' : category)) as InventoryCategory;

        if (!accountNumber || !customerName) continue;

        let receiveDate = new Date().toISOString().split('T')[0];
        if (rawReceiveDate) {
          const parsedDate = new Date(rawReceiveDate);
          if (!isNaN(parsedDate.getTime())) receiveDate = parsedDate.toISOString().split('T')[0];
        }

        batchEntries.push({ accountNumber, customerName, phoneNumber, address, receiveDate, category: itemCategory || 'DEBIT CARD' });
      }

      if (batchEntries.length > 0) {
        setItems(prev => {
          const finalItemsToAdd: InventoryItem[] = [];
          const existingKeys = new Set(prev.map(i => `${i.accountNumber.trim().toLowerCase()}_${i.category}`));

          batchEntries.forEach(newItem => {
            const uniqueKey = `${newItem.accountNumber.trim().toLowerCase()}_${newItem.category}`;
            if (!existingKeys.has(uniqueKey)) {
              existingKeys.add(uniqueKey);
              finalItemsToAdd.push({
                ...newItem,
                customerName: newItem.customerName.trim().toUpperCase(),
                address: newItem.address.trim().toUpperCase(),
                id: crypto.randomUUID(),
                destroyDate: calculateDestroyDate(newItem.receiveDate),
                isDelivered: false
              });
            }
          });
          return finalItemsToAdd.length === 0 ? prev : [...prev, ...finalItemsToAdd];
        });
        return { success: true, count: batchEntries.length };
      }
      return { success: true, count: 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed.' };
    }
  }, []);

  // AUTO SYNC ALL CLUSTERS ON EVERY PAGE RELOAD
  useEffect(() => {
    const initData = async () => {
      // 1. Load manual/existing data from localStorage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { setItems(JSON.parse(stored)); } catch (e) { setItems([]); }
      }
      
      // 2. Perform Instant Global Sync from all sheet sources
      const syncPromises = [
        syncFromGoogleSheet(MASTER_SHEET_ID, 'MASTER_DATA' as any),
        ...CATEGORIES.map(cat => syncFromGoogleSheet(SHEET_CONFIG[cat].id, cat))
      ];
      
      await Promise.all(syncPromises);
      setIsInitializing(false);
    };
    initData();
  }, [syncFromGoogleSheet]);

  useEffect(() => {
    if (!isInitializing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitializing]);

  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>) => {
    setItems(prev => {
      const isDuplicate = prev.some(i => 
        i.accountNumber.trim().toLowerCase() === item.accountNumber.trim().toLowerCase() && 
        i.category === item.category
      );
      if (isDuplicate) return prev;

      const newItem: InventoryItem = {
        ...item,
        customerName: item.customerName.trim().toUpperCase(),
        address: item.address.trim().toUpperCase(),
        id: crypto.randomUUID(),
        destroyDate: calculateDestroyDate(item.receiveDate),
        isDelivered: false
      };
      return [...prev, newItem];
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const formattedUpdates = { ...updates };
        if (updates.customerName) formattedUpdates.customerName = updates.customerName.trim().toUpperCase();
        if (updates.address) formattedUpdates.address = updates.address.trim().toUpperCase();
        const updatedItem = { ...item, ...formattedUpdates };
        if (updates.receiveDate) updatedItem.destroyDate = calculateDestroyDate(updates.receiveDate);
        return updatedItem;
      }
      return item;
    }));
  }, []);

  const deliverItem = useCallback((id: string, deliveryDate: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, deliveryDate, isDelivered: true } : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const getFullStats = useCallback(() => {
    const today = new Date();
    const stats: CategoryStats[] = CATEGORIES.map(category => {
      const catItems = items.filter(i => i.category === category);
      const received = catItems.length;
      const delivered = catItems.filter(i => i.isDelivered).length;
      const destruction = catItems.filter(i => !i.isDelivered && new Date(i.destroyDate) < today).length;
      const balance = received - delivered; 
      return { category, received, delivered, destruction, balance };
    });

    const totals: CategoryStats = {
      category: 'TOTAL',
      received: stats.reduce((acc, s) => acc + s.received, 0),
      delivered: stats.reduce((acc, s) => acc + s.delivered, 0),
      destruction: stats.reduce((acc, s) => acc + s.destruction, 0),
      balance: stats.reduce((acc, s) => acc + s.balance, 0),
    };
    return [...stats, totals];
  }, [items]);

  return { items, addItem, syncFromGoogleSheet, updateItem, deliverItem, deleteItem, getFullStats, isInitializing };
};
