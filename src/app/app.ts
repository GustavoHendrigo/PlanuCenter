import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './layout/sidebar.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);
  private authService = inject(AuthService);

  isMobileMenuOpen = signal(false);
  private profileMenuOpen = signal(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  isLoginRoute = computed(() => this.currentUrl().startsWith('/login'));
  isProfileMenuOpen = computed(() => this.profileMenuOpen());
  usuarioAtual = this.authService.usuarioAtual;
  estaAutenticado = this.authService.estaAutenticado;
  iniciaisUsuario = computed(() => {
    const usuario = this.usuarioAtual();
    if (!usuario) {
      return 'US';
    }
    return usuario.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte[0]?.toUpperCase() ?? '')
      .join('') || 'US';
  });

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(value => !value);
  }

  logout(): void {
    this.profileMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
