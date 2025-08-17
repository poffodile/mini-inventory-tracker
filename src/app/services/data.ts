import { Injectable } from '@angular/core';
import products from '../demo-data/products.json';
import locations from '../demo-data/locations.json';
import stockLedger from '../demo-data/stockledger.json';
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
