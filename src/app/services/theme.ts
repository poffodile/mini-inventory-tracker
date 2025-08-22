import { Injectable } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'inventory_theme';

  init(): void {
    const saved = this.get();
    if (saved) return this.apply(saved);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.apply(prefersDark ? 'dark' : 'light');
  }

  toggle(): void {
    this.apply(this.get() === 'dark' ? 'light' : 'dark');
  }

  get(): Theme | null {
    return (localStorage.getItem(this.KEY) as Theme | null) ?? null;
  }

  private apply(theme: Theme): void {
    const root = document.documentElement; // <html>
    // DaisyUI theme (for bg-base-*, text-base-*, etc.)
    root.setAttribute('data-theme', theme);
    // Tailwind dark: variant support if you use dark:bg-...
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(this.KEY, theme);
  }
}
