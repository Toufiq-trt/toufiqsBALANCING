import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, InventoryCategory, CategoryStats } from './types';
import { CATEGORIES } from './constants';

const STORAGE_KEY = 'toufiq_balancing_v3';
const MASTER_SHEET_ID = '1h7Nmn8alVoWNE_vn3690-yWMvRcXs93_9VXONaAA4po';

const SHEET_CONFIG: Record<InventoryCategory, { id: string }> = {
  'DEBIT CARD': { id: '1e_22aHpRoJYBe9J0ohT-PzwHmXGhrOtNlsQeOVHg67M' },
  'CHEQUE BOOK': { id: '1cakIYc79gR-YVnqKe4-i8J95AEuIKa4Q' },
  'DPS SLIP': { id: '1Ah7wHvJDbzAF9VUJLlBs6YHKfInY6ZWeXlmyZtlUj9Q' },
  'PIN': { id: '1voTnPN_6crhBoev-5mLg9pLRMREWp7alpMNM8SwhL6k' }
};

export const useInventoryStore = () => {
  // Load from local storage immediately to prevent "flicker" of old data
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

  const normalizeAC = (ac: string) => ac.trim().toLowerCase();

  const syncFromGoogleSheet = useCallback(async (sheetId: string, category: InventoryCategory | 'MASTER_DATA') => {
    try {
      const sheetName = category === 'MASTER_DATA' ? 'master data' : category.toLowerCase();
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      const csvText = await response.text();
      
      const rows = csvText.split('\n').map(row => row.split(',').map(c => c.replace(/"/g, '').trim()));
      if (rows.length < 2) return { success: true, count: 0 };

      const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
      const newItems: InventoryItem[] = [];

      setItems(prev => {
        const existingKeys = new Set(prev.map(i => `${normalizeAC(i.accountNumber)}_${i.category}`));
        const updatedItems = [...prev];

        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i];
          const rowMap: Record<string, string> = {};
          headers.forEach((h, idx) => { rowMap[h] = rowData[idx] || ''; });

          const ac = (rowMap['accountnumber'] || rowMap['account'] || rowMap['acno'] || '').trim();
          const name = (rowMap['customername'] || rowMap['name'] || '').trim();
          const cat = (rowMap['category'] || (category === 'MASTER_DATA' ? '' : category)) as InventoryCategory;

          if (!ac || !name) continue;
          
          const uniqueKey = `${normalizeAC(ac)}_${cat || 'DEBIT CARD'}`;
          
          // CRITICAL: If account exists in local storage (Active OR Delivered), do NOT re-add it
          if (!existingKeys.has(uniqueKey)) {
            existingKeys.add(uniqueKey);
            updatedItems.push({
              id: crypto.randomUUID(),
              accountNumber: ac,
              customerName: name.toUpperCase(),
              phoneNumber: (rowMap['phonenumber'] || rowMap['phone'] || '').trim(),
              address: (rowMap['address'] || rowMap['location'] || '').trim().toUpperCase(),
              receiveDate: rowMap['receivedate'] || new Date().toISOString().split('T')[0],
              category: cat || 'DEBIT CARD',
              isDelivered: false,
              destroyDate: calculateDestroyDate(rowMap['receivedate'] || new Date().toISOString().split('T')[0])
            });
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
        return updatedItems;
      });

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await syncFromGoogleSheet(MASTER_SHEET_ID, 'MASTER_DATA' as any);
      for (const cat of CATEGORIES) {
        await syncFromGoogleSheet(SHEET_CONFIG[cat].id, cat);
      }
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
      const newItem = { ...item, id: crypto.randomUUID(), isDelivered: false, destroyDate: calculateDestroyDate(item.receiveDate) };
      const updated = [...prev, newItem];
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

  return { items, isInitializing, deliverItem, addItem, getFullStats, syncFromGoogleSheet, updateItem: () => {}, deleteItem: () => {} };
};