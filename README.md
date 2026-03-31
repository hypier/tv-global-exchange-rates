# Global Exchange Rates

**预览网站**: https://forex.tradingviewapi.com/

Global Exchange Rates is a modern TradingView-style forex and market dashboard built with Next.js. It provides a polished interface for browsing live exchange-rate data, market rankings, currency conversion, news, calendar views, and other related tools powered by the TradingView Data API on RapidAPI.

## Highlights

- Real-time forex and market data UI
- Bring-your-own-key (BYOK) API workflow
- TradingView-powered market data integration
- Currency converter and quick query tools
- Market rankings and leaderboard views
- Calendar, heatmap, and news pages
- Responsive dashboard layout for desktop and mobile

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Framer Motion
- Headless UI
- Lucide React

## How API Access Works

This app is designed around a BYOK model:

- You provide your own RapidAPI key for the TradingView Data API
- The key is stored in the browser via `localStorage`
- Client-side requests are sent directly to the TradingView Data API endpoint on RapidAPI
- No server-side secret management is included in this app by default

Current local storage key:

```text
tradingview_api_key_v2
```

Validation is performed against:

```text
https://tradingview-data1.p.rapidapi.com/health
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the development server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

### 3. Add your API key

After the app loads:

- Open the settings modal
- Paste your RapidAPI key for the TradingView Data API
- Let the app validate the key
- Start exploring the dashboard pages

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Main Pages

- `/` - Landing dashboard with market widgets and quick rate query
- `/rankings` - Market and leaderboard views
- `/query` - Direct symbol or data queries
- `/converter` - Currency conversion tools
- `/calendar` - Calendar-oriented market data view
- `/heatmap` - Heatmap visualization
- `/news` - News interface

## Project Structure

```text
src/
  app/
    page.tsx
    rankings/
    query/
    converter/
    calendar/
    heatmap/
    news/
  components/
    layout/
  config/
    currencies.ts
  contexts/
    ApiKeyContext.tsx
    QueryProvider.tsx
  hooks/
    useTradingApi.ts
  lib/
    utils.ts
```

## Notes for Development

- API requests depend on a valid RapidAPI key being present in local storage
- This project is centered around TradingView market data consumption via RapidAPI
- Data fetching is handled with TanStack Query
- Animations and transitions are implemented with Framer Motion
- The UI is optimized for a dashboard-style trading experience

## Security Note

Because this project currently uses a client-side BYOK approach, API keys are managed in the browser instead of on a backend. That is convenient for local tools and personal dashboards, but if you plan to ship this to end users, you should review whether a server-side proxy or stronger key-handling strategy is more appropriate.

## License

Add your preferred license information here if this project is intended for public distribution.
