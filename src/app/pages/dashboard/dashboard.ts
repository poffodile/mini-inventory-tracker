import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data';
import { Product } from '../../interfaceTypes/Product';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // data
  products: Product[] = [];
  locations: Array<{ id: string; name: string }> = [];
  movements: Movement[] = [];

  // lookup maps for pretty names
  private productNameById = new Map<string, string>();
  private locationNameById = new Map<string, string>();

  // cards
  totalProducts = 0;
  totalLocations = 0;
  receiptsToday = 0;
  picksToday = 0;
  currentStockTotal = 0; // sum of balances across products

  // low stock
  readonly LOW_STOCK_THRESHOLD = 5; // you can tweak this or move into Product later
  lowStock: Array<{ productId: string; name: string; balance: number }> = [];

  // recent activity
  recent: Movement[] = [];

  // computed stock balance per productId (from movements)
  private stockByProduct = new Map<string, number>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.refresh();
  }

  // ----- actions (toolbar) -----
  loadDemo(): void {
    this.dataService.loadDemoData(); // writes demo JSON into localStorage
    this.refresh();
    alert('Demo data loaded.');
  }

  clearAll(): void {
    this.dataService.clearAll();
    this.refresh();
    alert('All inventory data cleared.');
  }

  exportMovementsJSON(): void {
    this.downloadJSON(this.movements, `movements-${this.todayStr()}.json`);
  }

  exportCurrentStockCSV(): void {
    const rows = this.products.map((p) => {
      const balance = this.stockByProduct.get(p.id) ?? 0;
      return { productId: p.id, name: p.name, balance };
    });

    const header = ['productId', 'name', 'balance'];
    const csv = [header.join(',')]
      .concat(rows.map((r) => [r.productId, this.csv(r.name), r.balance].join(',')))
      .join('\n');

    this.downloadBlob(csv, 'text/csv', `stock-balance-${this.todayStr()}.csv`);
  }

  // ----- helpers -----
  private refresh(): void {
    // pull everything from localStorage via your service
    this.products = this.dataService.getData('products') || [];
    this.locations = this.dataService.getData('locations') || [];
    this.movements = this.dataService.getData('movements') || [];

    // rebuild lookups
    this.productNameById.clear();
    this.locationNameById.clear();
    this.products.forEach((p) => this.productNameById.set(p.id, p.name));
    this.locations.forEach((l) => this.locationNameById.set(l.id, l.name));

    // metrics
    this.totalProducts = this.products.length;
    this.totalLocations = this.locations.length;

    // compute stock balances from movements (RECEIPT +, PICK -)
    this.stockByProduct.clear();
    for (const m of this.movements) {
      const pid = m.productId;
      const sign = m.type === 'RECEIPT' ? 1 : m.type === 'PICK' ? -1 : 0;
      if (!sign) continue;
      this.stockByProduct.set(pid, (this.stockByProduct.get(pid) ?? 0) + sign * (m.qty ?? 0));
    }

    // total stock across all products (never negative)
    this.currentStockTotal = Array.from(this.stockByProduct.values()).reduce(
      (sum, v) => sum + Math.max(0, v),
      0
    );

    // today’s activity (local day)
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t <= end.getTime();
    };

    this.receiptsToday = this.movements
      .filter((m) => m.type === 'RECEIPT' && inRange(m.timestamp))
      .reduce((s, m) => s + (m.qty ?? 0), 0);

    this.picksToday = this.movements
      .filter((m) => m.type === 'PICK' && inRange(m.timestamp))
      .reduce((s, m) => s + (m.qty ?? 0), 0);

    // low stock list
    this.lowStock = this.products
      .map((p) => ({
        productId: p.id,
        name: p.name,
        balance: this.stockByProduct.get(p.id) ?? 0,
      }))
      .filter((x) => x.balance <= this.LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 10);

    // recent movements
    this.recent = [...this.movements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  productName(id?: string): string {
    return id ? this.productNameById.get(id) ?? id : '-';
  }
  locationName(id?: string): string {
    return id ? this.locationNameById.get(id) ?? id : '-';
  }

  typeBadgeClasses(t: Movement['type']): string {
    if (t === 'RECEIPT') return 'bg-green-100 text-green-700';
    if (t === 'PICK') return 'bg-rose-100 text-rose-700';
    return 'bg-sky-100 text-sky-700';
    // TRANSFER shown as info-blue for now
  }

  private downloadJSON(data: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.forceDownload(url, filename);
    URL.revokeObjectURL(url);
  }
  private downloadBlob(text: string, type: string, filename: string): void {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    this.forceDownload(url, filename);
    URL.revokeObjectURL(url);
  }
  private forceDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  private csv(s: string): string {
    return `"${String(s).replace(/"/g, '""')}"`;
  }
  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
