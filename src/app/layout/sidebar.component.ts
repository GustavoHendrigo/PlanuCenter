import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../core/models/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-full flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-gray-100">
      <div class="flex h-20 items-center gap-3 px-6">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-7 w-7"
          >
            <path
              d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
            />
          </svg>
        </div>
        <div>
          <p class="text-lg font-semibold">PlanuCenter</p>
          <p class="text-xs text-gray-400">Gestão simplificada</p>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-3 pb-6">
        <div class="rounded-2xl bg-white/5 p-3">
          <p class="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Navegação</p>
          <nav class="mt-2 space-y-1">
            @for (item of menuItems; track item.id) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-blue-500/80 text-white shadow-lg shadow-blue-900/30"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="navItemClicked.emit()"
                class="flex items-center rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <span class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-5 w-5"
                  >
                    <path [attr.d]="item.iconPath" />
                  </svg>
                </span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>
      </div>

      <div class="border-t border-white/10 px-6 py-5">
        <p class="text-sm font-semibold text-white">Precisa de ajuda?</p>
        <p class="mt-1 text-xs text-gray-400">Nossa equipe está pronta para auxiliar sua operação.</p>
        <button
          type="button"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-7v-1a3 3 0 0 1 3-3h1m-4-4h.01" />
          </svg>
          Central de suporte
        </button>
      </div>
    </div>
  `,
})
export class SidebarComponent {
  @Output() navItemClicked = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { id: 'inicio', label: 'Início', path: '/', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id: 'ordem_servico', label: 'Ordens de Serviço', path: '/ordens-servico', iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M16 18H8 M16 14H8 M12 10H8' },
    { id: 'veiculos', label: 'Veículos', path: '/veiculos', iconPath: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z' },
    { id: 'estoque', label: 'Estoque', path: '/estoque', iconPath: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z' },
    { id: 'clientes', label: 'Clientes', path: '/clientes', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M8 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 21v-2a4 4 0 0 0-3-3.87 M17 3a4 4 0 0 1 0 8' },
  ];
}
