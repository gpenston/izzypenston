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

  // Story photo scroll effects (Apple-style scale, tilt, fade)
  var storyPhotos = document.querySelectorAll('.story-photo img');
  if (storyPhotos.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    function updateStoryPhotos() {
      var viewH = window.innerHeight;
      storyPhotos.forEach(function (img) {
        var rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < viewH) {
          // progress: 0 = entering bottom of viewport, 1 = exiting top
          var progress = 1 - (rect.top + rect.height) / (viewH + rect.height);
          // Ease: ramp up quickly in the first half, plateau in the center
          var eased = Math.min(progress * 2, 1);

          var scale = 0.92 + 0.08 * eased;
          var translateY = 20 * (1 - eased);
          var rotateX = 3 * (1 - eased);
          var opacity = 0.6 + 0.4 * eased;

          img.style.transform = 'scale(' + scale + ') translateY(' + translateY + 'px) rotateX(' + rotateX + 'deg)';
          img.style.opacity = opacity;
        }
      });
    }
    window.addEventListener('scroll', function () {
      requestAnimationFrame(updateStoryPhotos);
    }, { passive: true });
    updateStoryPhotos();
  }
}());
