# LEUCHTTURM - Security & Deployment Hardening V1

Vollständige Ersatzdateien bzw. neue Dateien für das bestehende Astro-Projekt.

## Enthalten
- `src/pages/api/project-request.ts`
  - Origin-Prüfung
  - In-Memory Rate Limit als zusätzliche Schutzschicht
  - Request-Größenprüfung
  - MIME-Allowlist + Magic-Byte-Prüfung für JPEG, PNG, WebP und PDF
  - keine Kundendateinamen mehr im Log
  - keine internen Fehlermeldungen mehr im Browser
  - kein localhost-Redirect mehr
- `src/lib/microsoft/mail.ts`
  - 15-Sekunden-Timeout für Microsoft Graph
  - begrenzte Fehlerausgabe
- `src/lib/microsoft/graph.ts`
  - 10-Sekunden-Timeout beim Tokenabruf
  - Token-Cache bleibt bestehen
- `src/layouts/BaseLayout.astro`
  - `STAGING=true` erzeugt automatisch `noindex, nofollow, noarchive`
- `src/pages/robots.txt.ts`
  - Staging: `Disallow: /`
  - Produktion: `Allow: /`
- `src/middleware.ts`
  - nosniff
  - Referrer-Policy
  - X-Frame-Options DENY
  - Permissions-Policy
  - HSTS bei HTTPS
  - X-Robots-Tag bei Staging
- `package.json`
  - produktionsrichtiger Startbefehl für `@astrojs/node` standalone
  - `npm run build:staging`

## Mittwald-Umgebungsvariablen fuer Staging
- `STAGING=true`
- `ALLOWED_FORM_ORIGINS=https://neu.stadter-kamin.de`
- `MS_TENANT_ID=...`
- `MS_CLIENT_ID=...`
- `MS_CLIENT_SECRET=...`
- `MS_MAILBOX=...`
- `PROJECT_REQUEST_RECIPIENT=...`

Secrets niemals in Git committen.

## Lokal testen
```bash
npm install
npm run build:staging
npm run start
```

## Rate Limit
Das In-Memory-Limit ist Defense-in-Depth fuer den aktuell vorgesehenen einzelnen Node-Prozess.
Fuer den spaeteren Livebetrieb sollte zusaetzlich ein externes Rate Limit/WAF vor die API,
z. B. ueber Cloudflare, damit der Schutz auch bei mehreren Instanzen und Neustarts erhalten bleibt.

GitHub und Mittwald wurden durch dieses Paket nicht veraendert.
