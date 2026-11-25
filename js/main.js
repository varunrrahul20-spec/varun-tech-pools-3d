(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile navigation toggle
  var menuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var isHidden = mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal observer
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // Consultation & Quote Request Form Handler (WhatsApp integration)
  var WHATSAPP_BASE_URL = 'https://wa.me/919642416913';
  var quoteForm = document.getElementById('quote-form');
  var consultBtn = document.getElementById('request-consultation-btn');
  var quoteConf = document.getElementById('quote-confirmation');
  var quoteConfMsg = document.getElementById('quote-confirmation-msg');

  function buildWhatsAppUrl() {
    var nameVal = ((document.getElementById('q-name') || {}).value || '').trim();
    var phoneVal = ((document.getElementById('q-phone') || {}).value || '').trim();
    var serviceVal = (document.getElementById('q-service') || {}).value || 'New Pool Construction';
    var cityVal = ((document.getElementById('q-city') || {}).value || '').trim();
    var notesVal = ((document.getElementById('q-notes') || {}).value || '').trim();
    var specEl = document.getElementById('form-spec-summary');
    var specText = specEl ? specEl.textContent.trim() : '';

    var lines = ['Hello Varun Tech Pools, I would like to request a consultation.'];
    if (nameVal) lines.push('Name: ' + nameVal);
    if (phoneVal) lines.push('Phone: ' + phoneVal);
    if (serviceVal) lines.push('Service: ' + serviceVal);
    if (cityVal) lines.push('Location: ' + cityVal);
    if (specText) lines.push(specText);
    if (notesVal) lines.push('Notes: ' + notesVal);

    return WHATSAPP_BASE_URL + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function showConsultationConfirmation() {
    if (!quoteConf) return;
    var nameVal = ((document.getElementById('q-name') || {}).value || '').trim() || 'there';
    var serviceVal = (document.getElementById('q-service') || {}).value || 'Pool Service';
    var st = window.getVarunPoolSummary ? window.getVarunPoolSummary() : { size: '24 × 12 ft', tile: 'Marine Cobalt' };
    if (quoteConfMsg) {
      quoteConfMsg.textContent =
        'Thank you, ' + nameVal + '! Opening WhatsApp for your ' + serviceVal + ' request (' + st.size + ', ' + st.tile + ') with K. Rathna Kumar\'s team.';
    }
    quoteConf.classList.remove('hidden');
  }

  if (consultBtn) {
    consultBtn.addEventListener('click', function () {
      consultBtn.href = buildWhatsAppUrl();
      showConsultationConfirmation();
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = buildWhatsAppUrl();
      if (consultBtn) consultBtn.href = url;
      showConsultationConfirmation();
      window.open(url, '_blank', 'noopener');
    });
  }
})();
