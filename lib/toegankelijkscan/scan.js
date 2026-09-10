// Haalt een publieke pagina op en verzamelt toegankelijkheidsdata via HTMLRewriter.

const MAX_BYTES = 3_000_000;
const TIMEOUT_MS = 15_000;
const MAX_LIST = 2000;

function isPrivateHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // Letterlijke IP-adressen: blokkeer loopback en private ranges
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  if (h === "::1" || h.startsWith("[")) return true;
  return false;
}

export function normalizeUrl(input) {
  let raw = (input || "").trim();
  if (!raw) return { error: "leeg" };
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { error: "ongeldig" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { error: "ongeldig" };
  if (u.port && u.port !== "80" && u.port !== "443") return { error: "poort" };
  if (isPrivateHost(u.hostname) || !u.hostname.includes(".")) return { error: "privé" };
  u.hash = "";
  return { url: u };
}

function push(list, item) {
  if (list.length < MAX_LIST) list.push(item);
}

export async function scanPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ToegankelijkScan/1.0; +https://toegankelijkscan.nl)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "nl,en;q=0.8",
      },
    });
  } catch (e) {
    clearTimeout(timer);
    return { error: e.name === "AbortError" ? "timeout" : "onbereikbaar" };
  }

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    clearTimeout(timer);
    return { error: "status", status: res.status };
  }
  if (!contentType.includes("html")) {
    clearTimeout(timer);
    return { error: "geen-html" };
  }

  const data = {
    finalUrl: res.url || url.toString(),
    htmlLang: null,
    sawHtml: false,
    title: "",
    sawTitle: false,
    viewport: null,
    imgs: { total: 0, missingAlt: 0, emptyAlt: 0, samples: [] },
    controls: [],
    labelFor: new Set(),
    links: [],
    buttons: [],
    headings: [],
    iframes: { total: 0, untitled: 0 },
    tabindexPositive: 0,
    autoplayMedia: 0,
    ids: new Map(),
  };

  const rewriter = new HTMLRewriter()
    .on("html", {
      element(e) {
        data.sawHtml = true;
        data.htmlLang = e.getAttribute("lang");
      },
    })
    .on("title", {
      element() {
        data.sawTitle = true;
      },
      text(t) {
        if (data.title.length < 300) data.title += t.text;
      },
    })
    .on("meta", {
      element(e) {
        if ((e.getAttribute("name") || "").toLowerCase() === "viewport") {
          data.viewport = e.getAttribute("content") || "";
        }
      },
    })
    .on("img", {
      element(e) {
        data.imgs.total++;
        const alt = e.getAttribute("alt");
        if (alt === null) {
          if (e.getAttribute("role") === "presentation" || e.getAttribute("aria-hidden") === "true") {
            data.imgs.emptyAlt++;
          } else {
            data.imgs.missingAlt++;
            const src = e.getAttribute("src") || "";
            if (data.imgs.samples.length < 5 && src) {
              data.imgs.samples.push(src.split("?")[0].slice(-80));
            }
          }
        } else if (alt.trim() === "") {
          data.imgs.emptyAlt++;
        }
      },
    })
    .on("input", {
      element(e) {
        const type = (e.getAttribute("type") || "text").toLowerCase();
        if (["hidden", "submit", "button", "reset", "image"].includes(type)) return;
        data.controls.push(readControl(e, "input[" + type + "]"));
      },
    })
    .on("select", {
      element(e) {
        data.controls.push(readControl(e, "select"));
      },
    })
    .on("textarea", {
      element(e) {
        data.controls.push(readControl(e, "textarea"));
      },
    })
    .on("label", {
      element(e) {
        const f = e.getAttribute("for");
        if (f) data.labelFor.add(f);
      },
    })
    .on("label input", { element: () => markNested(data) })
    .on("label select", { element: () => markNested(data) })
    .on("label textarea", { element: () => markNested(data) })
    .on("a", {
      element(e) {
        push(data.links, {
          href: e.getAttribute("href") || "",
          aria: e.getAttribute("aria-label") || e.getAttribute("title") || "",
          hidden: e.getAttribute("aria-hidden") === "true",
          text: "",
          imgAlt: false,
        });
      },
      text(t) {
        const rec = data.links[data.links.length - 1];
        if (rec && rec.text.length < 200) rec.text += t.text;
      },
    })
    .on("a img", {
      element(e) {
        const rec = data.links[data.links.length - 1];
        if (rec && (e.getAttribute("alt") || "").trim()) rec.imgAlt = true;
      },
    })
    .on("a svg title", {
      element() {
        const rec = data.links[data.links.length - 1];
        if (rec) rec.imgAlt = true;
      },
    })
    .on("button", {
      element(e) {
        push(data.buttons, {
          aria: e.getAttribute("aria-label") || e.getAttribute("title") || "",
          hidden: e.getAttribute("aria-hidden") === "true",
          text: "",
          imgAlt: false,
        });
      },
      text(t) {
        const rec = data.buttons[data.buttons.length - 1];
        if (rec && rec.text.length < 200) rec.text += t.text;
      },
    })
    .on("button img", {
      element(e) {
        const rec = data.buttons[data.buttons.length - 1];
        if (rec && (e.getAttribute("alt") || "").trim()) rec.imgAlt = true;
      },
    })
    .on("iframe", {
      element(e) {
        data.iframes.total++;
        if (!(e.getAttribute("title") || "").trim() && e.getAttribute("aria-hidden") !== "true") {
          data.iframes.untitled++;
        }
      },
    })
    .on("[tabindex]", {
      element(e) {
        const v = parseInt(e.getAttribute("tabindex"), 10);
        if (v > 0) data.tabindexPositive++;
      },
    })
    .on("video", { element: (e) => checkAutoplay(e, data) })
    .on("audio", { element: (e) => checkAutoplay(e, data) })
    .on("[id]", {
      element(e) {
        const id = e.getAttribute("id");
        if (id && data.ids.size < 5000) {
          data.ids.set(id, (data.ids.get(id) || 0) + 1);
        }
      },
    });

  for (let level = 1; level <= 6; level++) {
    rewriter.on("h" + level, {
      element() {
        push(data.headings, level);
      },
    });
  }

  try {
    const transformed = rewriter.transform(res);
    const reader = transformed.body.getReader();
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
  } catch {
    clearTimeout(timer);
    return { error: "leesfout" };
  }
  clearTimeout(timer);
  data.labelFor = [...data.labelFor];
  data.ids = [...data.ids.entries()].filter(([, n]) => n > 1);
  return { data };
}

function readControl(e, kind) {
  return {
    kind,
    id: e.getAttribute("id") || "",
    name: e.getAttribute("name") || "",
    aria: e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.getAttribute("title") || "",
    nestedLabel: false,
  };
}

function markNested(data) {
  const rec = data.controls[data.controls.length - 1];
  if (rec) rec.nestedLabel = true;
}

function checkAutoplay(e, data) {
  if (e.hasAttribute("autoplay") && !e.hasAttribute("muted") && !e.hasAttribute("controls")) {
    data.autoplayMedia++;
  }
}
