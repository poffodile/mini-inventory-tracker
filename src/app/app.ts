import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../app/services/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [ThemeService],
})
export class App {
  protected readonly title = signal('mini-inventory-tracker');

  constructor(private theme: ThemeService) {
    // set theme on app start (reads saved or system)
    this.theme.init();
  }

  // click handler from the header toggle
  toggleTheme() {
    this.theme.toggle();
  }
}
