# Instruções para Claude Code — PWA "Agenda Dino"

## 0. Identidade do Projeto

- **Nome do app:** Agenda Dino
- **Gerenciador de pacotes:** `npm` (usar `npm install`, `npm run dev`, `package-lock.json` — não usar yarn/pnpm)
- **Tema visual:** dinossauro, mas de forma discreta — sem mascote animado interativo (mantém a decisão anterior de não ter personagem "falando"). O dino entra como:
  - Ícone do PWA (`manifest.json` / favicon): um dinossauro simples e fofo, estilo flat/vetorial
  - Uma "marquinha" fixa e pequena (ex: ícone de pata/pegada de dino + wordmark "Agenda Dino") no canto superior das telas de Idle e de Alerta, como assinatura visual, sem animação nem interação
  - Paleta de cores pode remeter a tons de floresta/selva de forma leve (verdes, azuis, terracota) sem comprometer as cores vibrantes já definidas por tipo de lembrete
- **Layout sugerido** (ver mockup gerado na conversa):
  - **Idle:** fundo azul claro sólido, marca "Agenda Dino" pequena no topo, relógio digital grande centralizado, e um círculo decorativo com ícone de ovo/pata de dino abaixo do relógio
  - **Alerta recorrente (ex: hidratação):** fundo em cor sólida vibrante do tipo de lembrete, marca pequena no topo, ícone grande do lembrete centralizado com o label abaixo, barra de progresso "enchendo" na parte inferior com texto de tempo restante
  - **Alerta fixo (ex: soneca):** mesmo padrão de layout do alerta recorrente, trocando apenas cor/ícone/label — mantém consistência visual entre os dois tipos de lembrete

## 1. Visão Geral

Criar um **PWA (Progressive Web App) sem backend**, construído em **Nuxt 3**, que funciona como um **painel de lembretes visuais e sonoros de rotina para uma criança de 3 anos** (hidratação, banheiro/desfralde, refeições, soneca).

O app roda em um único dispositivo (tablet fixo ou celular), fica aberto o dia todo, e **não é interativo pela criança** — é um painel passivo que dispara alertas em tela cheia nos horários programados.

Fluxo de uso: o adulto abre a página, aperta **Play** uma vez (esperado que seja de manhã, mas não obrigatório) para iniciar a rotina do dia, e não mexe mais. Ao fechar/recarregar a página, tudo reinicia do zero (volta pra tela de Play).

**Não há tela de configuração.** Os lembretes desta primeira versão são **predefinidos no código**, conforme especificado abaixo.

---

## 2. Stack Técnica

- **npm** como gerenciador de pacotes (não usar yarn/pnpm)
- **Nuxt 3** (Vue 3 + Composition API)
- **Sem backend / sem API** — tudo client-side
- **Sem persistência entre sessões** — estado apenas em memória (reinicia ao fechar/recarregar)
- **PWA** via `@vite-pwa/nuxt` (manifest + service worker para instalação e cache de assets offline — imagens vetoriais e sons)
- **Wake Lock API** (`navigator.wakeLock`) para impedir que a tela apague durante o uso — reativar o lock se o app recuperar o foco/visibilidade (`visibilitychange`)
- Imagens dos lembretes em **SVG** (vetoriais)
- Som: apenas efeito sonoro (sem voz gravada) tocando ao iniciar cada alerta
- CSS puro ou UnoCSS/Tailwind para as animações e cores vibrantes

---

## 3. Telas do App

### 3.1 Tela de Play (estado inicial)
- Botão grande **"Play"**, sem qualquer configuração visível
- Ao pressionar: registra o horário atual como **referência (R)**, solicita o Wake Lock, e inicia o motor de agendamento (ver seção 4)

### 3.2 Tela de Espera (Idle — fora de qualquer lembrete)
- Fundo neutro em **tonalidade azulada**
- **Relógio digital grande** centralizado, mostrando a hora atual, atualizado em tempo real

