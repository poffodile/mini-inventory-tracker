// ========= Pick / Dispatch =========
// my plan:
// - use MY DataService helpers (getData, getAvailableAt, recordPick, productName, locationName)
// - validate before picking (qty > 0 and <= available)
// - update the available balance after a successful pick
// - keep a short "recent picks" table so the page looks alive on a screenshot

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { Product } from '../../interfaceTypes/Product';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-pick',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pick.html',
})
export class Pick implements OnInit {
  // dropdown data
  products: Product[] = [];
  locations: Array<{ id: string; name: string }> = [];

  // form model (what I submit)
  productId = '';
  fromLocationId = '';
  qty = 1;
  ref = '';

  // ui bits
  available = 0;
  errorMsg = '';
  recentPicks: Movement[] = [];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    // load lists
    this.products = this.data.getData<Product>('products') ?? [];
    this.locations = this.data.getData<{ id: string; name: string }>('locations') ?? [];

    // seed recent picks table
    const moves = (this.data.getData<Movement>('movements') ?? [])
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.recentPicks = moves.filter((m) => m.type === 'PICK').slice(0, 10);
  }

  // keep labels consistent via my service
  productLabel(id?: string): string {
    return id ? this.data.productName(id) : '-';
  }
  locationLabel(id?: string): string {
    return id ? this.data.locationName(id) : '-';
  }

  // recalc the available balance at the chosen bin
  recalcAvailable(): void {
    if (this.productId && this.fromLocationId) {
      this.available = this.data.getAvailableAt(this.productId, this.fromLocationId);
    } else {
      this.available = 0;
    }
  }

  isValid(): boolean {
    return !!this.productId && !!this.fromLocationId && Number.isFinite(this.qty) && this.qty > 0;
  }

  submit(): void {
    this.errorMsg = '';

    if (!this.isValid()) {
      this.errorMsg = 'Choose product & bin and enter a quantity > 0.';
      return;
    }
    if (this.qty > this.available) {
      this.errorMsg = `Only ${this.available} available at ${this.fromLocationId}.`;
      return;
    }

    const { ok, error, movement } = this.data.recordPick({
      productId: this.productId,
      qty: Number(this.qty),
      fromLocationId: this.fromLocationId,
      ref: this.ref?.trim() || undefined,
    });

    if (!ok || !movement) {
      this.errorMsg = error || 'Could not dispatch stock. Please try again.';
      return;
    }

    alert('Stock dispatched!');
    // keep the table fresh and update available after pick
    this.recentPicks = [movement, ...this.recentPicks].slice(0, 10);
    this.recalcAvailable();

    // optional: reset just the qty/ref to make repeated picks easier
    this.qty = 1;
    this.ref = '';
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
