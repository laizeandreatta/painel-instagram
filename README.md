# Painel de Conteúdo do Instagram

Painel para planejar, produzir, aprovar e acompanhar o desempenho dos
conteúdos do Instagram com a equipe — calendário, quadro Kanban, upload
de artes, comentários de aprovação, análise de desempenho automática e
crescimento de seguidores.

Este documento é o guia completo de configuração, escrito para quem
nunca programou. Siga as seções na ordem. Se travar em algum passo, é
só voltar e pedir ajuda descrevendo onde parou.

## O que já funciona agora, sem configurar nada

O projeto vem em **modo demonstração**: abra e já dá pra ver e clicar
em tudo (calendário, Kanban arrastando cards, página de post, análises)
com dados fictícios. Isso serve pra você validar se o visual e o fluxo
são o que você imaginou antes de configurar o banco de dados de
verdade.

### Rodar no seu computador

1. Instale o [Node.js](https://nodejs.org) (versão 20 ou mais recente) — baixe o instalador e siga o padrão.
2. Abra o Terminal (Mac) ou Prompt de Comando (Windows) dentro da pasta `painel-instagram`.
3. Rode:
   ```
   npm install
   npm run dev
   ```
4. Abra `http://localhost:3000` no navegador.

Isso já funciona sozinho, em modo demonstração. Os passos abaixo
transformam o painel em algo real, com login da equipe, dados salvos
de verdade e análise automática do Instagram.

---

## Passo 1 — Criar o banco de dados (Supabase)

O Supabase guarda os posts, comentários, artes enviadas e os logins da
equipe. É gratuito para o tamanho de uso de um painel como este.

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New Project**.
2. Dê um nome (ex: `painel-instagram`) e uma senha de banco de dados (guarde essa senha).
3. Espere o projeto ser criado (leva ~2 minutos).
4. No menu lateral, clique em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` (está nesta pasta do projeto), copie todo o conteúdo, cole no editor e clique em **Run**.
   - Isso cria todas as tabelas, as regras de segurança e o espaço de armazenamento das artes.
6. No menu lateral, vá em **Project Settings → API**. Você vai precisar de dois valores:
   - **Project URL**
   - **anon public key**
7. Ainda em **Project Settings → API**, copie também a **service_role key** (fica escondida, clique para revelar). Essa é secreta — nunca coloque em lugar público.

## Passo 2 — Conectar o painel ao Supabase

1. Na pasta do projeto, duplique o arquivo `.env.local.example` e renomeie a cópia para `.env.local`.
2. Preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=          (o "Project URL" do passo 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=     (a "anon public key")
   SUPABASE_SERVICE_ROLE_KEY=         (a "service_role key")
   ```
3. Rode `npm run dev` de novo. O aviso de "modo demonstração" deve sumir — o painel agora está lendo/gravando no Supabase.

## Passo 3 — Criar os logins da equipe

Cada pessoa da equipe precisa de uma conta para entrar com login individual.

1. No Supabase, vá em **Authentication → Users → Add user**.
2. Cadastre um e-mail e senha para cada pessoa (você, a designer, o social media etc). Você pode trocar a senha depois.
3. Em **Authentication → Providers**, confirme que **Email** está habilitado (vem habilitado por padrão).
4. Um perfil é criado automaticamente na tabela `perfis` para cada pessoa. Se quiser, edite o campo `papel` de cada uma (`admin`, `designer`, `editor`, `social_media`) diretamente na tabela **Table Editor → perfis** do Supabase.

Cada pessoa entra pelo painel em `/login` com o e-mail e senha cadastrados.

---

## Passo 4 — Colocar o painel no ar (para a equipe acessar por um link)

Use o [Vercel](https://vercel.com) — gratuito, feito para projetos Next.js como este.

**Caminho mais simples:**

1. Crie uma conta gratuita em [github.com](https://github.com) (se ainda não tiver).
2. Crie um repositório novo e envie a pasta `painel-instagram` para ele (o GitHub Desktop, app gráfico, ajuda bastante se você não usa terminal para isso: [desktop.github.com](https://desktop.github.com)).
3. Crie uma conta em [vercel.com](https://vercel.com) com o mesmo login do GitHub.
4. Clique em **Add New → Project**, selecione o repositório que você acabou de criar.
5. Antes de clicar em **Deploy**, adicione as variáveis de ambiente (as mesmas do arquivo `.env.local`) na seção **Environment Variables**.
6. Clique em **Deploy**. Em ~1 minuto você recebe um link (tipo `painel-instagram.vercel.app`) para compartilhar com a equipe.

Qualquer atualização que você mandar para o GitHub depois disso é publicada automaticamente.

---

## Passo 5 — Ligar a análise automática do Instagram (opcional, mas você pediu 🙂)

Essa parte é a mais técnica porque depende das regras da própria Meta
(dona do Instagram) para acessar dados de desempenho. Ela é separada de
tudo o que já funciona — o painel de planejamento funciona perfeitamente
sem isso.

**Pré-requisitos da sua conta do Instagram:**
- A conta precisa ser **Profissional** (Criador de Conteúdo ou Empresa).
- Precisa estar conectada a uma **Página do Facebook** (mesmo que você não use a página para nada).

**Como conseguir as chaves de acesso:**

1. Acesse [developers.facebook.com](https://developers.facebook.com) e crie um App (tipo "Empresa").
2. No painel do App, adicione o produto **Instagram Graph API**.
3. Use a ferramenta **Graph API Explorer** (no mesmo site) para gerar um token de acesso da sua conta, pedindo as permissões: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`.
4. Troque esse token por um **token de longa duração** (dura ~60 dias, precisa renovar periodicamente) — a documentação da Meta explica o passo de troca ("Long-Lived Access Tokens").
5. Com o token em mãos, descubra o **ID da sua conta profissional do Instagram**: chame `GET /me/accounts` e depois `GET /{id-da-pagina}?fields=instagram_business_account` no Graph API Explorer.
6. No `.env.local` (e nas variáveis de ambiente do Vercel), preencha:
   ```
   IG_ACCESS_TOKEN=            (o token de longa duração)
   IG_BUSINESS_ACCOUNT_ID=     (o ID que você descobriu no passo 5)
   CRON_SECRET=                (invente uma senha só sua, ex: uma frase aleatória)
   ```
7. Abra o arquivo `vercel.json` e troque `SUBSTITUA_PELO_SEU_CRON_SECRET` pelo mesmo valor que você colocou em `CRON_SECRET`.
8. Publique de novo no Vercel. A partir daí, o Vercel roda automaticamente, uma vez por dia, a coleta de: número de seguidores (para o gráfico de crescimento) e desempenho dos posts publicados há mais de 24h.

**Importante — como o painel sabe qual post do Instagram é qual:**
Como você pediu que a publicação continue manual (você posta direto pelo
Instagram), o painel não sabe sozinho qual post de lá corresponde a
qual card daqui. Por isso, depois de publicar de verdade no Instagram,
abra o post no painel (que já deve estar com status "Publicado") e cole
o **link ou ID do post** no campo que aparece na página — a partir daí
a coleta de métricas encontra o post certo.

Se preferir, posso te ajudar a fazer esse passo a passo do Instagram
junto com você quando chegar a hora — é mais fácil fazendo ao vivo.

---

## Passo 6 — WhatsApp automático de agendamento + verificação da consultoria marcada

> **CRM Assessoria e CRM Consultoria são serviços diferentes**, cada um
> com sua própria tabela e seu próprio funil de leads. Este passo é só
> sobre o CRM Consultoria (vendas da Hubla).

Quando uma venda da consultoria é confirmada na Hubla (veja a integração
já ativa em `/api/hubla/webhook`), o painel manda pro comprador um
WhatsApp com o link de agendamento
(`https://calendar.app.google/zFyfAuddQbUd7wH76`) e depois confere
sozinho, na sua agenda do Google, se a pessoa realmente marcou —
atualizando o card do lead no CRM Consultoria automaticamente. São duas
partes independentes de configurar.

### 6.1 — Enviar o WhatsApp (WhatsApp Business Platform / Meta)

A rota `/api/whatsapp/webhook` já existe pra **receber** mensagens.
Pra **enviar** — que é o que esse recurso precisa — é preciso um passo a
mais: um número comercial e um "modelo de mensagem" aprovado pela Meta
(toda mensagem que uma empresa manda primeiro, sem o cliente ter escrito
antes, precisa ser um modelo pré-aprovado).

1. Acesse [business.facebook.com](https://business.facebook.com) → **WhatsApp Manager**. Se você já configurou o webhook de recebimento numa sessão anterior, o número comercial já deve existir aqui — é só reaproveitar.
2. Em **Configurações da API** (ou "API Setup"), copie o **ID do número de telefone** (Phone number ID) e gere um **token de acesso permanente** (token de sistema, não o temporário de 24h que aparece por padrão).
3. Em **Gerenciador de modelos de mensagem** ("Message Templates"), clique em **Criar modelo**:
   - Categoria: **Utilidade** (Utility) — é uma notificação pós-compra, não propaganda.
   - Nome: `agendamento_consultoria` (se usar outro nome, preencha `WHATSAPP_TEMPLATE_AGENDAMENTO` com ele).
   - Idioma: Português (BR).
   - Corpo da mensagem (sugestão, pode ajustar o tom):
     > Oi {{1}}! Sua consultoria com a Laize Andreatta está confirmada. Toque no botão abaixo para escolher o melhor dia e horário para a nossa conversa.
   - Botão: tipo **Visitar site**, com a URL fixa `https://calendar.app.google/zFyfAuddQbUd7wH76`.
   - Envie para aprovação — geralmente sai em poucos minutos, às vezes até 24h.
4. Nas variáveis de ambiente (Vercel e `.env.local`), preencha:
   ```
   WHATSAPP_ACCESS_TOKEN=          (o token permanente do passo 2)
   WHATSAPP_PHONE_NUMBER_ID=       (o ID do número do passo 2)
   WHATSAPP_TEMPLATE_AGENDAMENTO=  (só se usou um nome diferente de "agendamento_consultoria")
   ```
5. Publique de novo no Vercel. A partir da próxima venda, o WhatsApp já sai sozinho.

Enquanto o modelo não estiver aprovado, o lead continua sendo criado
normalmente no CRM — só o envio automático do WhatsApp fica pulado (dá
pra mandar o link na mão nesse meio tempo).

### 6.2 — Verificar quem marcou a consultoria (Google Calendar)

1. Acesse [console.cloud.google.com](https://console.cloud.google.com), crie um projeto (ou use um existente) e ative a **Google Calendar API** (menu "APIs e serviços" → "Biblioteca").
2. Em **Tela de consentimento OAuth**, configure como "Externo", preencha o nome do app (ex: "Painel Laize") e o seu e-mail. Deixe o status como está.
3. Em **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**, tipo **Aplicativo da Web**. Em "URIs de redirecionamento autorizados", adicione:
   ```
   https://SEU-PAINEL.vercel.app/api/admin/google/callback
   ```
4. Copie o **ID do cliente** e a **Chave secreta do cliente** e preencha nas variáveis de ambiente:
   ```
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```
5. Publique no Vercel com essas duas variáveis já preenchidas (ainda sem o `GOOGLE_REFRESH_TOKEN`, esse vem no próximo passo).
6. Volte na Tela de consentimento OAuth e, em **Status de publicação**, clique em **Publicar app** (deixa como "Em produção"). Isso evita ter que refazer a autorização a cada 7 dias.
7. No navegador, **logada com a conta do Google dona da agenda** (a mesma que tem o link de agendamento configurado), acesse:
   ```
   https://SEU-PAINEL.vercel.app/api/admin/google/auth?secret=SEU_CRON_SECRET
   ```
   (troque pelo domínio real do seu painel e pelo valor que você colocou em `CRON_SECRET`).
8. Aceite a permissão (pode aparecer um aviso "o Google não verificou esse app" — é esperado, porque o app é seu; clique em "Avançado" → "Acessar [nome do app] (não seguro)" para prosseguir).
9. Você cai numa página com o **refresh token** — copie e cole na variável `GOOGLE_REFRESH_TOKEN` na Vercel.
10. Publique de novo no Vercel. Pronto: a partir daí, uma vez por dia (e também sempre que alguém clicar em "Verificar agendamentos" no CRM Consultoria), o painel confere sua agenda e marca automaticamente quem já agendou.

Esse passo só precisa ser feito **uma vez**. Se um dia o token parar de
funcionar (ex: você revogou o acesso sem querer), é só repetir os passos
7 a 10.

---

## Visual

Paleta: vinho, preto, off-white, rosa bebê e bordô, com tipografia
serifada nos títulos (estilo capa de revista) e sans-serif no corpo do
texto — pensado para parecer um painel editorial, não uma planilha.

## Estrutura do projeto

```
src/
  app/            páginas (login, dashboard, post/[id], analytics)
  components/     Kanban, calendário, upload, comentários, etc.
  lib/            dados (Supabase ou modo demo), tipos, autenticação
supabase/
  schema.sql      script que cria todo o banco de dados
vercel.json       agenda a coleta diária de métricas do Instagram
```
