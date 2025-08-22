import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 space-y-2 z-50">
      @for (t of toasts(); track t) {
      <div class="px-3 py-2 rounded shadow bg-black text-white/90">
        {{ t }}
      </div>
      }
    </div>
  `,
})
export class Toast {
  toasts = computed(() => this.svc.toasts());
  constructor(private svc: ToastService) {}
}
