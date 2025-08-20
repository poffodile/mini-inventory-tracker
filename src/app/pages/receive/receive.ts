import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { ReceivedItem } from '../../interfaceTypes/ReceivedItem';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receive.html',
  styleUrls: ['./receive.css'],
})
export class Receive implements OnInit {
  products: any[] = [];
  locations: any[] = [];
  receivedItems: ReceivedItem[] = [];

  productId: string = '';
  qty: number = 1;
  locationId: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    // Loads the products and locations from the data service(localStorage)
    this.products = this.dataService.getData('products') || [];
    this.locations = this.dataService.getData('locations') || [];
  }

  submitForm(): void {
    const now = new Date().toISOString();

    // Create a new received item entry
    const newEntry: ReceivedItem = {
      productId: this.productId,
      qty: this.qty,
      locationId: this.locationId,
      timestamp: now,
      toLocationId: this.locationId,
      fromLocationId: undefined,
    };

    //save to stockledger

    const ledger: ReceivedItem[] = this.dataService.getData('stockLedger') || [];
    ledger.push(newEntry);
    this.dataService.setData('stockLedger', ledger);

    // Create a new movement entry of type RECEIPT
    const existingMovements: Movement[] = this.dataService.getData('movements') || [];
    const newId = this.generateMovementId(existingMovements.length); // auto ID like M001

    const movement: Movement = {
      id: newId,
      type: 'RECEIPT',
      productId: this.productId,
      toLocationId: this.locationId,
      qty: this.qty,
      // Creates a reference like GRN-2025-08-20
      // now.slice(0, 10) just takes the "YYYY-MM-DD" part of the ISO date
      ref: `GRN-${now.slice(0, 10)}`, // like GRN-2025-08-20
      timestamp: now,
      fromLocationId: undefined,
      // ref: newEntry.timestamp,
      // timestamp: newEntry.timestamp,
    };

    existingMovements.push(movement);
    this.dataService.setData('movements', existingMovements);

    alert('Goods received and movement logged!');
    this.resetForm();
  }

  resetForm(): void {
    // Clear the form so the user can enter another
    this.productId = '';
    this.qty = 1;
    this.locationId = '';
  }

  generateMovementId(count: number): string {
    // Always start with "M" and pad with 0s like M001, M002, etc
    // Generates IDs like M001, M002, etc.
    // padStart(3, '0') means: always keep 3 digits by adding leading zeros
    return `M${(count + 1).toString().padStart(3, '0')}`;
  }
}
