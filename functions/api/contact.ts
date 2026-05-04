/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Verstuurt het bericht uit het contactformulier via Resend naar
 * marco@marcovanthiel.nl. De afzender is een verified domain
 * (no-reply@marcovanthiel.nl); Reply-To is het e-mailadres dat de
 * bezoeker zelf heeft ingevuld zodat antwoorden direct bij de
 * verzender belanden.
 *
 * Vereist een Cloudflare Pages environment-variable:
 *   RESEND_API_KEY  =  re_xxxxxxxxxxxxxx
 *
 * Te zetten via: Cloudflare Pages → Project → Settings →
 * Environment variables → Production (en/of Preview).
 */

interface Env {
  RESEND_API_KEY: string;
  RESEND_FROM?: string;
  RESEND_TO?: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  /**
   * Honeypot — een veld dat alleen bots invullen omdat het via CSS
   * verstopt is. Niet-leeg = spam, dus negeren met fake-success.
   */
  website?: string;
  /**
   * Indicatie van de invultaal voor het auto-reply onderwerp.
   * Niet kritiek; default valt terug op Engels.
   */
  lang?: string;
}

const ALLOWED_LANGS = ['nl', 'en', 'de', 'it', 'cn'] as const;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // Outer try/catch — zonder dit komt een runtime-exception terug als
  // Cloudflare error 1101 (text/plain), waarna de browser r.json()
  // niet kan parsen en 'Geen verbinding' toont. Nu krijgt de gebruiker
  // een leesbare error in JSON én verschijnt de stacktrace in de
  // Pages-logs.
  try {
    return await handleContact(ctx);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('contact handler crashed:', detail);
    return jsonResponse(
      { ok: false, error: `Server-fout: ${detail}` },
      500
    );
  }
};

async function handleContact({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  if (!env.RESEND_API_KEY) {
    return jsonResponse(
      { ok: false, error: 'Mailing service is niet geconfigureerd.' },
      503
    );
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ ok: false, error: 'Ongeldige aanvraag.' }, 400);
  }

  // Honeypot — bot-gefilterde vroege uitstap. We retourneren netjes
  // 200 OK zodat bots geen feedback krijgen dat hun spam geblokt is.
  if (payload.website && payload.website.trim() !== '') {
    return jsonResponse({ ok: true, skipped: 'spam' });
  }

  const name = (payload.name ?? '').trim();
  const email = (payload.email ?? '').trim();
  const subject = (payload.subject ?? '').trim();
  const message = (payload.message ?? '').trim();
  const lang = ALLOWED_LANGS.includes(
    (payload.lang ?? 'nl') as (typeof ALLOWED_LANGS)[number]
  )
    ? (payload.lang as string)
    : 'nl';

  // Basis-validatie. Lengte-limieten zijn ruim genoeg voor echte
  // berichten maar voorkomen dat bots megabytes proppen.
  if (!name || name.length > 200) {
    return jsonResponse({ ok: false, error: 'Vul een naam in.' }, 400);
  }
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ ok: false, error: 'E-mailadres ongeldig.' }, 400);
  }
  if (!subject || subject.length > 300) {
    return jsonResponse({ ok: false, error: 'Vul een onderwerp in.' }, 400);
  }
  if (!message || message.length > 10000) {
    return jsonResponse({ ok: false, error: 'Vul een bericht in.' }, 400);
  }

  const fromAddress = env.RESEND_FROM || 'Marco van Thiel <no-reply@marcovanthiel.nl>';
  const toAddress = env.RESEND_TO || 'marco@marcovanthiel.nl';

  // Plain-text body — leesbaar in elk e-mail-programma. We embedden de
  // taal als header en de IP/UA voor diagnostiek bij eventuele spam.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? 'unknown';
  const referer = request.headers.get('referer') ?? '';

  const textBody = [
    `Nieuw bericht via marcovanthiel.nl/contact (taal: ${lang})`,
    '',
    `Naam:    ${name}`,
    `E-mail:  ${email}`,
    `Onderwerp: ${subject}`,
    '',
    '— Bericht ———————————————————————————',
    message,
    '— /Bericht ——————————————————————————',
    '',
    `IP:       ${ip}`,
    `UA:       ${ua}`,
    `Referer:  ${referer}`,
  ].join('\n');

  const htmlBody = `
    <p><strong>Nieuw bericht via marcovanthiel.nl/contact</strong> <em>(taal: ${escapeHtml(lang)})</em></p>
    <table style="border-collapse:collapse">
      <tr><td><strong>Naam</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>E-mail</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td><strong>Onderwerp</strong></td><td>${escapeHtml(subject)}</td></tr>
    </table>
    <hr>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
    <hr>
    <p style="color:#888;font-size:.85em">
      IP: ${escapeHtml(ip)}<br>
      UA: ${escapeHtml(ua)}<br>
      Referer: ${escapeHtml(referer)}
    </p>
  `;

  // Resend API-call. Reply-To = bezoeker, zodat antwoord direct in de
  // mailbox van de afzender belandt zonder dat we de envelope-from
  // misbruiken.
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      reply_to: email,
      subject: `[Contact] ${subject}`,
      text: textBody,
      html: htmlBody,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text().catch(() => '');
    console.error('Resend error', resendRes.status, detail);
    return jsonResponse(
      {
        ok: false,
        error:
          'Bericht kon niet worden verzonden. Probeer het later nog eens of mail direct.',
      },
      502
    );
  }

  return jsonResponse({ ok: true });
};
