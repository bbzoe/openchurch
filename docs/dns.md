# DNS: openchurch.dev (GoDaddy → Vercel)

Domena jest zarejestrowana w **GoDaddy**. Strefa DNS jest w **Vercel** (konto: Bartek Bilicki's projects).

## Status (2026-10-20)

Nameserwery ustawione w GoDaddy (CLI `gddy`) na:

- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Vercel: strefa DNS aktywna, projekt **openchurch** ma `openchurch.dev` i `www` → redirect na apex.

Poddomena **design.openchurch.dev** jest osobnym projektem Vercel `openchurch-design` (Storybook z brand manualem). Nie podpinaj jej do projektu strony `openchurch`.

Po zmianie NS certyfikat HTTPS na edge może dojść z opóźnieniem (zwykle minuty, czasem do ~1 h). Lokalny resolver macOS czasem trzyma stare rekordy GoDaddy; wtedy pomaga odświeżenie cache DNS lub test przez `dig @8.8.8.8`.

## Ręczna zmiana w GoDaddy (gdyby trzeba było powtórzyć)

1. [godaddy.com](https://www.godaddy.com) → **openchurch.dev** → **Nameservers** → Custom.
2. `ns1.vercel-dns.com` i `ns2.vercel-dns.com`.

## Weryfikacja

```bash
dig NS openchurch.dev +short
# powinno pokazać ns1.vercel-dns.com i ns2.vercel-dns.com
```

Status domeny w Vercel: [Domains](https://vercel.com/bartek-bilickis-projects/openchurch/settings/domains) (po utworzeniu projektu).

## Uwaga o MCP GoDaddy

Oficjalny serwer MCP GoDaddy obsługuje tylko **wyszukiwanie i dostępność** domen (read-only). Zmiany DNS nadal robisz w panelu GoDaddy lub przez API z kluczami produkcyjnymi (poza zakresem tego repo).
