import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../core/models/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-full flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-gray-100">
      <div class="flex h-24 items-center gap-3 px-6">
        <div class="relative h-12 w-12">
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/80 via-blue-500/80 to-indigo-500/80 shadow-lg shadow-blue-900/40"></div>
          <div class="absolute inset-[6px] rounded-xl bg-gray-950"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-6 w-6 text-cyan-300"
            >
              <path d="M5 6.5C5 4.567 6.567 3 8.5 3h7A3.5 3.5 0 0 1 19 6.5V9h-5.25A3.75 3.75 0 0 0 10 12.75V21H8.5A3.5 3.5 0 0 1 5 17.5Z" />
              <path d="M14 21v-8.25A2.75 2.75 0 0 1 16.75 10H21" />
            </svg>
          </div>
        </div>
        <div>
          <p class="text-lg font-semibold tracking-wide text-white">PlanuCenter</p>
          <p class="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Operações inteligentes</p>
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
