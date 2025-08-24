// ======== My Dashboard (submission version) =========
// I’m keeping this page super clean for screenshots.
// - KPIs come from movements + lookups I already store
// - Recent activity shows latest movements (RECEIPT / PICK / TRANSFER)
// - Low stock shows products with small balances (nice “business” signal)
// - IMPORTANT: I use my DataService helpers: getData(), productName(), locationName()
//   so I’m not re-inventing lookups anywhere.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data';
import { Movement } from '../../interfaceTypes/Movement';
import { Product } from '../../interfaceTypes/Product';

type LowStockRow = { productId: string; name: string; qty: number };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  // KPIs I want to show at the top
  receiptsToday = 0;
  picksToday = 0;
  totalProducts = 0;
  totalLocations = 0;

  // Tables/cards
  recent: Movement[] = [];
  lowStock: LowStockRow[] = [];

  // small threshold so something actually shows on my screenshot
  private readonly LOW_STOCK_THRESHOLD = 10;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    // 1) lookups (counts only; details via helper methods)
    const products = this.data.getData<Product>('products') ?? [];
    const locations = this.data.getData<{ id: string; name: string }>('locations') ?? [];
    this.totalProducts = products.length;
    this.totalLocations = locations.length;

    // 2) movements: this is my “single source of truth” for history
    const moves = (this.data.getData<Movement>('movements') ?? [])
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Recent activity: top 10 looks nice on the page
    this.recent = moves.slice(0, 10);

    // 3) KPIs “today” (Receipts and Picks)
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    const inToday = (iso?: string) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };

    this.receiptsToday = moves
      .filter((m) => m.type === 'RECEIPT' && inToday(m.timestamp))
      .reduce((sum, m) => sum + (m.qty || 0), 0);

    this.picksToday = moves
      .filter((m) => m.type === 'PICK' && inToday(m.timestamp))
      .reduce((sum, m) => sum + (m.qty || 0), 0);

    // 4) low stock — quick sum by product (RECEIPT adds, PICK subtracts, TRANSFER = 0 net)
    const balByProduct = new Map<string, number>();
    for (const m of moves) {
      if (m.type === 'RECEIPT') {
        balByProduct.set(m.productId, (balByProduct.get(m.productId) ?? 0) + (m.qty || 0));
      } else if (m.type === 'PICK') {
        balByProduct.set(m.productId, (balByProduct.get(m.productId) ?? 0) - (m.qty || 0));
      }
      // TRANSFER does not change total product balance (just moves bins), so I ignore it here.
    }

    this.lowStock = [...balByProduct.entries()]
      .map(([productId, qty]) => ({
        productId,
        qty,
        // use my service so names stay consistent everywhere
        name: this.data.productName(productId),
      }))
      .filter((x) => x.qty < this.LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 6);
  }

  // UI helpers — keep tiny and readable

  /** badge color based on movement type */
  typeBadgeClass(m: Movement): string {
    switch (m.type) {
      case 'RECEIPT':
        return 'badge badge-success';
      case 'PICK':
        return 'badge badge-warning';
      case 'TRANSFER':
        return 'badge badge-info';
      default:
        return 'badge';
    }
  }

  /** show a nice location column that respects the movement type */
  locationDisplay(m: Movement): string {
    if (m.type === 'RECEIPT') return this.data.locationName(m.toLocationId);
    if (m.type === 'PICK') return this.data.locationName(m.fromLocationId);
    if (m.type === 'TRANSFER') {
      const from = this.data.locationName(m.fromLocationId);
      const to = this.data.locationName(m.toLocationId);
      return `${from} → ${to}`;
    }
    return '-';
  }

  /** product label everywhere should come from my service */
  productLabel(id: string): string {
    return this.data.productName(id);
  }
}
