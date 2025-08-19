import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data';
import { ProductTable } from '../../components/product-table/product-table';
import { FormsModule } from '@angular/forms';
interface Product {
  id: string;
  name: string;
  uom: string;
  defaultLocationId?: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ProductTable, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  products: Product[] = [];
  filterText: string = ''; // stores what the user types in the search box
  selectedField: string = 'id'; // stores the field to filter by, default is 'id', the dropdown option the user picks
  advancedFilterText: string = ''; // stores the text for advanced filtering, stores the currently selected field for  the dropdown option the user picks e.g product id or name
  filteredProducts: Product[] = []; // this will hold the final list of products to show  based on the advanced search criteria
  //sortField: string = 'id';
  sortOrder: string = 'asc';
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.products = this.dataService.getData('products'); // calls the data service to get the list of products from the LocalStorage
    // this.filteredProducts = [...this.products]; //
    this.applyFilters();
  }

  //this gets called when the filter button is clicked
  applyAdvancedFilter(): void {
    const field = this.selectedField;
    const text = this.advancedFilterText.toLowerCase();

    this.filteredProducts = this.products.filter((p) =>
      p[field as keyof Product]?.toString().toLowerCase().includes(text)
    );
  }

  applySort(): void {
    const field = this.sortField;
    const order = this.sortOrder;

    this.filteredProducts.sort((a, b) => {
      const valA = a[field as keyof Product];
      const valB = b[field as keyof Product];

      if (!valA || !valB) return 0;

      const strA = valA.toString().toLowerCase();
      const strB = valB.toString().toLowerCase();

      return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }

  applyFilters(): void {
    const searchText = this.filterText.toLowerCase();
    const advancedText = this.advancedFilterText.toLowerCase();
    const selectedField = this.selectedField;

    // Filter
    let results = this.products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchText);
      const matchesAdvanced = product[selectedField as keyof Product]
        ?.toString()
        .toLowerCase()
        .includes(advancedText);
      return matchesSearch && matchesAdvanced;
    });

    // Sort
    if (this.sortField) {
      results.sort((a, b) => {
        const valueA = a[this.sortField as keyof Product];
        const valueB = b[this.sortField as keyof Product];

        if (valueA == null || valueB == null) return 0;

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }

        return this.sortDirection === 'asc'
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
      });
    }

    this.filteredProducts = results;
  }
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }
}
