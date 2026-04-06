(function () {
  var backdrop = document.getElementById('memory-modal');
  var modal = backdrop ? backdrop.querySelector('.modal') : null;
  var closeBtn = document.getElementById('modal-close');
  var openBtn = document.getElementById('share-memory-btn');
  var form = document.getElementById('memory-form');
  var formState = document.getElementById('modal-form-state');
  var thanksState = document.getElementById('modal-thanks-state');
  var triggerEl = null;

  function open() {
    if (!backdrop) return;
    triggerEl = document.activeElement;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var firstInput = modal.querySelector('input:not([type="hidden"]):not([style*="display:none"])');
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
