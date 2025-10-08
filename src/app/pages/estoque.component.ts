import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Peca } from '../core/models/models';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Controle de Estoque de Peças</h2>
        @if (modoVisualizacao() === 'lista') {
          <button
            class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
            (click)="abrirFormularioNovo()"
          >
            + Adicionar Peça
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
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Peça</th>
                <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Estoque</th>
                <th class="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço (R$)</th>
                <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
              @for (peca of pecas(); track peca.id) {
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                  <td class="py-3 px-6 text-left">{{ peca.codigo }}</td>
                  <td class="py-3 px-6 text-left">{{ peca.nome }}</td>
                  <td class="py-3 px-6 text-center">{{ peca.estoque }}</td>
                  <td class="py-3 px-6 text-right">{{ peca.preco | currency:'BRL' }}</td>
                  <td class="py-3 px-6 text-center">
                    <div class="flex justify-center gap-2">
                      <button
                        class="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 text-xs"
                        (click)="editarPeca(peca)"
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
        <form class="grid gap-4 md:grid-cols-2" (ngSubmit)="salvarPeca()">
          <label class="flex flex-col text-sm text-gray-600">
            Código
            <input class="mt-1 rounded-md border-gray-300" name="codigo" [(ngModel)]="formulario.codigo" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Nome
            <input class="mt-1 rounded-md border-gray-300" name="nome" [(ngModel)]="formulario.nome" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Quantidade em estoque
            <input
              type="number"
              min="0"
              class="mt-1 rounded-md border-gray-300"
              name="estoque"
              [(ngModel)]="formulario.estoque"
              required
            />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Preço
            <input
              type="number"
              min="0"
              step="0.01"
              class="mt-1 rounded-md border-gray-300"
              name="preco"
              [(ngModel)]="formulario.preco"
              required
            />
          </label>

          <div class="md:col-span-2 flex justify-end gap-3">
            <button type="button" class="px-4 py-2 rounded-md border border-gray-300" (click)="voltarParaLista()">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              {{ editandoId() ? 'Atualizar Peça' : 'Salvar Peça' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class EstoqueComponent {
  private dataService = inject(DataService);

  pecas = this.dataService.pecas;

  modoVisualizacao = signal<'lista' | 'formulario'>('lista');
  editandoId = signal<number | null>(null);

  formulario = {
    codigo: '',
    nome: '',
    estoque: 0,
    preco: 0,
  };

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      codigo: '',
      nome: '',
      estoque: 0,
      preco: 0,
    };
    this.modoVisualizacao.set('formulario');
  }

  editarPeca(peca: Peca) {
    this.editandoId.set(peca.id);
    this.formulario = {
      codigo: peca.codigo,
      nome: peca.nome,
      estoque: peca.estoque,
      preco: peca.preco,
    };
    this.modoVisualizacao.set('formulario');
  }

  salvarPeca() {
    if (!this.formulario.codigo || !this.formulario.nome) {
      return;
    }

    if (this.editandoId()) {
      const idParaAtualizar = this.editandoId()!;
      this.dataService.pecas.update(lista =>
        lista.map(item =>
          item.id === idParaAtualizar
            ? {
                ...item,
                codigo: this.formulario.codigo,
                nome: this.formulario.nome,
                estoque: Number(this.formulario.estoque),
                preco: Number(this.formulario.preco),
              }
            : item,
        ),
      );
    } else {
      const novoId = this.dataService.pecas().reduce((max, peca) => Math.max(max, peca.id), 0) + 1;
      this.dataService.pecas.update(lista => [
        {
          id: novoId,
          codigo: this.formulario.codigo,
          nome: this.formulario.nome,
          estoque: Number(this.formulario.estoque),
          preco: Number(this.formulario.preco),
        },
        ...lista,
      ]);
    }

    this.voltarParaLista();
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
  }
}
