import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Cliente } from '../core/models/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Gestão de Clientes</h2>
        @if (modoVisualizacao() === 'lista') {
          <button
            class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
            (click)="abrirFormularioNovo()"
          >
            + Cadastrar Cliente
          </button>
        } @else {
          <button
            class="w-full md:w-auto bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            (click)="voltarParaLista()"
          >
            Voltar para a lista
          </button>
        }
      </div>

      @if (modoVisualizacao() === 'lista') {
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead class="bg-gray-50">
              <tr>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
              @for (cliente of clientes(); track cliente.id) {
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                  <td class="py-3 px-6 text-left">{{ cliente.nome }}</td>
                  <td class="py-3 px-6 text-left">{{ cliente.email }}</td>
                  <td class="py-3 px-6 text-left">{{ cliente.telefone }}</td>
                  <td class="py-3 px-6 text-center">
                    <div class="flex justify-center gap-2">
                      <button
                        class="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-xs"
                        (click)="verDetalhes(cliente)"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        class="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 text-xs"
                        (click)="editarCliente(cliente)"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (modoVisualizacao() === 'formulario') {
        <form class="grid gap-4 md:grid-cols-2" (ngSubmit)="salvarCliente()">
          <label class="flex flex-col text-sm text-gray-600 md:col-span-2">
            Nome completo
            <input class="mt-1 rounded-md border-gray-300" name="nome" [(ngModel)]="formulario.nome" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            E-mail
            <input class="mt-1 rounded-md border-gray-300" type="email" name="email" [(ngModel)]="formulario.email" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Telefone
            <input class="mt-1 rounded-md border-gray-300" name="telefone" [(ngModel)]="formulario.telefone" required />
          </label>

          <div class="md:col-span-2 flex justify-end gap-3">
            <button type="button" class="px-4 py-2 rounded-md border border-gray-300" (click)="voltarParaLista()">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              {{ editandoId() ? 'Atualizar Cliente' : 'Salvar Cliente' }}
            </button>
          </div>
        </form>
      }

      @if (modoVisualizacao() === 'detalhes' && clienteSelecionado()) {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-base font-semibold text-gray-700">Resumo do Cliente</h3>
            <button class="text-sm text-blue-600 hover:underline" (click)="voltarParaLista()">Voltar para a lista</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2 text-sm text-gray-600">
            <div>
              <span class="font-semibold text-gray-700 block">Nome</span>
              {{ clienteSelecionado()!.nome }}
            </div>
            <div>
              <span class="font-semibold text-gray-700 block">E-mail</span>
              {{ clienteSelecionado()!.email }}
            </div>
            <div>
              <span class="font-semibold text-gray-700 block">Telefone</span>
              {{ clienteSelecionado()!.telefone }}
            </div>
            <div>
              <span class="font-semibold text-gray-700 block">Veículos cadastrados</span>
              {{ veiculosDoCliente().length }}
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-700 mb-2">Veículos do cliente</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              @if (veiculosDoCliente().length) {
                @for (veiculo of veiculosDoCliente(); track veiculo.id) {
                  <li class="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 rounded-md px-3 py-2">
                    <span>{{ veiculo.marca }} {{ veiculo.modelo }} ({{ veiculo.placa }})</span>
                    <span class="text-gray-500 text-xs">Ano {{ veiculo.ano }}</span>
                  </li>
                }
              } @else {
                <li class="text-gray-500">Nenhum veículo cadastrado para este cliente.</li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `,
})
export class ClientesComponent {
  private dataService = inject(DataService);

  clientes = this.dataService.clientes;
  veiculos = this.dataService.veiculos;

  modoVisualizacao = signal<'lista' | 'formulario' | 'detalhes'>('lista');
  editandoId = signal<number | null>(null);
  clienteSelecionadoId = signal<number | null>(null);

  formulario = {
    nome: '',
    email: '',
    telefone: '',
  };

  clienteSelecionado = computed(() => {
    const id = this.clienteSelecionadoId();
    if (id == null) {
      return undefined;
    }
    return this.clientes().find(cliente => cliente.id === id);
  });

  veiculosDoCliente = computed(() => {
    if (!this.clienteSelecionado()) {
      return [];
    }
    return this.veiculos().filter(veiculo => veiculo.clienteId === this.clienteSelecionado()!.id);
  });

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      nome: '',
      email: '',
      telefone: '',
    };
    this.modoVisualizacao.set('formulario');
  }

  editarCliente(cliente: Cliente) {
    this.editandoId.set(cliente.id);
    this.formulario = {
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
    };
    this.modoVisualizacao.set('formulario');
  }

  verDetalhes(cliente: Cliente) {
    this.clienteSelecionadoId.set(cliente.id);
    this.modoVisualizacao.set('detalhes');
  }

  salvarCliente() {
    if (!this.formulario.nome || !this.formulario.email || !this.formulario.telefone) {
      return;
    }

    const dadosNormalizados = {
      nome: this.formulario.nome.trim(),
      email: this.formulario.email.trim(),
      telefone: this.formulario.telefone.trim(),
    };

    if (this.editandoId()) {
      const idParaAtualizar = this.editandoId()!;
      this.dataService.clientes.update(lista =>
        lista.map(item =>
          item.id === idParaAtualizar
            ? { ...item, ...dadosNormalizados }
            : item,
        ),
      );
    } else {
      const novoId = this.dataService.clientes().reduce((max, cliente) => Math.max(max, cliente.id), 0) + 1;
      this.dataService.clientes.update(lista => [
        { id: novoId, ...dadosNormalizados },
        ...lista,
      ]);
    }

    this.voltarParaLista();
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
    this.clienteSelecionadoId.set(null);
  }
}
