(function () {
  var BATCH_SIZE = 6;
  var memories = [];
  var shown = 0;
  var list = document.getElementById('memories-list');
  var btnWrap = document.getElementById('memories-load-more-wrap');

  function createCard(memory) {
    var div = document.createElement('div');
    div.className = 'memory-card';

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
      list.appendChild(createCard(memories[i]));
    }
    shown = end;
    if (shown >= memories.length && btnWrap) {
      btnWrap.style.display = 'none';
    }
  }

  function init() {
    if (!list) return;

    fetch('/assets/memories.json')
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
        // Silently fail — no memories to show yet
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
