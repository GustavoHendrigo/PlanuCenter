const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const {
  getClientes,
  addCliente,
  updateCliente,
  getVeiculos,
  addVeiculo,
  updateVeiculo,
  getPecas,
  addPeca,
  updatePeca,
  getServicos,
  getOrdensServico,
  addOrdemServico,
  updateOrdemServico,
  deleteCliente,
  deleteVeiculo,
  deletePeca,
  deleteOrdemServico,
  getUsuarios
} = require('./db');

const PORT = process.env.PORT || 3000;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

function parseBody(req, res, callback) {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    if (chunks.length === 0) {
      callback({});
      return;
    }

    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      callback(body);
    } catch (error) {
      sendJson(res, 400, { message: 'JSON inválido no corpo da requisição.' });
    }
  });
}

function mapVeiculo(veiculo) {
  const cliente = getClientes().find(clienteAtual => clienteAtual.id === veiculo.clienteId);
  return {
    ...veiculo,
    clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
  };
}

function mapOrdem(ordem) {
  return {
    ...ordem,
    observacoes: ordem.observacoes || undefined
  };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { message: 'Requisição inválida.' });
    return;
  }

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      parseBody(req, res, body => {
        const { email, password } = body || {};
        if (!email || !password) {
          sendJson(res, 400, { message: 'E-mail e senha são obrigatórios.' });
          return;
        }

        const usuario = getUsuarios().find(user => user.email.toLowerCase() === String(email).trim().toLowerCase());
        if (!usuario) {
          sendJson(res, 401, { message: 'Credenciais inválidas.' });
          return;
        }

        const senhaHash = crypto.createHash('sha256').update(String(password)).digest('hex');
        if (senhaHash !== usuario.senhaHash) {
          sendJson(res, 401, { message: 'Credenciais inválidas.' });
          return;
        }

        const token = crypto.randomUUID();
        sendJson(res, 200, {
          token,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
          }
        });
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/clientes') {
      const clientes = [...getClientes()].sort((a, b) => b.id - a.id).map(cliente => ({
        ...cliente,
        email: cliente.email || undefined,
        telefone: cliente.telefone || undefined
      }));
      sendJson(res, 200, clientes);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/clientes') {
      parseBody(req, res, body => {
        const { nome, email, telefone } = body || {};
        if (!nome || !nome.trim()) {
          sendJson(res, 400, { message: 'Nome é obrigatório.' });
          return;
        }

        const novo = addCliente({
          nome: nome.trim(),
          email: email?.trim() || undefined,
          telefone: telefone?.trim() || undefined
        });
        sendJson(res, 201, novo);
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/clientes\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { nome, email, telefone } = body || {};
        if (!nome || !nome.trim()) {
          sendJson(res, 400, { message: 'Nome é obrigatório.' });
          return;
        }
        const atualizado = updateCliente(id, {
          nome: nome.trim(),
          email: email?.trim() || undefined,
          telefone: telefone?.trim() || undefined
        });
        if (!atualizado) {
          sendJson(res, 404, { message: 'Cliente não encontrado.' });
          return;
        }
        sendJson(res, 200, atualizado);
      });
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/clientes\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const removido = deleteCliente(id);
      if (!removido) {
        sendJson(res, 404, { message: 'Cliente não encontrado.' });
        return;
      }
      sendNoContent(res);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/veiculos') {
      const veiculos = [...getVeiculos()].sort((a, b) => b.id - a.id).map(mapVeiculo);
      sendJson(res, 200, veiculos);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/veiculos') {
      parseBody(req, res, body => {
        const { placa, marca, modelo, ano, clienteId } = body || {};
        if (!placa || !marca || !modelo || !ano || !clienteId) {
          sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
          return;
        }
        const jaExiste = getVeiculos().some(v => v.placa.toLowerCase() === placa.trim().toLowerCase());
        if (jaExiste) {
          sendJson(res, 409, { message: 'Já existe um veículo com esta placa.' });
          return;
        }
        const novo = addVeiculo({
          placa: placa.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano: ano.trim(),
          clienteId: Number(clienteId)
        });
        sendJson(res, 201, mapVeiculo(novo));
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { placa, marca, modelo, ano, clienteId } = body || {};
        if (!placa || !marca || !modelo || !ano || !clienteId) {
          sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
          return;
        }
        const outroVeiculo = getVeiculos().find(v => v.placa.toLowerCase() === placa.trim().toLowerCase() && v.id !== id);
        if (outroVeiculo) {
          sendJson(res, 409, { message: 'Já existe um veículo com esta placa.' });
          return;
        }
        const atualizado = updateVeiculo(id, {
          placa: placa.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano: ano.trim(),
          clienteId: Number(clienteId)
        });
        if (!atualizado) {
          sendJson(res, 404, { message: 'Veículo não encontrado.' });
          return;
        }
        sendJson(res, 200, mapVeiculo(atualizado));
      });
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const removido = deleteVeiculo(id);
      if (!removido) {
        sendJson(res, 404, { message: 'Veículo não encontrado.' });
        return;
      }
      sendNoContent(res);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/pecas') {
      const pecas = [...getPecas()].sort((a, b) => b.id - a.id);
      sendJson(res, 200, pecas);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/pecas') {
      parseBody(req, res, body => {
        const { nome, codigo, estoque, preco } = body || {};
        if (!nome || !codigo) {
          sendJson(res, 400, { message: 'Nome e código são obrigatórios.' });
          return;
        }
        const novo = addPeca({
          nome: nome.trim(),
          codigo: codigo.trim(),
          estoque: Number.isFinite(Number(estoque)) ? Number(estoque) : 0,
          preco: Number.isFinite(Number(preco)) ? Number(preco) : 0
        });
        sendJson(res, 201, novo);
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/pecas\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { nome, codigo, estoque, preco } = body || {};
        if (!nome || !codigo) {
          sendJson(res, 400, { message: 'Nome e código são obrigatórios.' });
          return;
        }
        const atualizada = updatePeca(id, {
          nome: nome.trim(),
          codigo: codigo.trim(),
          estoque: Number.isFinite(Number(estoque)) ? Number(estoque) : 0,
          preco: Number.isFinite(Number(preco)) ? Number(preco) : 0
        });
        if (!atualizada) {
          sendJson(res, 404, { message: 'Peça não encontrada.' });
          return;
        }
        sendJson(res, 200, atualizada);
      });
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/pecas\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const removida = deletePeca(id);
      if (!removida) {
        sendJson(res, 404, { message: 'Peça não encontrada.' });
        return;
      }
      sendNoContent(res);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/servicos') {
      const servicos = [...getServicos()].sort((a, b) => b.id - a.id);
      sendJson(res, 200, servicos);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/ordens-servico') {
      const ordens = [...getOrdensServico()].sort((a, b) => b.id - a.id).map(mapOrdem);
      sendJson(res, 200, ordens);
      return;
    }

    if (req.method === 'GET' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const ordem = getOrdensServico().find(item => item.id === id);
      if (!ordem) {
        sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
        return;
      }
      sendJson(res, 200, mapOrdem(ordem));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/ordens-servico') {
      parseBody(req, res, body => {
        const { clienteId, veiculoId, dataEntrada, status, servicos = [], pecas = [], observacoes } = body || {};
        if (!clienteId || !veiculoId || !dataEntrada || !status) {
          sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
          return;
        }
        const nova = addOrdemServico({
          clienteId: Number(clienteId),
          veiculoId: Number(veiculoId),
          dataEntrada,
          status,
          servicos: Array.isArray(servicos) ? servicos : [],
          pecas: Array.isArray(pecas) ? pecas : [],
          observacoes: observacoes?.trim() || undefined
        });
        sendJson(res, 201, mapOrdem(nova));
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { clienteId, veiculoId, dataEntrada, status, servicos = [], pecas = [], observacoes } = body || {};
        if (!clienteId || !veiculoId || !dataEntrada || !status) {
          sendJson(res, 400, { message: 'Dados obrigatórios ausentes.' });
          return;
        }
        const atualizada = updateOrdemServico(id, {
          clienteId: Number(clienteId),
          veiculoId: Number(veiculoId),
          dataEntrada,
          status,
          servicos: Array.isArray(servicos) ? servicos : [],
          pecas: Array.isArray(pecas) ? pecas : [],
          observacoes: observacoes?.trim() || undefined
        });
        if (!atualizada) {
          sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
          return;
        }
        sendJson(res, 200, mapOrdem(atualizada));
      });
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const removida = deleteOrdemServico(id);
      if (!removida) {
        sendJson(res, 404, { message: 'Ordem de serviço não encontrada.' });
        return;
      }
      sendNoContent(res);
      return;
    }

    sendJson(res, 404, { message: 'Rota não encontrada.' });
  } catch (error) {
    console.error('Erro inesperado:', error);
    sendJson(res, 500, { message: 'Erro interno do servidor.' });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor da API iniciado em http://localhost:${PORT}`);
});
