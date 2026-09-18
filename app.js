(() => {
  'use strict';

  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const year = document.getElementById('year');
  // ضع رابط الاستقبال الحقيقي هنا مرة واحدة بعد إنشائه.
  // يدعم Formspree أو Web App في Google Apps Script.
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxDVCVBmQiM_3enAt0FojxHmdQ12Auoyw8a897-z334QXWnOH3ysgcRfxnnLPsVKMS1HQ/exec';

  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formMsg = document.getElementById('formMsg');

  if (year) year.textContent = String(new Date().getFullYear());

  const closeMenu = () => {
    if (!menuBtn || !mobileMenu) return;
    mobileMenu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'فتح القائمة');
  };

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const willOpen = mobileMenu.hidden;
      mobileMenu.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', String(willOpen));
      menuBtn.setAttribute('aria-label', willOpen ? 'إغلاق القائمة' : 'فتح القائمة');
    });

    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  }



  // تنقل بنمط صفحات حقيقية داخل ملف واحد: يظهر محتوى الصفحة المطلوبة فقط.
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const viewSections = Array.from(document.querySelectorAll('[data-view]'));
  const consultationCtas = Array.from(document.querySelectorAll('a[href="#consultation"]'));
  const validViews = new Set(['home', 'services', 'systems', 'service-web', 'service-automation', 'service-branding', 'demo-access', 'process', 'about', 'faq', 'consultation']);

  const navForView = (view) => {
    if (view === 'demo-access') return 'systems';
    if (view === 'consultation') return 'consultation';
    if (view === 'faq') return 'about';
    if (view.startsWith('service-')) return 'services';
    return view;
  };

  const setActiveNav = (view) => {
    const activeNav = navForView(view);
    navLinks.forEach((link) => {
      const active = link.dataset.nav === activeNav;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    consultationCtas.forEach((link) => {
      if (!link.classList.contains('desktop-cta')) return;
      const active = view === 'consultation';
      link.classList.toggle('cta-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const getViewFromHash = () => {
    const id = (window.location.hash || '#home').slice(1);
    return validViews.has(id) ? id : 'home';
  };

  const renderView = (view, options = {}) => {
    const nextView = validViews.has(view) ? view : 'home';
    viewSections.forEach((section) => {
      section.hidden = section.dataset.view !== nextView;
    });
    setActiveNav(nextView);
    document.body.dataset.currentView = nextView;

    const behavior = options.behavior || 'auto';
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior });
    });
  };

  const navigateTo = (view, options = {}) => {
    const nextView = validViews.has(view) ? view : 'home';
    if (options.replace) history.replaceState(null, '', `#${nextView}`);
    else history.pushState(null, '', `#${nextView}`);
    renderView(nextView, { behavior: options.behavior || 'auto' });
    // ضمان بدء كل صفحة من أعلى بدون أي تعديل بصري على التصميم.
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  // كل رابط داخلي يفتح "صفحة" واحدة فقط، بدل إظهار أجزاء الأقسام التالية تحته.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href')?.slice(1);
      if (!id || !validViews.has(id)) return;
      event.preventDefault();
      navigateTo(id);
      if (link.closest('#mobileMenu')) closeMenu();
    });
  });

  window.addEventListener('popstate', () => renderView(getViewFromHash()));
  window.addEventListener('hashchange', () => renderView(getViewFromHash()));

  // أول فتح للملف: اعرض الصفحة المطلوبة فقط.
  const initialView = getViewFromHash();
  if (!window.location.hash || !validViews.has(window.location.hash.slice(1))) {
    history.replaceState(null, '', `#${initialView}`);
  }
  renderView(initialView);

  // تعبئة نوع الخدمة تلقائيًا بنموذج الاستشارة حسب صفحة الخدمة اللي جاء منها الزائر.
  document.querySelectorAll('[data-service-type]').forEach((link) => {
    link.addEventListener('click', () => {
      const type = link.dataset.serviceType || '';
      const serviceSelect = document.getElementById('serviceType');
      if (serviceSelect && type) serviceSelect.value = type;
    });
  });

  // اختيار النظام التجريبي من بطاقة النظام ثم نقل المستخدم إلى قسم التجربة.
  const demoSystem = document.getElementById('demoSystem');
  document.querySelectorAll('[data-demo-system]').forEach((link) => {
    link.addEventListener('click', () => {
      const system = link.dataset.demoSystem || '';
      if (demoSystem) demoSystem.value = system;
    });
  });

  const demoContinueBtn = document.getElementById('demoContinueBtn');
  const demoRequestForm = document.getElementById('demoRequestForm');
  const demoFormMsg = document.getElementById('demoFormMsg');
  const serviceTypeSelect = document.getElementById('serviceType');
  const detailsField = document.getElementById('details');
  const demoDuration = document.getElementById('demoDuration');
  const requestTypeField = document.getElementById('requestType');
  const systemField = document.getElementById('systemField');
  const requestedDemoSystem = document.getElementById('requestedDemoSystem');
  const requestedDemoDuration = document.getElementById('requestedDemoDuration');

  if (demoRequestForm) {
    demoRequestForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const system = demoSystem?.value || '';
      const duration = demoDuration?.value || '';
      if (!system) {
        if (demoFormMsg) {
          demoFormMsg.textContent = 'اختر النظام المطلوب تجربته.';
          demoFormMsg.className = 'form-message error';
        }
        demoSystem?.focus();
        return;
      }

      const systemLabel = demoSystem?.selectedOptions?.[0]?.textContent || 'النظام';
      const durationLabel = demoDuration?.selectedOptions?.[0]?.textContent || 'مدة محددة';
      if (serviceTypeSelect) serviceTypeSelect.value = 'erp';
      if (requestTypeField) requestTypeField.value = 'demo';
      if (requestedDemoSystem) requestedDemoSystem.value = system;
      if (systemField) systemField.value = system;
      if (requestedDemoDuration) requestedDemoDuration.value = duration;
      if (detailsField) detailsField.value = `طلب رابط تجريبي: ${systemLabel} — المدة: ${durationLabel}.`;
      if (demoFormMsg) demoFormMsg.textContent = '';
      window.location.hash = '#consultation';
    });
  }

  const fields = {
    fullName: {
      el: document.getElementById('fullName'),
      validate: (value) => value.trim().length >= 2 ? '' : 'اكتب الاسم بشكل صحيح.'
    },
    phone: {
      el: document.getElementById('phone'),
      validate: (value) => /^[+\d][\d\s()-]{7,18}$/.test(value.trim()) ? '' : 'أدخل رقم جوال صحيحًا.'
    },
    serviceType: {
      el: document.getElementById('serviceType'),
      validate: (value) => value ? '' : 'اختر الخدمة المطلوبة.'
    }
  };

  const setFieldError = (key, message) => {
    const config = fields[key];
    const output = document.querySelector(`[data-error-for="${key}"]`);
    if (!config?.el || !output) return;
    output.textContent = message;
    config.el.closest('.field')?.classList.toggle('has-error', Boolean(message));
    config.el.setAttribute('aria-invalid', String(Boolean(message)));
  };

  Object.entries(fields).forEach(([key, config]) => {
    if (!config.el) return;
    const eventName = config.el.tagName === 'SELECT' ? 'change' : 'blur';
    config.el.addEventListener(eventName, () => setFieldError(key, config.validate(config.el.value)));
  });

  const showFormMessage = (text, type = '') => {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = `form-message ${type}`.trim();
  };

  if (form && submitBtn) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      showFormMessage('');

      let firstInvalid = null;
      Object.entries(fields).forEach(([key, config]) => {
        const message = config.validate(config.el?.value || '');
        setFieldError(key, message);
        if (message && !firstInvalid) firstInvalid = config.el;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        showFormMessage('راجع الحقول المطلوبة ثم أعد المحاولة.', 'error');
        return;
      }

      const trap = document.getElementById('companyWebsite');
      if (trap?.value) return;

      if (systemField && !systemField.value) systemField.value = serviceTypeSelect?.value || 'consultation';

      const endpoint = (FORM_ENDPOINT || form.getAttribute('action') || '').trim();
      if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
        showFormMessage('النموذج جاهز من ناحية الواجهة، لكنه لم يُربط بعد بوجهة استقبال الطلبات.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'جارٍ الإرسال...';

      
      try {
        // إرسال مباشر إلى Apps Script عن طريق form POST.
        // يعمل حتى عند فتح الموقع محليًا عبر file:// بدون مشكلة CORS.
        const frameName = 'eamarSubmitFrame';
        let frame = document.getElementById(frameName);
        if (!frame) {
          frame = document.createElement('iframe');
          frame.id = frameName;
          frame.name = frameName;
          frame.style.display = 'none';
          document.body.appendChild(frame);
        }

        const previousAction = form.getAttribute('action');
        const previousTarget = form.getAttribute('target');
        const previousMethod = form.getAttribute('method');

        form.setAttribute('action', endpoint);
        form.setAttribute('method', 'POST');
        form.setAttribute('target', frameName);

        const restoreFormAttrs = () => {
          if (previousAction !== null) form.setAttribute('action', previousAction);
          else form.removeAttribute('action');
          if (previousTarget !== null) form.setAttribute('target', previousTarget);
          else form.removeAttribute('target');
          if (previousMethod !== null) form.setAttribute('method', previousMethod);
          else form.removeAttribute('method');
        };

        let completed = false;
        const onFrameLoad = () => {
          if (completed) return;
          completed = true;
          restoreFormAttrs();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال طلب الاستشارة';
          }
          if (formMsg) {
            formMsg.textContent = 'تم إرسال طلبك بنجاح.';
            formMsg.className = 'form-message success';
          }
          form.reset();
          if (requestTypeField) requestTypeField.value = 'consultation';
          if (requestedDemoSystem) requestedDemoSystem.value = '';
          if (requestedDemoDuration) requestedDemoDuration.value = '';
          if (systemField) systemField.value = '';
          Object.keys(fields).forEach((key) => setFieldError(key, ''));
          frame.removeEventListener('load', onFrameLoad);
        };

        frame.addEventListener('load', onFrameLoad, { once: true });
        form.submit();

        // احتياطًا: إذا منع المتصفح قراءة استجابة الإطار، نظهر النجاح بعد وقت قصير
        // لأن الطلب نفسه يكون قد أُرسل إلى Apps Script.
        setTimeout(() => {
          if (completed) return;
          completed = true;
          restoreFormAttrs();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال طلب الاستشارة';
          }
          if (formMsg) {
            formMsg.textContent = 'تم إرسال طلبك.';
            formMsg.className = 'form-message success';
          }
          form.reset();
          if (requestTypeField) requestTypeField.value = 'consultation';
          if (requestedDemoSystem) requestedDemoSystem.value = '';
          if (requestedDemoDuration) requestedDemoDuration.value = '';
          if (systemField) systemField.value = '';
          Object.keys(fields).forEach((key) => setFieldError(key, ''));
          try { frame.removeEventListener('load', onFrameLoad); } catch (_) {}
        }, 2500);

      } catch (error) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال طلب الاستشارة';
          }
        if (formMsg) {
          formMsg.textContent = 'تعذر إرسال الطلب. حاول مرة أخرى.';
          formMsg.className = 'form-message error';
        }
      }
    });
  }
})();
