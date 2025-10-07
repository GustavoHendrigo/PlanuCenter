import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);

  isMobileMenuOpen = signal(false);
  private currentUrl = signal(this.router.url || '/');
  shouldShowLayout = computed(() => !this.currentUrl().startsWith('/login'));

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);

        if (!this.shouldShowLayout()) {
          this.isMobileMenuOpen.set(false);
        }
      }
    });
  }
}
