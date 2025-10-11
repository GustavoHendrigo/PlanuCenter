USE planu_center;

INSERT INTO clients (nome, email, telefone) VALUES
  ('Carlos Alberto', 'carlos.alberto@email.com', '(11) 91234-5678'),
  ('Joana Pereira', 'joana.pereira@email.com', '(11) 98765-4321'),
  ('Pedro Henrique', 'pedro.henrique@email.com', '(21) 99876-5432'),
  ('João da Silva', 'joao.silva@email.com', '(31) 93456-7890')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO vehicles (client_id, placa, marca, modelo, ano) VALUES
  (1, 'ROZ-1295', 'Toyota', 'Corolla', '2022'),
  (3, 'PEA-0M40', 'Honda', 'Civic', '2021'),
  (4, 'LBT-3954', 'Ford', 'Ranger', '2023'),
  (2, 'XYZ-7890', 'Chevrolet', 'Onix', '2020')
ON DUPLICATE KEY UPDATE placa = VALUES(placa);

INSERT INTO parts (id, nome, codigo, estoque, preco) VALUES
  (101, 'Filtro de Óleo', 'FO-001', 15, 35.00),
  (102, 'Pastilha de Freio', 'PF-002', 8, 120.50),
  (103, 'Vela de Ignição', 'VI-003', 32, 25.00),
  (104, 'Óleo Motor 5W30', 'OM-004', 20, 55.00)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO services (id, descricao, preco) VALUES
  (201, 'Troca de Óleo e Filtro', 150.00),
  (202, 'Alinhamento e Balanceamento', 180.00),
  (203, 'Revisão Sistema de Freios', 250.00)
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);

INSERT INTO orders (id, client_id, vehicle_id, data_entrada, status, observacoes)
VALUES
  (968, 4, 3, '2025-09-02', 'Finalizada', 'Revisão geral concluída sem pendências.'),
  (971, 3, 2, '2025-09-05', 'Aguardando Aprovação', 'Aguardando autorização do cliente para troca das pastilhas.'),
  (973, 1, 1, '2025-09-06', 'Finalizada', 'Cliente retirou o veículo no mesmo dia.'),
  (974, 1, 1, '2025-09-07', 'Em Andamento', 'Realizar checklist final antes da entrega.')
ON DUPLICATE KEY UPDATE status = VALUES(status), observacoes = VALUES(observacoes);

INSERT INTO order_services (order_id, service_id, qtde, preco_unitario) VALUES
  (974, 201, 1, 150.00),
  (973, 202, 1, 180.00),
  (971, 203, 1, 250.00),
  (968, 201, 1, 150.00)
ON DUPLICATE KEY UPDATE qtde = VALUES(qtde);

INSERT INTO order_parts (order_id, part_id, qtde, preco_unitario) VALUES
  (974, 101, 1, 35.00),
  (974, 104, 1, 55.00),
  (971, 102, 2, 120.50),
  (968, 101, 1, 35.00),
  (968, 104, 1, 55.00)
ON DUPLICATE KEY UPDATE qtde = VALUES(qtde);
