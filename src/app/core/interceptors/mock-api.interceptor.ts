import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { DataService } from '../services/data.service';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

const API_PREFIX = '/api';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX)) {
    return next(req);
  }

  const dataService = inject(DataService);
  const url = new URL(req.url, 'http://localhost');
  const response = handleMockRequest(url.pathname, dataService);

  if (!response) {
    return next(req);
  }

  return of(response);
};

function handleMockRequest(pathname: string, dataService: DataService): HttpResponse<unknown> | null {
  switch (pathname) {
    case `${API_PREFIX}/clientes`:
      return createOkResponse<Cliente[]>(dataService.clientes());
    case `${API_PREFIX}/veiculos`:
      return createOkResponse<Veiculo[]>(dataService.veiculos());
    case `${API_PREFIX}/pecas`:
      return createOkResponse<Peca[]>(dataService.pecas());
    case `${API_PREFIX}/servicos`:
      return createOkResponse<Servico[]>(dataService.servicos());
    case `${API_PREFIX}/ordens-servico`:
      return createOkResponse<OrdemServico[]>(dataService.ordensServico());
    default: {
      const ordemServicoMatch = pathname.match(new RegExp(`^${API_PREFIX}/ordens-servico/(\\d+)$`));
      if (!ordemServicoMatch) {
        return null;
      }

      const ordemId = Number(ordemServicoMatch[1]);
      const ordemServico = dataService.getOrdemServicoById(ordemId);

      if (!ordemServico) {
        return new HttpResponse<null>({ status: 404, body: null });
      }

      return createOkResponse<OrdemServico>(ordemServico);
    }
  }
}

function createOkResponse<T>(body: T): HttpResponse<T> {
  return new HttpResponse<T>({ status: 200, body });
}
