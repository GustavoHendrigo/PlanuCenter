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
  nomeUsuario = computed(() => this.usuarioAtual()?.nome ?? '');
  perfilUsuario = computed(() => {
    const perfil = this.usuarioAtual()?.perfil ?? '';
    if (!perfil) {
      return '';
    }
    return perfil.charAt(0).toUpperCase() + perfil.slice(1);
  });
  avatarInicial = computed(() => {
    const nome = this.nomeUsuario();
    return nome ? nome.charAt(0).toUpperCase() : '?';
  });

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(value => !value);
  }

  logout(): void {
    this.profileMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.authService.logout();
  }
}
