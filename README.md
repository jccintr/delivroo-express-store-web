# Delivroo Lojista (Web)

Painel web responsivo para lojistas do Delivroo Express: cadastro, login,
recuperação de senha, ativação de conta e área autenticada com sidebar.

## Stack

- Vite + React 19 (JavaScript)
- Tailwind CSS v4
- flowbite-react (componentes de UI)
- React Router

## Setup

```bash
npm install
cp .env.example .env
```

Edite `.env` e aponte `VITE_API_BASE_URL` para a URL da API
(`api-delivroo-express-node`), por exemplo:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

## Estrutura

```
src/
├── api/            # client HTTP + funções que espelham /api/stores/*
├── context/        # AuthContext (sessão da loja)
├── routes/         # guards RequireAuth / RequireGuest
├── components/
│   ├── layout/     # Sidebar, Header, AppLayout, AuthLayout, VerifyEmailBanner
│   └── ui/         # componentes utilitários (loader etc.)
└── pages/
    ├── auth/       # Login, Cadastro, Recuperação de senha (wizard)
    ├── dashboard/
    ├── pedidos/
    ├── cardapio/
    ├── perfil/
    └── conta/
```

## Estado atual

Autenticação (registro, login, ativação de conta, recuperação de senha)
está totalmente conectada à API real. As demais áreas (pedidos, cardápio,
perfil, dashboard) são estrutura de UI pronta aguardando endpoints que
ainda não existem no backend — veja `NEXT_STEPS.md` para o detalhamento.

## Paleta e tipografia

A identidade visual segue o `theme.js` do app do entregador
(`delivroo-rider-android`): laranja `#FF6B35` como cor primária, fundo
`cream` `#FAF7F1`, tipografia Baloo 2 (títulos) / Inter (corpo) / IBM
Plex Mono (códigos de verificação). Definido em `src/index.css` via
`@theme` do Tailwind v4.
