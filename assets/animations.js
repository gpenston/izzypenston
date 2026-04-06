(function () {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-64px' });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    observer.observe(el);
  });

  function initStagger() {
    requestAnimationFrame(function () {
      document.querySelectorAll('[data-stagger]').forEach(function (el) {
        el.style.setProperty('--stagger-index', el.dataset.stagger);
        el.classList.add('is-revealed');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStagger);
  } else {
    initStagger();
  }

  // Nav scroll shadow
  var nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 10);
    }, { passive: true });
  }
}());
