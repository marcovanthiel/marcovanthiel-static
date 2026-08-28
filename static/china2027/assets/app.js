/* China 2027: taalschakelaar en media-inlader.
   Geen build-stap, geen framework. Alles draait op een gewone statische host. */

(function () {
  "use strict";

  /* ---------- taal ---------- */
  // Elk tekstelement heeft data-nl en data-zh. Er is geen opslag in de browser:
  // de taalkeuze geldt voor de sessie en de pagina start altijd in het Nederlands.
  var lang = "nl";

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
  }

  document.querySelectorAll(".langs button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.dataset.lang); });
  });

  /* ---------- media ---------- */
  // media/manifest.json beschrijft per bestemming welke beelden er zijn.
  // Ontbreekt een beeld, dan blijft de tegel staan met de gewenste opname erin.
  // Zo is de site vanaf dag één te tonen en groeit hij mee terwijl je fotografeert.
  fetch("media/manifest.json")
    .then(function (r) { if (!r.ok) throw new Error("geen manifest"); return r.json(); })
    .then(function (data) {
      Object.keys(data).forEach(function (stop) {
        var host = document.querySelector('[data-gallery="' + stop + '"]');
        if (!host) return;
        (data[stop].photos || []).forEach(function (p) {
          var tile = host.querySelector('[data-slot="' + p.slot + '"]');
          if (!tile || !p.file) return;
          tile.classList.remove("empty");
          tile.innerHTML =
            '<img src="media/' + p.file + '" alt="' + (p.alt || "") + '" loading="lazy">' +
            (p.caption ? '<figcaption>' + p.caption + '</figcaption>' : "");
        });
        var v = data[stop].video;
        var vhost = document.querySelector('[data-video="' + stop + '"]');
        if (v && vhost) {
          vhost.innerHTML = v.embed
            ? '<iframe src="' + v.embed + '" title="' + (v.title || "") + '" allowfullscreen loading="lazy"></iframe>'
            : '<video src="media/' + v.file + '" controls preload="none" poster="' +
              (v.poster ? "media/" + v.poster : "") + '"></video>';
        }
      });
    })
    .catch(function () { /* nog geen media: de tegels blijven zoals ze zijn */ });

  applyLang("nl");
})();
