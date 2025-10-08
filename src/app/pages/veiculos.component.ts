import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Veiculo } from '../core/models/models';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Cadastro de Veículos</h2>
        @if (modoVisualizacao() === 'lista') {
          <button
            class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
            (click)="abrirFormularioNovo()"
          >
            + Cadastrar Veículo
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
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ano</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
              @for (veiculo of veiculos(); track veiculo.id) {
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                  <td class="py-3 px-6 text-left">{{ veiculo.placa }}</td>
                  <td class="py-3 px-6 text-left">{{ veiculo.marca }}</td>
                  <td class="py-3 px-6 text-left">{{ veiculo.modelo }}</td>
                  <td class="py-3 px-6 text-left">{{ veiculo.ano }}</td>
                  <td class="py-3 px-6 text-left">{{ veiculo.clienteNome }}</td>
                  <td class="py-3 px-6 text-center">
                    <div class="flex justify-center gap-2">
                      <button
                        class="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 text-xs"
                        (click)="editarVeiculo(veiculo)"
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
        <form class="grid gap-4 md:grid-cols-2" (ngSubmit)="salvarVeiculo()">
          <label class="flex flex-col text-sm text-gray-600">
            Placa
            <input
              class="mt-1 rounded-md border-gray-300"
              name="placa"
              [(ngModel)]="formulario.placa"
              required
              placeholder="AAA-0A00"
            />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Marca
            <input class="mt-1 rounded-md border-gray-300" name="marca" [(ngModel)]="formulario.marca" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Modelo
            <input class="mt-1 rounded-md border-gray-300" name="modelo" [(ngModel)]="formulario.modelo" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600">
            Ano
            <input class="mt-1 rounded-md border-gray-300" name="ano" [(ngModel)]="formulario.ano" required />
          </label>

          <label class="flex flex-col text-sm text-gray-600 md:col-span-2">
            Cliente
            <select class="mt-1 rounded-md border-gray-300" name="clienteId" [(ngModel)]="formulario.clienteId" required>
              <option [ngValue]="undefined" disabled>Selecione um cliente</option>
              @for (cliente of clientes(); track cliente.id) {
                <option [ngValue]="cliente.id">{{ cliente.nome }}</option>
              }
            </select>
          </label>

          <div class="md:col-span-2 flex justify-end gap-3">
            <button type="button" class="px-4 py-2 rounded-md border border-gray-300" (click)="voltarParaLista()">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              {{ editandoId() ? 'Atualizar Veículo' : 'Salvar Veículo' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class VeiculosComponent {
  private dataService = inject(DataService);

  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;

  modoVisualizacao = signal<'lista' | 'formulario'>('lista');
  editandoId = signal<number | null>(null);

  formulario = {
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    clienteId: undefined as number | undefined,
  };

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      clienteId: undefined,
    };
    this.modoVisualizacao.set('formulario');
  }

  editarVeiculo(veiculo: Veiculo) {
    this.editandoId.set(veiculo.id);
    this.formulario = {
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      clienteId: veiculo.clienteId,
    };
    this.modoVisualizacao.set('formulario');
  }

  salvarVeiculo() {
    if (!this.formulario.placa || !this.formulario.marca || !this.formulario.modelo || !this.formulario.ano || !this.formulario.clienteId) {
      return;
    }

    const cliente = this.obterClienteSelecionado();
    if (!cliente) {
      return;
    }

    if (this.editandoId()) {
      const idParaAtualizar = this.editandoId()!;
      this.dataService.veiculos.update(lista =>
        lista.map(item =>
          item.id === idParaAtualizar
            ? {
                ...item,
                placa: this.formulario.placa,
                marca: this.formulario.marca,
                modelo: this.formulario.modelo,
                ano: this.formulario.ano,
                clienteId: cliente.id,
                clienteNome: cliente.nome,
              }
            : item,
        ),
      );
    } else {
      const novoId = this.dataService.veiculos().reduce((max, v) => Math.max(max, v.id), 0) + 1;
      this.dataService.veiculos.update(lista => [
        {
          id: novoId,
          placa: this.formulario.placa,
          marca: this.formulario.marca,
          modelo: this.formulario.modelo,
          ano: this.formulario.ano,
          clienteId: cliente.id,
          clienteNome: cliente.nome,
        },
        ...lista,
      ]);
    }

    this.voltarParaLista();
  }

  private obterClienteSelecionado() {
    if (!this.formulario.clienteId) {
      return undefined;
    }
    return this.clientes().find(cliente => cliente.id === this.formulario.clienteId);
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
  }
}
