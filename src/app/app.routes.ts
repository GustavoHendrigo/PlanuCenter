import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { EstoqueComponent } from './pages/estoque.component';
import { OrdensServicoComponent } from './pages/ordens-servico.component';
import { ResumoOsComponent } from './pages/resumo-os.component';
import { VeiculosComponent } from './pages/veiculos.component';
import { LoginComponent } from './pages/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'inicio', component: DashboardComponent },
  { path: 'ordens-servico', component: OrdensServicoComponent },
  { path: 'ordens-servico/:id', component: ResumoOsComponent },
  { path: 'veiculos', component: VeiculosComponent },
  { path: 'estoque', component: EstoqueComponent },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
