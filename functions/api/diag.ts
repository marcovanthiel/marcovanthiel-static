/**
 * Cloudflare Pages Function — GET /api/diag
 *
 * Diagnostische helper voor het contactformulier. Doet drie outbound
 * fetches achter elkaar en rapporteert per call (status, ms, error).
 * Hiermee kunnen we vaststellen of een platte CF-502 op /api/contact
 * komt door (a) algemene outbound-fetch-problemen in deze Pages-omgeving,
 * (b) een specifieke incompatibiliteit met api.resend.com, of (c) een
 * environment-config (ontbrekende RESEND_API_KEY).
 *
 * Veilig om publiek te exposeren: de diag-call mailt niets en lekt
 * geen secrets — alleen statuscodes + tijdsduur + (bij Resend) de
 * eerste regel van een error-body.
 */

interface Env {
  RESEND_API_KEY?: string;
}

interface Probe {
  name: string;
  url: string;
  ok: boolean;
  status: number | null;
  ms: number;
  error?: string;
  bodyPreview?: string;
}

async function probe(
  name: string,
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<Probe> {
  const start = Date.now();
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(tid);
    let preview = '';
    try {
      preview = (await r.text()).slice(0, 200);
    } catch {
      /* body lezen kan zelden falen — negeren */
    }
    return {
      name,
      url,
      ok: r.ok,
      status: r.status,
      ms: Date.now() - start,
      bodyPreview: preview,
    };
  } catch (err) {
    clearTimeout(tid);
    return {
      name,
      url,
      ok: false,
      status: null,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const probes: Probe[] = [];

  // 1) Generieke httpbin GET — werkt outbound HTTPS überhaupt?
  probes.push(await probe('httpbin', 'https://httpbin.org/get'));

  // 2) Cloudflare's eigen 1.1.1.1 — bewijst minimum routing
  probes.push(
    await probe('cloudflare-1.1.1.1', 'https://1.1.1.1/cdn-cgi/trace')
  );

  // 3) Resend zonder auth — verwacht 401, maar moet wel DOORKOMEN.
  //    Als deze hangt of crasht, ligt het probleem bij api.resend.com
  //    vanuit de Pages Function-runtime, niet bij onze code.
  probes.push(
    await probe('resend-noauth', 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
  );

  // 4) Resend MET auth (tijdelijk; we lekken geen sleutel — alleen status)
  if (env.RESEND_API_KEY) {
    probes.push(
      await probe(
        'resend-auth',
        'https://api.resend.com/domains', // GET-vriendelijk endpoint
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
        }
      )
    );
  } else {
    probes.push({
      name: 'resend-auth',
      url: '(skipped)',
      ok: false,
      status: null,
      ms: 0,
      error: 'RESEND_API_KEY niet gezet in deze deploy.',
    });
  }

  return new Response(
    JSON.stringify(
      {
        runtime: 'cloudflare-pages-function',
        time: new Date().toISOString(),
        probes,
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
};
