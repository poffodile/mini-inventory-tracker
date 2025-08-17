import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  constructor(private dataService: DataService) {}

  loadData(): void {
    this.dataService.loadDemoData();
    alert('Demo data loaded into LocalStorage!');
  }

  // ngOnInit(): void { dont  need this anymore as if  i used ngOnInit it would immediately
  //   this.loadData();  load the data, and i would no longer have contorol as to when i want the data to be loaded which is only ( onclick)
  // }
}