### 3.3 Tela de Lembrete (Alerta — tela cheia)
Ao disparar, cada lembrete mostra:
- Fundo com **cor vibrante** própria do tipo de lembrete
- **Imagem SVG** grande representando o evento (ver lista na seção 4)
- **Efeito sonoro** tocado uma vez ao iniciar o alerta
- Nos lembretes **recorrentes** (hidratação e intervalo): **barra de progresso "enchendo"** ao longo da duração
- Nos lembretes **fixos** (almoço, soneca, lanche, banho, jantar): a imagem permanece fixa em tela pela janela de tempo definida (barra de progresso é opcional nesses — pode usar o mesmo padrão visual de "enchendo" com base no tempo restante da janela, para manter consistência)
- Ao final da duração, retorna sozinho para a tela apropriada (Idle ou próximo evento) — nenhuma interação/toque é necessária

---

## 4. Lógica de Agendamento (regra de negócio central)

Esta é a parte mais importante da implementação — siga a especificação com atenção.

### 4.1 Referência de tempo (R)

- Ao apertar Play no horário `T0`, define-se `R = T0`.
- **Às 14:00, se `R` for anterior a 14:00**, resete `R = 14:00` (recalcula a referência a partir daí). Isso deve acontecer **apenas uma vez por dia** e **apenas se `R` ainda for menor que 14:00** no momento em que o relógio bate 14:00 — ou seja, se o Play foi apertado depois das 14:00, **não** reseta (não faz sentido mover a referência para trás).

### 4.2 Lembretes recorrentes (calculados a partir de R)

| Lembrete | Imagem | Intervalo | Duração em tela |
|---|---|---|---|
| **Hidratação** | garrafa de água | a cada 1h a partir de R | 3 minutos, com barra "enchendo" |
| **Intervalo** | garrafa de água + vaso sanitário (composição) | a cada 2h a partir de R | 10 minutos, com barra "enchendo" |

**Regra de coincidência:** como o intervalo de "Intervalo" (2h) é múltiplo do intervalo de "Hidratação" (1h), toda vez que os dois calculam a mesma ocorrência (R+2h, R+4h, R+6h...), **exibir apenas o lembrete de Intervalo** (Hidratação é suprimida nessa ocorrência específica, mas continua normalmente nas horas ímpares).

**Cálculo sugerido (para evitar depender de "tick exato"):**
```
elapsedMs = now - R
hydrationOccurrence = floor(elapsedMs / 1h) * 1h   // última ocorrência de hidratação
intervaloOccurrence = floor(elapsedMs / 2h) * 2h   // última ocorrência de intervalo

isIntervaloActive = elapsedMs >= 2h e now < (R + intervaloOccurrence + 10min)
isHydrationActive = elapsedMs >= 1h e now < (R + hydrationOccurrence + 3min)

se isIntervaloActive → mostrar Intervalo
senão se isHydrationActive → mostrar Hidratação
senão → Idle
```

### 4.3 Janela de bloqueio (blackout) — 11:30 às 14:00

- Entre **11:30 e 14:00**, os lembretes recorrentes (Hidratação e Intervalo) **não disparam**, mesmo que o cálculo indicasse uma ocorrência nesse intervalo. Simplesmente suprimir — não há necessidade de "recuperar" a ocorrência perdida depois, pois `R` é resetado às 14:00 de qualquer forma.

### 4.4 Lembretes fixos (horário fixo do relógio, independentes de R)

| Horário | Lembrete | Imagem | Janela ativa |
|---|---|---|---|
| 11:30 | **Almoço** | prato com talheres | 11:30 – 12:00 (30 min) |
| 12:00 | **Soneca** | cama com "zzzz" | 12:00 – 13:30 (1h30) |
| 15:30 | **Lanche** | frutas | 15:30 – 15:40 (10 min) |
| 18:00 | **Banho** | chuveiro | 18:00 – 18:15 (15 min) |
| 18:15 | **Jantar** | prato com talheres | 18:15 em diante, **sem horário de término definido** (permanece até o fim do dia / fechamento da página) |

- Esses lembretes disparam com base **apenas no relógio do sistema**, independentemente de quando o Play foi apertado — desde que a rotina já tenha sido iniciada (Play pressionado).
- **Às 18:00, todos os lembretes recorrentes (Hidratação/Intervalo) param definitivamente** pelo resto do dia (motor de recorrência é desligado). Na prática isso já é garantido pela prioridade dos eventos fixos (Banho/Jantar cobrem 18:00 em diante), mas implemente também uma flag explícita de "stop" às 18:00 como segurança.

