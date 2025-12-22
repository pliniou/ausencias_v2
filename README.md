# Sistema de Gestão de Ausências

Sistema moderno para gestão de ausências e escalas de trabalho. Interface profissional desenvolvida com React, Vite, Tailwind CSS e ShadCN UI, com suporte a Backend Node.js.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🚀 Funcionalidades

- **Autenticação Híbrida**: Suporte a login local (IndexedDB) e via API (Node.js + Express).
- **CRUD e API**: Endpoints RESTful para gestão de colaboradores, ausências (leaves), feriados e eventos.
- **Armazenamento Robusto**: Backup centralizado (SQLite) e sincronização via API.
- **Sistema de Aprovação**: Workflow completo de aprovação de afastamentos (Admin -> Pendente -> Aprovado).
- **Dashboard Interativo**:
  - Relógio de Ponto (Brasília)
  - Calendário Visual com Feriados e Ausências
  - Cards de Estatísticas em Tempo Real
- **Design Premium**: Themes (Light/Dark/Sepia), animações fluídas e componentes ShadCN UI.
- **Exportação**: Dados exportáveis em CSV, XLSX e TXT.

## 🌐 Demo Online

O front-end da aplicação está publicado e acessível em:
**[https://pliniou.github.io/ausencias_v2](https://pliniou.github.io/ausencias_v2)**

> *Nota: A versão online do GitHub Pages funciona em "Modo Demo". Se o backend não estiver acessível, o sistema ativará automaticamente um mock de dados e autenticação.*
>
> **Credenciais para Teste (Demo Mode):**
> *   **Admin**: Usuário `admin` / Senha `admin`
> *   **Usuário Comum**: Usuário `user` / Senha `user`

## 🛠️ Stack Tecnológica

### Frontend
- **Core**: React 18, Vite, TypeScript
- **Estilização**: Tailwind CSS, ShadCN UI, Lucide Icons
- **Estado/Dados**: React Context + IndexedDB (Dexie.js)
- **Testes**: Vitest

### Backend (API)
- **Runtime**: Node.js + Express
- **Segurança**: BCryptJS, Express Session
- **Banco de Dados**: Suporte a SQL (via sql.js/SQLite)

## 📦 Instalação e Execução (Windows)

### 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:

*   **Node.js** (v18.0.0 ou superior) - [Download](https://nodejs.org/)
    *   *Dica: Na instalação, marque a opção "Add to PATH".*
*   **Git** for Windows - [Download](https://git-scm.com/download/win)
*   **Terminal**: PowerShell 7+ ou Windows Terminal (Recomendado).

> **Nota**: Este projeto utiliza bibliotecas puras JavaScript (`bcryptjs`, `sql.js`), portanto **NÃO** é necessário instalar o Python ou Visual Studio Build Tools (C++) no Windows.

### 2. Configuração do Projeto

Abra o terminal na pasta onde deseja instalar o projeto:

```powershell
# 1. Clone o repositório
git clone https://github.com/pliniou/Project_Ausencias.git
cd Project_Ausencias

# 2. Instale as dependências do Frontend
npm install

# 3. Instale as dependências do Backend (Em uma nova aba/janela do terminal)
cd backend
npm install
cd ..
```

### 3. Executando a Aplicação

Para ter o ambiente completo funcionando, você precisará de **dois terminais** abertos:

**Terminal 1: Backend (API)**
```powershell
# Na pasta raiz do projeto
# Inicie o servidor TypeScript diretamente
npx ts-node backend/server.ts
```
*O servidor iniciará em `http://localhost:4000`*

**Terminal 2: Frontend (Interface)**
```powershell
# Na pasta raiz do projeto
npm run dev
```
*O frontend iniciará em `http://localhost:8080` (Acesse este link no navegador)*

### 4. Novos Endpoints da API

O backend agora fornece endpoints CRUD completos para ausências:

*   `GET /api/leaves`: Listar todas as ausências.
*   `POST /api/leaves`: Criar nova ausência.
*   `PUT /api/leaves/:id`: Atualizar ausência.
*   `DELETE /api/leaves/:id`: Remover ausência.
*   `GET /api/backup`: Download do banco de dados SQLite completo.

## 🧪 Testes

O projeto utiliza **Vitest** para testes unitários e de integração no frontend.

```powershell
# Executar todos os testes
npm test

# Executar testes com interface visual (UI)
npm run test:ui
```

## 📂 Estrutura de Pastas

```
/
├── backend/            # Servidor API Node.js/Express
├── public/             # Assets estáticos (Images, WASM)
├── src/
│   ├── auth/           # Lógica de permissões
│   ├── components/     # Componentes React (UI, Dashboard, Forms)
│   ├── context/        # Gerenciamento de Estado (Auth, Data, Config)
│   ├── data/           # Camada de Persistência (IndexedDB)
│   ├── pages/          # Rotas/Páginas da Aplicação
│   └── lib/            # Utilitários e Tipos
├── vite.config.ts      # Configuração do Vite (Proxy, Plugins)
└── package.json        # Dependências e Scripts
```

## 🔧 Solução de Problemas Comuns

**Erro: `sql-wasm.wasm not found`**
O script de build deve copiar este arquivo automaticamente. Se falhar:
```powershell
Copy-Item "node_modules/sql.js/dist/sql-wasm.wasm" -Destination "public/"
```

**Porta em uso**
Se a porta 4000 ou 8080 estiver ocupada, edite:
- Frontend: `vite.config.ts` (`server.port`)
- Backend: `backend/server.ts` (`PORT`)

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
