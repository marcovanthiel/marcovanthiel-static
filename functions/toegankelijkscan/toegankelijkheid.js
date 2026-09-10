import { html } from "../../lib/toegankelijkscan/common.js";
import { statementPage } from "../../lib/toegankelijkscan/ui.js";

export function onRequestGet() {
  return html(statementPage(), 200, "public, max-age=300");
}
