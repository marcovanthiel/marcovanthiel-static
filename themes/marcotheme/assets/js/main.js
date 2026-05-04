// Main JavaScript for Marco van Thiel website

document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for fixed header
          behavior: 'smooth'
        });
      }
    });
  });

  // Add active class to current nav item
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.main-nav a');

  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath ||
        (currentPath === '/' && linkPath === '/') ||
        (currentPath !== '/' && linkPath !== '/' && currentPath.includes(linkPath))) {
      link.classList.add('active');
    }
  });

  // Kunstwerk van de dag — alleen actief op pagina's met de aod-section
  initArtworkOfTheDay();

  // Project-modal: opent bij klik op een project-item-btn
  initProjectModal();

  // Scroll-onthul: voegt .is-visible toe wanneer een element in beeld komt
  initScrollReveal();
});

function initScrollReveal() {
  // Respecteer prefers-reduced-motion: zet alles meteen op zichtbaar
  // zonder observer te starten.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document
      .querySelectorAll('.reveal-on-scroll, .project-grid, .projects-section, .governance-section, .credentials-section')
      .forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Selecteer alle elementen die "onthuld" moeten worden bij scrolling.
  const targets = document.querySelectorAll(
    '.reveal-on-scroll, .project-grid, .projects-section, .governance-section, .credentials-section'
  );

  // Geen IntersectionObserver beschikbaar (oudere browser): alles meteen zichtbaar.
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Onthul gebeurt eenmalig — uitgevoerd, dan niet langer observeren
          observer.unobserve(entry.target);
        }
      });
    },
    {
      // Trigger zodra ~12% van het element zichtbaar is
      threshold: 0.12,
      // Iets eerder triggeren zodat de animatie loopt voordat de gebruiker
      // erbij is — voelt vloeiender aan dan strikt op de viewport-rand
      rootMargin: '0px 0px -8% 0px',
    }
  );

  targets.forEach((el) => observer.observe(el));
}

function initProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  const titleEl = document.getElementById('project-modal-title');
  const bodyEl = document.getElementById('project-modal-body');
  const imageEl = document.getElementById('project-modal-image');
  const linkEl = document.getElementById('project-modal-link');
  const linkWrap = document.getElementById('project-modal-link-wrap');
  if (!titleEl || !bodyEl || !imageEl) return;

  // Een tijdelijke buffer om de focus terug te zetten naar de knop
  // die de modal opende — accessibility best-practice.
  let lastTrigger = null;

  function open(trigger) {
    const title = trigger.getAttribute('data-project-title') || '';
    const body = trigger.getAttribute('data-project-body') || '';
    const image = trigger.getAttribute('data-project-image') || '';
    const url = trigger.getAttribute('data-project-url') || '';
    titleEl.textContent = title;
    bodyEl.textContent = body;
    imageEl.src = image;
    imageEl.alt = title;
    if (linkEl && linkWrap) {
      if (url) {
        linkEl.href = url;
        linkWrap.hidden = false;
      } else {
        linkWrap.hidden = true;
      }
    }
    modal.hidden = false;
    document.body.classList.add('project-modal-open');
    lastTrigger = trigger;
    // Focus naar de sluit-knop voor toetsenbord-gebruikers
    const closeBtn = modal.querySelector('.project-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove('project-modal-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
    lastTrigger = null;
  }

  document.querySelectorAll('.project-item-btn').forEach((btn) => {
    btn.addEventListener('click', function () { open(btn); });
  });

  modal.querySelectorAll('[data-project-modal-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}

function initArtworkOfTheDay() {
  const section = document.querySelector('.aod-section');
  if (!section) return;
  const card = document.getElementById('aod-card');
  if (!card) return;
  const apiUrl = section.getAttribute('data-aod-api');
  const detailBase = section.getAttribute('data-aod-detail-base') || '';
  if (!apiUrl) {
    section.style.display = 'none';
    return;
  }

  fetch(apiUrl, { mode: 'cors' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      const detailUrl = detailBase ? detailBase + '/' + (data.id || '') : null;
      const yearLine = data.year ? '<span class="aod-year">' + escapeHtml(data.year) + '</span>' : '';
      const mediumLine = data.medium ? '<span class="aod-medium">' + escapeHtml(data.medium) + '</span>' : '';
      const meta = [yearLine, mediumLine].filter(Boolean).join(' <span class="aod-dot">·</span> ');
      const imgHtml = data.imageUrl
        ? '<img src="' + encodeURI(data.imageUrl) + '" alt="' + escapeAttr(data.title) + '" loading="lazy" decoding="async">'
        : '<div class="aod-noimg" aria-hidden="true">geen foto</div>';

      card.innerHTML =
        '<a class="aod-link" href="' + (detailUrl || '#') + '"' +
        (detailUrl ? ' target="_blank" rel="noopener"' : '') + '>' +
          '<div class="aod-image">' + imgHtml + '</div>' +
          '<div class="aod-meta">' +
            '<p class="aod-eyebrow">' + escapeHtml(formatDateNL(data.date)) + '</p>' +
            '<h3 class="aod-title">' + escapeHtml(data.title || '') + '</h3>' +
            '<p class="aod-artist">' + escapeHtml(data.artistName || '') + '</p>' +
            (meta ? '<p class="aod-detail">' + meta + '</p>' : '') +
          '</div>' +
        '</a>';
    })
    .catch(function (err) {
      // Stilletjes verbergen — geen broken-UI op een statische site
      // wanneer de kunstcollectie-API even niet bereikbaar is.
      console.warn('[aod] kunstwerk van de dag niet beschikbaar:', err);
      section.style.display = 'none';
    });
}

function formatDateNL(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                    'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  } catch (e) {
    return isoDate;
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}
