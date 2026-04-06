(function () {
  var backdrop, img, caption, prevBtn, nextBtn, closeBtn;
  var currentIndex = -1;
  var triggerEl = null;

  function build() {
    backdrop = document.createElement('div');
    backdrop.className = 'lightbox-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'Photo viewer');

    closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close photo viewer');
    closeBtn.innerHTML = '&times;';

    prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-nav lightbox-prev';
    prevBtn.setAttribute('aria-label', 'Previous photo');
    prevBtn.innerHTML = '&#8249;';

    nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-nav lightbox-next';
    nextBtn.setAttribute('aria-label', 'Next photo');
    nextBtn.innerHTML = '&#8250;';

    img = document.createElement('img');
    img.className = 'lightbox-img';
    img.alt = '';

    caption = document.createElement('div');
    caption.className = 'lightbox-caption';

    backdrop.appendChild(closeBtn);
    backdrop.appendChild(prevBtn);
    backdrop.appendChild(img);
    backdrop.appendChild(nextBtn);
    backdrop.appendChild(caption);
    document.body.appendChild(backdrop);

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { navigate(-1); });
    nextBtn.addEventListener('click', function () { navigate(1); });
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    document.addEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (!backdrop || !backdrop.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  }

  function show(index) {
    var photos = window.getGalleryPhotos ? window.getGalleryPhotos() : [];
    if (!photos.length || index < 0 || index >= photos.length) return;
    currentIndex = index;
    var photo = photos[index];
    img.src = '/assets/photos/' + photo.file;
    img.alt = photo.caption || 'Photo of Izzy';
    caption.textContent = photo.caption || '';
    prevBtn.style.display = index > 0 ? '' : 'none';
    nextBtn.style.display = index < photos.length - 1 ? '' : 'none';
  }

  function navigate(dir) {
    show(currentIndex + dir);
  }

  function open(index) {
    if (!backdrop) build();
    triggerEl = document.activeElement;
    show(index);
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    currentIndex = -1;
    if (triggerEl) triggerEl.focus();
  }

  window.openLightbox = open;
}());
