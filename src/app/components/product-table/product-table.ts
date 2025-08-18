import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: string;
  name: string;
  uom: string;
  defaultLocationId?: string;
}

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-table.html',
  styleUrl: './product-table.css',
})
export class ProductTable {
  @Input() products: Product[] = [];
}
// to make the product table reusable, i used the add an @Input() property to accept the product data from the parent component.
