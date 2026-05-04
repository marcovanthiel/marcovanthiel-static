# Contactformulier — Resend via Cloudflare Pages Function

Het contactformulier op `/contact/` (5 talen) verstuurt berichten via
**Resend** zonder externe form-service of CRM. Architecturaal is het
één bestand server-side en één in elke taal-content-file client-side.

## Architectuur

```
┌──────────────────┐         ┌─────────────────────────────┐         ┌──────────────┐
│ /contact/-pagina │         │ Cloudflare Pages Function   │         │ Resend API   │
│                  │         │ functions/api/contact.ts    │         │              │
│  <form>          │  POST   │                             │  POST   │              │
│  — name          │ ──────► │ - validate input            │ ──────► │ verstuurt    │
│  — email         │  JSON   │ - honeypot check            │         │ e-mail naar  │
│  — subject       │         │ - call Resend API           │ ◄────── │ marco@…      │
│  — message       │         │ - return JSON {ok, error?}  │         │              │
│  — website (hp)  │ ◄────── │                             │         └──────────────┘
└──────────────────┘ JSON    └─────────────────────────────┘
        │
        ├─ status pending  ("Bezig met verzenden…")
        ├─ status success  ("Bedankt — je bericht is verstuurd.")
        └─ status error    ("Er ging iets mis…")
```

## Server-side: `functions/api/contact.ts`

Cloudflare Pages Function die automatisch op `/api/contact` luistert.

**Invoer (POST JSON):**
```ts
{
  name: string,         // max 200 chars, required
  email: string,        // valid email format, max 320, required
  subject: string,      // max 300, required
  message: string,      // max 10000, required
  website: string,      // honeypot — moet leeg zijn
  lang: 'nl'|'en'|'de'|'it'|'cn'  // voor diagnose-header in mail
}
```

**Validatie:**
- Lege of te lange velden → 400 met error-string
- Ongeldig e-mailformat → 400
- Niet-leeg honeypot-veld → 200 OK + `skipped: 'spam'` (bot-vriendelijk: doet alsof het is verstuurd)

**Resend-call:**
- `from`: `RESEND_FROM` env (default `Marco van Thiel <no-reply@marcovanthiel.nl>`)
- `to`: `RESEND_TO` env (default `marco@marcovanthiel.nl`)
- `reply_to`: het ingevulde e-mailadres → antwoorden gaan direct terug naar de afzender
- Body: zowel `text/plain` als `text/html` versie, met IP/UA/Referer onderaan voor diagnose

**Foutpaden:**
- `RESEND_API_KEY` ontbreekt → 503 + duidelijke error
- Resend API faalt → 502 + generieke error (ware fout in `console.error` voor logs)

## Client-side: form in `content/<lang>/contact.md`

Inline `<form>` + `<script>` in markdown. Vereist `markup.goldmark.renderer.unsafe: true` in `config.yaml`.

**Vertaalde JS-meldingen** zitten in elk `contact.md` zelf (geen `i18n/` dependency — was simpler voor inline scripts).

**Honeypot** via `.hp-field` in `themes/marcotheme/assets/css/main.css`:
```css
.contact-form .hp-field {
  position: absolute !important;
  left: -10000px;
  width: 1px; height: 1px;
  overflow: hidden;
}
```

**Submit-flow:**
1. `form.checkValidity()` — native HTML5 validation
2. `fetch('/api/contact', { method: 'POST', body: JSON })`
3. Update status-div met success/error
4. Bij success: `form.reset()` en disable submit-knop

## Setup vanaf nul

### 1. Resend account
- Ga naar [resend.com](https://resend.com)
- Domein `marcovanthiel.nl` toevoegen, DNS-records (SPF + DKIM) zetten
- API-key genereren

### 2. Cloudflare Pages env-vars
Cloudflare Dashboard → Workers & Pages → marcovanthiel-static → Settings → Environment variables:

| Naam | Waarde | Production / Preview |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxx` | beide |

Optioneel:
- `RESEND_FROM` als de default afzender niet bevalt
- `RESEND_TO` als je naar een andere mailbox wil sturen

### 3. Test
- Ga naar `https://marcovanthiel.nl/contact/`
- Vul iets in en verstuur
- Check je mailbox + de "Reply"-knop moet direct het ingevulde adres pakken

## Spam-protectie

- **Honeypot**: 99% van de bots vult ALLE velden in, ook verborgen ones
- **Cloudflare WAF**: globale rate-limit en bot-bescherming op platform-niveau
- **Reply-to als bezoeker**: voorkomt impersonatie (afzender domain blijft no-reply@…)
- **Geen JS-ablation-bypass**: server valideert opnieuw, niet alleen client-side

## Onderhoud

- Resend free tier: 100 mails/dag, 3000/maand
- Een groei-grens halen we waarschijnlijk niet, maar als het wel:
  upgrade naar pro of switch naar SES/Postmark
- Logs zichtbaar in Cloudflare Pages Function-logs (Real-time logs tab)
