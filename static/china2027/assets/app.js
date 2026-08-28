/* China 2027: taalschakelaar en media-inlader.
   Geen build-stap, geen framework. Alles draait op een gewone statische host. */

(function () {
  "use strict";

  /* ---------- taal ---------- */
  // Elk tekstelement heeft data-nl en data-zh. Er is geen opslag in de browser:
  // de taalkeuze geldt voor de sessie en de pagina start altijd in het Nederlands.
  var lang = "nl";
  var media = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Tekstvelden in media/manifest.json mogen een gewone string zijn of een
  // {nl, zh}-object; pick() geeft de tekst in de actieve taal terug.
  function pick(v) {
    if (v == null) return "";
    if (typeof v === "object") return v[lang] || v.nl || "";
    return v;
  }

  function creditHtml(c) {
    if (!c) return "";
    var tekst = esc(pick(c.tekst || c));
    return c.url
      ? ' <a class="credit" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + tekst + "</a>"
      : ' <span class="credit">' + tekst + "</span>";
  }

  /* ---------- media ---------- */
  // media/manifest.json beschrijft per bestemming welke beelden er zijn.
  // Ontbreekt een beeld, dan blijft de tegel staan met de gewenste opname erin.
  // Zo is de site vanaf dag één te tonen en groeit hij mee terwijl je fotografeert.
  function renderMedia() {
    if (!media) return;
    Object.keys(media).forEach(function (stop) {
      var host = document.querySelector('[data-gallery="' + stop + '"]');
      if (host) (media[stop].photos || []).forEach(function (p) {
        var tile = host.querySelector('[data-slot="' + p.slot + '"]');
        if (!tile || !p.file) return;
        tile.classList.remove("empty");
        var cap = pick(p.caption);
        tile.innerHTML =
          '<img src="media/' + esc(p.file) + '" alt="' + esc(pick(p.alt)) + '" loading="lazy">' +
          (cap || p.credit ? "<figcaption>" + esc(cap) + creditHtml(p.credit) + "</figcaption>" : "");
      });
      var v = media[stop].video;
      var vhost = document.querySelector('[data-video="' + stop + '"]');
      if (v && vhost) {
        vhost.classList.add("filled");
        vhost.innerHTML = (v.embed
          ? '<iframe src="' + esc(v.embed) + '" title="' + esc(pick(v.title)) + '" allowfullscreen loading="lazy"></iframe>'
          : '<video src="media/' + esc(v.file) + '" controls preload="none"' +
            (v.poster ? ' poster="media/' + esc(v.poster) + '"' : "") +
            ' aria-label="' + esc(pick(v.title)) + '"></video>') +
          (pick(v.caption) || v.credit
            ? '<div class="vcaption">' + esc(pick(v.caption)) + creditHtml(v.credit) + "</div>"
            : "");
      }
    });
  }

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = next === "zh" ? "zh-Hans" : "nl";
    document.querySelectorAll("[data-nl]").forEach(function (el) {
      var v = el.getAttribute("data-" + next);
      if (v !== null) el.textContent = v;
    });
    document.querySelectorAll("[data-only]").forEach(function (el) {
      el.toggleAttribute("data-lang-hide", el.getAttribute("data-only") !== next);
    });
    document.querySelectorAll(".langs button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === next));
    });
    renderMedia();
  }

  document.querySelectorAll(".langs button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.dataset.lang); });
  });

  fetch("media/manifest.json")
    .then(function (r) { if (!r.ok) throw new Error("geen manifest"); return r.json(); })
    .then(function (data) { media = data; renderMedia(); })
    .catch(function () { /* nog geen media: de tegels blijven zoals ze zijn */ });

  applyLang("nl");
})();
