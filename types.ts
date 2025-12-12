export enum ShippingStatus {
  PENDING = 'Siap Cetak',
  PRINTED = 'Sudah Dicetak',
  SHIPPED = 'Dikirim',
}

export interface PackageItem {
  name: string;
  qty: string;
  value: number;
}

export interface PackageData {
  id: string;
  // Sender
  senderName: string;
  senderPhone: string;
  
  // Recipient
  recipientName: string;
  phoneNumber: string; // Recipient Phone
  address: string;
  district?: string;
  city: string;
  province?: string;
  zipCode: string;
  
  // Shipping Service
  courier: string;
  shippingCode?: string; // Optional booking code/ref
  
  // Item Details (Legacy support + Multi item)
  itemName?: string; // Kept for backward compatibility (summary string)
  itemQty?: string;  // Kept for backward compatibility (total qty string)
  itemValue?: string; // Stored as string to allow formatting
  
  items?: PackageItem[]; // New: Array of items

  note?: string;
  createdAt: string; // ISO Date string
  status: ShippingStatus;
}

export interface DashboardStats {
  totalPending: number;
  totalPrinted: number;
  totalShipped: number;
  totalProfit: number;
  dailyShipments: { date: string; count: number }[];
}
