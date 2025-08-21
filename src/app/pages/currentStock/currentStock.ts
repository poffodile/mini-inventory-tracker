import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, StockLedgerRow } from '../../services/data';
import { Product } from '../../interfaceTypes/Product';

type SortKey = 'product' | 'location' | 'qty' | 'updated';

@Component({
  selector: 'app-current-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './currentStock.html',
  styleUrl: './currentStock.css',
})
export class CurrentStock implements OnInit {
  // raw ledger rows (1 row per product+location)
  private allRows: StockLedgerRow[] = [];

  // lookups for friendly names
  private productNameById = new Map<string, string>();
  private locationNameById = new Map<string, string>();

  // filters
  searchText = '';
  productFilter = ''; // productId
  locationFilter = ''; // locationId

  // view mode
  groupByProduct = false;

  // sorting & paging
  sortKey: SortKey = 'product';
  sortDir: 'asc' | 'desc' = 'asc';

  page = 1;
  pageSize = 20;

  // derived
  visible: StockLedgerRow[] = []; // when NOT grouped
  grouped: Array<{ productId: string; qty: number; locations: number }> = []; // when grouped

  constructor(private data: DataService) {}

  ngOnInit(): void {
    const products = this.data.getData<Product>('products') || [];
    const locations = this.data.getData<{ id: string; name: string }>('locations') || [];
    products.forEach((p) => this.productNameById.set(p.id, p.name));
    locations.forEach((l) => this.locationNameById.set(l.id, l.name));

    this.allRows = this.data.getData<StockLedgerRow>('stockLedger') || [];
    this.applyAll();
  }

  // friendly labels
  productName(id?: string) {
    return id ? this.productNameById.get(id) ?? id : '-';
  }
  locationName(id?: string) {
    return id ? this.locationNameById.get(id) ?? id : '-';
  }

  // --- filtering + sorting pipeline ---
  private applyAll(): void {
    const q = this.searchText.trim().toLowerCase();

    // base rows (respect product/location filters)
    let rows = this.allRows.filter(
      (r) =>
        (!this.productFilter || r.productId === this.productFilter) &&
        (!this.locationFilter || r.locationId === this.locationFilter)
    );

    // text search (id + friendly names)
    if (q) {
      rows = rows.filter((r) => {
        const haystack = [
          r.productId,
          this.productName(r.productId),
          r.locationId,
          this.locationName(r.locationId),
          String(r.qty),
          r.updatedAt,
        ].map((v) => String(v).toLowerCase());
        return haystack.some((v) => v.includes(q));
      });
    }

    if (this.groupByProduct) {
      // aggregate by product
      const map = new Map<string, { productId: string; qty: number; locations: number }>();
      for (const r of rows) {
        const entry = map.get(r.productId) ?? { productId: r.productId, qty: 0, locations: 0 };
        entry.qty += Number(r.qty) || 0;
        entry.locations += 1;
        map.set(r.productId, entry);
      }
      let grouped = Array.from(map.values());

      // sort aggregated
      grouped = grouped.sort((a, b) => {
        if (this.sortKey === 'qty') return this.numCmp(a.qty, b.qty);
        // 'product' or default
        return this.strCmp(this.productName(a.productId), this.productName(b.productId));
      });
      if (this.sortDir === 'desc') grouped.reverse();

      this.grouped = grouped;
    } else {
      // sort granular rows
      rows = rows.sort((a, b) => {
        if (this.sortKey === 'qty') return this.numCmp(a.qty, b.qty);
        if (this.sortKey === 'updated')
          return this.numCmp(new Date(a.updatedAt).getTime(), new Date(b.updatedAt).getTime());
        if (this.sortKey === 'location')
          return this.strCmp(this.locationName(a.locationId), this.locationName(b.locationId));
        // default: product
        return this.strCmp(this.productName(a.productId), this.productName(b.productId));
      });
      if (this.sortDir === 'desc') rows.reverse();

      this.visible = rows;
    }

    // reset paging when filters/view change
    this.page = 1;
  }

  // hooks
  onFiltersChange(): void {
    this.applyAll();
  }
  toggleGroup(): void {
    this.groupByProduct = !this.groupByProduct;
    this.applyAll();
  }
  setSort(key: SortKey): void {
    this.sortDir = this.sortKey === key && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortKey = key;
    this.applyAll();
  }

  // paging helpers
  get totalRows(): number {
    return this.groupByProduct ? this.grouped.length : this.visible.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
  }
  get pageRows(): any[] {
    const rows = this.groupByProduct ? this.grouped : this.visible;
    const start = (this.page - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  // totals
  get totalQtyVisible(): number {
    return (this.groupByProduct ? this.grouped : this.visible).reduce(
      (s: number, r: any) => s + Number(r.qty || 0),
      0
    );
  }
  get totalQtyPage(): number {
    return this.pageRows.reduce((s: number, r: any) => s + Number(r.qty || 0), 0);
  }

  // export
  exportJSON(): void {
    const data = this.groupByProduct ? this.grouped : this.visible;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.download(url, `current-stock-${this.today()}.json`);
  }

  exportCSV(): void {
    if (this.groupByProduct) {
      const header = ['productId', 'productName', 'qty', 'locations'];
      const rows = this.grouped.map((g) =>
        [g.productId, this.csv(this.productName(g.productId)), g.qty, g.locations].join(',')
      );
      this.saveCsv([header.join(','), ...rows].join('\n'));
    } else {
      const header = ['productId', 'productName', 'locationId', 'locationName', 'qty', 'updatedAt'];
      const rows = this.visible.map((r) =>
        [
          r.productId,
          this.csv(this.productName(r.productId)),
          r.locationId,
          this.csv(this.locationName(r.locationId)),
          r.qty,
          r.updatedAt,
        ].join(',')
      );
      this.saveCsv([header.join(','), ...rows].join('\n'));
    }
  }

  // utils
  private download(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  private saveCsv(text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    this.download(url, `current-stock-${this.today()}.csv`);
  }
  private csv(s: string) {
    return `"${String(s).replace(/"/g, '""')}"`;
  }
  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private numCmp(a: number, b: number) {
    return (Number(a) || 0) - (Number(b) || 0);
  }
  private strCmp(a: string, b: string) {
    return String(a).localeCompare(String(b));
  }
}
