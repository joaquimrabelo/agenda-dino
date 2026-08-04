# Agenda Dino

PWA (Progressive Web App) sem backend, construído em Nuxt 3, que funciona como um painel de lembretes visuais e sonoros de rotina para uma criança de 3 anos (hidratação, banheiro/intervalo, refeições, soneca).

O app roda em um único dispositivo (tablet fixo ou celular), fica aberto o dia todo, e não é interativo pela criança — é um painel passivo que dispara alertas em tela cheia nos horários programados. O adulto abre a página, aperta **Play** uma vez para iniciar a rotina do dia, e não mexe mais. Fechar ou recarregar a página reinicia tudo (não há persistência entre sessões).

A especificação completa do produto está em [`instructions.md`](./instructions.md) — é a fonte de verdade para comportamento, dados e critérios de aceite.

## Stack

- Nuxt 3 (Vue 3 + Composition API)
- `npm` como gerenciador de pacotes (não usar yarn/pnpm)
- `@vite-pwa/nuxt` para manifest + service worker (cache offline de SVGs, som e fontes)
- Wake Lock API para manter a tela acesa
- Sem backend, sem API, sem persistência entre sessões

## Como rodar

Instalar dependências:

```bash
npm install
```

Servidor de desenvolvimento em `http://localhost:3000`:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Pré-visualizar o build de produção localmente:

```bash
npm run preview
```

## Estrutura do projeto

- `app/data/reminders.ts` — dados dos lembretes (recorrentes e fixos) e constantes de horário (reset, blackout, parada dos recorrentes). Único lugar onde horários são configurados.
- `app/composables/useScheduler.ts` — motor de agendamento: calcula qual tela/lembrete deve estar ativo a cada instante, seguindo a ordem de prioridade e as regras de coincidência/reset da spec (§4).
- `app/composables/useWakeLock.ts` — solicita e mantém o Wake Lock da tela.
- `app/components/PlayScreen.vue`, `IdleScreen.vue`, `AlertScreen.vue` — as três telas do app.
- `public/reminder-icons/`, `public/icons/`, `public/sounds/` — SVGs dos lembretes, ícone do PWA e efeito sonoro.

## Testando a passagem do tempo

Como a lógica de agendamento depende do horário do relógio, a seção 10 de [`instructions.md`](./instructions.md#10-simulando-a-passagem-do-tempo-para-testes-manuais) traz um script para colar no console do navegador e simular horários (avançar o relógio, saltar para 14:00, 18:00 etc.) sem precisar esperar o tempo real passar.

## Fora do escopo (v1)

Sem tela de configuração, sem login/autenticação, sem backend, sem histórico de lembretes, sem múltiplos perfis, sem persistência entre sessões, sem notificações push — ver [`instructions.md`](./instructions.md#8-fora-do-escopo-não-implementar-nesta-versão) para a lista completa.
