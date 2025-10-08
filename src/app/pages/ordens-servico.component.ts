import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Gerenciar Ordens de Serviço</h2>
        @if (modoVisualizacao() === 'lista') {
          <button
            class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
            (click)="abrirFormulario()"
          >
            + Nova Ordem de Serviço
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
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
              @for (os of ordensServico(); track os.id) {
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                  <td class="py-3 px-6 text-left whitespace-nowrap">
                    <span class="text-blue-600 font-medium">#{{ os.id }}</span>
                  </td>
                  <td class="py-3 px-6 text-left">{{ getVeiculo(os.veiculoId)?.placa }}</td>
                  <td class="py-3 px-6 text-left">{{ getCliente(os.clienteId)?.nome }}</td>
                  <td class="py-3 px-6 text-left">
                    {{ getVeiculo(os.veiculoId)?.marca }} {{ getVeiculo(os.veiculoId)?.modelo }}
                  </td>
                  <td class="py-3 px-6 text-center">
                    <button
                      class="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-xs"
                      (click)="verResumo(os.id)"
                    >
                      Ver Resumo
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (modoVisualizacao() === 'formulario') {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-base font-semibold text-gray-700">Nova Ordem de Serviço</h3>
            <button class="text-sm text-blue-600 hover:underline" (click)="voltarParaLista()">Voltar para a lista</button>
          </div>
          <form class="grid gap-4 md:grid-cols-2" (ngSubmit)="salvarOrdem()">
            <label class="flex flex-col text-sm text-gray-600">
              Cliente
              <select class="mt-1 rounded-md border-gray-300" [(ngModel)]="formularioOrdem.clienteId" name="clienteId" required>
                <option [ngValue]="undefined" disabled>Selecione um cliente</option>
                @for (cliente of clientes(); track cliente.id) {
                  <option [ngValue]="cliente.id">{{ cliente.nome }}</option>
                }
              </select>
            </label>

            <label class="flex flex-col text-sm text-gray-600">
              Veículo
              <select class="mt-1 rounded-md border-gray-300" [(ngModel)]="formularioOrdem.veiculoId" name="veiculoId" required>
                <option [ngValue]="undefined" disabled>Selecione um veículo</option>
                @for (veiculo of veiculosDisponiveis(); track veiculo?.id) {
                  <option [ngValue]="veiculo?.id">{{ veiculo?.placa }} - {{ veiculo?.marca }} {{ veiculo?.modelo }}</option>
                }
              </select>
            </label>

            <label class="flex flex-col text-sm text-gray-600">
              Data de entrada
              <input
                type="date"
                class="mt-1 rounded-md border-gray-300"
                [(ngModel)]="formularioOrdem.dataEntrada"
                name="dataEntrada"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-gray-600">
              Status
              <select class="mt-1 rounded-md border-gray-300" [(ngModel)]="formularioOrdem.status" name="status" required>
                <option [ngValue]="undefined" disabled>Selecione</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </label>

            <label class="flex flex-col text-sm text-gray-600 md:col-span-2">
              Observações
              <textarea
                rows="4"
                class="mt-1 rounded-md border-gray-300"
                [(ngModel)]="formularioOrdem.observacoes"
                name="observacoes"
                placeholder="Inclua detalhes adicionais, serviços previstos ou peças necessárias"
              ></textarea>
            </label>

            <div class="md:col-span-2 flex justify-end gap-3">
              <button type="button" class="px-4 py-2 rounded-md border border-gray-300" (click)="voltarParaLista()">Cancelar</button>
              <button type="submit" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Salvar Ordem</button>
            </div>
          </form>
        </div>
      }

      @if (modoVisualizacao() === 'resumo' && ordemSelecionada()) {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-base font-semibold text-gray-700">Resumo da Ordem #{{ ordemSelecionada()?.id }}</h3>
            <button class="text-sm text-blue-600 hover:underline" (click)="voltarParaLista()">Voltar para a lista</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2 text-sm text-gray-600">
            <div>
              <span class="font-semibold text-gray-700 block">Cliente</span>
              {{ getCliente(ordemSelecionada()!.clienteId)?.nome }}
            </div>
            <div>
              <span class="font-semibold text-gray-700 block">Veículo</span>
              {{ getVeiculo(ordemSelecionada()!.veiculoId)?.marca }} {{ getVeiculo(ordemSelecionada()!.veiculoId)?.modelo }}
              ({{ getVeiculo(ordemSelecionada()!.veiculoId)?.placa }})
            </div>
            <div>
              <span class="font-semibold text-gray-700 block">Data de entrada</span>
              {{ ordemSelecionada()!.dataEntrada | date:'dd/MM/yyyy' }}
            </div>
            <div>
              <span class="font-semibold text-gray-700 block">Status</span>
              {{ ordemSelecionada()!.status }}
            </div>
            <div class="md:col-span-2">
              <span class="font-semibold text-gray-700 block">Observações</span>
              {{ ordemSelecionada()!.observacoes || 'Sem observações registradas.' }}
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold text-gray-700 mb-2">Serviços</h4>
              <ul class="space-y-2 text-sm text-gray-600">
                @if (ordemSelecionada()!.servicos.length) {
                  @for (servico of ordemSelecionada()!.servicos; track servico.id) {
                    <li class="flex justify-between bg-gray-50 rounded-md px-3 py-2">
                      <span>{{ getServico(servico.id)?.descricao }}</span>
                      <span>x{{ servico.qtde }}</span>
                    </li>
                  }
                } @else {
                  <li class="text-gray-500">Nenhum serviço vinculado.</li>
                }
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-gray-700 mb-2">Peças</h4>
              <ul class="space-y-2 text-sm text-gray-600">
                @if (ordemSelecionada()!.pecas.length) {
                  @for (peca of ordemSelecionada()!.pecas; track peca.id) {
                    <li class="flex justify-between bg-gray-50 rounded-md px-3 py-2">
                      <span>{{ getPeca(peca.id)?.nome }}</span>
                      <span>x{{ peca.qtde }}</span>
                    </li>
                  }
                } @else {
                  <li class="text-gray-500">Nenhuma peça vinculada.</li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OrdensServicoComponent {
  private dataService = inject(DataService);

  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;
  servicos = this.dataService.servicos;
  pecas = this.dataService.pecas;

  modoVisualizacao = signal<'lista' | 'formulario' | 'resumo'>('lista');
  ordemSelecionadaId = signal<number | null>(null);

  formularioOrdem = {
    clienteId: undefined as number | undefined,
    veiculoId: undefined as number | undefined,
    dataEntrada: '',
    status: undefined as 'Em Andamento' | 'Aguardando Aprovação' | 'Finalizada' | 'Cancelada' | undefined,
    observacoes: '',
  };

  ordemSelecionada = computed(() => {
    const id = this.ordemSelecionadaId();
    if (id == null) {
      return undefined;
    }
    return this.dataService.getOrdemServicoById(id);
  });

  abrirFormulario() {
    this.limparFormulario();
    this.modoVisualizacao.set('formulario');
  }

  verResumo(id: number) {
    this.ordemSelecionadaId.set(id);
    this.modoVisualizacao.set('resumo');
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.ordemSelecionadaId.set(null);
  }

  salvarOrdem() {
    if (!this.formularioOrdem.clienteId || !this.formularioOrdem.veiculoId || !this.formularioOrdem.dataEntrada || !this.formularioOrdem.status) {
      return;
    }

    const novaOrdemId = this.ordensServico().reduce((max, os) => Math.max(max, os.id), 0) + 1;
    this.dataService.ordensServico.update(ordens => [
      {
        id: novaOrdemId,
        clienteId: this.formularioOrdem.clienteId!,
        veiculoId: this.formularioOrdem.veiculoId!,
        dataEntrada: this.formularioOrdem.dataEntrada,
        status: this.formularioOrdem.status!,
        servicos: [],
        pecas: [],
        observacoes: this.formularioOrdem.observacoes?.trim() || undefined,
      },
      ...ordens,
    ]);

    this.voltarParaLista();
  }

  getVeiculo(id: number) {
    return this.veiculos().find(v => v.id === id);
  }

  getCliente(id: number) {
    return this.clientes().find(c => c.id === id);
  }

  veiculosDisponiveis() {
    if (!this.formularioOrdem.clienteId) {
      return this.veiculos();
    }
    return this.veiculos().filter(v => v.clienteId === this.formularioOrdem.clienteId);
  }

  getServico(id: number) {
    return this.servicos().find(s => s.id === id);
  }

  getPeca(id: number) {
    return this.pecas().find(p => p.id === id);
  }

  private limparFormulario() {
    this.formularioOrdem = {
      clienteId: undefined,
      veiculoId: undefined,
      dataEntrada: new Date().toISOString().split('T')[0],
      status: undefined,
      observacoes: '',
    };
  }
}
