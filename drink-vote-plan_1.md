# Drink Voting App — Project Plan

**Stack:** GitHub Pages (frontend) · Railway (backend API) · AWS DynamoDB (database) · GitHub Actions (CI/CD)

---

## 1. Project Overview

A party voting web app where guests rate drinks across four categories (rum, gin, bourbon, spritz). Each drink has a name, photo, ingredients list, and a 1–5 star rating with an optional comment. Votes are persisted to DynamoDB. An `/admin` page shows live averaged results.

---

## 2. Repository Structure

```
drink-vote/
├── frontend/
│   ├── index.html              # Entry page (name input)
│   ├── vote.html               # Main voting page
│   ├── drink.html              # Single-drink detail page
│   ├── admin.html              # Admin results page
│   ├── scss/
│   │   ├── _variables.scss     # Colors, fonts, spacing tokens
│   │   ├── _reset.scss         # Normalize / box-sizing
│   │   ├── _typography.scss    # Headings, body, links
│   │   ├── _layout.scss        # Page shell, grid, containers
│   │   ├── _components.scss    # Cards, stars, buttons, inputs
│   │   ├── _drink-card.scss    # Drink card specific styles
│   │   ├── _admin.scss         # Admin results view styles
│   │   └── main.scss           # @use imports all partials
│   ├── css/
│   │   └── main.css            # Compiled output (git-ignored; CI compiles)
│   ├── js/
│   │   ├── config.js           # API base URL, drink data definitions
│   │   ├── api.js              # Fetch wrappers for all API calls
│   │   ├── state.js            # In-memory vote state management
│   │   ├── ui.js               # DOM helpers, star renderer, card builder
│   │   ├── entry.js            # Entry page logic
│   │   ├── vote.js             # Main voting page logic
│   │   ├── drink.js            # Single drink detail page logic
│   │   └── admin.js            # Admin page logic
│   └── assets/
│       └── drinks/             # Drink photos (jpeg, 800×600 min)
│           ├── rum-1.jpg
│           └── ...
├── backend/
│   ├── src/
│   │   ├── server.js           # Express entry point
│   │   ├── routes/
│   │   │   ├── votes.js        # POST /votes, GET /votes/:drinkId
│   │   │   └── results.js      # GET /results (aggregated)
│   │   ├── db/
│   │   │   └── dynamo.js       # DynamoDB client + helpers
│   │   └── middleware/
│   │       └── cors.js         # CORS config (allow Pages origin)
│   ├── package.json
│   └── .env.example            # AWS_REGION, TABLE_NAME, PORT
└── .github/
    └── workflows/
        ├── deploy-frontend.yml # Compile SCSS → Pages on push to main
        └── deploy-backend.yml  # Deploy backend to Railway on push to main
```

---

## 3. Drink Data

Defined statically in `frontend/js/config.js` as a JS array. No CMS needed. To add/edit drinks, update this file and redeploy.

```js
// frontend/js/config.js
export const API_BASE = import.meta.env?.VITE_API_URL ?? 'https://your-app.railway.app';

export const DRINKS = [
  {
    id: 'rum-1',
    category: 'rum',
    name: 'Dark & Stormy',
    photo: 'assets/drinks/rum-1.jpg',
    description: 'A classic rum-based cocktail with ginger beer and lime.',
    ingredients: ['2oz dark rum', 'Ginger beer', 'Lime juice', 'Lime wedge'],
  },
  {
    id: 'rum-2',
    category: 'rum',
    name: 'Jungle Bird',
    photo: 'assets/drinks/rum-2.jpg',
    description: 'A tropical rum cocktail with Campari and pineapple.',
    ingredients: ['1.5oz dark rum', '0.75oz Campari', 'Pineapple juice', 'Lime juice', 'Simple syrup'],
  },
  // Add 1–2 more per category as needed
  {
    id: 'gin-1',
    category: 'gin',
    name: "Bee's Knees",
    photo: 'assets/drinks/gin-1.jpg',
    description: 'A classic gin cocktail with honey syrup and lemon juice.',
    ingredients: ['2oz gin', 'Honey syrup', 'Lemon juice'],
  },
  {
    id: 'bourbon-1',
    category: 'bourbon',
    name: 'Old Fashioned',
    photo: 'assets/drinks/bourbon-1.jpg',
    description: 'A classic bourbon cocktail with sugar, bitters, and orange peel.',
    ingredients: ['2oz bourbon', 'Sugar cube', 'Angostura bitters', 'Orange peel'],
  },
  {
    id: 'spritz-1',
    category: 'spritz',
    name: 'Aperol Spritz',
    photo: 'assets/drinks/spritz-1.jpg',
    description: 'A refreshing aperitif with Prosecco, Aperol, and soda water.',
    ingredients: ['3oz Prosecco', '2oz Aperol', '1oz soda water', 'Orange slice'],
  },
  // ...
];

export const CATEGORIES = [
  { id: 'rum',     label: 'Rum Drinks' },
  { id: 'gin',     label: 'Gin Drinks' },
  { id: 'bourbon', label: 'Bourbon Drinks' },
  { id: 'spritz',  label: 'Spritz' },
];
```

