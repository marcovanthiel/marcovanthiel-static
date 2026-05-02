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
});

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
