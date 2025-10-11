import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const pecas = await query(
      `SELECT id, nome, codigo, estoque, preco FROM parts ORDER BY nome`
    );
    res.json(pecas);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nome, codigo, estoque, preco } = req.body;
    const result = await query(
      `INSERT INTO parts (nome, codigo, estoque, preco)
       VALUES (:nome, :codigo, :estoque, :preco)`,
      { nome, codigo, estoque, preco }
    );
    const [peca] = await query(
      `SELECT id, nome, codigo, estoque, preco FROM parts WHERE id = :id`,
      { id: result.insertId }
    );
    res.status(201).json(peca);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nome, codigo, estoque, preco } = req.body;
    await query(
      `UPDATE parts
         SET nome = :nome,
             codigo = :codigo,
             estoque = :estoque,
             preco = :preco
       WHERE id = :id`,
      { nome, codigo, estoque, preco, id: req.params.id }
    );
    const [peca] = await query(
      `SELECT id, nome, codigo, estoque, preco FROM parts WHERE id = :id`,
      { id: req.params.id }
    );
    res.json(peca);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM parts WHERE id = :id`, { id: req.params.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
