import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const clientes = await query(
      `SELECT id, nome, email, telefone FROM clients ORDER BY nome`
    );
    res.json(clientes);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [cliente] = await query(
      `SELECT id, nome, email, telefone FROM clients WHERE id = :id`,
      { id: req.params.id }
    );
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nome, email, telefone } = req.body;
    const result = await query(
      `INSERT INTO clients (nome, email, telefone) VALUES (:nome, :email, :telefone)`,
      { nome, email, telefone }
    );
    const [novoCliente] = await query(
      `SELECT id, nome, email, telefone FROM clients WHERE id = :id`,
      { id: result.insertId }
    );
    res.status(201).json(novoCliente);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nome, email, telefone } = req.body;
    await query(
      `UPDATE clients SET nome = :nome, email = :email, telefone = :telefone WHERE id = :id`,
      { id: req.params.id, nome, email, telefone }
    );
    const [clienteAtualizado] = await query(
      `SELECT id, nome, email, telefone FROM clients WHERE id = :id`,
      { id: req.params.id }
    );
    res.json(clienteAtualizado);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM clients WHERE id = :id`, { id: req.params.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
