# Plano — Perfil inicial, alimentação estimada e evolução

## Implementação e desenho

Continuar no app React/TypeScript com TanStack Start, mantendo os dados exclusivamente no `localStorage` já existente. Estender o modelo do perfil de forma compatível com instalações antigas; registrar histórico de peso e ingestão diária de água no mesmo estado local. Isolar fórmulas em módulos puros para testes. O primeiro acesso abre um onboarding curto com dados básicos, objetivo, atividade e medidas opcionais. A aba Dieta mostra apenas estimativas e hidratação, sem cardápio ou prescrição. O Histórico reúne progresso do peso por etapas de até 5 kg e constância de treinos.

A navegação inferior mantém cinco posições visuais, com o botão “+” no centro; Dieta ocupa o lado esquerdo e Cardio o direito. Permanecem acessíveis Início, Exercícios e Histórico pelo conteúdo e links do app, e Cardio continua como rota própria.

**Design Movement:** interface fitness premium de grafite e prata, com superfícies translúcidas inspiradas no glass do iPhone, sem reproduzir marca da referência.

**Princípios:** leitura rápida; controles confortáveis no celular; transparência sobre estimativas; progresso em passos pequenos.

**Paleta:** preto/grafite como base, prata para ações e dados; cores funcionais existentes preservadas para estados musculares.

**Layout:** painéis verticais móveis com cards de vidro, progresso em primeiro plano e navegação fixa inferior.

**Motivos:** brilho metálico contido, bordas translúcidas e barras de progresso segmentadas em marcos de 5 kg.

**Interação e movimento:** formulário dividido por etapas, salvamento local imediato, transições discretas; respeitar `prefers-reduced-motion`.

**Tipografia:** manter Geist para corpo, Geist Mono para números e Unbounded para títulos já utilizados no app.

**Essência:** painel de treino e recuperação local, direto e acolhedor; personalidade objetiva, premium e realista.

**Voz:** explicar o que o app estima e o que não sabe. Exemplo: “Uma etapa de cada vez.” e “Estimativa de referência, não prescrição.”

**Marca:** preservar o wordmark e ícone existentes do Muscle Recovery.

**Cor de assinatura:** prata fria sobre grafite.

## Estrutura principal

- `src/lib/types.ts` e `src/lib/store.ts`: perfil, histórico de peso e água, com migração local compatível.
- `src/lib/fitness-estimates.ts`: fórmulas e progresso de metas puros/testáveis.
- `src/components/OnboardingWizard.tsx`: criação do perfil inicial.
- `src/routes/_authenticated/_approved/dieta.tsx`: estimativas e registro de hidratação.
- `src/routes/_authenticated/_approved/historico.tsx`: etapa corporal e gráfico de foco.
- `src/components/AppNav.tsx` e `src/routes/__root.tsx`: navegação e gate de primeiro uso.

## Limites

Dados são armazenados neste aparelho, sem conta e sem sincronização. Calorias, proteína e água são referências gerais; não há dieta/cardápio, diagnóstico ou promessa de prazo. O app deve explicar limites para menores, gestantes, pessoas amamentando e condições clínicas. O histórico anterior ao cadastro continua preservado.
