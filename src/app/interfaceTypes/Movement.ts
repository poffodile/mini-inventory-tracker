export interface Movement {
  id: string;
  type: 'RECEIPT' | 'PICK' | 'TRANSFER';
  productId: string;
  toLocationId?: string; // only present if RECEIPT or TRANSFER
  fromLocationId?: string; // only present if PICK or TRANSFER
  qty: number;
  ref: string;
  timestamp: string; // ISO date string
}
