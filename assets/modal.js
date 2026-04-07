(function () {
  var backdrop = document.getElementById('memory-modal');
  var modal = backdrop ? backdrop.querySelector('.modal') : null;
  var closeBtn = document.getElementById('modal-close');
  var openBtn = document.getElementById('share-memory-btn');
  var form = document.getElementById('memory-form');
  var formState = document.getElementById('modal-form-state');
  var thanksState = document.getElementById('modal-thanks-state');
  var photosInput = document.getElementById('memory-photos');
  var previewsEl = document.getElementById('memory-photo-previews');
  var triggerEl = null;

  // Resize an image file to max 1000px on longest side, returns a Promise<Blob>
  function resizeImage(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var maxDim = 1000;
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        if (w <= maxDim && h <= maxDim) {
          // No resize needed — return original as blob
          resolve(file);
          return;
        }
        var scale = Math.min(maxDim / w, maxDim / h);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) { resolve(blob); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  // Show thumbnail previews when files are selected
  if (photosInput && previewsEl) {
    photosInput.addEventListener('change', function () {
      previewsEl.innerHTML = '';
      var files = Array.from(photosInput.files).slice(0, 3);
      files.forEach(function (file) {
        var url = URL.createObjectURL(file);
        var wrap = document.createElement('div');
        wrap.className = 'photo-preview-item';
        var img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.onload = function () { URL.revokeObjectURL(url); };
        wrap.appendChild(img);
        previewsEl.appendChild(wrap);
      });
    });
  }

  function open() {
    if (!backdrop) return;
    triggerEl = document.activeElement;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var firstInput = modal.querySelector('input:not([type="hidden"]):not([style*="display:none"]):not([type="file"])');
    if (firstInput) firstInput.focus();
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    if (triggerEl) triggerEl.focus();
  }

  function handleKeydown(e) {
    if (!backdrop || !backdrop.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      close();
      return;
    }

    if (e.key === 'Tab') {
      var focusable = modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    var data = new FormData(form);

    // Gather up to 3 selected photo files
    var photoFiles = photosInput ? Array.from(photosInput.files).slice(0, 3) : [];

    // Validate size before processing
    for (var fi = 0; fi < photoFiles.length; fi++) {
      if (photoFiles[fi].size > 20 * 1024 * 1024) {
        alert('Each photo must be under 20 MB. Please choose smaller images.');
        return;
      }
    }

    // Remove the raw file input from FormData (we'll add resized versions)
    data.delete('photos');

    var resizePromises = photoFiles.map(function (file) { return resizeImage(file); });

    Promise.all(resizePromises).then(function (blobs) {
      blobs.forEach(function (blob, i) {
        data.append('photo_' + i, blob, 'photo_' + i + '.jpg');
      });

      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(function (response) {
        if (response.ok) {
          formState.style.display = 'none';
          thanksState.style.display = '';
          modal.setAttribute('aria-labelledby', 'modal-thanks-title');
          if (previewsEl) previewsEl.innerHTML = '';
          setTimeout(function () {
            close();
            setTimeout(function () {
              formState.style.display = '';
              thanksState.style.display = 'none';
              modal.setAttribute('aria-labelledby', 'modal-title');
              form.reset();
            }, 300);
          }, 3000);
        } else {
          alert('Something went wrong. Please try again or email your memory to memories@izzypenston.com.');
        }
      })
      .catch(function () {
        alert('Something went wrong. Please try again or email your memory to memories@izzypenston.com.');
      });
    });
  }

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
  }
  if (form) form.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', handleKeydown);

  // Handle #share deep link
  if (window.location.hash === '#share') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', open);
    } else {
      open();
    }
  }
}());
