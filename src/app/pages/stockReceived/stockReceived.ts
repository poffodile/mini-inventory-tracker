// stockReceived.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ⬅️ add this
import { DataService } from '../../services/data';
import { Movement } from '../../interfaceTypes/Movement';
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

  // search box
  searchText = '';

  // what the table shows
  visible: Movement[] = [];

  // simple sort (we’ll wire this in step 2)
  sortDir: 'asc' | 'desc' = 'desc'; // default: newest first

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    const allMovements = this.dataService.getData<Movement>('movements') || [];
    this.allReceipts = allMovements.filter((m) => m.type === 'RECEIPT');
    this.applySearch(); // initial render
  }
  // filter by any field (id, productId, ref, location, qty, date...)
  applySearch(): void {
    const q = this.searchText.trim().toLowerCase();

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

          return values.some((v) => v.includes(q));
        });

    rows = this.sortByTimestamp(rows, this.sortDir);

    this.visible = rows;
  }

  // step 2 will call this
  toggleSort(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.applySearch();
  }

  // Sorts the rows by timestamp in the specified direction
  sortByTimestamp(rows: Movement[], dir: 'asc' | 'desc'): Movement[] {
    return rows.slice().sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return dir === 'asc' ? tA - tB : tB - tA;
    });
  }
}
