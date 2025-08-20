// src/app/types/stock-entry.ts

export interface ReceivedItem {
  productId: string;
  quantity: number;
  locationId: string;
  timestamp: string;
  toLocationId: string;
  fromLocationId?: string;
  qty: number;
}