### 4.5 Ordem de prioridade na renderização (a cada tick do relógio)

1. Se a rotina não foi iniciada → **Tela de Play**
2. Se o horário atual cai dentro da janela de algum **lembrete fixo** (4.4) → mostrar esse lembrete fixo (eles não se sobrepõem entre si pela própria tabela de horários)
3. Senão, se o horário atual está na **janela de bloqueio** (11:30–14:00) ou após as **18:00** → **Idle**
4. Senão, calcular lembretes recorrentes (4.2) → Intervalo, senão Hidratação, senão **Idle**

---

## 5. Requisitos Técnicos de PWA

- `manifest.json` com nome, ícones (vários tamanhos), `display: standalone`, orientação livre (funcionar bem tanto em tablet quanto celular)
- Service Worker cacheando todos os assets estáticos (SVGs, sons, fontes) para funcionar **offline**
- **Wake Lock**: solicitar `navigator.wakeLock.request('screen')` assim que o Play é pressionado; re-solicitar automaticamente via listener de `visibilitychange` caso o lock tenha sido liberado pelo sistema
- Testar que o app é instalável (ícone "Adicionar à tela inicial") em Android/iOS/desktop

---

## 6. Estilo Visual

- Cores vibrantes e ícones grandes, adequados para chamar atenção de uma criança de 3 anos
- Tema "Agenda Dino": ícone do PWA é um dinossauro fofo/vetorial; nas telas do app, o tema aparece apenas como uma marca discreta (ícone de pegada de dino + wordmark), **sem mascote animado/interativo**
- Tela de espera: tom azulado, calmo, com relógio digital grande e legível
- Tipografia grande e legível à distância (pensando em tablet fixo)
- Cada lembrete tem uma cor de destaque própria (ex: hidratação = azul, intervalo = verde, refeições = laranja, soneca = roxo/lilás, banho = ciano) para reforço visual rápido — ver cores sugeridas na seção 7
- Superfícies sempre em cor sólida (sem gradiente); contraste alto entre fundo e ícone/texto

---

## 7. Estrutura de Dados (hardcoded, mas organizada em código)

Mesmo sem tela de configuração, estruture os lembretes como dados (não espalhe horários mágicos pela lógica) para facilitar ajustes futuros:

```ts
// Lembretes recorrentes (calculados a partir de R)
interface RecurringReminder {
  id: 'hidratacao' | 'intervalo'
  label: string
  icon: string          // svg
  color: string
  intervalMinutes: number   // 60 | 120
  durationSeconds: number   // 180 | 600
}

const recurringReminders: RecurringReminder[] = [
  { id: 'hidratacao', label: 'Pausa para hidratação', icon: 'water-bottle.svg', color: '#3B82F6', intervalMinutes: 60, durationSeconds: 180 },
  { id: 'intervalo', label: 'Intervalo', icon: 'water-toilet.svg', color: '#22C55E', intervalMinutes: 120, durationSeconds: 600 },
]

// Lembretes fixos (horário absoluto do relógio, formato "HH:mm")
interface FixedReminder {
  id: string
  label: string
  icon: string
  color: string
  start: string   // 'HH:mm'
  end: string | null // 'HH:mm' ou null = sem término definido
}

const fixedReminders: FixedReminder[] = [
  { id: 'almoco',  label: 'Almoço', icon: 'plate.svg',   color: '#F97316', start: '11:30', end: '12:00' },
  { id: 'soneca',  label: 'Soneca', icon: 'bed.svg',     color: '#A855F7', start: '12:00', end: '13:30' },
  { id: 'lanche',  label: 'Lanche', icon: 'fruits.svg',  color: '#EAB308', start: '15:30', end: '15:40' },
  { id: 'banho',   label: 'Banho',  icon: 'shower.svg',  color: '#06B6D4', start: '18:00', end: '18:15' },
  { id: 'jantar',  label: 'Jantar', icon: 'plate.svg',   color: '#F97316', start: '18:15', end: null },
]

const RESET_TIME = '14:00'
const BLACKOUT_WINDOW = { start: '11:30', end: '14:00' }
const RECURRING_STOP_TIME = '18:00'
```

---

## 8. Fora do Escopo (não implementar nesta versão)

