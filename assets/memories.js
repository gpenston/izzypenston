(function () {
  var BATCH_SIZE = 6;
  var memories = [];
  var shown = 0;
  var list = document.getElementById('memories-list');
  var btnWrap = document.getElementById('memories-load-more-wrap');

  // ===== Memory photo lightbox =====
  var mlb = null;
  var mlbPhotos = [];
  var mlbIndex = 0;
  var mlbTrigger = null;

  function buildMemoryLightbox() {
    var wrap = document.createElement('div');
    wrap.className = 'mlb-backdrop';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Photo viewer');

    var img = document.createElement('img');
    img.className = 'mlb-img';
    img.alt = 'Photo shared with this memory';
    wrap.appendChild(img);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'mlb-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    wrap.appendChild(closeBtn);

    var prevBtn = document.createElement('button');
    prevBtn.className = 'mlb-nav prev';
    prevBtn.setAttribute('aria-label', 'Previous photo');
    prevBtn.innerHTML = '&#8249;';
    wrap.appendChild(prevBtn);

    var nextBtn = document.createElement('button');
    nextBtn.className = 'mlb-nav next';
    nextBtn.setAttribute('aria-label', 'Next photo');
    nextBtn.innerHTML = '&#8250;';
    wrap.appendChild(nextBtn);

    var counter = document.createElement('div');
    counter.className = 'mlb-counter';
    counter.setAttribute('aria-live', 'polite');
    wrap.appendChild(counter);

    document.body.appendChild(wrap);

    function showAt(i) {
      mlbIndex = i;
      img.src = mlbPhotos[i];
      counter.textContent = (i + 1) + ' of ' + mlbPhotos.length;
      prevBtn.hidden = (i === 0);
      nextBtn.hidden = (i === mlbPhotos.length - 1);
    }

    function openLightbox(photos, startIndex, trigger) {
      mlbPhotos = photos;
      mlbTrigger = trigger || null;
      showAt(startIndex || 0);
      wrap.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox() {
      wrap.classList.remove('is-open');
      document.body.style.overflow = '';
      if (mlbTrigger) mlbTrigger.focus();
    }

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function () { if (mlbIndex > 0) showAt(mlbIndex - 1); });
    nextBtn.addEventListener('click', function () { if (mlbIndex < mlbPhotos.length - 1) showAt(mlbIndex + 1); });

    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!wrap.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && mlbIndex > 0) showAt(mlbIndex - 1);
      if (e.key === 'ArrowRight' && mlbIndex < mlbPhotos.length - 1) showAt(mlbIndex + 1);

      // Focus trap
      if (e.key === 'Tab') {
        var focusable = wrap.querySelectorAll('button:not([hidden])');
        var els = Array.prototype.filter.call(focusable, function (el) { return !el.hidden; });
        if (!els.length) return;
        var first = els[0];
        var last = els[els.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    });

    return openLightbox;
  }

  // Lazily built on first use
  var openMemoryLightbox = null;

  // ===== Photo pile =====


  function createPhotoPile(photos, cardEl) {
    if (!photos || photos.length === 0) return null;

    var pile = document.createElement('div');
    pile.className = 'memory-photo-pile';
    pile.setAttribute('role', 'button');
    pile.setAttribute('tabindex', '0');
    var label = photos.length === 1 ? '1 photo' : photos.length + ' photos';
    pile.setAttribute('aria-label', 'View ' + label);

    var stack = document.createElement('div');
    stack.className = 'pile-stack';

    // Render back-to-front (first img = back, last = front)
    photos.forEach(function (url) {
      var img = document.createElement('img');
      img.className = 'pile-img';
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      stack.appendChild(img);
    });

    pile.appendChild(stack);

    function open() {
      if (!openMemoryLightbox) {
        openMemoryLightbox = buildMemoryLightbox();
      }
      openMemoryLightbox(photos, 0, pile);
    }

    pile.addEventListener('click', open);
    pile.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    return pile;
  }

  // ===== Card creation =====

  function createCard(memory, index) {
    var div = document.createElement('div');
    div.className = 'memory-card';

    // Subtle tilt — pre-varied values, consistent per position
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var tilts = [-1.8, 1.2, -0.8, 2.1, -1.4, 0.9, -2.0, 1.6, -0.6, 1.9, -1.1, 2.3, -0.7, 1.5];
      var deg = tilts[index % tilts.length];
      div.style.transform = 'rotate(' + deg + 'deg)';
    }

    // Photo pile floats right — must be in DOM before text so content wraps around it
    if (memory.photos && memory.photos.length > 0) {
      var pile = createPhotoPile(memory.photos, div);
      if (pile) div.appendChild(pile);
    }

    var name = document.createElement('div');
    name.className = 'memory-name';
    name.textContent = memory.name;
    div.appendChild(name);

    if (memory.relation) {
      var rel = document.createElement('div');
      rel.className = 'memory-relation';
      rel.textContent = memory.relation.charAt(0).toUpperCase() + memory.relation.slice(1);
      div.appendChild(rel);
    }

    var text = document.createElement('p');
    text.className = 'memory-text';
    text.textContent = memory.text;
    div.appendChild(text);

    return div;
  }

  function truncateIfNeeded(card) {
    var text = card.querySelector('.memory-text');
    if (!text) return;
    // Apply truncation class to measure
    text.classList.add('memory-text-truncated');
    if (text.scrollHeight <= text.clientHeight) {
      // Fits fine — remove class
      text.classList.remove('memory-text-truncated');
      return;
    }

    // Whole card (minus photo pile) is the tap/click target
    card.classList.add('is-expandable');

    var btn = document.createElement('button');
    btn.className = 'memory-more';
    btn.setAttribute('aria-label', 'Read more');
    btn.textContent = 'More';
    text.insertAdjacentElement('afterend', btn);

    function expand(e) {
      // Ignore clicks that originate inside the photo pile
      if (e.target.closest('.memory-photo-pile')) return;
      text.classList.remove('memory-text-truncated');
      btn.remove();
      card.classList.remove('is-expandable');
      card.removeEventListener('click', expand);
    }

    card.addEventListener('click', expand);
  }

  function renderBatch() {
    var end = Math.min(shown + BATCH_SIZE, memories.length);
    var newCards = [];
    for (var i = shown; i < end; i++) {
      var card = createCard(memories[i], i);
      list.appendChild(card);
      newCards.push(card);
    }
    // Truncate after DOM insertion so scrollHeight is measurable
    newCards.forEach(truncateIfNeeded);
    shown = end;
    if (btnWrap) {
      btnWrap.style.display = shown >= memories.length ? 'none' : '';
    }
  }

  function init() {
    if (!list) return;

    fetch('/assets/memories.json?v=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        memories = data;
        if (memories.length === 0) return;
        renderBatch();
        if (shown >= memories.length && btnWrap) {
          btnWrap.style.display = 'none';
        }
      })
      .catch(function () {
        if (list) list.innerHTML = '<p style="color:var(--text-tertiary);text-align:center;">Memories could not be loaded. Please try again later.</p>';
        if (btnWrap) btnWrap.style.display = 'none';
      });

    var btn = document.getElementById('memories-load-more');
    if (btn) {
      btn.addEventListener('click', function () { renderBatch(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
