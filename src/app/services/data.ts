import { Injectable } from '@angular/core';
import products from '../demo-data/products.json';
import locations from '../demo-data/locations.json';
import stockLedger from '../demo-data/stockledger.json';
import movements from '../demo-data/movements.json';
import { Movement } from '../interfaceTypes/Movement';
import { ReceivedItem } from '../interfaceTypes/ReceivedItem';

/** Balance row kept in stockLedger: one row per product+location */
export interface StockLedgerRow {
  productId: string;
  locationId: string;
  qty: number;
  updatedAt: string; // ISO
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private keys = {
    products: 'inventory_products',
    locations: 'inventory_locations',
    stockLedger: 'inventory_stockLedger',
    movements: 'inventory_movements',
  };

  // --- Demo data & general storage helpers ---
  loadDemoData(): void {
    localStorage.setItem(this.keys.products, JSON.stringify(products));
    localStorage.setItem(this.keys.locations, JSON.stringify(locations));
    localStorage.setItem(this.keys.stockLedger, JSON.stringify(stockLedger));
    localStorage.setItem(this.keys.movements, JSON.stringify(movements));
    console.log('%c Demo data loaded into LocalStorage!', 'color: green');
    this.refreshLookups();
  }

  getData<T>(key: keyof typeof this.keys): T[] {
    const raw = localStorage.getItem(this.keys[key]);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  setData<T>(key: keyof typeof this.keys, data: T[]): void {
    localStorage.setItem(this.keys[key], JSON.stringify(data));
  }

  clearAll(): void {
    Object.values(this.keys).forEach((key) => localStorage.removeItem(key));
    console.log('%c Demo data cleared from LocalStorage!', 'color: orange');
    this.refreshLookups();
  }

  // --- Movements store helpers (single source of truth for history) ---
  private getMovements(): Movement[] {
    return this.getData<Movement>('movements') || [];
  }
  private setMovements(moves: Movement[]): void {
    this.setData<Movement>('movements', moves);
  }
  private nextMovementId(): string {
    const max = this.getMovements()
      .map((m) => Number(String(m.id ?? '').replace(/^M/, '')))
      .filter((n) => !Number.isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    return `M${String(max + 1).padStart(3, '0')}`;
  }

  // --- Stock ledger (balance table) helpers ---
  private getLedger(): StockLedgerRow[] {
    return this.getData<StockLedgerRow>('stockLedger') || [];
  }
  private setLedger(rows: StockLedgerRow[]): void {
    this.setData<StockLedgerRow>('stockLedger', rows);
  }
  /** Add or subtract qty for a product at a location (delta can be + or -). */
  private upsertLedger(productId: string, locationId: string, deltaQty: number, nowIso: string) {
    const ledger = this.getLedger();
    const i = ledger.findIndex((r) => r.productId === productId && r.locationId === locationId);
    if (i === -1) {
      ledger.push({ productId, locationId, qty: Math.max(0, deltaQty), updatedAt: nowIso });
    } else {
      ledger[i].qty = Math.max(0, (Number(ledger[i].qty) || 0) + deltaQty);
      ledger[i].updatedAt = nowIso;
    }
    this.setLedger(ledger);
  }

  // --- Public API: business actions ---
  /**
   * Record a goods receipt:
   * - movements: add type=RECEIPT
   * - stockLedger: increment balance at toLocationId
   * (I’m not storing a ReceivedItem[]; the historical log lives in movements)
   */
  recordReceipt(input: { productId: string; qty: number; toLocationId: string; ref?: string }) {
    const now = new Date().toISOString();

    // (For forms/typing clarity, this is how the ReceivedItem looks)
    const received: ReceivedItem = {
      productId: input.productId,
      qty: input.qty,
      locationId: input.toLocationId,
      toLocationId: input.toLocationId,
      timestamp: now,
      fromLocationId: undefined,
    };

    // 1) movements log
    const movement: Movement = {
      id: this.nextMovementId(),
      type: 'RECEIPT',
      productId: input.productId,
      toLocationId: input.toLocationId,
      qty: input.qty,
      ref: input.ref ?? `GRN-${now.slice(0, 10)}`,
      timestamp: now,
    };
    const moves = this.getMovements();
    moves.push(movement);
    this.setMovements(moves);

    // 2) stockLedger balance (add)
    this.upsertLedger(input.productId, input.toLocationId, +input.qty, now);

    return { received, movement };
  }

  /** Available stock at a location, derived from movements (RECEIPT - PICK). */
  getAvailableAt(productId: string, locationId: string): number {
    const moves = this.getMovements();
    const inQty = moves
      .filter(
        (m) => m.type === 'RECEIPT' && m.productId === productId && m.toLocationId === locationId
      )
      .reduce((s, m) => s + (m.qty ?? 0), 0);
    const outQty = moves
      .filter(
        (m) => m.type === 'PICK' && m.productId === productId && m.fromLocationId === locationId
      )
      .reduce((s, m) => s + (m.qty ?? 0), 0);
    return inQty - outQty;
  }

  /**
   * Record a stock dispatch (pick):
   * - validates availability
   * - movements: add type=PICK
   * - stockLedger: decrement balance at fromLocationId
   */
  recordPick(input: { productId: string; qty: number; fromLocationId: string; ref?: string }) {
    const { productId, qty, fromLocationId } = input;
    const now = new Date().toISOString();

    if (!productId || !fromLocationId || !Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: 'Please provide product, location, and a quantity > 0.' as const };
    }

    const available = this.getAvailableAt(productId, fromLocationId);
    if (qty > available) {
      return { ok: false, error: `Only ${available} available at ${fromLocationId}.` as const };
    }

    const movement: Movement = {
      id: this.nextMovementId(),
      type: 'PICK',
      productId,
      fromLocationId,
      qty,
      ref: input.ref ?? `DISP-${now.slice(0, 10)}`,
      timestamp: now,
    };
    const moves = this.getMovements();
    moves.push(movement);
    this.setMovements(moves);

    // decrement ledger at the fromLocation
    this.upsertLedger(productId, fromLocationId, -qty, now);

    return { ok: true, movement };
  }

  // --- Lookup caches ---
  private productMap?: Map<string, string>;
  private locationMap?: Map<string, string>;

  /** Reset caches (call this after loading/clearing/importing data) */
  refreshLookups(): void {
    this.productMap = undefined;
    this.locationMap = undefined;
  }

  /** Get human-friendly product name by id (falls back to id) */
  productName(id?: string): string {
    if (!id) return '-';
    if (!this.productMap) {
      const products = this.getData<{ id: string; name: string }>('products') || [];
      this.productMap = new Map(products.map((p) => [p.id, p.name]));
    }
    return this.productMap.get(id) ?? id;
  }

  /** Get human-friendly location name by id (falls back to id) */
  locationName(id?: string): string {
    if (!id) return '-';
    if (!this.locationMap) {
      const locations = this.getData<{ id: string; name: string }>('locations') || [];
      this.locationMap = new Map(locations.map((l) => [l.id, l.name]));
    }
    return this.locationMap.get(id) ?? id;
  }
}

//  - T= the result wouldhave to be of type T- which is a list of products or locations
//  - keyof typeof this.keys - this is a type that represents the keys of the keys object-basivally saying that it can
// only pass in a key that exists in this.keys- it only allows valid names such as location or products
//  - the injectable decorator- that tells angular that it can be used or injected into other parts of the app like the components and stuff
//  - so to use it i could import it constructor(private dataService: DataService) {}
//  - (loadDemoData())- this function is for loading the dummy data into the browser's memory i.e the local storage.
// so i can use the app for now as if its coming from a real backend then add the backend later
//  - " localStorage.setItem() "- way of using key and value pairs to store data like the hashmaps, in this case is have 4 things
//  - this.keys.locations or products- these are the keys used to store the data
//  - JSON.stringify() - this is a way of converting the data into a string so that it can be stored in the local storage( local storage cnnonly store strings, so it has to be converted)
//  - (getData())- this function is for retrieving data from the local storage
//  - (setData())- this function is for saving data to the local storage
//  - (clearAll())- this function is for clearing all data from the local storage

//
// Saved the locations JSON into LocalStorage so I can look up which products are in which aisle/bin.

// Saved the stockLedger JSON — this keeps track of how many of each product I have at each location.

// Saved the movements JSON — this shows the history of all items received or picked, like a log book.
