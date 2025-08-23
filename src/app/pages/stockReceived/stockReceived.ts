// stockReceived.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ⬅️ add this
import { DataService } from '../../services/data';
import { Movement } from '../../interfaceTypes/Movement';
import { Product } from '../../interfaceTypes/Product';
// add search by time later
@Component({
  selector: 'app-stock-received',
  standalone: true,
  imports: [CommonModule, FormsModule], // ⬅️ add FormsModule
  templateUrl: './stockReceived.html',
  styleUrls: ['./stockReceived.css'],
})
export class StockReceived implements OnInit {
  // raw receipts
  private allReceipts: Movement[] = [];

  // lookup maps for pretty names
  private productNameById = new Map<string, string>();
  private locationNameById = new Map<string, string>();

  // search box
  // filters
  searchText = '';
  dateFrom = ''; // yyyy-mm-dd
  dateTo = ''; // yyyy-mm-dd

  // what the table shows after filtering
  visible: Movement[] = [];

  // simple sort
  sortDir: 'asc' | 'desc' = 'desc'; // default: newest first

  // pagination
  page = 1;
  pageSize = 20;
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }
  get paged(): Movement[] {
    const start = (this.page - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }
  get totalQtyVisible(): number {
    return this.visible.reduce((sum, r) => sum + (r.qty ?? 0), 0);
  }
  get totalQtyPage(): number {
    return this.paged.reduce((sum, r) => sum + (r.qty ?? 0), 0);
  }

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    // build lookups
    const products = this.dataService.getData<Product>('products') || [];
    products.forEach((p) => this.productNameById.set(p.id, p.name));

    const locations = this.dataService.getData<{ id: string; name: string }>('locations') || [];
    locations.forEach((l) => this.locationNameById.set(l.id, l.name));

    //load movements and keep only receipts
    const allMovements = this.dataService.getData<Movement>('movements') || [];
    this.allReceipts = allMovements.filter((m) => m.type === 'RECEIPT');
    this.applySearch(); // initial render
  }

  // friendly helpers for template
  productName(id?: string): string {
    return id ? this.productNameById.get(id) ?? id : '-';
  }
  locationName(id?: string): string {
    return id ? this.locationNameById.get(id) ?? id : '-';
  }

  // filter by any field (id, productId, ref, location, qty, date...)
  applySearch(): void {
    const q = this.searchText.trim().toLowerCase();
    // text search
    let rows = !q
      ? [...this.allReceipts]
      : this.allReceipts.filter((m) => {
          // flatten all possible values into one string
          const values = [
            m.id,
            m.productId,
            m.ref,
            m.toLocationId,
            m.fromLocationId,
            m.qty?.toString(),
            m.timestamp, // ISO string, so "2025-08-20" will match
          ]
            .filter(Boolean) // remove undefined
            .map((v) => v!.toString().toLowerCase());

          // also include friendly names in the haystack
          values.push(
            this.productName(m.productId).toLowerCase(),
            this.locationName(m.toLocationId).toLowerCase()
          );

          return values.some((v) => v.includes(q));
        });

    // date range filter (inclusive)
    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      rows = rows.filter((r) => new Date(r.timestamp).getTime() >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo + 'T23:59:59.999Z').getTime();
      rows = rows.filter((r) => new Date(r.timestamp).getTime() <= to);
    }
    //sort by timestamp
    rows = this.sortByTimestamp(rows, this.sortDir);

    this.visible = rows;
    this.page = 1; // reset to first page whenever filters change
  }

  // toggle sort direction
  toggleSort(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.applySearch();
  }

  // Sorts the rows by timestamp in the specified direction
  private sortByTimestamp(rows: Movement[], dir: 'asc' | 'desc'): Movement[] {
    return rows.slice().sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return dir === 'asc' ? tA - tB : tB - tA;
    });
  }

  // ---- Export helpers ----
  exportJSON(all = false): void {
    const data = all ? this.allReceipts : this.visible;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.download(
      url,
      `receipts${all ? '-all' : ''}-${new Date().toISOString().slice(0, 10)}.json`
    );
  }

  exportCSV(all = false): void {
    const rows = all ? this.allReceipts : this.visible;
    const header = [
      'id',
      'type',
      'productId',
      'toLocationId',
      'fromLocationId',
      'qty',
      'ref',
      'timestamp',
    ];
    const csv = [header.join(',')]
      .concat(rows.map((r) => header.map((h) => (r as any)[h] ?? '').join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    this.download(url, `receipts${all ? '-all' : ''}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  private download(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  }
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }
  onSearchInput(): void {
    // You can implement search logic here or leave it empty if handled elsewhere
  }
}
