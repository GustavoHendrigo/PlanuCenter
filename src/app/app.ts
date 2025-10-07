import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './layout/sidebar.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
type QuickPanelState = {
  title: string;
  description: string;
};

export class App {
  private router = inject(Router);

  isMobileMenuOpen = signal(false);
  private profileMenuOpen = signal(false);
  private quickPanelState = signal<QuickPanelState | null>(null);

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
  quickPanel = computed(() => this.quickPanelState());

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(value => !value);
  }

  openQuickPanel(type: 'analytics' | 'notifications'): void {
    this.profileMenuOpen.set(false);

    if (type === 'analytics') {
      this.quickPanelState.set({
        title: 'Insights em tempo real',
        description: 'Acompanhe os principais indicadores das operações e identifique gargalos rapidamente.'
      });
      return;
    }

    this.quickPanelState.set({
      title: 'Central de notificações',
      description: 'Veja solicitações pendentes, aprovações e atualizações das suas ordens de serviço.'
    });
  }

  closeQuickPanel(): void {
    this.quickPanelState.set(null);
  }

  handleProfileAction(action: 'profile' | 'settings' | 'logout'): void {
    this.profileMenuOpen.set(false);

    if (action === 'logout') {
      this.quickPanelState.set(null);
      this.isMobileMenuOpen.set(false);
      void this.router.navigate(['/login']);
      return;
    }

    if (action === 'profile') {
      this.quickPanelState.set({
        title: 'Perfil do colaborador',
        description: 'Gerencie dados pessoais, permissões de acesso e assinatura eletrônica.'
      });
      return;
    }

    this.quickPanelState.set({
      title: 'Preferências da conta',
      description: 'Ative temas escuros, ajuste notificações e conecte integrações externas.'
    });
  }
}
