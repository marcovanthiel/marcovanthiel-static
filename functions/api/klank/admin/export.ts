/**
 * Cloudflare Pages Function — GET /api/klank/admin/export
 *
 * Geeft een CSV terug met alle reserveringen voor een concert.
 * Toegang via een gedeelde bearer-token (env-var KLANK_ADMIN_TOKEN).
 *
 * Voorbeeld:
 *   curl -H 'Authorization: Bearer <KLANK_ADMIN_TOKEN>' \
 *        https://marcovanthiel.nl/api/klank/admin/export
 *
 * Optionele query-parameters:
 *   concert=midzomer-2026   (default; filtert op concert-id)
 *   format=json             (default = csv)
 */

interface Env {
  KLANK_DB: D1Database;
  KLANK_ADMIN_TOKEN: string;
}

type Row = {
  id: number;
  ref: string;
  concert: string;
  naam: string;
  woonplaats: string;
  email: string;
  aantal: number;
  bedrag_cent: number;
  created_at: string;
  ip: string | null;
};

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'www-authenticate': 'Bearer realm="klank-admin"',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.KLANK_ADMIN_TOKEN) {
    return new Response('Admin-token is niet geconfigureerd.', { status: 503 });
  }
  if (!env.KLANK_DB) {
    return new Response('Database is niet geconfigureerd.', { status: 503 });
  }

  // Bearer-token check. Ook query-param ?token=… ondersteund zodat je
  // 'm makkelijk in de browser kunt openen.
  const url = new URL(request.url);
  const headerToken = (request.headers.get('authorization') || '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  const queryToken = (url.searchParams.get('token') || '').trim();
  const provided = headerToken || queryToken;
  // Constant-tijd vergelijk: geen vroegtijdige exit op de eerste afwijkende byte.
  const expected = env.KLANK_ADMIN_TOKEN || '';
  let diff = provided.length ^ expected.length;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i % (expected.length || 1));
  }
  if (diff !== 0 || !expected) {
    return unauthorized();
  }

  const concert = (url.searchParams.get('concert') || 'midzomer-2026').trim();
  const format = (url.searchParams.get('format') || 'csv').toLowerCase();

  const { results } = await env.KLANK_DB.prepare(
    `SELECT id, ref, concert, naam, woonplaats, email, aantal, bedrag_cent,
            created_at, ip
       FROM reservaties
      WHERE concert = ?
      ORDER BY created_at ASC, id ASC`
  )
    .bind(concert)
    .all<Row>();

  const rows = results ?? [];

  if (format === 'json') {
    return new Response(JSON.stringify({ concert, count: rows.length, rows }, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  // CSV — kolom-volgorde gericht op de gastenlijst aan de deur:
  // naam, woonplaats, email, aantal — gevolgd door referentie/admin-velden.
  const header = [
    'naam',
    'woonplaats',
    'email',
    'aantal',
    'bedrag_eur',
    'referentie',
    'aangemaakt',
    'id',
  ].join(',');

  const lines = rows.map((r) =>
    [
      csvEscape(r.naam),
      csvEscape(r.woonplaats),
      csvEscape(r.email),
      csvEscape(r.aantal),
      csvEscape((r.bedrag_cent / 100).toFixed(2).replace('.', ',')),
      csvEscape(r.ref),
      csvEscape(r.created_at),
      csvEscape(r.id),
    ].join(',')
  );

  const totalKaarten = rows.reduce((s, r) => s + (r.aantal || 0), 0);
  const totalBedrag  = rows.reduce((s, r) => s + (r.bedrag_cent || 0), 0);
  const footer = [
    '',
    `# Concert: ${concert}`,
    `# Reserveringen: ${rows.length}`,
    `# Kaarten totaal: ${totalKaarten}`,
    `# Bedrag totaal: € ${(totalBedrag / 100).toFixed(2).replace('.', ',')}`,
    `# Geëxporteerd: ${new Date().toISOString()}`,
  ].join('\n');

  // UTF-8 BOM zodat Excel/Numbers diakrieten goed leest.
  const csv = '﻿' + header + '\n' + lines.join('\n') + '\n' + footer + '\n';

  const filename = `klank-reserveringen-${concert}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
};
