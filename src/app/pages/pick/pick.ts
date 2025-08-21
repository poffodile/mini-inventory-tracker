import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { Product } from '../../interfaceTypes/Product';

@Component({
  selector: 'app-pick',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pick.html',
  styleUrl: './pick.css',
})
export class Pick implements OnInit {
  // dropdowns
  products: Product[] = [];
  locations: Array<{ id: string; name: string }> = [];

  // form state
  productId = '';
  fromLocationId = '';
  qty = 1;
  ref = ''; // optional reference: e.g., ORD-9002

  // UI helpers
  available = 0; // live available at (product, location)
  errorMsg = ''; // show friendly error if any

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.products = this.data.getData('products') || [];
    this.locations = this.data.getData('locations') || [];
  }

  // keep availability in sync when any key field changes
  onFieldChange(): void {
    this.errorMsg = '';
    if (this.productId && this.fromLocationId) {
      this.available = this.data.getAvailableAt(this.productId, this.fromLocationId);
    } else {
      this.available = 0;
    }
  }

  isValid(): boolean {
    const hasProduct = !!this.productId && this.products.some((p) => p.id === this.productId);
    const hasLocation =
      !!this.fromLocationId && this.locations.some((l) => l.id === this.fromLocationId);
    const goodQty = Number.isFinite(this.qty) && this.qty > 0;
    return hasProduct && hasLocation && goodQty;
  }

  submit(): void {
    this.errorMsg = '';
    if (!this.isValid()) {
      this.errorMsg = 'Pick a product, a from-location, and enter a quantity > 0.';
      return;
    }

    const result = this.data.recordPick({
      productId: this.productId,
      fromLocationId: this.fromLocationId,
      qty: this.qty,
      ref: this.ref?.trim() || undefined,
    });

    if (!result.ok) {
      this.errorMsg = result.error!;
      return;
    }

    alert('Stock dispatched and movement logged!');
    this.reset();
  }

  reset(): void {
    this.productId = '';
    this.fromLocationId = '';
    this.qty = 1;
    this.ref = '';
    this.available = 0;
    this.errorMsg = '';
  }
}