---

## 4. DynamoDB Schema

**Table name:** `DrinkVotes`  
**Free tier:** 25 WCU / 25 RCU / 25 GB — your party will use a trivial fraction of this.

### Primary Key Design

| Attribute     | Type   | Role                     |
|---------------|--------|--------------------------|
| `pk`          | String | Partition key: `DRINK#<drinkId>` |
| `sk`          | String | Sort key: `VOTE#<voterName>#<timestamp>` |

### Item Attributes

```json
{
  "pk":        "DRINK#rum-1",
  "sk":        "VOTE#Alice#1718200000000",
  "voterName": "Alice",
  "drinkId":   "rum-1",
  "rating":    4,
  "comment":   "Really smooth!",
  "createdAt": "2025-06-01T20:00:00Z"
}
```

### Access Patterns

| Pattern | Operation |
|---------|-----------|
| Submit a vote | `PutItem` |
| Get all votes for a drink | `Query` on `pk = DRINK#<id>` |
| Get all votes (admin) | `Scan` (small dataset, fine for 10 people) |
| Update an existing vote | `PutItem` with same `sk` (overwrites) |

> **Re-voting:** When a user changes their rating, the frontend sends the same `voterName`. The backend uses `PutItem` with the same `sk` — this is a clean overwrite. No deletion required.

---

## 5. API Contract

**Base URL:** `https://your-app.railway.app`

All responses: `Content-Type: application/json`

---

### `POST /votes`

Submit or update a single vote.

**Request body:**
```json
{
  "drinkId":   "rum-1",
  "voterName": "Alice",
  "rating":    4,
  "comment":   "Really smooth!"
}
```

**Success `200`:**
```json
{ "ok": true }
```

**Validation errors `400`:**
```json
{ "error": "rating must be 1–5" }
```

---

### `POST /votes/batch`

Submit all votes at once from the main voting page.

**Request body:**
```json
{
  "voterName": "Alice",
  "votes": [
    { "drinkId": "rum-1", "rating": 4, "comment": "Smooth" },
    { "drinkId": "gin-1", "rating": 5, "comment": "" }
  ]
}
```

**Success `200`:**
```json
{ "ok": true, "saved": 2 }
```

---

### `GET /votes/:drinkId`

Get all individual votes for a drink (used on drink detail page and admin).

**Response `200`:**
```json
{
  "drinkId": "rum-1",
  "votes": [
    { "voterName": "Alice", "rating": 4, "comment": "Smooth", "createdAt": "..." },
    { "voterName": "Bob",   "rating": 3, "comment": "",        "createdAt": "..." }
  ]
}
```

---

### `GET /results`

Aggregated results for all drinks (admin view).

**Response `200`:**
```json
{
  "results": [
    {
      "drinkId":     "rum-1",
      "average":     3.8,
      "voteCount":   5,
      "comments":    ["Smooth", "A bit sweet"],
      "breakdown":   { "1": 0, "2": 1, "3": 1, "4": 2, "5": 1 }
    }
  ]
}
```

---

## 6. Frontend Pages

### 6.1 Entry Page (`index.html`)

