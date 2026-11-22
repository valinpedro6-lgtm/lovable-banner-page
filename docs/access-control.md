# Login, aprovação e acesso administrativo

## Configuração do servidor

Configure no ambiente de hospedagem (não no código nem em variáveis expostas ao navegador):

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — uso exclusivo do servidor
- `SESSION_SECRET` — segredo aleatório com pelo menos 32 caracteres
- `DEV_ACCESS_PASSWORD` — senha administrativa aleatória com pelo menos 12 caracteres

Para builds locais, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são variáveis públicas do frontend; nunca coloque a service-role key, `SESSION_SECRET` ou `DEV_ACCESS_PASSWORD` em nomes `VITE_*`. Consulte `.env.example` para os nomes sem valores.

Use gerenciador de segredos da hospedagem e nunca faça commit dos valores. Qualquer senha de desenvolvedor que tenha aparecido em um commit antigo deve ser trocada imediatamente no ambiente de hospedagem; apagar do código atual não remove o histórico remoto.

## Supabase

A migration `supabase/migrations/20261122103000_access_requests.sql` cria a tabela de pedidos, a política RLS de leitura do próprio registro, registra novas contas pelo trigger e cria entradas pendentes para contas já existentes sem aprová-las. Ela está no repositório, mas não é aplicada automaticamente: revise-a e aplique-a pelo fluxo Supabase do projeto antes de ativar o cadastro em produção. Não aplique sem autorização em banco compartilhado.

Em **Authentication → URL Configuration**, inclua a origem publicada e permita o retorno para `/auth?type=recovery` (além das URLs usadas para confirmar e-mail). O domínio deve usar HTTPS em produção.

## Comportamento

Pessoas criam conta ou entram com Supabase Auth; contas comuns ficam bloqueadas até a aprovação no painel de administração. A ativação de desenvolvedor exige uma conta Supabase válida e a senha administrativa é verificada exclusivamente em server function. Aprovação, recusa e consulta administrativa verificam esse modo elevado no servidor a cada operação. O modo elevado dura até oito horas e é vinculado ao ID do usuário autenticado. Cinco senhas incorretas bloqueiam novas tentativas por 15 minutos; esse contador fica em metadados gerenciados pelo servidor por usuário, não apenas no navegador.

A redefinição envia um link por e-mail; o link retorna ao formulário de nova senha em `/auth?type=recovery`. Treinos, perfil e check-ins continuam guardados localmente no dispositivo. A autenticação não migra nem sincroniza esses dados.
