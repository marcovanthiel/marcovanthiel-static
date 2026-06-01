(function () {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.backdrop');
  const navLinks = document.querySelectorAll('.sidebar__nav a, .sidebar__nav-opening');
  const chapters = document.querySelectorAll('.chapter, .opening');

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function openSidebar() {
    sidebar.classList.add('is-open');
    backdrop.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (sidebar.classList.contains('is-open')) closeSidebar();
      else openSidebar();
    });
  }

  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  // Highlight active chapter in sidebar tijdens scrollen
  if ('IntersectionObserver' in window && chapters.length) {
    const linkById = {};
    navLinks.forEach(function (a) {
      const id = a.getAttribute('href').replace('#', '');
      linkById[id] = a;
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const link = linkById[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    chapters.forEach(function (c) { observer.observe(c); });
  }
})();
