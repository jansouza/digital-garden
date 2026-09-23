document.addEventListener('DOMContentLoaded', function () {
  var images = Array.prototype.slice.call(
    document.querySelectorAll('#main-content img')
  );
  if (!images.length) return;

  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Fechar">&times;</button>' +
    '<img alt="">' +
    '<p class="lightbox-caption"></p>';
  document.body.appendChild(overlay);

  var full = overlay.querySelector('img');
  var caption = overlay.querySelector('.lightbox-caption');
  var lastFocus = null;

  function open(img) {
    lastFocus = img;
    full.src = img.currentSrc || img.src;
    full.alt = img.alt;
    caption.textContent = img.alt;
    overlay.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    overlay.querySelector('.lightbox-close').focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    full.src = '';
    if (lastFocus) lastFocus.focus();
  }

  images.forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.title = 'Clique para ampliar';
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(img);
      }
    });
  });

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
});
