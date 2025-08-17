import { Injectable } from '@angular/core';
import products from './../demo-data/products.json';
import locations from './../demo-data/locations.json';
import stockLedger from './../demo-data/stockLedger.json';
import movements from '../demo-data/movements.json';

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
}
