# Império Açaí — Cardápio Digital

Site único com três áreas:

| Rota | O que é |
| --- | --- |
| `/` | Árvore de links (estilo Linktree) com botão de destaque para o cardápio |
| `/cardapio` | Cardápio online: busca, banners, categorias, pratos, mapa e contatos |
| `/admin` | Painel administrativo (pratos, categorias, banners, links, configurações) |

**Stack:** React 18 + Vite + TypeScript (front) · PHP 8 puro (rotas internas `/data/*`) · MySQL 8 / MariaDB.
Sem API separada: o PHP serve o `index.html` do React e responde JSON apenas para o próprio site (mesma origem, sessão por cookie + CSRF).

```
imperioacai/
├── app/                 # PHP (fica FORA da pasta publica)
│   ├── bootstrap.php, routes.php, Router.php, Database.php, Auth.php, ...
│   ├── Controllers/
│   ├── database/schema.sql + seed.sql
│   └── config.example.php
├── public/              # -> public_html na Hostinger
│   ├── index.php        # front controller (/data/* -> PHP, resto -> SPA)
│   ├── .htaccess
│   ├── uploads/         # imagens enviadas pelo admin
│   └── index.html + assets/   (gerados pelo `npm run build`)
├── src/                 # React
├── docker-compose.yml   # ambiente local (PHP + MySQL + phpMyAdmin)
└── vite.config.ts
```

---

## Desenvolvimento local

Pré-requisitos: Node 18+ e Docker Desktop (PHP e MySQL rodam em containers).

```bash
npm install
npm run docker:up          # PHP em http://localhost:8090, phpMyAdmin em http://localhost:8081
npm run dev                # Vite em http://localhost:5173 (proxy de /data e /uploads para o PHP)
```

Na primeira subida o MySQL importa `schema.sql` e `seed.sql` automaticamente (64 pratos, 8 categorias, 4 banners, links e configurações do cardápio original).

Para testar o build de produção exatamente como na Hostinger:

```bash
npm run build              # gera public/index.html + public/assets
# abra http://localhost:8090
```

Resetar o banco do zero: `npm run docker:reset`.

### Acesso ao painel

- URL: `/admin`
- Usuário: `admin@imperioacai.com.br`
- Senha: `admin123`

Troque a senha em **Minha conta** logo após o primeiro login.

---

## Deploy na Hostinger (hospedagem compartilhada)

### 1. Banco de dados

1. hPanel → **Bancos de dados → MySQL** → crie um banco e um usuário (anote nome, usuário e senha).
2. Abra o **phpMyAdmin** desse banco e importe, nesta ordem:
   - `app/database/schema.sql`
   - `app/database/seed.sql`

### 2. Build do front

Na sua máquina:

```bash
npm install
npm run build
```

Isso gera `public/index.html` e `public/assets/`.

### 3. Enviar arquivos

Pelo **Gerenciador de arquivos** ou FTP, usando a raiz do domínio (`/home/uXXXX/domains/seudominio.com.br/`):

| Local no projeto | Destino na Hostinger |
| --- | --- |
| conteúdo de `public/` (index.php, .htaccess, index.html, assets/, uploads/) | `public_html/` |
| pasta `app/` inteira | `app/` **ao lado** de `public_html` (não dentro) |

Estrutura final esperada:

```
domains/seudominio.com.br/
├── app/
│   ├── bootstrap.php
│   ├── config.php        <- criado no passo 4
│   └── ...
└── public_html/
    ├── index.php
    ├── .htaccess
    ├── index.html
    ├── assets/
    └── uploads/
```

> Se o seu plano não permitir pastas fora de `public_html`, coloque `app/` dentro de `public_html/app/`. O `.htaccess` que já está em `app/` bloqueia acesso direto, e o `index.php` encontra a pasta automaticamente.

### 4. Configuração

Copie `app/config.example.php` para `app/config.php` e preencha:

```php
'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'u000000000_imperioacai',
    'user' => 'u000000000_imperioacai',
    'pass' => 'SENHA_DO_BANCO',
],
'app_key' => 'cole aqui uma chave aleatória longa',
'app_env' => 'production',
```

Garanta permissão de escrita na pasta `public_html/uploads` (755 costuma bastar; se o upload falhar, 775).

### 5. PHP

hPanel → **Avançado → Configuração PHP**: use PHP **8.1 ou superior** e confira que as extensões `pdo_mysql`, `fileinfo` e `mbstring` estão ativas (padrão na Hostinger).

### 6. Testar

- `https://seudominio.com.br/` → árvore de links
- `https://seudominio.com.br/cardapio` → cardápio
- `https://seudominio.com.br/data/menu` → JSON do cardápio (se der 500, revise o `config.php`)
- `https://seudominio.com.br/admin` → painel; troque a senha padrão

### Atualizações futuras

- **Conteúdo** (pratos, preços, fotos, banners, links): tudo pelo painel `/admin`, sem redeploy.
- **Código do front**: `npm run build` e reenviar `public/index.html` + `public/assets/`.
- **Código PHP**: reenviar os arquivos alterados de `app/`.

---

## Rotas internas (`/data/*`)

Públicas (GET): `/data/menu`, `/data/banners`, `/data/links`, `/data/settings`.

Admin (sessão + header `X-CSRF-Token` nas escritas):

- `POST /data/auth/login`, `POST /data/auth/logout`, `GET /data/auth/me`, `PUT /data/auth/password`
- `GET /data/admin/stats`
- CRUD em `/data/admin/{categories|products|banners|links}` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `PUT /reorder`)
- `PUT /data/admin/settings`
- `POST /data/admin/upload` (multipart `file`, JPG/PNG/WEBP/GIF até 5 MB)
