# OpenChurch

Open source tools for local churches: service run-of-show for leaders, then modules for worship, slides, translations, and more.

- **Site:** [openchurch.dev](https://openchurch.dev)
- **License:** MIT (see [LICENSE](LICENSE))

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/web` | Marketing landing (Next.js, port **3488** locally) |
| `apps/app` | Church app: account, plan, live view (Next.js, port **3492** locally) |
| `apps/admin` | Operator panel (Next.js, port **3493** locally, `admin.openchurch.dev`) |
| `apps/design` | Brand manual in Storybook (port **3489** locally, `design.openchurch.dev`) |
| `packages/db` | Postgres schema (Drizzle) shared by the app |

## App

```bash
docker compose up -d
cp .env.example apps/app/.env.local
pnpm db:push
pnpm dev:app
```

Open [http://localhost:3492](http://localhost:3492). Set `BETTER_AUTH_SECRET` in `apps/app/.env.local` before the first run.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3488](http://localhost:3488).

Brand manual:

```bash
pnpm dev:design
```

Open [http://localhost:3489](http://localhost:3489).

## DNS

Domain registrar: GoDaddy. DNS zone: Vercel. See [docs/dns.md](docs/dns.md).

## Vision

Free for church use, sustained by donations. Mobile and web clients, optional separate modules under the openchurch.dev brand.