- Tela de configuração / edição de lembretes pelo usuário
- Login, autenticação ou proteção por senha
- Backend, API externa ou sincronização entre dispositivos
- Histórico/log de lembretes já exibidos
- Múltiplos perfis de crianças
- Persistência entre sessões (recarregar = reiniciar)
- Notificações push do navegador (o app depende de ficar aberto em tela cheia)

---

## 9. Critérios de Aceite

- [ ] App abre na tela de Play
- [ ] Ao apertar Play, `R` é definido, Wake Lock é solicitado, e o app vai para o Idle
- [ ] Hidratação dispara a cada 1h a partir de R, tela cheia, 3 min, com barra enchendo
- [ ] Intervalo dispara a cada 2h a partir de R, tela cheia, 10 min, com barra enchendo
- [ ] Quando Hidratação e Intervalo coincidem, só Intervalo aparece
- [ ] Entre 11:30 e 14:00, nenhum lembrete recorrente aparece
- [ ] Almoço aparece 11:30–12:00, Soneca aparece 12:00–13:30 (sem sobreposição com recorrentes)
- [ ] Às 14:00, se R era anterior a 14:00, a referência é resetada para 14:00 e os recorrentes voltam a contar a partir daí
- [ ] Lanche aparece 15:30–15:40
- [ ] Às 18:00, todos os recorrentes param; Banho aparece 18:00–18:15
- [ ] Às 18:15, Jantar aparece e permanece (sem fechamento automático)
- [ ] Fora de qualquer lembrete, tela Idle azulada com relógio digital é exibida
- [ ] Tela nunca apaga sozinha enquanto o app está ativo (wake lock funcionando)
- [ ] App funciona offline após primeira carga (PWA instalável)
- [ ] Recarregar a página reseta tudo e volta para a tela de Play

---

## 10. Simulando a passagem do tempo (para testes manuais)

O motor de agendamento sempre lê o horário via `new Date()` global (nunca importado de um módulo próprio), então é possível "adiantar o relógio" no navegador sobrescrevendo o `Date` global pelo console do DevTools, sem alterar código do app.

Cole isso no Console da página do app, uma vez, antes ou depois de apertar Play:

```js
;(function () {
  const RealDate = window.Date
  let offsetMs = 0

  window.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(RealDate.now() + offsetMs)
      return new RealDate(...args)
    }
    static now() {
      return RealDate.now() + offsetMs
    }
  }

  window.__advance = (minutes) => {
    offsetMs += minutes * 60 * 1000
    console.log('Novo horário:', new Date().toLocaleTimeString('pt-BR'))
  }

  window.__setClock = (hh, mm) => {
    const target = new RealDate()
    target.setHours(hh, mm, 0, 0)
    offsetMs = target.getTime() - RealDate.now()
    console.log('Novo horário:', new Date().toLocaleTimeString('pt-BR'))
  }

  window.__resetClock = () => {
    offsetMs = 0
    console.log('Horário real restaurado:', new Date().toLocaleTimeString('pt-BR'))
  }
})()
```

Uso no console:

- `__setClock(11, 29)` — pula direto para 11:29 (útil para ver a virada para o Almoço em 11:30)
- `__advance(60)` — avança 60 minutos a partir do horário atual simulado
- `__setClock(13, 59)` — testa a virada de 13:59 → 14:00 (reset do `R`)
- `__setClock(17, 59)` — testa a parada dos recorrentes e entrada do Banho às 18:00
- `__resetClock()` — volta ao horário real da máquina

Notas:

- A tela reage sozinha até 1 segundo depois de cada chamada (o `setInterval` do relógio continua rodando em tempo real; apenas o valor retornado por `new Date()` fica deslocado).
- Se `__setClock`/`__advance` for chamado **antes** de apertar Play, o `R` (horário de referência) já nasce no horário simulado — útil para testar cenários específicos de recorrência desde o início.
- Se o Play for pressionado primeiro e a simulação vier depois, `R` fica fixo no horário real do clique; apenas o "agora" avança, então os cálculos de tempo decorrido refletem o salto.
- `location.reload()` remove a sobrescrita do `Date` (volta ao normal) e também reseta o app para a tela de Play, como já é esperado pela spec.