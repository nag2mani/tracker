# 💠 Lumina — Expenditure Tracker & Bill Splitter

A premium, dark-mode fintech dashboard for tracking personal spending and
splitting group bills — with a Splitwise-style debt-simplification engine.
All state lives in LocalStorage, so it works instantly with zero backend.

<img width="1164" height="772" alt="Screenshot 2026-06-12 at 7 44 00 PM" src="https://github.com/user-attachments/assets/ded16ade-e4f2-44a2-bd3a-72a2f16676a5" />

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build                # type-check + production build
npm run lint                 # eslint
npx tsx scripts/verify.ts    # algorithm sanity checks (splits, debt simplification)
node scripts/screenshot.mjs  # headless-Chrome smoke test (dev server must be running)
```

## What's inside

- **Bento dashboard** — hero spending card with glowing personal/group split
  bar, net-balance card ("who owes you / you owe"), interactive donut ⇄ bar
  category analytics, recent activity feed.
- **Flawless filters** — sticky side panel; toggle by category (Grocery, Rent,
  Entertainment, Dining, Utilities, Others) and type (Personal / Group) with
  instant animated feedback. Filters flow into the dashboard analytics too.
- **Split mechanics** — equal (paise-exact remainder spreading), exact
  amounts, and percentage splits with live validation.
- **Debt simplification** — greedy max-creditor/max-debtor matching collapses
  the debt graph into the fewest possible payments (Σ balances = 0 invariant).
- **Settle Up drawer** — animated side drawer; marking a debt paid records a
  settlement and fires a confetti burst.
- **Seed data** — realistic INR expenses (rent splits, Goa trip, office
  lunches) load on first visit. The ↺ button in the header resets the demo.

## Architecture

```
src/
  lib/            pure domain logic (no React)
    types.ts        entities + category palette
    splitwise.ts    balances, simplification, split resolution/validation
    seed.ts         realistic demo dataset
    utils.ts        INR formatting, dates, ids
  store/
    store.tsx       reducer + LocalStorage persistence (key: lumina:data:v1)
    filters.tsx     filter state shared across views
  components/
    dashboard/      bento cards (hero, net balance, analytics, activity)
    expenses/       expense rows + add-expense drawer (split builder)
    settle/         settle-up drawer + confetti
    filters/        sticky filter panel
    ui/             drawer, avatars, animated money, category icons
  views/            Dashboard · Expenses · Groups
```
