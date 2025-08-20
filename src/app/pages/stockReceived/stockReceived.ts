import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data';
import { ReceivedItem } from '../../interfaceTypes/ReceivedItem';

@Component({
  selector: 'app-stock-received',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stockReceived.html',
  styleUrls: ['./stockReceived.css'],
})
export class StockReceived implements OnInit {
  receivedItems: ReceivedItem[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.receivedItems = this.dataService.getData<ReceivedItem>('stockLedger');
  }
}
