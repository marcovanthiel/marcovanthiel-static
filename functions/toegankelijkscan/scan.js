import { html, rateLimited, FOUTEN } from "../../lib/toegankelijkscan/common.js";
import { normalizeUrl, scanPage } from "../../lib/toegankelijkscan/scan.js";
import { evaluate } from "../../lib/toegankelijkscan/checks.js";
import { reportPage, errorPage } from "../../lib/toegankelijkscan/ui.js";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const ip = request.headers.get("cf-connecting-ip") || "?";
  if (rateLimited(ip)) {
    return html(errorPage("U heeft in korte tijd veel scans gestart. Wacht een minuut en probeer het opnieuw."), 429);
  }
  const norm = normalizeUrl(url.searchParams.get("url"));
  if (norm.error) return html(errorPage(FOUTEN[norm.error] || FOUTEN.ongeldig), 400);

  const scanned = await scanPage(norm.url);
  if (scanned.error) {
    const msg = scanned.error === "status"
      ? `De website gaf een foutmelding terug (HTTP ${scanned.status}). Controleer het adres en probeer het opnieuw.`
      : FOUTEN[scanned.error] || FOUTEN.onbereikbaar;
    return html(errorPage(msg), 502);
  }
  const result = evaluate(scanned.data);
  return html(reportPage(scanned.data.finalUrl, result));
}
