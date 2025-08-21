import { Injectable } from '@angular/core';
import products from '../demo-data/products.json';
import locations from '../demo-data/locations.json';
import stockLedger from '../demo-data/stockledger.json';
import movements from '../demo-data/movements.json';
import { Movement } from '../interfaceTypes/Movement';
import { ReceivedItem } from '../interfaceTypes/ReceivedItem';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private keys = {
    products: 'inventory_products',
    locations: 'inventory_locations',
    stockLedger: 'inventory_stockLedger',
    movements: 'inventory_movements',
  };

  loadDemoData(): void {
    localStorage.setItem(this.keys.products, JSON.stringify(products));
    localStorage.setItem(this.keys.locations, JSON.stringify(locations));
    localStorage.setItem(this.keys.stockLedger, JSON.stringify(stockLedger));
    localStorage.setItem(this.keys.movements, JSON.stringify(movements));
    console.log('%c Demo data loaded into LocalStorage!', 'color: green');
  }

  // Load any dataset
  getData<T>(key: keyof typeof this.keys): T[] {
    const raw = localStorage.getItem(this.keys[key]);
    return raw ? JSON.parse(raw) : [];
  }

  // Save dataset
  setData<T>(key: keyof typeof this.keys, data: T[]): void {
    localStorage.setItem(this.keys[key], JSON.stringify(data));
  }

  //Clear all demo data
  clearAll(): void {
    Object.values(this.keys).forEach((key) => localStorage.removeItem(key));
    console.log('%c Demo data cleared from LocalStorage!', 'color: orange');
  }

  private getMovements(): Movement[] {
    return this.getData<Movement>('movements') || [];
  }
  private setMovements(moves: Movement[]): void {
    this.setData<Movement>('movements', moves);
  }

  // robust M-ID generator: find current max and +1
  private nextMovementId(): string {
    const moves = this.getMovements();
    const max = moves
      .map((m) => Number((m.id || '').replace(/^M/, '')))
      .filter((n) => !Number.isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    return `M${String(max + 1).padStart(3, '0')}`;
  }

  /**
   * Record a goods receipt in BOTH ledgers:
   * - stockLedger (ReceivedItem)
   * - movements (Movement with type=RECEIPT)
   *
   * Returns both objects for UI use if needed.
   */
  recordReceipt(input: { productId: string; qty: number; toLocationId: string; ref?: string }) {
    const now = new Date().toISOString();

    // prepare ReceivedItem (qty only)
    const received: ReceivedItem = {
      productId: input.productId,
      qty: input.qty,
      locationId: input.toLocationId,
      toLocationId: input.toLocationId,
      timestamp: now,
      fromLocationId: undefined,
    };

    // save to stockLedger
    const ledger = this.getData<ReceivedItem>('stockLedger') || [];
    ledger.push(received);
    this.setData<ReceivedItem>('stockLedger', ledger);

    // prepare Movement log
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

    return { received, movement };
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
