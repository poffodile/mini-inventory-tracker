import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DataService } from './services/data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App implements OnInit {
  constructor(private data: DataService) {}

  ngOnInit(): void {
    // Seed demo data once so pages aren’t empty
    const products = this.data.getData('products') ?? [];
    if (products.length === 0) this.data.loadDemoData();
  }
}
