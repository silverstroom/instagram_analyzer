# Instagram Analyzer

Tool interno per analisi profili Instagram, in stile Not Just Analytics.
Due modalità d'uso:

- **Quick analysis** (gratuita per te): 2 request API, ~$0.0012 di costo.
  Restituisce follower, engagement rate, giorno/orario migliori, top hashtag.
- **Deep focus** (on-demand, tu confermi): analisi approfondita modulare con
  costo esatto calcolato in anticipo. Include 90 post storici, hashtag analysis,
  stories, audience quality, competitor discovery.

Stack: Next.js 14 (App Router), TypeScript, Tailwind, Supabase, HikerAPI, Recharts.

---

## Indice

1. [Setup locale](#setup-locale)
2. [Schema database](#schema-database)
3. [Variabili d'ambiente](#variabili-dambiente)
4. [Deploy su GitHub](#deploy-su-github)
5. [Deploy su Vercel](#deploy-su-vercel)
6. [Configurazione cron](#configurazione-cron)
7. [Costi e budget](#costi-e-budget)
8. [Architettura](#architettura)

---

## Setup locale

### Prerequisiti

- Node.js 18.17+ (consigliato 20+)
- Account [HikerAPI](https://hikerapi.com) (100 request gratis all'iscrizione)
- Progetto [Supabase](https://supabase.com) (piano Free è sufficiente)

### Installazione

```bash
git clone https://github.com/TUO-USERNAME/instagram-analyzer.git
cd instagram-analyzer
npm install
cp .env.example .env.local
```

Poi apri `.env.local` e inserisci le tue chiavi (vedi sezione [Variabili d'ambiente](#variabili-dambiente)).

### Avvio in sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

---

## Schema database

Nel tuo progetto Supabase, vai su **SQL Editor** e incolla il contenuto di
[`supabase/schema.sql`](./supabase/schema.sql), poi premi "Run".

Crea 6 tabelle e 1 view:

- `clients` — raggruppa profili in progetti
- `tracked_profiles` — profili monitorati giornalmente
- `profile_snapshots` — storico giornaliero (per grafici di crescita)
- `posts` — cache dei post analizzati
- `api_usage` — log di ogni analisi + costi
- `deep_focus_results` — storage analisi approfondite
- `monthly_budget_usage` (view) — aggregazione spesa mensile

---

## Variabili d'ambiente

Copia `.env.example` in `.env.local` e compila:

| Variabile | Dove ottenerla | Obbligatoria |
|---|---|---|
| `HIKERAPI_ACCESS_KEY` | [hikerapi.com](https://hikerapi.com) → Dashboard | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) | ✅ |
| `NEXT_PUBLIC_MONTHLY_BUDGET_CAP` | Budget massimo USD (default: 20) | — |
| `CRON_SECRET` | Stringa random ≥32 char per proteggere il cron | ✅ in produzione |
| `APP_ACCESS_PASSWORD` | (Opzionale) password per limitare accesso | — |

**Genera un CRON_SECRET sicuro:**
```bash
openssl rand -base64 32
```

---

## Deploy su GitHub

### Prima volta

```bash
# Inizializza repo
cd instagram-analyzer
git init
git add .
git commit -m "Initial commit"

# Crea repo su GitHub (via web o CLI)
gh repo create instagram-analyzer --private --source=. --remote=origin
# oppure manualmente: crea il repo su github.com e poi:
# git remote add origin https://github.com/TUO-USERNAME/instagram-analyzer.git
# git branch -M main

# Push
git push -u origin main
```

### Aggiornamenti successivi

```bash
git add .
git commit -m "Descrivi la modifica"
git push
```

### Best practice

- **Mai committare `.env.local`** (già escluso dal `.gitignore`)
- Usa branch per feature grandi: `git checkout -b feature/nome`
- Considera un workflow GitHub Actions per typecheck + lint (già predisposto)

---

## Deploy su Vercel

### Primo deploy

1. **Vai su [vercel.com/new](https://vercel.com/new)** e collega il tuo GitHub.
2. **Seleziona il repo** `instagram-analyzer`.
3. Vercel rileva automaticamente Next.js — non toccare i build settings.
4. **Aggiungi le variabili d'ambiente** nella sezione "Environment Variables".
   Copia TUTTE le variabili da `.env.local` tranne quelle locali.
   Imposta ciascuna per i 3 ambienti: Production, Preview, Development.
5. Clicca **Deploy**.

Dopo ~2 minuti il tuo tool sarà live su `https://instagram-analyzer-xxx.vercel.app`.

### Aggiungi un dominio custom (opzionale)

Vercel Dashboard → Progetto → Settings → Domains → Add.
Segui le istruzioni per puntare il tuo DNS su Vercel.

### Aggiornamenti futuri

Ogni push su `main` triggera un deploy automatico in produzione.
Ogni push su altri branch genera una preview URL — utile per testare modifiche.

### Troubleshooting deploy

**Errore "HIKERAPI_ACCESS_KEY non configurata"**
→ Hai dimenticato di aggiungere la variabile in Vercel → Settings → Environment Variables.

**Errore SSR/IndexedDB o simili**
→ In `next.config.mjs` abbiamo già escluso `@react-pdf/renderer` dal bundle client. Se aggiungi librerie browser-only, wrapale in `dynamic(() => import(...), { ssr: false })`.

**Build fallisce per TypeScript**
→ Esegui `npm run typecheck` in locale prima di pushare.

---

## Configurazione cron

Il file `vercel.json` definisce un cron job che gira **ogni giorno alle 06:00 UTC**:

```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 6 * * *" }]
}
```

Questo job:
1. Legge tutti i profili in `tracked_profiles`.
2. Per ciascuno, fa 1 request HikerAPI e salva un record in `profile_snapshots`.
3. Logga il costo aggregato in `api_usage`.

**Attenzione**: i cron Vercel funzionano solo su piani Hobby (1 cron/giorno) e Pro+ (ilimitato). Sul piano Free Hobby (attuale) hai diritto a 2 cron giornalieri max. Per tracking più granulare, considera il piano Pro.

**Modifiche allo schedule**:
- `0 6 * * *` = ogni giorno alle 06:00 UTC
- `0 */6 * * *` = ogni 6 ore
- Riferimento: [crontab.guru](https://crontab.guru)

### Test manuale del cron

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/snapshot
```

---

## Costi e budget

### Tariffa HikerAPI

**$0.0006 per request** ([fonte](https://hikerapi.com/pricing)), pay-as-you-go.

### Costi tipici

| Operazione | Request | Costo |
|---|---|---|
| Quick analysis | 2 | $0.0012 |
| Deep focus completa | 15–25 | $0.009–$0.015 |
| Snapshot giornaliero (per profilo) | 1 | $0.0006 |
| Mese con 50 profili trackati + 20 deep | ~1500+300 | ~$1.10 |

### Budget cap

La variabile `NEXT_PUBLIC_MONTHLY_BUDGET_CAP` (default $20) blocca le deep analysis
al raggiungimento del limite. Le quick analysis restano sempre attive.

Per cambiarlo in produzione: Vercel Dashboard → Settings → Environment Variables → modifica → Redeploy.

### Monitoraggio spesa

- UI: indicatore budget in alto a destra sulla home.
- SQL: `SELECT * FROM monthly_budget_usage;` nello SQL editor di Supabase.

---

## Architettura

```
┌─────────────────────────────────────────────────────┐
│  Next.js 14 App Router (Vercel)                     │
│                                                      │
│  Pages:                                              │
│   - / (home + search + tracked list)                │
│   - /dashboard/[username] (analisi profilo)         │
│                                                      │
│  API Routes:                                         │
│   - GET  /api/profiles/[username]  (quick)          │
│   - POST /api/deep-focus/estimate  (costo preview)  │
│   - POST /api/deep-focus           (execute)        │
│   - GET  /api/budget               (stato budget)   │
│   - POST /api/track                (tracking on)    │
│   - GET  /api/cron/snapshot        (daily, Vercel)  │
└────────────────┬────────────────────────────────────┘
                 │
    ┌────────────┴─────────────┐
    │                          │
┌───▼─────────┐   ┌────────────▼──────────────┐
│  HikerAPI   │   │  Supabase (PostgreSQL)     │
│  ($0.0006/  │   │  - profile_snapshots       │
│  request)   │   │  - posts                   │
└─────────────┘   │  - api_usage               │
                  │  - deep_focus_results      │
                  │  - tracked_profiles        │
                  └────────────────────────────┘
```

### Flusso Deep Focus (il cuore del tool)

1. Utente apre `/dashboard/nextfram`
2. La pagina fa Quick analysis (2 req API) e mostra metriche base
3. Utente seleziona moduli in `DeepFocusCard` (es. posts_90 + hashtag_analysis)
4. Click su "Calcola costo esatto" → chiama `/api/deep-focus/estimate`
5. L'endpoint fetcha il profilo e calcola il costo esatto modulo per modulo
6. UI mostra: "Questa analisi costa $0.0138 e consuma 23 request. Budget residuo: $16.58"
7. Utente conferma → `/api/deep-focus` esegue tutti i moduli
8. Risultati salvati in `deep_focus_results`, costo in `api_usage`

### Dove estendere

- **PDF report brandizzati**: scheletro in `lib/pdf/report-generator.tsx`, integrare con `@react-pdf/renderer`
- **Auth multi-user**: abilitare Supabase Auth + RLS
- **Multi-tenant clienti**: usare `clients.id` per scoping automatico dei dati
- **Export dati**: endpoint per CSV/JSON dump dei `profile_snapshots`

---

## Licenza

Uso interno. Non redistribuire.
