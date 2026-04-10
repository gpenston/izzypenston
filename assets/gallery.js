(function () {
  var BATCH_SIZE = 18;
  var photos = [];
  var shown = 0;
  var grid = document.getElementById('gallery-grid');
  var loadMoreTile = null;

  function createItem(photo) {
    var div = document.createElement('div');
    div.className = 'gallery-item' + (photo.wide ? ' wide' : '');
    div.setAttribute('data-index', photos.indexOf(photo));
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', photo.caption || ('Photo ' + (photos.indexOf(photo) + 1) + ' of Izzy'));

    var img = document.createElement('img');
    img.src = '/assets/photos/' + photo.file;
    img.alt = photo.caption || 'Photo of Izzy';
    img.loading = 'lazy';
    div.appendChild(img);

    if (photo.caption) {
      var cap = document.createElement('div');
      cap.className = 'gallery-caption-text';
      cap.textContent = photo.caption;
      div.appendChild(cap);
    }

    div.addEventListener('click', function () {
      if (window.openLightbox) window.openLightbox(photos.indexOf(photo));
    });
    div.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (window.openLightbox) window.openLightbox(photos.indexOf(photo));
      }
    });

    return div;
  }

  function renderBatch() {
    // Remove existing load-more tile before adding new photos
    if (loadMoreTile && loadMoreTile.parentNode) {
      loadMoreTile.parentNode.removeChild(loadMoreTile);
    }

    var end = Math.min(shown + BATCH_SIZE, photos.length);
    for (var i = shown; i < end; i++) {
      grid.appendChild(createItem(photos[i]));
    }
    shown = end;

    // Add load-more tile if there are more photos
    if (shown < photos.length) {
      loadMoreTile = document.createElement('div');
      loadMoreTile.className = 'gallery-item gallery-load-more-tile';
      loadMoreTile.setAttribute('role', 'button');
      loadMoreTile.setAttribute('tabindex', '0');
      loadMoreTile.setAttribute('aria-label', 'Load more photos');
      loadMoreTile.innerHTML = '<span class="load-more-label">Load More</span>';
      loadMoreTile.addEventListener('click', function () { renderBatch(); });
      loadMoreTile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderBatch(); }
      });
      grid.appendChild(loadMoreTile);
    }
  }

  function init() {
    if (!grid) return;

    fetch('/assets/photos/manifest.json?v=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        photos = data.filter(function (p) { return !p.hidden; }).sort(function (a, b) { return a.order - b.order; });
        if (photos.length === 0) {
          grid.innerHTML = '<p style="color:var(--text-tertiary);grid-column:1/-1;text-align:center;">Photos coming soon.</p>';
          return;
        }
        renderBatch();
      })
      .catch(function () {
        grid.innerHTML = '<p style="color:var(--text-tertiary);grid-column:1/-1;text-align:center;">Photos coming soon.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose photos array for lightbox
  window.getGalleryPhotos = function () { return photos; };
}());
