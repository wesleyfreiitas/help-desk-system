-- TYPE
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-type-1', 'TYPE', 'Pergunta', 'Pergunta', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-type-2', 'TYPE', 'Incidente', 'Incidente', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-type-3', 'TYPE', 'Problema', 'Problema', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-type-4', 'TYPE', 'Solicitacao de recurso', 'Solicitação de recurso', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-type-5', 'TYPE', 'Reembolso', 'Reembolso', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SOURCE
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-src-1', 'SOURCE', 'Telefone', 'Telefone', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-src-2', 'SOURCE', 'Email', 'Email', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-src-3', 'SOURCE', 'Portal', 'Portal', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-src-4', 'SOURCE', 'Chat', 'Chat', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", createdAt, updatedAt) VALUES ('opt-src-5', 'SOURCE', 'Pessoalmente', 'Pessoalmente', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- STATUS
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-1', 'STATUS', 'Aberto', 'ABERTO', 1, '#ef4444', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-2', 'STATUS', 'Em Andamento', 'EM_ANDAMENTO', 2, '#3b82f6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-3', 'STATUS', 'Pendente', 'PENDENTE', 3, '#f59e0b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-4', 'STATUS', 'Aguardando Cliente', 'AGUARDANDO_CLIENTE', 4, '#8b5cf6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-5', 'STATUS', 'Aguardando Terceiro', 'AGUARDANDO_TERCEIRO', 5, '#6366f1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-6', 'STATUS', 'Resolvido', 'RESOLVIDO', 6, '#10b981', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-st-7', 'STATUS', 'Fechado', 'FECHADO', 7, '#6b7280', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- PRIORITY
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-pri-1', 'PRIORITY', 'Baixa', 'BAIXA', 1, '#10b981', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-pri-2', 'PRIORITY', 'Média', 'MEDIA', 2, '#f59e0b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO TicketOption (id, type, label, value, "order", color, createdAt, updatedAt) VALUES ('opt-pri-3', 'PRIORITY', 'Alta', 'ALTA', 3, '#ef4444', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
