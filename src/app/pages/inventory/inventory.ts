import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data';
import { ProductTable } from '../../components/product-table/product-table';
interface Product {
  id: string;
  name: string;
  uom: string;
  defaultLocationId?: string;
}
@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ProductTable],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  products: Product[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.products = this.dataService.getData('products');
  }
}
