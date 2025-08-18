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
  @Input() filterText: string = ''; //this would take the filter text input from the parent component

  get filteredProducts(): Product[] {
    if (!this.filterText) return this.products;
    return this.products.filter((product) =>
      product.name.toLowerCase().includes(this.filterText.toLowerCase())
    );
  }
}
// to make the product table reusable, i used the add an @Input() property to accept the product data from the parent component.
