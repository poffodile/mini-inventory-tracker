import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // ⬅️ add
import { DataService } from '../../services/data';
import { Movement } from '../../interfaceTypes/Movement';
import { Product } from '../../interfaceTypes/Product';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink], // ⬅️ add RouterLink
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  products: Product[] = [];
  locations: Array<{ id: string; name: string }> = [];
  movements: Movement[] = [];

  totalProducts = 0;
  totalLocations = 0;
  receiptsToday = 0;
  picksToday = 0;
  currentStockTotal = 0;

  readonly LOW_STOCK_THRESHOLD = 5;
  lowStock: Array<{ productId: string; name: string; balance: number }> = [];
  recent: Movement[] = [];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.products = this.data.getData('products') || [];
    this.locations = this.data.getData('locations') || [];
    this.movements = this.data.getData('movements') || [];

    this.totalProducts = this.products.length;
    this.totalLocations = this.locations.length;

    const stockByProduct = new Map<string, number>();
    for (const m of this.movements) {
      const s = m.type === 'RECEIPT' ? 1 : m.type === 'PICK' ? -1 : 0;
      if (!s) continue;
      stockByProduct.set(m.productId, (stockByProduct.get(m.productId) ?? 0) + s * (m.qty ?? 0));
    }
    this.currentStockTotal = [...stockByProduct.values()].reduce((a, v) => a + Math.max(0, v), 0);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86400000 - 1);
    const inToday = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };

    this.receiptsToday = this.movements
      .filter((m) => m.type === 'RECEIPT' && inToday(m.timestamp))
      .reduce((s, m) => s + (m.qty ?? 0), 0);

    this.picksToday = this.movements
      .filter((m) => m.type === 'PICK' && inToday(m.timestamp))
      .reduce((s, m) => s + (m.qty ?? 0), 0);

    this.lowStock = this.products
      .map((p) => ({ productId: p.id, name: p.name, balance: stockByProduct.get(p.id) ?? 0 }))
      .filter((x) => x.balance <= this.LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 10);

    this.recent = [...this.movements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);
  }

  productName(id?: string) {
    return this.data.productName(id);
  }
  locationName(id?: string) {
    return this.data.locationName(id);
  }

  typeBadge(m: Movement): string {
    if (m.type === 'RECEIPT') return 'badge badge-success';
    if (m.type === 'PICK') return 'badge badge-error';
    return 'badge badge-info';
  }

  loadDemo(): void {
    this.data.loadDemoData();
    this.data.refreshLookups();
    this.refresh();
  }
  clearAll(): void {
    this.data.clearAll();
    this.data.refreshLookups();
    this.refresh();
  }

  exportMovementsJSON(): void {
    const blob = new Blob([JSON.stringify(this.movements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.dl(url, `movements-${new Date().toISOString().slice(0, 10)}.json`);
  }
  exportCurrentStockCSV(): void {
    const totals = new Map<string, number>();
    for (const m of this.movements) {
      const s = m.type === 'RECEIPT' ? 1 : m.type === 'PICK' ? -1 : 0;
      if (!s) continue;
      totals.set(m.productId, (totals.get(m.productId) ?? 0) + s * (m.qty ?? 0));
    }
    const header = ['productId', 'productName', 'balance'];
    const rows = [...totals.entries()].map(([id, bal]) =>
      [id, this.csv(this.productName(id)), bal].join(',')
    );
    const url = URL.createObjectURL(
      new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' })
    );
    this.dl(url, `stock-balance-${new Date().toISOString().slice(0, 10)}.csv`);
  }
  private dl(url: string, name: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  private csv(s: string) {
    return `"${String(s).replace(/"/g, '""')}"`;
  }
}
