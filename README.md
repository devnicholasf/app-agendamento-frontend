# App Agendamento (Frontend)

Breve documentação do projeto e alterações recentes feitas na organização do código.

**Resumo rápido**
- **Objetivo:** Aplicação frontend React para gerenciamento de agendamentos.
- **Alteração:** Telas (páginas) foram reorganizadas para `src/pages` e componentes reutilizáveis ficam em `src/components`.

**Estrutura importante**
- **`src/pages`**: Páginas/rotas completas (ex.: `Login`, `Register`, `ForgotPassword`, `Home`, `Appointments`, etc.).
- **`src/components`**: Componentes reutilizáveis pequenos (ex.: `ProfilePictureUpload.js`).

**Alterações realizadas neste repositório**
- **Movido/centralizado em `src/pages`:** `Login`, `Register`, `ForgotPassword`, `Home` (implementações reais agora moram em `src/pages`).
- **Limpeza em `src/components`:** arquivos de tela duplicados foram removidos para evitar ambiguidade. A pasta `src/components` atualmente contém apenas componentes reutilizáveis (por exemplo `ProfilePictureUpload.js`).
- **`src/App.js`**: imports das rotas atualizados para apontar para `./pages/*`.

**Como rodar localmente (PowerShell, Windows)**
1. Instale dependências:

```
npm install
```

2. Inicie a aplicação:

```
npm start
```

3. (Opcional) Rode lint/tests, se disponíveis:

```
npm run lint
npm test
```

**Notas e recomendações**
- Caso você tenha importações em outros projetos apontando para caminhos antigos (por exemplo `src/components/Login`), atualize para `src/pages/Login`.
- Se quiser que eu remova arquivos obsoletos de forma definitiva (ou gere um commit com essas mudanças), posso fazer isso — solicite que eu gere o commit e push (preciso de confirmação).

**Contato / Histórico**
- Alterações de organização aplicadas em: 2025-11-17.
- Se precisar de documentação adicional ou um guia de contribuição, eu posso gerar um `CONTRIBUTING.md`.

---
Gerado automaticamente durante a reorganização das telas e componentes.
