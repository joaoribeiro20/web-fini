# Webfini

O Webfini é uma aplicação web de organização financeira pessoal. O projeto está em desenvolvimento e, atualmente, oferece um dashboard para acompanhar o orçamento mensal usando dados simulados.

## Funcionalidades atuais

- Resumo dos gastos comprometidos, do valor restante no mês e da taxa de poupança.
- Detalhamento dos gastos por categoria.
- Cadastro de metas de poupança com aportes mensais; os aportes reduzem a sobra livre e são contabilizados na taxa de poupança.
- Cadastro manual de gastos com as categorias Gastos Fixos e Gastos Mensais; E-commerce, Mercado e Outros são subcategorias de Gastos Mensais. A tela também permite importar extrato CSV com prévia e confirmação antes do cadastro.
- Filtro mensal e visualização dos gastos parcelados em modal, com parcela atual e quantidade restante; a lista permite buscar por descrição, filtrar por categoria e lojas catalogadas, e ordenar por data ou valor. A loja é detectada pelo nome incluído na descrição.
- Histórico mensal de gastos em uma linha do tempo, com cores mais fortes para totais mais altos e detalhes dos lançamentos por mês.
- Navegação para Dashboard, Histórico, Gastos e Metas, com ícones de Configurações e Entrar no rodapé do menu. Configurações e Entrar ainda são telas provisórias.

Para importar um extrato, selecione um CSV com as colunas `data`, `descricao`, `valor` e `categoria`. A tela mostra uma prévia e valida os lançamentos antes de permitir o cadastro; as datas devem pertencer ao mês selecionado e podem estar em `DD/MM/AAAA` ou `AAAA-MM-DD`.

> **Dados de demonstração:** renda, gastos, metas e histórico são fornecidos por um repositório simulado em memória. Alterações são perdidas ao recarregar a aplicação. O projeto ainda não está conectado a uma API ou banco de dados.

## Integração com o back-end

A proposta de rotas, filtros, formatos de requisição/resposta e regras de negócio está em [BACKEND_API.md](./BACKEND_API.md).
O modelo proposto de entidades, campos, relacionamentos e SQL está em [DATABASE_MODEL.md](./DATABASE_MODEL.md).

## Tecnologias

- React 19 e TypeScript
- Vite
- React Router
- Lucide React para ícones

## Como executar

Pré-requisitos: Node.js e npm instalados.

1. Abra um terminal na pasta do projeto.
2. Instale as dependências:

   ```bash
   npm ci
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse no navegador o endereço exibido pelo Vite no terminal (normalmente `http://localhost:5173`).

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com atualização automática. |
| `npm run build` | Verifica os tipos TypeScript e gera a versão de produção em `dist/`. |
| `npm run preview` | Serve localmente a versão de produção já gerada. Execute `npm run build` antes. |
| `npm run lint` | Analisa o código com ESLint. |

## Estrutura do projeto

```text
src/
├── app/                 # Composição da aplicação, rotas e injeção de dependências
├── core/                # Modelos, contratos de repositório e casos de uso
├── infrastructure/      # Implementações de infraestrutura, incluindo dados simulados
├── presentation/        # Páginas, componentes e layout da interface
└── shared/              # Estilos e utilitários compartilhados
```

O dashboard segue uma separação em camadas: a interface usa um view model, que executa casos de uso do `core`; os casos de uso dependem de um contrato de repositório, atualmente implementado pelo repositório simulado. Essa organização permite substituir a fonte de dados posteriormente sem acoplar a interface a uma API específica.
