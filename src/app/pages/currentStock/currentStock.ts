// ========= Current Stock =========
// what I'm doing here:
// - read my current balances from 'stockledger' (already maintained by my DataService)
// - show a neat table with search + filters + sort + paging
// - NEVER guess field names: I use productId/locationId/qty exactly as in my JSON
// - use my DataService helpers for labels so names stay consistent app-wide

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';

type LedgerRow = { productId: string; locationId: string; qty: number };

type SortKey = 'product' | 'location' | 'qty';

@Component({
  selector: 'app-current-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './currentStock.html',
})
export class CurrentStock implements OnInit {
  // raw + working sets
  ledger: LedgerRow[] = [];
  filtered: LedgerRow[] = [];

  // dropdown options
  productOptions: string[] = [];
  locationOptions: string[] = [];

  // filters
  searchText = '';
  productFilter = '';
  locationFilter = '';

  // sort + paging
  sortKey: SortKey = 'product';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.reload();
  }

  // refresh from local storage
  reload(): void {
    const rows = (this.data.getData<LedgerRow>('stockLedger') ?? []).filter(
      (r) => r && Number(r.qty) > 0
    );
    this.ledger = rows;

    // build select options from actual data (keeps dropdowns real)
    this.productOptions = Array.from(new Set(this.ledger.map((r) => r.productId))).sort();
    this.locationOptions = Array.from(new Set(this.ledger.map((r) => r.locationId))).sort();

    this.applyAll(true);
  }

  // helper labels (ALWAYS go through my service for consistency)
  productLabel(id?: string): string {
    return id ? this.data.productName(id) : '-';
  }
  locationLabel(id?: string): string {
    return id ? this.data.locationName(id) : '-';
  }

  // filtering + sorting + paging
  private applyAll(resetPage: boolean): void {
    const q = this.searchText.trim().toLowerCase();
    const pf = this.productFilter;
    const lf = this.locationFilter;

    // filter
    let rows = this.ledger.filter((r) => {
      if (pf && r.productId !== pf) return false;
      if (lf && r.locationId !== lf) return false;
      if (!q) return true;
      // search against both ids and resolved labels
      const productText = `${this.productLabel(r.productId)} ${r.productId}`.toLowerCase();
      const locationText = `${this.locationLabel(r.locationId)} ${r.locationId}`.toLowerCase();
      const qtyText = String(r.qty);
      return productText.includes(q) || locationText.includes(q) || qtyText.includes(q);
    });

    // sort
    rows.sort((a, b) => {
      if (this.sortKey === 'qty') {
        return this.sortDir === 'asc' ? a.qty - b.qty : b.qty - a.qty;
      }
      if (this.sortKey === 'product') {
        const ax = this.productLabel(a.productId).toLowerCase();
        const bx = this.productLabel(b.productId).toLowerCase();
        return this.sortDir === 'asc' ? ax.localeCompare(bx) : bx.localeCompare(ax);
      }
      // location
      const al = this.locationLabel(a.locationId).toLowerCase();
      const bl = this.locationLabel(b.locationId).toLowerCase();
      return this.sortDir === 'asc' ? al.localeCompare(bl) : bl.localeCompare(al);
    });

    this.filtered = rows;
    if (resetPage) this.page = 1;
  }

  onSearch() {
    this.applyAll(true);
  }
  onFilterChange() {
    this.applyAll(true);
  }

  setSort(key: SortKey) {
    this.sortDir = this.sortKey === key && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortKey = key;
    this.applyAll(false); // keep current page when only sorting
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  get paged(): LedgerRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
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
}
