(function () {
  var BATCH_SIZE = 6;
  var memories = [];
  var shown = 0;
  var list = document.getElementById('memories-list');
  var btnWrap = document.getElementById('memories-load-more-wrap');

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
