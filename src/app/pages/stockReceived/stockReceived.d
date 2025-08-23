<div class="p-6 space-y-4">
  <h1 class="text-2xl font-bold">Stock Received Log</h1>

  <!-- Filters -->
  <div class="grid grid-cols-1 md:grid-cols-5 gap-3 max-w-5xl items-end">
    <div class="">
      <label class="block text-sm font-medium mb-1">Search (any field)</label>
      <input
        [(ngModel)]="searchText"
        (input)="applySearch()"
        type="text"
        class="border rounded px-2 py-1 w-full"
        placeholder="Try: M001, P001, PO-10001, LOC01, 2025-08"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">From (date)</label>
      <input
        type="date"
        [(ngModel)]="dateFrom"
        (change)="applySearch()"
        class="border rounded px-2 py-1 w-full"
        placeholder="Select start date"
        title="From date"
      />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1">To (date)</label>
      <input
        type="date"
        [(ngModel)]="dateTo"
        (change)="applySearch()"
        class="border rounded px-2 py-1 w-full"
        placeholder="Select end date"
        title="To date"
      />
    </div>

    <div class="flex gap-2">
      <button
        class="px-3 py-2 rounded bg-gray-100 border"
        (click)="toggleSort()"
        title="Toggle sort by timestamp"
      >
        Sort: {{ sortDir === 'desc' ? 'Newest first' : 'Oldest first' }}
      </button>
    </div>

    <div class="flex gap-2 justify-end">
      <button class="px-3 py-2 rounded bg-gray-100 border" (click)="exportJSON(false)">
        Export JSON
      </button>
      <button class="px-3 py-2 rounded bg-gray-100 border" (click)="exportCSV(false)">
        Export CSV
      </button>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="min-w-full border border-gray-300 mt-2">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-3 py-2 text-left">ID</th>
          <th class="px-3 py-2 text-left">Product</th>
          <th class="px-3 py-2 text-left">To Location</th>
          <th class="px-3 py-2 text-left">Qty</th>
          <th class="px-3 py-2 text-left">Ref</th>
          <th class="px-3 py-2 text-left">Timestamp</th>
        </tr>
      </thead>

      <tbody>
        @for (m of paged; track m.id) {
        <tr class="hover:bg-gray-50">
          <td class="border px-3 py-2">{{ m.id }}</td>
          <td class="border px-3 py-2">{{ productName(m.productId) }} ({{ m.productId }})</td>
          <td class="border px-3 py-2">
            {{ locationName(m.toLocationId) }}
            <span *ngIf="m.toLocationId">({{ m.toLocationId }})</span>
          </td>
          <td class="border px-3 py-2">{{ m.qty }}</td>
          <td class="border px-3 py-2">{{ m.ref }}</td>
          <td class="border px-3 py-2">{{ m.timestamp | date : 'medium' }}</td>
        </tr>
        }
      </tbody>

      <tfoot>
        <tr class="bg-gray-50 font-medium">
          <td class="border px-3 py-2" colspan="3">Total (visible filters)</td>
          <td class="border px-3 py-2">{{ totalQtyVisible }}</td>
          <td class="border px-3 py-2" colspan="2"></td>
        </tr>
      </tfoot>
    </table>

    <!-- Pagination -->
    <div class="flex items-center gap-3 mt-3">
      <button class="px-3 py-1 border rounded" (click)="prevPage()">Prev</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button class="px-3 py-1 border rounded" (click)="nextPage()">Next</button>

      <span class="ml-4">Rows per page:</span>
      <select
        [(ngModel)]="pageSize"
        (change)="page = 1"
        class="border rounded px-2 py-1"
        title="Rows per page"
      >
        <option [ngValue]="10">10</option>
        <option [ngValue]="20">20</option>
        <option [ngValue]="50">50</option>
        <option [ngValue]="100">100</option>
      </select>

      <span class="ml-auto text-sm text-gray-600">
        Showing {{ paged.length }} of {{ visible.length }} (qty on page: {{ totalQtyPage }})
      </span>
    </div>
  </div>
</div>
