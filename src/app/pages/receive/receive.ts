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
  products: Array<{ id: string; name: string }> = [];
  locations: Array<{ id: string; name: string }> = [];

  productId = '';
  qty = 1;
  locationId = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    // load dropdowns
    this.products = this.dataService.getData('products') || [];
    this.locations = this.dataService.getData('locations') || [];
  }

  // tiny guard so I can’t save nonsense (my “baby words” version)
  isValid(): boolean {
    const hasProduct = !!this.productId && this.products.some((p) => p.id === this.productId);
    const hasLocation = !!this.locationId && this.locations.some((l) => l.id === this.locationId);
    const goodQty = Number.isFinite(this.qty) && this.qty > 0;
    return hasProduct && hasLocation && goodQty;
  }

  submitForm(): void {
    if (!this.isValid()) {
      alert('Please pick a product, a location, and a quantity > 0.');
      return;
    }

    // one call: writes to stockLedger + movements (RECEIPT)
    this.dataService.recordReceipt({
      productId: this.productId,
      qty: this.qty,
      toLocationId: this.locationId,
      // optional human ref; default looks like GRN-YYYY-MM-DD
      // ref: `GRN-${new Date().toISOString().slice(0,10)}`
    });

    alert('Goods received and movement logged!');
    this.resetForm();
  }

  resetForm(): void {
    this.productId = '';
    this.qty = 1;
    this.locationId = '';
  }
}
