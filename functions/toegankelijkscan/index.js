import { html } from "../../lib/toegankelijkscan/common.js";
import { landingPage } from "../../lib/toegankelijkscan/ui.js";

export function onRequestGet() {
  return html(landingPage(), 200, "public, max-age=300");
}
