import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';

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

  productId: string = '';
  quantity: number = 1;
  locationId: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.products = this.dataService.getData('products') || [];
    this.locations = this.dataService.getData('locations') || [];
  }

  submitForm(): void {
    const newEntry = {
      productId: this.productId,
      quantity: this.quantity,
      locationId: this.locationId,
      timestamp: new Date().toISOString(),
    };

    const ledger = this.dataService.getData('stockLedger') || [];
    ledger.push(newEntry);
    this.dataService.setData('stockLedger', ledger);

    alert('Goods received and recorded!');
    this.resetForm();
  }

  resetForm(): void {
    this.productId = '';
    this.quantity = 1;
    this.locationId = '';
  }
}