- Full-screen centered layout
- Text input: "Your name"
- "Enter" button
- On submit: saves `voterName` to `sessionStorage`, redirects to `vote.html`
- Validates non-empty name before redirect

---

### 6.2 Main Voting Page (`vote.html`)

- Reads `voterName` from `sessionStorage`; redirects to `index.html` if missing
- Four category sections (rum, gin, bourbon, spritz) with a heading each
- Each drink renders as a **DrinkCard** (see component spec below)
- "Submit All Votes" button at bottom — calls `POST /votes/batch`
- After submit: shows confirmation toast, button becomes "Update Votes"
- Voted state is held in `state.js` — cards stay editable for changes

**DrinkCard component (rendered by `ui.js`):**
```
┌─────────────────────────────────────────┐
│  [Photo 300×200]                        │
│  Drink Name                             │
│  Ingredients: item · item · item        │
│  ★ ★ ★ ☆ ☆   [Rate this]              │
│  Comment: [___________________________] │
│  [Submit this drink] ← individual CTA   │
└─────────────────────────────────────────┘
```

- Stars are interactive (hover + click)
- "Submit this drink" calls `POST /votes` for that drink only
- Both submission paths (individual + batch) update the same state

---

### 6.3 Drink Detail Page (`drink.html?id=rum-1`)

- Reads `id` from query string, looks up drink in `config.js`
- Large photo, name, full ingredients list
- Star rating widget
- Comment textarea
- "Submit Vote" button → `POST /votes`
- Shows existing vote if `voterName` already voted (pre-fills fields)
- "← Back to all drinks" link

---

### 6.4 Admin Page (`admin.html`)

- No auth — access via shared URL
- Same DrinkCard layout as vote page, but **read-only**
- Below each card: average rating displayed as stars + numeric `(3.8 / 5 · 7 votes)`
- Comment thread: list of `voterName: comment` entries (non-empty only)
- Rating breakdown bar chart (pure CSS, no library needed)
- Auto-refreshes every 30 seconds via `setInterval`

---

## 7. JavaScript Module Responsibilities

| File | Responsibility |
|------|---------------|
| `config.js` | Drink definitions, category list, API base URL |
| `api.js` | `submitVote()`, `submitBatch()`, `getVotes()`, `getResults()` — all fetch calls |
| `state.js` | Holds `{ [drinkId]: { rating, comment } }` in memory; read/write helpers |
| `ui.js` | `renderCard()`, `renderStars()`, `renderAdminCard()`, toast notifications |
| `entry.js` | Name form submit handler, sessionStorage write, redirect |
| `vote.js` | Renders all categories + cards; wires batch submit button |
| `drink.js` | Single drink view; reads query param; pre-fills existing vote |
| `admin.js` | Fetches `/results`; renders admin cards; sets up refresh interval |

---

## 8. SCSS Architecture

```scss
// main.scss
@use 'variables';   // --color-*, --font-*, --space-*
@use 'reset';
@use 'typography';
@use 'layout';
@use 'components';  // buttons, inputs, toasts
@use 'drink-card';
@use 'admin';
```

**Token examples (`_variables.scss`):**
```scss
// Colors
$color-bg:       #1a1a2e;
$color-surface:  #16213e;
$color-accent:   #e94560;
$color-star:     #f5a623;
$color-text:     #eaeaea;

// Spacing
$space-sm: 8px;
$space-md: 16px;
$space-lg: 32px;

// Typography
$font-display: 'Playfair Display', serif;
$font-body:    'DM Sans', sans-serif;
```

---

## 9. Backend (`backend/`)

**Runtime:** Node.js 20 · Express 4 · `@aws-sdk/client-dynamodb` v3

### `server.js`
- Loads env vars
- Mounts `/votes` and `/results` routers
- Applies CORS middleware (allow `https://<username>.github.io`)
- Listens on `process.env.PORT` (Railway sets this automatically)

### `db/dynamo.js`
- Exports a configured `DynamoDBDocumentClient`
- Exports helpers: `putVote(item)`, `queryVotes(drinkId)`, `scanAllVotes()`

