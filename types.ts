
export type InventoryCategory = 'DEBIT CARD' | 'CHEQUE BOOK' | 'DPS SLIP' | 'PIN';

export interface InventoryItem {
  id: string;
  accountNumber: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  receiveDate: string; // ISO string
  destroyDate: string; // ISO string (3 months from receiveDate)
  deliveryDate?: string; // ISO string if delivered
  category: InventoryCategory;
  isDelivered: boolean;
  isTrashed?: boolean; // New property for Trash Bin persistence
  remarks?: string;
}

export interface CategoryStats {
  category: InventoryCategory | 'TOTAL';
  received: number;
  delivered: number;
  destruction: number;
  balance: number;
}

export type UserRole = 'super_admin' | 'debit_admin' | 'cheque_admin' | 'pin_admin' | 'dps_admin' | 'user';

export interface User {
  username: string;
  fullName: string;
  password?: string;
  profilePicture?: string;
  role: UserRole;
  allowedCategory?: InventoryCategory; // Category this user is allowed to edit
}
