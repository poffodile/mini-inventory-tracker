import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('mini-inventory-tracker');

  mobileMenuOpen = false;

  toggleMobile() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  mobileOpen() {
    return this.mobileMenuOpen;
  }

  closeMobile() {
    this.mobileMenuOpen = false;
  }
}
