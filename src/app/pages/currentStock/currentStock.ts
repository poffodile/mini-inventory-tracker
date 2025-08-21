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
})
export class CurrentStock implements OnInit {
  // raw ledger rows (1 row per product+location)
  private allRows: StockLedgerRow[] = [];

  // lookups for friendly names
  private productNameById = new Map<string, string>();
  private locationNameById = new Map<string, string>();

  // full stores
  products: Product[] = [];
  locations: Array<{ id: string; name: string }> = [];

  // select options (filtered to items that actually appear in the ledger)
  productOptions: Array<{ id: string; name: string }> = [];
  locationOptions: Array<{ id: string; name: string }> = [];

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

  // derived datasets
  visible: StockLedgerRow[] = []; // when NOT grouped
  grouped: Array<{ productId: string; qty: number; locations: number }> = []; // when grouped

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.products = this.data.getData<Product>('products') || [];
    this.locations = this.data.getData<{ id: string; name: string }>('locations') || [];
    this.products.forEach((p) => this.productNameById.set(p.id, p.name));
    this.locations.forEach((l) => this.locationNameById.set(l.id, l.name));

    this.allRows = this.data.getData<StockLedgerRow>('stockLedger') || [];

    // build select options from what actually exists in the ledger
    const productIdsInLedger = new Set(this.allRows.map((r) => r.productId));
    const locationIdsInLedger = new Set(this.allRows.map((r) => r.locationId));
    this.productOptions = this.products.filter((p) => productIdsInLedger.has(p.id));
    this.locationOptions = this.locations.filter((l) => locationIdsInLedger.has(l.id));

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
      const map = new Map<string, { productId: string; qty: number; locations: number }>();
      for (const r of rows) {
        const e = map.get(r.productId) ?? { productId: r.productId, qty: 0, locations: 0 };
        e.qty += Number(r.qty) || 0;
        e.locations += 1;
        map.set(r.productId, e);
      }
      let grouped = Array.from(map.values());
      grouped = grouped.sort((a, b) => {
        if (this.sortKey === 'qty') return this.numCmp(a.qty, b.qty);
        return this.strCmp(this.productName(a.productId), this.productName(b.productId));
      });
      if (this.sortDir === 'desc') grouped.reverse();
      this.grouped = grouped;
    } else {
      rows = rows.sort((a, b) => {
        if (this.sortKey === 'qty') return this.numCmp(a.qty, b.qty);
        if (this.sortKey === 'updated')
          return this.numCmp(new Date(a.updatedAt).getTime(), new Date(b.updatedAt).getTime());
        if (this.sortKey === 'location')
          return this.strCmp(this.locationName(a.locationId), this.locationName(b.locationId));
        return this.strCmp(this.productName(a.productId), this.productName(b.productId));
      });
      if (this.sortDir === 'desc') rows.reverse();
      this.visible = rows;
    }

    this.page = 1; // reset paging whenever filters/view change
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
  clearFilters(): void {
    this.searchText = '';
    this.productFilter = '';
    this.locationFilter = '';
    this.groupByProduct = false;
    this.sortKey = 'product';
    this.sortDir = 'asc';
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

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.onFiltersChange();
    }
  }
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.onFiltersChange?.();
    }
  }
}
