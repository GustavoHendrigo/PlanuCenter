import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, of, tap, throwError } from 'rxjs';
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
    forkJoin({
      clientes: this.http.get<Cliente[]>(`${this.apiUrl}/clients`),
      veiculos: this.http.get<Veiculo[]>(`${this.apiUrl}/vehicles`),
      pecas: this.http.get<Peca[]>(`${this.apiUrl}/parts`),
      servicos: this.http.get<Servico[]>(`${this.apiUrl}/services`),
      ordens: this.http.get<OrdemServico[]>(`${this.apiUrl}/orders`)
    })
      .pipe(
        tap(({ clientes, veiculos, pecas, servicos, ordens }) => {
          this.clientes.set(clientes);
          this.veiculos.set(veiculos);
          this.pecas.set(pecas);
          this.servicos.set(servicos);
          this.ordensServico.set(ordens);
        }),
        catchError(erro => {
          this.handleError('carregar dados iniciais')(erro);
          return of(null);
        })
      )
      .subscribe();
  }

  private handleError(contexto: string) {
    return (erro: unknown) => {
      console.error(`Falha ao ${contexto}:`, erro);
      if (!this.usingMockData && this.isConnectionRefused(erro)) {
        console.warn('Não foi possível acessar a API. Voltando para os dados locais.');
        this.enableMockFallback();
      }
    };
  }

  private isConnectionRefused(erro: unknown) {
    return erro instanceof HttpErrorResponse && erro.status === 0;
  }

  private enableMockFallback() {
    this.usingMockData = true;
    this.clientes.set(DEFAULT_CLIENTES.map(cliente => ({ ...cliente })));
    this.veiculos.set(
      DEFAULT_VEICULOS.map(veiculo => ({ ...veiculo }))
    );
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

  refreshClientes() {
    if (this.usingMockData) {
      return of(this.clientes());
    }

    return this.http
      .get<Cliente[]>(`${this.apiUrl}/clients`)
      .pipe(
        tap(clientes => this.clientes.set(clientes)),
        catchError(erro => {
          this.handleError('carregar clientes')(erro);
          return of(this.clientes());
        })
      );
  }

  refreshVeiculos() {
    if (this.usingMockData) {
      return of(this.veiculos());
    }

    return this.http
      .get<Veiculo[]>(`${this.apiUrl}/vehicles`)
      .pipe(
        tap(veiculos => this.veiculos.set(veiculos)),
        catchError(erro => {
          this.handleError('carregar veículos')(erro);
          return of(this.veiculos());
        })
      );
  }

  refreshPecas() {
    if (this.usingMockData) {
      return of(this.pecas());
    }

    return this.http
      .get<Peca[]>(`${this.apiUrl}/parts`)
      .pipe(
        tap(pecas => this.pecas.set(pecas)),
        catchError(erro => {
          this.handleError('carregar peças')(erro);
          return of(this.pecas());
        })
      );
  }

  refreshServicos() {
    if (this.usingMockData) {
      return of(this.servicos());
    }

    return this.http
      .get<Servico[]>(`${this.apiUrl}/services`)
      .pipe(
        tap(servicos => this.servicos.set(servicos)),
        catchError(erro => {
          this.handleError('carregar serviços')(erro);
          return of(this.servicos());
        })
      );
  }

  refreshOrdensServico() {
    if (this.usingMockData) {
      return of(this.ordensServico());
    }

    return this.http
      .get<OrdemServico[]>(`${this.apiUrl}/orders`)
      .pipe(
        tap(ordens => this.ordensServico.set(ordens)),
        catchError(erro => {
          this.handleError('carregar ordens de serviço')(erro);
          return of(this.ordensServico());
        })
      );
  }

  createCliente(cliente: Omit<Cliente, 'id'>) {
    if (this.usingMockData) {
      return of(this.createClienteLocal(cliente));
    }

    return this.http
      .post<Cliente>(`${this.apiUrl}/clients`, cliente)
      .pipe(
        tap(novo => this.clientes.update(lista => [novo, ...lista])),
        catchError(erro => {
          this.handleError('criar cliente')(erro);
          if (this.usingMockData) {
            return of(this.createClienteLocal(cliente));
          }
          return throwError(() => erro);
        })
      );
  }

  updateCliente(id: number, cliente: Omit<Cliente, 'id'>) {
    if (this.usingMockData) {
      return of(this.updateClienteLocal(id, cliente));
    }

    return this.http
      .put<Cliente>(`${this.apiUrl}/clients/${id}`, cliente)
      .pipe(
        tap(atualizado => this.clientes.update(lista => lista.map(item => (item.id === id ? atualizado : item)))),
        catchError(erro => {
          this.handleError('atualizar cliente')(erro);
          if (this.usingMockData) {
            return of(this.updateClienteLocal(id, cliente));
          }
          return throwError(() => erro);
        })
      );
  }

  deleteCliente(id: number) {
    if (this.usingMockData) {
      this.deleteClienteLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/clients/${id}`)
      .pipe(
        tap(() => this.clientes.update(lista => lista.filter(item => item.id !== id))),
        catchError(erro => {
          this.handleError('remover cliente')(erro);
          if (this.usingMockData) {
            this.deleteClienteLocal(id);
            return of(void 0);
          }
          return throwError(() => erro);
        })
      );
  }

  createVeiculo(veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (this.usingMockData) {
      return of(this.createVeiculoLocal(veiculo));
    }

    return this.http
      .post<Veiculo>(`${this.apiUrl}/vehicles`, veiculo)
      .pipe(
        tap(novo => this.veiculos.update(lista => [novo, ...lista])),
        catchError(erro => {
          this.handleError('criar veículo')(erro);
          if (this.usingMockData) {
            return of(this.createVeiculoLocal(veiculo));
          }
          return throwError(() => erro);
        })
      );
  }

  updateVeiculo(id: number, veiculo: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (this.usingMockData) {
      return of(this.updateVeiculoLocal(id, veiculo));
    }

    return this.http
      .put<Veiculo>(`${this.apiUrl}/vehicles/${id}`, veiculo)
      .pipe(
        tap(atualizado => this.veiculos.update(lista => lista.map(item => (item.id === id ? atualizado : item)))),
        catchError(erro => {
          this.handleError('atualizar veículo')(erro);
          if (this.usingMockData) {
            return of(this.updateVeiculoLocal(id, veiculo));
          }
          return throwError(() => erro);
        })
      );
  }

  deleteVeiculo(id: number) {
    if (this.usingMockData) {
      this.deleteVeiculoLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/vehicles/${id}`)
      .pipe(
        tap(() => this.veiculos.update(lista => lista.filter(item => item.id !== id))),
        catchError(erro => {
          this.handleError('remover veículo')(erro);
          if (this.usingMockData) {
            this.deleteVeiculoLocal(id);
            return of(void 0);
          }
          return throwError(() => erro);
        })
      );
  }

  createPeca(peca: Omit<Peca, 'id'>) {
    if (this.usingMockData) {
      return of(this.createPecaLocal(peca));
    }

    return this.http
      .post<Peca>(`${this.apiUrl}/parts`, peca)
      .pipe(
        tap(nova => this.pecas.update(lista => [nova, ...lista])),
        catchError(erro => {
          this.handleError('criar peça')(erro);
          if (this.usingMockData) {
            return of(this.createPecaLocal(peca));
          }
          return throwError(() => erro);
        })
      );
  }

  updatePeca(id: number, peca: Omit<Peca, 'id'>) {
    if (this.usingMockData) {
      return of(this.updatePecaLocal(id, peca));
    }

    return this.http
      .put<Peca>(`${this.apiUrl}/parts/${id}`, peca)
      .pipe(
        tap(atualizada => this.pecas.update(lista => lista.map(item => (item.id === id ? atualizada : item)))),
        catchError(erro => {
          this.handleError('atualizar peça')(erro);
          if (this.usingMockData) {
            return of(this.updatePecaLocal(id, peca));
          }
          return throwError(() => erro);
        })
      );
  }

  deletePeca(id: number) {
    if (this.usingMockData) {
      this.deletePecaLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/parts/${id}`)
      .pipe(
        tap(() => this.pecas.update(lista => lista.filter(item => item.id !== id))),
        catchError(erro => {
          this.handleError('remover peça')(erro);
          if (this.usingMockData) {
            this.deletePecaLocal(id);
            return of(void 0);
          }
          return throwError(() => erro);
        })
      );
  }

  createServico(servico: Omit<Servico, 'id'>) {
    if (this.usingMockData) {
      return of(this.createServicoLocal(servico));
    }

    return this.http
      .post<Servico>(`${this.apiUrl}/services`, servico)
      .pipe(
        tap(novo => this.servicos.update(lista => [novo, ...lista])),
        catchError(erro => {
          this.handleError('criar serviço')(erro);
          if (this.usingMockData) {
            return of(this.createServicoLocal(servico));
          }
          return throwError(() => erro);
        })
      );
  }

  updateServico(id: number, servico: Omit<Servico, 'id'>) {
    if (this.usingMockData) {
      return of(this.updateServicoLocal(id, servico));
    }

    return this.http
      .put<Servico>(`${this.apiUrl}/services/${id}`, servico)
      .pipe(
        tap(atualizado => this.servicos.update(lista => lista.map(item => (item.id === id ? atualizado : item)))),
        catchError(erro => {
          this.handleError('atualizar serviço')(erro);
          if (this.usingMockData) {
            return of(this.updateServicoLocal(id, servico));
          }
          return throwError(() => erro);
        })
      );
  }

  deleteServico(id: number) {
    if (this.usingMockData) {
      this.deleteServicoLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/services/${id}`)
      .pipe(
        tap(() => this.servicos.update(lista => lista.filter(item => item.id !== id))),
        catchError(erro => {
          this.handleError('remover serviço')(erro);
          if (this.usingMockData) {
            this.deleteServicoLocal(id);
            return of(void 0);
          }
          return throwError(() => erro);
        })
      );
  }

  createOrdemServico(ordem: Omit<OrdemServico, 'id'>) {
    if (this.usingMockData) {
      return of(this.createOrdemServicoLocal(ordem));
    }

    return this.http
      .post<OrdemServico>(`${this.apiUrl}/orders`, ordem)
      .pipe(
        tap(nova => this.ordensServico.update(lista => [nova, ...lista])),
        catchError(erro => {
          this.handleError('criar ordem de serviço')(erro);
          if (this.usingMockData) {
            return of(this.createOrdemServicoLocal(ordem));
          }
          return throwError(() => erro);
        })
      );
  }

  updateStatusOrdemServico(id: number, status: OrdemServico['status']) {
    if (this.usingMockData) {
      return of(this.updateStatusOrdemServicoLocal(id, status));
    }

    return this.http
      .put<OrdemServico>(`${this.apiUrl}/orders/${id}`, { status })
      .pipe(
        tap(atualizada => this.ordensServico.update(lista => lista.map(item => (item.id === id ? atualizada : item)))),
        catchError(erro => {
          this.handleError('atualizar ordem de serviço')(erro);
          if (this.usingMockData) {
            return of(this.updateStatusOrdemServicoLocal(id, status));
          }
          return throwError(() => erro);
        })
      );
  }

  deleteOrdemServico(id: number) {
    if (this.usingMockData) {
      this.deleteOrdemServicoLocal(id);
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.apiUrl}/orders/${id}`)
      .pipe(
        tap(() => this.ordensServico.update(lista => lista.filter(item => item.id !== id))),
        catchError(erro => {
          this.handleError('remover ordem de serviço')(erro);
          if (this.usingMockData) {
            this.deleteOrdemServicoLocal(id);
            return of(void 0);
          }
          return throwError(() => erro);
        })
      );
  }

  getOrdemServicoById(id: number) {
    return this.ordensServico().find(ordem => ordem.id === id);
  }

  fetchOrdemServicoById(id: number) {
    if (this.usingMockData) {
      const ordem = this.getOrdemServicoById(id);
      return of(ordem as OrdemServico);
    }

    return this.http.get<OrdemServico>(`${this.apiUrl}/orders/${id}`).pipe(
      catchError(erro => {
        this.handleError('buscar ordem de serviço')(erro);
        return of(this.getOrdemServicoById(id) as OrdemServico);
      })
    );
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
    return atualizada as OrdemServico;
  }

  private deleteOrdemServicoLocal(id: number) {
    this.ordensServico.update(lista => lista.filter(item => item.id !== id));
  }
}
