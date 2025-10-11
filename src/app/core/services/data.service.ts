import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

const DEFAULT_CLIENTES: Cliente[] = [
  { id: 1, nome: 'Carlos Alberto', email: 'carlos.alberto@email.com', telefone: '(11) 91234-5678' },
  { id: 2, nome: 'Joana Pereira', email: 'joana.pereira@email.com', telefone: '(11) 98765-4321' },
  { id: 3, nome: 'Pedro Henrique', email: 'pedro.henrique@email.com', telefone: '(21) 99876-5432' },
  { id: 4, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(31) 93456-7890' }
];

const DEFAULT_VEICULOS: Veiculo[] = [
  { id: 1, placa: 'ROZ-1295', marca: 'Toyota', modelo: 'Corolla', ano: '2022', clienteId: 1, clienteNome: 'Carlos Alberto' },
  { id: 2, placa: 'PEA-0M40', marca: 'Honda', modelo: 'Civic', ano: '2021', clienteId: 3, clienteNome: 'Pedro Henrique' },
  { id: 3, placa: 'LBT-3954', marca: 'Ford', modelo: 'Ranger', ano: '2023', clienteId: 4, clienteNome: 'João da Silva' },
  { id: 4, placa: 'XYZ-7890', marca: 'Chevrolet', modelo: 'Onix', ano: '2020', clienteId: 2, clienteNome: 'Joana Pereira' }
];

const DEFAULT_PECAS: Peca[] = [
  { id: 101, nome: 'Filtro de Óleo', codigo: 'FO-001', estoque: 15, preco: 35 },
  { id: 102, nome: 'Pastilha de Freio', codigo: 'PF-002', estoque: 8, preco: 120.5 },
  { id: 103, nome: 'Vela de Ignição', codigo: 'VI-003', estoque: 32, preco: 25 },
  { id: 104, nome: 'Óleo Motor 5W30', codigo: 'OM-004', estoque: 20, preco: 55 }
];

const DEFAULT_SERVICOS: Servico[] = [
  { id: 201, descricao: 'Troca de Óleo e Filtro', preco: 150 },
  { id: 202, descricao: 'Alinhamento e Balanceamento', preco: 180 },
  { id: 203, descricao: 'Revisão Sistema de Freios', preco: 250 }
];

const DEFAULT_ORDENS: OrdemServico[] = [
  {
    id: 974,
    veiculoId: 1,
    clienteId: 1,
    dataEntrada: '2025-09-07',
    status: 'Em Andamento',
    servicos: [{ id: 201, qtde: 1 }],
    pecas: [
      { id: 101, qtde: 1 },
      { id: 104, qtde: 1 }
    ]
  },
  {
    id: 973,
    veiculoId: 1,
    clienteId: 1,
    dataEntrada: '2025-09-06',
    status: 'Finalizada',
    servicos: [{ id: 202, qtde: 1 }],
    pecas: []
  },
  {
    id: 971,
    veiculoId: 2,
    clienteId: 3,
    dataEntrada: '2025-09-05',
    status: 'Aguardando Aprovação',
    servicos: [{ id: 203, qtde: 1 }],
    pecas: [{ id: 102, qtde: 2 }]
  },
  {
    id: 968,
    veiculoId: 3,
    clienteId: 4,
    dataEntrada: '2025-09-02',
    status: 'Finalizada',
    servicos: [{ id: 201, qtde: 1 }],
    pecas: [
      { id: 101, qtde: 1 },
      { id: 104, qtde: 1 }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private usingMockData = false;
  private bootstrapInFlight = false;

  readonly clientes = signal<Cliente[]>([]);
  readonly veiculos = signal<Veiculo[]>([]);
  readonly pecas = signal<Peca[]>([]);
  readonly servicos = signal<Servico[]>([]);
  readonly ordensServico = signal<OrdemServico[]>([]);

  constructor() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return;
    }

    this.bootstrapFromApi();
  }

  private bootstrapFromApi() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return;
    }

    if (this.bootstrapInFlight) {
      return;
    }

    this.bootstrapInFlight = true;

    forkJoin({
      clientes: this.http.get<Cliente[]>(`${this.apiUrl}/clients`),
      veiculos: this.http.get<Veiculo[]>(`${this.apiUrl}/vehicles`),
      pecas: this.http.get<Peca[]>(`${this.apiUrl}/parts`),
      servicos: this.http.get<Servico[]>(`${this.apiUrl}/services`),
      ordens: this.http.get<OrdemServico[]>(`${this.apiUrl}/orders`)
    })
      .pipe(
        tap(({ clientes, veiculos, pecas, servicos, ordens }) => {
          this.usingMockData = false;
          this.clientes.set(clientes);
          this.veiculos.set(veiculos);
          this.pecas.set(pecas);
          this.servicos.set(servicos);
          this.ordensServico.set(ordens);
        }),
        catchError(erro => {
          this.logError('carregar dados iniciais', erro);
          this.enableMockFallback();
          return of(null);
        }),
        finalize(() => {
          this.bootstrapInFlight = false;
        })
      )
      .subscribe();
  }

  refreshClientes() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.clientes());
    }

    return this.http
      .get<Cliente[]>(`${this.apiUrl}/clients`)
      .pipe(
        tap(clientes => {
          this.onApiCallSucceeded();
          this.clientes.set(clientes);
        }),
        catchError(this.handleRequestError('carregar clientes', () => this.clientes()))
      );
  }

  refreshVeiculos() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.veiculos());
    }

    return this.http
      .get<Veiculo[]>(`${this.apiUrl}/vehicles`)
      .pipe(
        tap(veiculos => {
          this.onApiCallSucceeded();
          this.veiculos.set(veiculos);
        }),
        catchError(this.handleRequestError('carregar veículos', () => this.veiculos()))
      );
  }

  refreshPecas() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.pecas());
    }

    return this.http
      .get<Peca[]>(`${this.apiUrl}/parts`)
      .pipe(
        tap(pecas => {
          this.onApiCallSucceeded();
          this.pecas.set(pecas);
        }),
        catchError(this.handleRequestError('carregar peças', () => this.pecas()))
      );
  }

  refreshServicos() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.servicos());
    }

    return this.http
      .get<Servico[]>(`${this.apiUrl}/services`)
      .pipe(
        tap(servicos => {
          this.onApiCallSucceeded();
          this.servicos.set(servicos);
        }),
        catchError(this.handleRequestError('carregar serviços', () => this.servicos()))
      );
  }

  refreshOrdensServico() {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.ordensServico());
    }

    return this.http
      .get<OrdemServico[]>(`${this.apiUrl}/orders`)
      .pipe(
        tap(ordens => {
          this.onApiCallSucceeded();
          this.ordensServico.set(ordens);
        }),
        catchError(this.handleRequestError('carregar ordens de serviço', () => this.ordensServico()))
      );
  }

  createCliente(cliente: Omit<Cliente, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.createClienteLocal(cliente));
    }

    return this.http
      .post<Cliente>(`${this.apiUrl}/clients`, cliente)
      .pipe(
        tap(novo => {
          this.onApiCallSucceeded();
          this.clientes.update(lista => [novo, ...lista.filter(item => item.id !== novo.id)]);
        }),
        catchError(this.handleRequestError('criar cliente', () => this.createClienteLocal(cliente)))
      );
  }

  updateCliente(id: number, cliente: Omit<Cliente, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.updateClienteLocal(id, cliente));
    }

    return this.http
      .put<Cliente>(`${this.apiUrl}/clients/${id}`, cliente)
      .pipe(
        tap(atualizado => {
          this.onApiCallSucceeded();
          this.clientes.update(lista => lista.map(item => (item.id === id ? atualizado : item)));
        }),
        catchError(this.handleRequestError('atualizar cliente', () => this.updateClienteLocal(id, cliente)))
      );
  }

  deleteCliente(id: number) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      this.deleteClienteLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/clients/${id}`)
      .pipe(
        tap(() => {
          this.onApiCallSucceeded();
          this.clientes.update(lista => lista.filter(item => item.id !== id));
        }),
        catchError(this.handleRequestError('remover cliente', () => {
          this.deleteClienteLocal(id);
        }))
      );
  }

  createVeiculo(veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.createVeiculoLocal(veiculo));
    }

    return this.http
      .post<Veiculo>(`${this.apiUrl}/vehicles`, veiculo)
      .pipe(
        tap(novo => {
          this.onApiCallSucceeded();
          this.veiculos.update(lista => [novo, ...lista.filter(item => item.id !== novo.id)]);
        }),
        catchError(this.handleRequestError('criar veículo', () => this.createVeiculoLocal(veiculo)))
      );
  }

  updateVeiculo(id: number, veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.updateVeiculoLocal(id, veiculo));
    }

    return this.http
      .put<Veiculo>(`${this.apiUrl}/vehicles/${id}`, veiculo)
      .pipe(
        tap(atualizado => {
          this.onApiCallSucceeded();
          this.veiculos.update(lista => lista.map(item => (item.id === id ? atualizado : item)));
        }),
        catchError(this.handleRequestError('atualizar veículo', () => this.updateVeiculoLocal(id, veiculo)))
      );
  }

  deleteVeiculo(id: number) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      this.deleteVeiculoLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(
        tap(() => {
          this.onApiCallSucceeded();
          this.deleteVeiculoLocal(id);
        }),
        catchError(this.handleRequestError('remover veículo', () => {
          this.deleteVeiculoLocal(id);
        }))
      );
  }

  createPeca(peca: Omit<Peca, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.createPecaLocal(peca));
    }

    return this.http
      .post<Peca>(`${this.apiUrl}/parts`, peca)
      .pipe(
        tap(nova => {
          this.onApiCallSucceeded();
          this.pecas.update(lista => [nova, ...lista.filter(item => item.id !== nova.id)]);
        }),
        catchError(this.handleRequestError('criar peça', () => this.createPecaLocal(peca)))
      );
  }

  updatePeca(id: number, peca: Omit<Peca, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.updatePecaLocal(id, peca));
    }

    return this.http
      .put<Peca>(`${this.apiUrl}/parts/${id}`, peca)
      .pipe(
        tap(atualizada => {
          this.onApiCallSucceeded();
          this.pecas.update(lista => lista.map(item => (item.id === id ? atualizada : item)));
        }),
        catchError(this.handleRequestError('atualizar peça', () => this.updatePecaLocal(id, peca)))
      );
  }

  deletePeca(id: number) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      this.deletePecaLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/parts/${id}`)
      .pipe(
        tap(() => {
          this.onApiCallSucceeded();
          this.deletePecaLocal(id);
        }),
        catchError(this.handleRequestError('remover peça', () => {
          this.deletePecaLocal(id);
        }))
      );
  }

  createServico(servico: Omit<Servico, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.createServicoLocal(servico));
    }

    return this.http
      .post<Servico>(`${this.apiUrl}/services`, servico)
      .pipe(
        tap(novo => {
          this.onApiCallSucceeded();
          this.servicos.update(lista => [novo, ...lista.filter(item => item.id !== novo.id)]);
        }),
        catchError(this.handleRequestError('criar serviço', () => this.createServicoLocal(servico)))
      );
  }

  updateServico(id: number, servico: Omit<Servico, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.updateServicoLocal(id, servico));
    }

    return this.http
      .put<Servico>(`${this.apiUrl}/services/${id}`, servico)
      .pipe(
        tap(atualizado => {
          this.onApiCallSucceeded();
          this.servicos.update(lista => lista.map(item => (item.id === id ? atualizado : item)));
        }),
        catchError(this.handleRequestError('atualizar serviço', () => this.updateServicoLocal(id, servico)))
      );
  }

  deleteServico(id: number) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      this.deleteServicoLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/services/${id}`)
      .pipe(
        tap(() => {
          this.onApiCallSucceeded();
          this.deleteServicoLocal(id);
        }),
        catchError(this.handleRequestError('remover serviço', () => {
          this.deleteServicoLocal(id);
        }))
      );
  }

  createOrdemServico(ordem: Omit<OrdemServico, 'id'>) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.createOrdemServicoLocal(ordem));
    }

    return this.http
      .post<OrdemServico>(`${this.apiUrl}/orders`, ordem)
      .pipe(
        tap(nova => {
          this.onApiCallSucceeded();
          this.ordensServico.update(lista => [nova, ...lista.filter(item => item.id !== nova.id)]);
        }),
        catchError(this.handleRequestError('criar ordem de serviço', () => this.createOrdemServicoLocal(ordem)))
      );
  }

  updateStatusOrdemServico(id: number, status: OrdemServico['status']) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.updateStatusOrdemServicoLocal(id, status));
    }

    return this.http
      .put<OrdemServico>(`${this.apiUrl}/orders/${id}`, { status })
      .pipe(
        tap(atualizada => {
          this.onApiCallSucceeded();
          this.ordensServico.update(lista => lista.map(item => (item.id === id ? atualizada : item)));
        }),
        catchError(this.handleRequestError('atualizar ordem de serviço', () => this.updateStatusOrdemServicoLocal(id, status)))
      );
  }

  deleteOrdemServico(id: number) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      this.deleteOrdemServicoLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/orders/${id}`)
      .pipe(
        tap(() => {
          this.onApiCallSucceeded();
          this.deleteOrdemServicoLocal(id);
        }),
        catchError(this.handleRequestError('remover ordem de serviço', () => {
          this.deleteOrdemServicoLocal(id);
        }))
      );
  }

  getOrdemServicoById(id: number) {
    return this.ordensServico().find(ordem => ordem.id === id);
  }

  fetchOrdemServicoById(id: number) {
    if (!this.apiUrl) {
      this.enableMockFallback();
      return of(this.getOrdemServicoById(id) as OrdemServico);
    }

    return this.http
      .get<OrdemServico>(`${this.apiUrl}/orders/${id}`)
      .pipe(
        tap(() => {
          this.onApiCallSucceeded();
        }),
        catchError(this.handleRequestError('buscar ordem de serviço', () => this.getOrdemServicoById(id) as OrdemServico))
      );
  }

  private handleRequestError<T>(contexto: string, fallback: () => T) {
    return (erro: unknown) => {
      this.logError(contexto, erro);

      if (this.isConnectionRefused(erro)) {
        this.enableMockFallback();
        return of(fallback());
      }

      return throwError(() => erro);
    };
  }

  private onApiCallSucceeded() {
    if (!this.usingMockData || this.bootstrapInFlight) {
      this.usingMockData = false;
      return;
    }

    this.usingMockData = false;
    this.bootstrapFromApi();
  }

  private logError(contexto: string, erro: unknown) {
    console.error(`Falha ao ${contexto}:`, erro);
  }

  private isConnectionRefused(erro: unknown) {
    return erro instanceof HttpErrorResponse && erro.status === 0;
  }

  private enableMockFallback() {
    if (this.usingMockData) {
      return;
    }

    this.usingMockData = true;
    console.warn('Não foi possível acessar a API. Voltando para os dados locais.');

    this.clientes.set(DEFAULT_CLIENTES.map(cliente => ({ ...cliente })));
    this.veiculos.set(DEFAULT_VEICULOS.map(veiculo => ({ ...veiculo })));
    this.pecas.set(DEFAULT_PECAS.map(peca => ({ ...peca })));
    this.servicos.set(DEFAULT_SERVICOS.map(servico => ({ ...servico })));
    this.ordensServico.set(
      DEFAULT_ORDENS.map(ordem => ({
        ...ordem,
        servicos: ordem.servicos.map(item => ({ ...item })),
        pecas: ordem.pecas.map(item => ({ ...item }))
      }))
    );
  }

  private nextId(lista: { id: number }[]) {
    return lista.length ? Math.max(...lista.map(item => item.id)) + 1 : 1;
  }

  private createClienteLocal(cliente: Omit<Cliente, 'id'>) {
    const novo: Cliente = { id: this.nextId(this.clientes()), ...cliente };
    this.clientes.update(lista => [novo, ...lista]);
    return novo;
  }

  private updateClienteLocal(id: number, cliente: Omit<Cliente, 'id'>) {
    const atualizado: Cliente = { id, ...cliente };
    this.clientes.update(lista => lista.map(item => (item.id === id ? atualizado : item)));
    return atualizado;
  }

  private deleteClienteLocal(id: number) {
    this.clientes.update(lista => lista.filter(item => item.id !== id));
    this.veiculos.update(lista => lista.filter(item => item.clienteId !== id));
  }

  private createVeiculoLocal(veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const cliente = this.clientes().find(item => item.id === veiculo.clienteId);
    const novo: Veiculo = {
      id: this.nextId(this.veiculos()),
      ...veiculo,
      clienteNome: cliente?.nome ?? ''
    };
    this.veiculos.update(lista => [novo, ...lista]);
    return novo;
  }

  private updateVeiculoLocal(id: number, veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const cliente = this.clientes().find(item => item.id === veiculo.clienteId);
    const atualizado: Veiculo = { id, ...veiculo, clienteNome: cliente?.nome ?? '' };
    this.veiculos.update(lista => lista.map(item => (item.id === id ? atualizado : item)));
    return atualizado;
  }

  private deleteVeiculoLocal(id: number) {
    this.veiculos.update(lista => lista.filter(item => item.id !== id));
    this.ordensServico.update(lista => lista.filter(ordem => ordem.veiculoId !== id));
  }

  private createPecaLocal(peca: Omit<Peca, 'id'>) {
    const nova: Peca = { id: this.nextId(this.pecas()), ...peca };
    this.pecas.update(lista => [nova, ...lista]);
    return nova;
  }

  private updatePecaLocal(id: number, peca: Omit<Peca, 'id'>) {
    const atualizada: Peca = { id, ...peca };
    this.pecas.update(lista => lista.map(item => (item.id === id ? atualizada : item)));
    return atualizada;
  }

  private deletePecaLocal(id: number) {
    this.pecas.update(lista => lista.filter(item => item.id !== id));
  }

  private createServicoLocal(servico: Omit<Servico, 'id'>) {
    const novo: Servico = { id: this.nextId(this.servicos()), ...servico };
    this.servicos.update(lista => [novo, ...lista]);
    return novo;
  }

  private updateServicoLocal(id: number, servico: Omit<Servico, 'id'>) {
    const atualizado: Servico = { id, ...servico };
    this.servicos.update(lista => lista.map(item => (item.id === id ? atualizado : item)));
    return atualizado;
  }

  private deleteServicoLocal(id: number) {
    this.servicos.update(lista => lista.filter(item => item.id !== id));
  }

  private createOrdemServicoLocal(ordem: Omit<OrdemServico, 'id'>) {
    const nova: OrdemServico = {
      id: this.nextId(this.ordensServico()),
      ...ordem,
      servicos: ordem.servicos.map(item => ({ ...item })),
      pecas: ordem.pecas.map(item => ({ ...item }))
    };
    this.ordensServico.update(lista => [nova, ...lista]);
    return nova;
  }

  private updateStatusOrdemServicoLocal(id: number, status: OrdemServico['status']) {
    let atualizada: OrdemServico | undefined;
    this.ordensServico.update(lista =>
      lista.map(item => {
        if (item.id === id) {
          atualizada = { ...item, status };
          return atualizada;
        }

        return item;
      })
    );
    return atualizada!;
  }

  private deleteOrdemServicoLocal(id: number) {
    this.ordensServico.update(lista => lista.filter(item => item.id !== id));
  }
}
