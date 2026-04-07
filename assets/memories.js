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
    });

    return openLightbox;
  }

  // Lazily built on first use
  var openMemoryLightbox = null;

  // ===== Photo pile =====

  // Paperclip SVG path
  var PAPERCLIP_SVG = '<svg class="pile-clip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';

  function createPhotoPile(photos, cardEl) {
    if (!photos || photos.length === 0) return null;

    cardEl.classList.add('has-photos');

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

    pile.innerHTML = PAPERCLIP_SVG;
    pile.appendChild(stack);

    var labelEl = document.createElement('span');
    labelEl.className = 'pile-label';
    labelEl.textContent = label;
    pile.appendChild(labelEl);

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

    var name = document.createElement('div');
    name.className = 'memory-name';
    name.textContent = memory.name;
    div.appendChild(name);

    if (memory.relation) {
      var rel = document.createElement('div');
      rel.className = 'memory-relation';
      rel.textContent = memory.relation;
      div.appendChild(rel);
    }

    var text = document.createElement('p');
    text.className = 'memory-text';
    text.textContent = memory.text;
    div.appendChild(text);

    if (memory.photos && memory.photos.length > 0) {
      var pile = createPhotoPile(memory.photos, div);
      if (pile) div.appendChild(pile);
    }

    return div;
  }

  function renderBatch() {
    var end = Math.min(shown + BATCH_SIZE, memories.length);
    for (var i = shown; i < end; i++) {
      list.appendChild(createCard(memories[i], i));
    }
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
