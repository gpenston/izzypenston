(function () {
  var backdrop = document.getElementById('pronoun-modal');
  var modal = backdrop ? backdrop.querySelector('.modal') : null;
  var closeBtn = document.getElementById('pronoun-modal-close');
  var trigger = document.getElementById('pronoun-trigger');

  if (!backdrop || !modal || !trigger) return;

  function open() {
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!backdrop.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();

    if (e.key === 'Tab') {
      // Only one focusable element (close button), so trap focus there
      e.preventDefault();
      closeBtn.focus();
    }
  });
}());
