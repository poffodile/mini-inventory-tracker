import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data';
import { ReceivedItem } from '../../interfaceTypes/ReceivedItem';
import { Movement } from '../../interfaceTypes/Movement';

@Component({
  selector: 'app-stock-received',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stockReceived.html',
  styleUrls: ['./stockReceived.css'],
})
export class StockReceived implements OnInit {
  sortedItems: ReceivedItem[] = [];
  receivedItems: Movement[] = [];

  sortField: keyof ReceivedItem | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    const allMovements = this.dataService.getData<Movement[]>('movements');
    this.receivedItems = allMovements.filter((m) => m.type === 'RECEIPT');
    this.sortedItems = [...this.receivedItems];
  }

  sort(field: keyof ReceivedItem): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortedItems.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === undefined || bValue === undefined) return 0;

      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();

      if (aStr < bStr) return this.sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
