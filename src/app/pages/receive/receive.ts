// ========= Receive (Goods Receipt) =========
// my goal here:
// - keep it super simple for screenshots
// - use MY DataService everywhere (getData, recordReceipt, productName, locationName)
// - create a RECEIPT movement that the dashboard + stock pages can see
// - show the last few receipts so the page doesn't look empty

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { Product } from '../../interfaceTypes/Product';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receive.html',
})
export class Receive implements OnInit {
  // dropdown data
  products: Product[] = [];
  locations: Array<{ id: string; name: string }> = [];

  // form model (what I actually submit)
  productId = '';
  toLocationId = '';
  qty = 1;
  ref = '';

  // ui bits
  errorMsg = '';
  recentReceipts: Movement[] = [];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    // load lists from local storage (my service does the parsing)
    this.products = this.data.getData<Product>('products') ?? [];
    this.locations = this.data.getData<{ id: string; name: string }>('locations') ?? [];

    // seed the "recent" table — last 10 receipts by time desc
    const moves = (this.data.getData<Movement>('movements') ?? [])
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.recentReceipts = moves.filter((m) => m.type === 'RECEIPT').slice(0, 10);
  }

  // submit the GR to my movement log + ledger (via DataService)
  submitForm(): void {
    this.errorMsg = '';

    // tiny validation (keep it friendly)
    if (!this.productId) {
      this.errorMsg = 'Please choose a product.';
      return;
    }
    if (!this.toLocationId) {
      this.errorMsg = 'Please choose a destination bin.';
      return;
    }
    const qty = Number(this.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      this.errorMsg = 'Quantity must be a positive number.';
      return;
    }

    const result = this.data.recordReceipt({
      productId: this.productId,
      qty,
      toLocationId: this.toLocationId,
      ref: this.ref?.trim() || undefined,
    });

    if (!result || !result.movement) {
      this.errorMsg = 'Could not post receipt. Please try again.';
      return;
    }
    const { movement } = result;

    // friendly feedback + keep the table looking alive
    alert('Goods receipt posted!');
    this.recentReceipts = [movement, ...this.recentReceipts].slice(0, 10);

    // reset form to a tidy state
    this.productId = '';
    this.toLocationId = '';
    this.qty = 1;
    this.ref = '';
  }

  // keep label lookups going through MY service so names stay consistent app-wide
  productLabel(id?: string): string {
    return id ? this.data.productName(id) : '-';
  }
  locationLabel(id?: string): string {
    return id ? this.data.locationName(id) : '-';
  }
}
