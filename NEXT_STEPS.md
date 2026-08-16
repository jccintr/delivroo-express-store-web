# Próximos passos

Este projeto foi construído com a API atual do Delivroo Express
(`api-delivroo-express-node`). O fluxo de autenticação da loja está
100% funcional e ligado aos endpoints reais. As telas abaixo são
estrutura de UI pronta, mas ainda **sem dados reais** porque a API
não tem os endpoints correspondentes.

## Pendências no backend (`api-delivroo-express-node`)

| Recurso | O que falta | Onde mexer |
|---|---|---|
| Pedidos | Endpoints de listar/atualizar status de `Delivery` para a loja (o model já existe em `models/delivery.js`, mas não há controller/rotas) | novo `controllers/delivery.controller.js` + rotas em `routes/store.routes.js` |
| Cardápio/Produtos | Nem o model existe ainda | novo `models/product.js` + controller + rotas |
| Perfil da loja | Endpoint de atualização (nome, telefone, endereço, avatar) — o rider já tem um equivalente (`PATCH /riders/me`), a loja não | `controllers/store.controller.js` + rota `PATCH /stores/me` |
| Troca de senha logado | Só existe o fluxo de recuperação via código; falta endpoint para o usuário já autenticado trocar a senha sabendo a atual | `PATCH /stores/me/password` |
| Pedidos em tempo real | `websocket.js` está fixo para o app de passageiro (`JWT_SECRET_PASSENGER`) e faz broadcast pra todo mundo conectado — precisa de lógica de sala/canal por loja | `websocket.js` |

## No frontend, quando esses endpoints existirem

Cada página tem um comentário `// TODO` marcando exatamente onde plugar
a chamada real:
- `src/pages/pedidos/PedidosPage.jsx`
- `src/pages/cardapio/CardapioPage.jsx`
- `src/pages/perfil/PerfilLojaPage.jsx`
- `src/pages/conta/ContaPage.jsx`
- `src/pages/dashboard/DashboardPage.jsx`

Ao criar os novos endpoints, adicione as funções correspondentes em
`src/api/` (seguindo o padrão de `storeAuth.js`) e substitua os estados
vazios/mockados pelas chamadas reais.
