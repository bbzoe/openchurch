# OpenChurch

Open source tools for local churches: service run-of-show for leaders, then modules for worship, slides, translations, and more.

- **Site:** [openchurch.dev](https://openchurch.dev)
- **License:** MIT (see [LICENSE](LICENSE))

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/web` | Marketing landing and future web app (Next.js, port **3488** locally) |
| `apps/design` | Brand manual in Storybook (port **3489** locally, `design.openchurch.dev`) |

More apps and shared packages will live under `apps/` and `packages/` as the project grows.

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
