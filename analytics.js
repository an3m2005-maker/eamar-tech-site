/* Google Analytics 4 — السنجك تك (G-R4CYBJ6Y34) */
(function () {
  var GA_ID = 'G-R4CYBJ6Y34';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  function track(name, params) {
    try { gtag('event', name, params || {}); } catch (_) {}
  }

  // نقرات واتساب والإيميل والاتصال
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var label = (a.textContent || '').trim().slice(0, 80);
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(a.href)) {
      track('contact_whatsapp', { link_text: label, page_path: location.pathname });
    } else if (href.indexOf('mailto:') === 0) {
      track('contact_email', { link_text: label, page_path: location.pathname });
    } else if (href.indexOf('tel:') === 0) {
      track('contact_phone', { link_text: label, page_path: location.pathname });
    }
  }, true);

  // طلب الاستشارة / طلب رابط تجريبي: يُسجَّل عند ظهور رسالة النجاح فقط
  function watchForm(msgId) {
    var msg = document.getElementById(msgId);
    if (!msg || !window.MutationObserver) return;
    var sent = false;
    var formType = 'consultation';
    var form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', function () {
      var req = document.getElementById('requestType');
      formType = (req && req.value) || 'consultation';
    }, true);
    new MutationObserver(function () {
      if (sent || !msg.classList.contains('success')) return;
      sent = true;
      track('generate_lead', { form_type: formType });
      setTimeout(function () { sent = false; }, 5000);
    }).observe(msg, { attributes: true, attributeFilter: ['class'] });
  }

  function init() { watchForm('formMsg'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
