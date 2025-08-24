// ========= Stock Received (audit list) =========
// my rules here:
// - read ALL movements from my DataService, but only show type === 'RECEIPT'
// - search across product, bin, ref, ids
// - date range filter (from / to)
// - sort newest/oldest, simple paging
// - labels always via DataService.productName() / locationName()
// - export buttons for CSV + JSON based on my CURRENT filtered list

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { Movement } from '../../interfaceTypes/Movement';

type Receipt = Movement & { type: 'RECEIPT' };

@Component({
  selector: 'app-stock-received',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stockReceived.html',
})
export class StockReceived implements OnInit {
  // source + working sets
  receipts: Receipt[] = [];
  filtered: Receipt[] = [];

  // filters
  searchText = '';
  dateFrom = ''; // yyyy-mm-dd
  dateTo = ''; // yyyy-mm-dd
  sortDir: 'desc' | 'asc' = 'desc';

  // paging
  page = 1;
  pageSize = 10;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    const all = (this.data.getData<Movement>('movements') ?? []).slice();
    const onlyReceipts = all.filter((m) => m?.type === 'RECEIPT') as Receipt[];
    // default newest first
    onlyReceipts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.receipts = onlyReceipts;
    this.applyFilters(true);
  }

  // labels must go through my service so they match everywhere in the app
  productLabel(id?: string) {
    return id ? this.data.productName(id) : '-';
  }
  locationLabel(id?: string) {
    return id ? this.data.locationName(id) : '-';
  }

  // main filter + sort
  applyFilters(resetPage: boolean = true): void {
    const q = this.searchText.trim().toLowerCase();
    const from = this.dateFrom ? new Date(this.dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const to = this.dateTo
      ? new Date(this.dateTo + 'T23:59:59.999').getTime()
      : Number.POSITIVE_INFINITY;

    let rows = this.receipts.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      if (t < from || t > to) return false;

      if (!q) return true;
      const prod = `${this.productLabel(r.productId)} ${r.productId}`.toLowerCase();
      const loc = `${this.locationLabel(r.toLocationId)} ${r.toLocationId}`.toLowerCase();
      const ref = (r.ref ?? '').toLowerCase();
      const id = (r.id ?? '').toLowerCase();
      return prod.includes(q) || loc.includes(q) || ref.includes(q) || id.includes(q);
    });

    rows.sort((a, b) =>
      this.sortDir === 'desc'
        ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    this.filtered = rows;
    if (resetPage) this.page = 1;
  }

  onSearchInput() {
    this.applyFilters(true);
  }

  toggleSort(): void {
    this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    this.applyFilters(false);
  }

  // paging helpers
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  get paged(): Receipt[] {
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

  // totals (nice for the screenshot footer)
  get totalQtyVisible(): number {
    return this.filtered.reduce((s, r) => s + (r.qty || 0), 0);
  }
  get totalQtyPage(): number {
    return this.paged.reduce((s, r) => s + (r.qty || 0), 0);
  }

  // export current FILTERED list to CSV/JSON for the interviewer
  exportCSV(): void {
    const rows = this.filtered;
    const header = [
      'id',
      'productId',
      'productName',
      'toLocationId',
      'toLocationName',
      'qty',
      'ref',
      'timestamp',
    ];
    const body = rows.map((r) => [
      r.id ?? '',
      r.productId,
      this.productLabel(r.productId),
      r.toLocationId ?? '',
      this.locationLabel(r.toLocationId),
      String(r.qty ?? 0),
      r.ref ?? '',
      r.timestamp,
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-received.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportJSON(): void {
    const blob = new Blob([JSON.stringify(this.filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-received.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
