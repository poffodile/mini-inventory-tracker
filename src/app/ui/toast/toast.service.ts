import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<string[]>([]);
  toasts = this._toasts.asReadonly();

  show(message: string, ms = 2000): void {
    const arr = this._toasts();
    this._toasts.set([...arr, message]);
    setTimeout(() => {
      const [, ...rest] = this._toasts();
      this._toasts.set(rest);
    }, ms);
  }
}
