import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type Theme =
  | 'light'
  | 'dark'
  | 'cupcake'
  | 'bumblebee'
  | 'emerald'
  | 'corporate'
  | 'synthwave'
  | 'retro'
  | 'cyberpunk'
  | 'valentine'
  | 'halloween'
  | 'garden'
  | 'forest'
  | 'aqua'
  | 'lofi'
  | 'pastel'
  | 'fantasy'
  | 'wireframe'
  | 'black'
  | 'luxury'
  | 'dracula'
  | 'cmyk'
  | 'autumn'
  | 'business'
  | 'acid'
  | 'lemonade'
  | 'night'
  | 'coffee'
  | 'winter'
  | 'dim'
  | 'nord'
  | 'sunset'
  | 'caramellatte'
  | 'abyss'
  | 'silk';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  // current theme (for binding)
  theme = signal<Theme>('light');

  // list shown in the dropdown (curated, but you can keep all)
  themes: Theme[] = [
    'light',
    'dark',
    'cupcake',
    'corporate',
    'emerald',
    'business',
    'night',
    'winter',
    'coffee',
    'nord',
    'dim',
    'retro',
    'dracula',
    'lemonade',
    'sunset',
    'caramellatte',
    'abyss',
    'silk',
  ];

  ngOnInit(): void {
    const saved = localStorage.getItem('inventory_theme') as Theme | null;
    this.setTheme(saved ?? 'light');
  }

  // call from dropdown / buttons
  setTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t); // DaisyUI switch
    localStorage.setItem('inventory_theme', t);
    this.theme.set(t);
  }
  onThemeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setTheme(value as Theme);
  }
}
