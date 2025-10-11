import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const servicos = await query(
      `SELECT id, descricao, preco FROM services ORDER BY descricao`
    );
    res.json(servicos);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { descricao, preco } = req.body;
    const result = await query(
      `INSERT INTO services (descricao, preco) VALUES (:descricao, :preco)`,
      { descricao, preco }
    );
    const [servico] = await query(
      `SELECT id, descricao, preco FROM services WHERE id = :id`,
      { id: result.insertId }
    );
    res.status(201).json(servico);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { descricao, preco } = req.body;
    await query(
      `UPDATE services SET descricao = :descricao, preco = :preco WHERE id = :id`,
      { descricao, preco, id: req.params.id }
    );
    const [servico] = await query(
      `SELECT id, descricao, preco FROM services WHERE id = :id`,
      { id: req.params.id }
    );
    res.json(servico);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM services WHERE id = :id`, { id: req.params.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
