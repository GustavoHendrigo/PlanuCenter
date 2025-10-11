import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  MOCK_CLIENTES,
  MOCK_ORDENS_SERVICO,
  MOCK_PECAS,
  MOCK_SERVICOS,
  MOCK_VEICULOS,
} from '../mocks/mock-data';

function handleMockRequest(pathname: string): HttpResponse<unknown> | null {
  switch (pathname) {
    case '/api/clients':
      return new HttpResponse({ status: 200, body: MOCK_CLIENTES });
    case '/api/vehicles':
      return new HttpResponse({ status: 200, body: MOCK_VEICULOS });
    case '/api/parts':
      return new HttpResponse({ status: 200, body: MOCK_PECAS });
    case '/api/services':
      return new HttpResponse({ status: 200, body: MOCK_SERVICOS });
    case '/api/orders':
      return new HttpResponse({ status: 200, body: MOCK_ORDENS_SERVICO });
    default:
      return null;
  }
}

function normaliseUrl(url: string): string {
  try {
    const target = new URL(url, 'http://placeholder.local');
    return target.pathname;
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  if (req.method !== 'GET') {
    return next(req);
  }

  const pathname = normaliseUrl(req.url);
  const response = handleMockRequest(pathname);

  if (response) {
    return of(response);
  }

  return next(req);
};
