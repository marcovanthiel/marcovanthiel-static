// Gedeelde helpers voor de ToegankelijkScan-functions (/toegankelijkscan/*).
// Afkomstig uit de oude losse Worker (repo toegankelijkscan, src/index.js).

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
};

export function html(body, status = 200, cache) {
  const h = { ...HEADERS };
  if (cache) h["Cache-Control"] = cache;
  return new Response(body, { status, headers: h });
}

// Best-effort rate limit per isolate: 8 scans per minuut per IP.
const hits = new Map();
export function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 8;
}

export const FOUTEN = {
  leeg: "Er is geen webadres ingevuld.",
  ongeldig: "Het ingevulde adres is geen geldig webadres. Gebruik de vorm https://www.uwwebsite.nl.",
  poort: "Alleen gewone webadressen (poort 80 of 443) kunnen worden gescand.",
  "privé": "Dit adres verwijst niet naar een publieke website en kan daarom niet worden gescand.",
  timeout: "De website reageerde niet binnen 15 seconden. Probeer het later opnieuw.",
  onbereikbaar: "De website is niet bereikbaar. Controleer het adres en probeer het opnieuw.",
  "geen-html": "Dit adres levert geen webpagina op (bijvoorbeeld een afbeelding of PDF). Vul het adres van een pagina in.",
  leesfout: "De pagina kon niet worden gelezen. Probeer het later opnieuw.",
};
