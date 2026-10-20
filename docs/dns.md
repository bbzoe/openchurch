# DNS: openchurch.dev (GoDaddy → Vercel)

Domena jest zarejestrowana w **GoDaddy**. Strefa DNS jest w **Vercel** (konto: Bartek Bilicki's projects).

## Co musisz zrobić w GoDaddy (jednorazowo)

1. Zaloguj się na [godaddy.com](https://www.godaddy.com) → **Moje produkty** → **openchurch.dev** → **Zarządzaj DNS** / **Nameservers**.
2. Wybierz **Zmień nameserwery** (Custom nameservers).
3. Ustaw dokładnie:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
4. Zapisz. Propagacja zwykle trwa od kilku minut do 48 h.

Po propagacji Vercel ustawi rekordy dla apex (`openchurch.dev`) i możesz dodać `www` w panelu Vercel, jeśli potrzebujesz.

## Weryfikacja

```bash
dig NS openchurch.dev +short
# powinno pokazać ns1.vercel-dns.com i ns2.vercel-dns.com
```

Status domeny w Vercel: [Domains](https://vercel.com/bartek-bilickis-projects/openchurch/settings/domains) (po utworzeniu projektu).

## Uwaga o MCP GoDaddy

Oficjalny serwer MCP GoDaddy obsługuje tylko **wyszukiwanie i dostępność** domen (read-only). Zmiany DNS nadal robisz w panelu GoDaddy lub przez API z kluczami produkcyjnymi (poza zakresem tego repo).
