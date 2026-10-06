(() => {
  'use strict';

  // ⚙️ رقم واتساب للتواصل (بدون + وبدون 00). غيّره هنا فقط
  const WHATSAPP = '966550811194';

  // أزرار الشراء: لين يتفعّل متجر Lemon Squeezy (الرابط فيه YOUR-STORE) يتحول الزر لطلب عبر واتساب
  const names = { RESTAURANT: 'نظام المطاعم والتكاليف', CONTRACTING: 'نظام المقاولات والمشاريع', HESBAN: 'نظام حسبان للمناديب والتوزيع' };
  document.querySelectorAll('a[href*="YOUR-STORE"]').forEach((a) => {
    const code = a.getAttribute('href').split('/').pop();
    a.dataset.wa = 'أرغب في شراء النسخة الأساسية من ' + (names[code] || 'النظام');
    a.textContent = 'اطلب الآن';
  });

  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // قائمة الجوال
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    const close = () => {
      mobileMenu.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'فتح القائمة');
    };
    menuBtn.addEventListener('click', () => {
      const open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    });
    mobileMenu.querySelectorAll('a').forEach((l) => l.addEventListener('click', close));
    window.addEventListener('resize', () => { if (window.innerWidth > 820) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // عرض قسم واحد في كل مرة — بنفس طريقة تنقل الموقع
  const views = Array.from(document.querySelectorAll('[data-store-view]'));
  const tabs = Array.from(document.querySelectorAll('[data-store-nav]'));
  const ids = new Set(views.map((v) => v.dataset.storeView));
  const fallback = views.length ? views[0].dataset.storeView : '';

  const show = (id, scroll) => {
    const view = ids.has(id) ? id : fallback;
    views.forEach((v) => { v.hidden = v.dataset.storeView !== view; });
    tabs.forEach((t) => {
      const on = t.dataset.storeNav === view;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.addEventListener('hashchange', () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), false);
})();
