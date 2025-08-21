import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

type AppTheme = 'light' | 'dark';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = signal('mini-inventory-tracker');

  // mobile menu (boolean version)
  mobileMenuOpen = false;
  toggleMobile() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  closeMobile() {
    this.mobileMenuOpen = false;
  }

  // theme
  private THEME_KEY = 'app_theme';
  private theme = signal<AppTheme>('light');

  ngOnInit(): void {
    const saved = localStorage.getItem(this.THEME_KEY) as AppTheme | null;
    if (saved) this.theme.set(saved);
    else if (window.matchMedia?.('(prefers-color-scheme: dark)')) this.theme.set('dark');

    this.applyTheme();
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
    localStorage.setItem(this.THEME_KEY, this.theme());
    this.applyTheme();
  }

  themeLabel(): string {
    return this.theme() === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  private applyTheme(): void {
    const root = document.documentElement; // <html>
    if (this.theme() === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }
}
