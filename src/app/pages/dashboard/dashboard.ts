import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.loadDemoData();
  }
}
