/**
 * Cloudflare Pages Function — POST /api/klank/reserve
 *
 * Reserveert kaarten voor het MidzomerConcert van Vocaal Ensemble Klank
 * (21 juni 2026, Remonstrantse kerk Bussum). Slaat de reservering op in
 * de D1-database KLANK_DB en stuurt een bevestigingsmail via Resend.
 *
 * Bindings/secrets in Cloudflare Pages:
 *   - D1 binding:        KLANK_DB           (database "klank")
 *   - env var (secret):  RESEND_API_KEY     (gedeeld met /api/contact)
 *   - env var (optional): RESEND_FROM       (default: "Vocaal Ensemble Klank <no-reply@marcovanthiel.nl>")
 *   - env var (optional): KLANK_BCC         (default: marco@marcovanthiel.nl — krijgt copy van iedere reservering)
 */

interface Env {
  KLANK_DB: D1Database;
  RESEND_API_KEY: string;
  RESEND_FROM?: string;
  KLANK_BCC?: string;
}

interface ReservePayload {
  naam?: string;
  woonplaats?: string;
  email?: string;
  aantal?: number;
  website?: string; // honeypot
}

const PRIJS_CENT = 1700; // € 17,00 per kaart
const CONCERT_ID = 'midzomer-2026';
const CONCERT_LABEL = 'MidzomerConcert · 21 juni 2026 · 14.30 uur';
const CONCERT_LOCATIE = 'Remonstrantse kerk, Koningslaan 2, Bussum';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEuro(cent: number): string {
  return '€ ' + (cent / 100).toFixed(2).replace('.', ',');
}

/**
 * Korte, leesbare referentie zoals "K-7M3X-A4". Gebaseerd op
 * crypto.randomUUID()-bytes — uniek genoeg voor een concert van
 * een paar honderd reserveringen.
 */
function makeReference(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '').toUpperCase();
  return 'K-' + uuid.slice(0, 4) + '-' + uuid.slice(4, 6);
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    return await handleReserve(ctx);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('klank/reserve crashed:', detail);
    return jsonResponse({ ok: false, error: `Server-fout: ${detail}` }, 500);
  }
};

