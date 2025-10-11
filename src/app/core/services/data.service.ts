import { Injectable, signal } from '@angular/core';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';
import {
  MOCK_CLIENTES,
  MOCK_ORDENS_SERVICO,
  MOCK_PECAS,
  MOCK_SERVICOS,
  MOCK_VEICULOS,
} from '../mocks/mock-data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // --- DADOS MOCKADOS (Simulação de um banco de dados) ---
  // Usando Signals para reatividade.
  
  readonly clientes = signal<Cliente[]>(MOCK_CLIENTES.map(cliente => ({ ...cliente })));

  readonly veiculos = signal<Veiculo[]>(MOCK_VEICULOS.map(veiculo => ({ ...veiculo })));

  readonly pecas = signal<Peca[]>(MOCK_PECAS.map(peca => ({ ...peca })));

  readonly servicos = signal<Servico[]>(MOCK_SERVICOS.map(servico => ({ ...servico })));

  readonly ordensServico = signal<OrdemServico[]>(MOCK_ORDENS_SERVICO.map(ordem => ({
    ...ordem,
    servicos: ordem.servicos.map(item => ({ ...item })),
    pecas: ordem.pecas.map(item => ({ ...item })),
  })));

  constructor() { }

  getOrdemServicoById(id: number): OrdemServico | undefined {
    return this.ordensServico().find(os => os.id === id);
  }
}
