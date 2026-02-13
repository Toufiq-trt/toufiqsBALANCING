
import { InventoryCategory } from './types';

export const CATEGORIES: InventoryCategory[] = [
  'DEBIT CARD',
  'CHEQUE BOOK',
  'DPS SLIP',
  'PIN'
];

export const CATEGORY_COLORS: Record<string, string> = {
  'DEBIT CARD': 'text-blue-400 border-blue-400/20 bg-blue-400/10',
  'CHEQUE BOOK': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
  'DPS SLIP': 'text-violet-400 border-violet-400/20 bg-violet-400/10',
  'PIN': 'text-amber-400 border-amber-400/20 bg-amber-400/10',
  'TOTAL': 'text-white border-white/20 bg-white/10'
};

export const THEME = {
  bg: '#09090b',
  card: '#18181b',
  accent: '#8b5cf6',
  accentSecondary: '#10b981',
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa'
};
