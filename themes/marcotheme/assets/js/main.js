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
});