### Environment Variables (`.env.example`)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMO_TABLE=DrinkVotes
PORT=3000
CORS_ORIGIN=https://<username>.github.io
```

---

## 10. GitHub Actions Workflows

### `deploy-frontend.yml`

Trigger: push to `main`, paths `frontend/**`

Steps:
1. `actions/checkout`
2. `node setup` → `npm install -g sass`
3. `sass frontend/scss/main.scss frontend/css/main.css --style=compressed`
4. `actions/upload-pages-artifact` with `path: frontend/`
5. `actions/deploy-pages`

Required repo settings: Settings → Pages → Source: **GitHub Actions**

---

### `deploy-backend.yml`

Trigger: push to `main`, paths `backend/**`

Steps:
1. `actions/checkout`
2. `railwayapp/railway-action@v2` — deploys `backend/` directory to Railway

Required secrets: `RAILWAY_TOKEN` (get from Railway dashboard)

Railway reads env vars from its dashboard (set `AWS_*`, `DYNAMO_TABLE`, `CORS_ORIGIN` there — never commit secrets).

---

## 11. DynamoDB Setup (One-Time)

1. Create AWS account (free tier, no credit card charge for this usage)
2. Create DynamoDB table `DrinkVotes`:
   - Partition key: `pk` (String)
   - Sort key: `sk` (String)
   - Capacity: **On-demand** (free tier covers it; no provisioning math needed)
3. Create IAM user `drink-vote-api` with policy:
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "dynamodb:PutItem",
       "dynamodb:Query",
       "dynamodb:Scan"
     ],
     "Resource": "arn:aws:dynamodb:us-east-1:*:table/DrinkVotes"
   }
   ```
4. Generate access keys → paste into Railway environment variables

---

## 12. Railway Setup (One-Time)

1. Create Railway account → New Project → Deploy from GitHub repo
2. Set root directory to `backend/`
3. Add environment variables (see §9)
4. Copy the generated domain (e.g. `https://drink-vote.railway.app`)
5. Paste that URL into `frontend/js/config.js` as `API_BASE`

---

## 13. Local Development

```bash
# Frontend — no build step needed for dev; open directly
open frontend/vote.html

# Or with live-reload
npx live-server frontend/

# Compile SCSS watch
sass --watch frontend/scss/main.scss:frontend/css/main.css

# Backend
cd backend
cp .env.example .env   # fill in real AWS creds
npm install
npm run dev            # nodemon src/server.js
```

---

## 14. Sharing the App

1. Push to `main` → GitHub Actions deploys frontend to Pages automatically
2. Your Pages URL: `https://<username>.github.io/drink-vote/`
3. Shorten with TinyURL or bit.ly
4. Share `/admin` separately: `https://<username>.github.io/drink-vote/admin.html`

---

## 15. Drink Photos

- Recommended: 800×600px, JPEG, <200KB each
- Name files to match `config.js` IDs: `rum-1.jpg`, `gin-1.jpg`, etc.
- Free sources: Unsplash (`unsplash.com/s/photos/cocktail`), Pexels
- Place in `frontend/assets/drinks/`

---

## 16. Implementation Order

1. **DynamoDB + IAM** — create table and user (15 min)
2. **Backend** — `server.js`, routes, dynamo helpers, test locally with Postman
3. **Railway** — deploy backend, verify endpoints return JSON
4. **`config.js`** — add all drink definitions and photos
5. **SCSS tokens + reset** — establish design system
6. **Entry page** — simplest page, good warm-up
7. **Vote page** — main page; build `ui.js` helpers here
8. **Admin page** — reuses vote page components, adds results overlay
9. **Drink detail page** — mostly reuses existing pieces
10. **GitHub Actions** — wire up both workflows, test end-to-end deploy

---

## 17. Cost Estimate

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|---------------|------|
| DynamoDB | 25 WCU/RCU, 25GB forever | ~200 writes, ~500 reads | **$0** |
| GitHub Pages | Unlimited for public repos | ~5MB static site | **$0** |
| Railway | $5 free credit/month | Tiny Express app | **$0** |
| GitHub Actions | 2,000 min/month | ~5 min per deploy | **$0** |
| **Total** | | | **$0** |