async function handleReserve({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: 'Mailing service is niet geconfigureerd.' }, 503);
  }
  if (!env.KLANK_DB) {
    return jsonResponse({ ok: false, error: 'Reserveringsdatabase is niet geconfigureerd.' }, 503);
  }

  let payload: ReservePayload;
  try {
    payload = (await request.json()) as ReservePayload;
  } catch {
    return jsonResponse({ ok: false, error: 'Ongeldige aanvraag.' }, 400);
  }

  // Honeypot — bot-vroege uitstap met fake-success.
  if (payload.website && payload.website.trim() !== '') {
    return jsonResponse({ ok: true, skipped: 'spam', ref: 'SPAM' });
  }

  const naam = (payload.naam ?? '').trim();
  const woonplaats = (payload.woonplaats ?? '').trim();
  const email = (payload.email ?? '').trim().toLowerCase();
  const aantal = Number.isFinite(payload.aantal) ? Math.floor(payload.aantal as number) : 0;

  // Validatie.
  if (!naam || naam.length > 200) {
    return jsonResponse({ ok: false, error: 'Vul je naam in.' }, 400);
  }
  if (!woonplaats || woonplaats.length > 120) {
    return jsonResponse({ ok: false, error: 'Vul je woonplaats in.' }, 400);
  }
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ ok: false, error: 'E-mailadres ongeldig.' }, 400);
  }
  if (aantal < 1 || aantal > 10) {
    return jsonResponse({ ok: false, error: 'Aantal kaarten moet tussen 1 en 10 zijn.' }, 400);
  }

  const ref = makeReference();
  const bedragCent = aantal * PRIJS_CENT;
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ua = request.headers.get('user-agent') ?? '';

  // Insert in D1. Bij een UNIQUE-conflict op ref proberen we één keer
  // opnieuw — onmogelijk klein, maar netjes om af te vangen.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await env.KLANK_DB.prepare(
        `INSERT INTO reservaties
           (ref, concert, naam, woonplaats, email, aantal, bedrag_cent, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(ref, CONCERT_ID, naam, woonplaats, email, aantal, bedragCent, ip, ua)
        .run();
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 0 && /UNIQUE.+ref/i.test(msg)) {
        // Genereer nieuwe ref en probeer opnieuw.
        continue;
      }
      console.error('D1 insert failed:', msg);
      return jsonResponse({ ok: false, error: 'Reservering kon niet worden opgeslagen.' }, 500);
    }
  }

  // ── Bevestigingsmail ──────────────────────────────────────────────
  const fromAddress =
    env.RESEND_FROM || 'Vocaal Ensemble Klank <no-reply@marcovanthiel.nl>';
  const bccAddress = env.KLANK_BCC || 'marco@marcovanthiel.nl';

  const subject = `Bevestiging — ${aantal} kaart${aantal === 1 ? '' : 'en'} MidzomerConcert 21 juni`;

  const plain = [
    `Beste ${naam},`,
    '',
    'Bedankt voor je reservering voor het MidzomerConcert van',
    'Vocaal Ensemble Klank.',
    '',
    '────────────────────────────────────────────',
    `  Datum:    zondag 21 juni 2026, 14.30 uur`,
    `  Locatie:  Remonstrantse kerk`,
    `            Koningslaan 2, Bussum`,
    `  Kaarten:  ${aantal}`,
    `  Bedrag:   ${formatEuro(bedragCent)} (€ 17,00 per kaart)`,
    `  Betaling: aan de deur (contant of via betaalverzoek)`,
    `  Ref:      ${ref}`,
    '────────────────────────────────────────────',
    '',
    'Deze mail is je toegangsbewijs. Neem hem geprint of digitaal mee',
    'naar de kerk — we strepen je af op de gastenlijst aan de deur.',
    '',
    'Inloop vanaf 14.00 uur. Het concert duurt ongeveer een uur,',
    'zonder pauze.',
    '',
    'Tot 21 juni!',
    'Vocaal Ensemble Klank',
    '',
    '— Vragen? Antwoord op deze mail of mail klank@marcovanthiel.nl.',
  ].join('\n');

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.55;">
      <p>Beste ${escapeHtml(naam)},</p>
      <p>Bedankt voor je reservering voor het <strong>MidzomerConcert</strong> van Vocaal Ensemble Klank.</p>

      <table style="width:100%; border-collapse: collapse; margin: 1.4em 0; background: #faf8f3; border: 1px solid #d8d1bd;">
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9; width: 110px; color: #6b6b6b;">Datum</td><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9;"><strong>zondag 21 juni 2026</strong> · 14.30 uur</td></tr>
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9; color: #6b6b6b;">Locatie</td><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9;">Remonstrantse kerk<br>Koningslaan 2, Bussum</td></tr>
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9; color: #6b6b6b;">Kaarten</td><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9;"><strong>${aantal}</strong></td></tr>
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9; color: #6b6b6b;">Bedrag</td><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9;"><strong>${formatEuro(bedragCent)}</strong> <span style="color:#6b6b6b">(€ 17,00 per kaart)</span></td></tr>
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9; color: #6b6b6b;">Betaling</td><td style="padding: 10px 14px; border-bottom: 1px solid #ebe6d9;">aan de deur — contant of via betaalverzoek</td></tr>
        <tr><td style="padding: 10px 14px; color: #6b6b6b;">Referentie</td><td style="padding: 10px 14px; font-family: 'SFMono-Regular', Menlo, monospace; letter-spacing: 0.05em;">${escapeHtml(ref)}</td></tr>
      </table>

      <p style="background: #f5f2eb; padding: 12px 16px; border-left: 3px solid #b08a3e; margin: 1.4em 0;">
        <strong>Deze mail is je toegangsbewijs.</strong><br>
        Neem hem geprint of digitaal mee naar de kerk — we strepen je af op de gastenlijst aan de deur.
      </p>

      <p>Inloop vanaf 14.00 uur. Het concert duurt ongeveer een uur, zonder pauze.</p>
      <p style="margin-top: 1.6em;">Tot 21 juni!<br><em>Vocaal Ensemble Klank</em></p>
      <hr style="border: none; border-top: 1px solid #ebe6d9; margin: 2em 0 1em;">
      <p style="color: #888; font-size: 0.9em;">Vragen? Antwoord op deze mail of mail <a href="mailto:klank@marcovanthiel.nl">klank@marcovanthiel.nl</a>.</p>
    </div>
  `;

  // Mail versturen. Bij Resend-fout: wel insert behouden (we hebben
  // de reservering al opgeslagen) maar de bezoeker krijgt een nette
  // foutmelding zodat ze opnieuw of via mail kunnen reageren.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  let resendOk = false;
  let resendError = '';
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        bcc: bccAddress ? [bccAddress] : undefined,
        reply_to: 'klank@marcovanthiel.nl',
        subject,
        text: plain,
        html,
      }),
      signal: controller.signal,
    });

    if (resendRes.ok) {
      resendOk = true;
    } else {
      const txt = await resendRes.text();
      resendError = `Resend ${resendRes.status}: ${txt.slice(0, 200)}`;
      console.error(resendError);
    }
  } catch (err) {
    resendError = err instanceof Error ? err.message : String(err);
    console.error('Resend fetch failed:', resendError);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resendOk) {
    // Reservering staat in DB, mail is mislukt. Marco kan dat in de
    // export-CSV terugzien en de gast handmatig benaderen.
    return jsonResponse(
      {
        ok: false,
        error:
          'Je reservering is genoteerd, maar de bevestigingsmail kon niet worden verstuurd. Mail klank@marcovanthiel.nl met referentie ' +
          ref +
          ' zodat we contact opnemen.',
        ref,
      },
      502
    );
  }

  return jsonResponse({ ok: true, ref });
}
