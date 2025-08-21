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
  styleUrls: ['./receive.css'],
})
export class Receive implements OnInit {
  products: Array<Product> = [];
  locations: Array<{ id: string; name: string }> = [];

  productId = '';
  qty = 1;
  locationId = '';

  // recent receipts (from movements)
  recentReceipts: Movement[] = [];

  // quick name lookups for pretty table labels
  private productNameById = new Map<string, string>();
  private locationNameById = new Map<string, string>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.products = this.dataService.getData('products') || [];
    this.locations = this.dataService.getData('locations') || [];
    this.products.forEach((p) => this.productNameById.set(p.id, p.name));
    this.locations.forEach((l) => this.locationNameById.set(l.id, l.name));
    this.refreshRecent(); // show recent receipts on load
  }

  isValid(): boolean {
    const hasProduct = !!this.productId && this.products.some((p) => p.id === this.productId);
    const hasLocation = !!this.locationId && this.locations.some((l) => l.id === this.locationId);
    const goodQty = Number.isFinite(this.qty) && this.qty > 0;
    return hasProduct && hasLocation && goodQty;
  }

  submitForm(): void {
    if (!this.isValid()) return;

    this.dataService.recordReceipt({
      productId: this.productId,
      qty: this.qty,
      toLocationId: this.locationId,
    });

    alert('Goods received and movement logged!');
    this.resetForm();
    this.refreshRecent();
  }

  resetForm(): void {
    this.productId = '';
    this.qty = 1;
    this.locationId = '';
  }

  private refreshRecent(): void {
    const moves = this.dataService.getData<Movement>('movements') || [];
    this.recentReceipts = moves
      .filter((m) => m.type === 'RECEIPT')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // friendly names for template
  productName(id?: string): string {
    return id ? this.productNameById.get(id) ?? id : '-';
  }
  locationName(id?: string): string {
    return id ? this.locationNameById.get(id) ?? id : '-';
  }
}
