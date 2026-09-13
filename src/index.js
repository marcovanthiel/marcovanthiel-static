// marcovanthiel.nl — Worker met Workers Static Assets.
// Serveert de door Hugo gebouwde statische site (public/) via de ASSETS-binding
// en handelt POST /api/contact af (contactformulier -> e-mail via Resend).
// De site is verder puur statisch; run_worker_first staat uit, dus assets komen
// rechtstreeks uit de edge-cache en deze Worker draait alleen voor /api/contact
// en niet-bestaande paden (dan valt hij terug op de 404-pagina van de assets).
//
// Overgenomen 13-9-2026 van de oude Pages Function functions/api/contact.ts bij
// de migratie van Cloudflare Pages naar Workers Static Assets. De dode
// Klank-reserverings- en OCAI-functies zijn daarbij verwijderd.

const ALLOWED_LANGS = ['nl', 'en', 'de', 'it', 'cn'];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function handleContact(request, env) {
  if (!env.RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: 'Mailing service is niet geconfigureerd.' }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Ongeldige aanvraag.' }, 400);
  }

  // Honeypot: bots vullen dit verstopte veld in. Fake-success terug.
  if (payload.website && String(payload.website).trim() !== '') {
    return jsonResponse({ ok: true, skipped: 'spam' });
  }

  const name = (payload.name ?? '').trim();
  const email = (payload.email ?? '').trim();
  const subject = (payload.subject ?? '').trim();
  const message = (payload.message ?? '').trim();
  const langInput = payload.lang ?? 'nl';
  const lang = ALLOWED_LANGS.includes(langInput) ? langInput : 'nl';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
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
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Resend fetch failed:', detail);
    return jsonResponse({ ok: false, error: `Mailprovider onbereikbaar: ${detail}` }, 502);
  }
  clearTimeout(timeoutId);

  if (!resendRes.ok) {
    const detail = await resendRes.text().catch(() => '');
    console.error('Resend non-OK', resendRes.status, detail);
    return jsonResponse(
      { ok: false, error: `Mailprovider weigerde de mail (${resendRes.status}): ${detail.slice(0, 240) || 'geen detail'}` },
      502,
    );
  }

  return jsonResponse({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return jsonResponse({ ok: false, error: 'Methode niet toegestaan.' }, 405);
      }
      try {
        return await handleContact(request, env);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error('contact handler crashed:', detail);
        return jsonResponse({ ok: false, error: `Server-fout: ${detail}` }, 500);
      }
    }
    // Al het andere: laat de statische-assets-laag het afhandelen (incl. 404-page).
    return env.ASSETS.fetch(request);
  },
};
