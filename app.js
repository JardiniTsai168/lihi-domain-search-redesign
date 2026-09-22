(() => {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile-menu');
  const mobileOverlay = document.querySelector('.nav-mobile-overlay');
  const submenuToggle = document.querySelector('.mobile-submenu-toggle');
  const mobileSubmenu = document.querySelector('.mobile-submenu');

  const closeMobileMenu = () => {
    hamburger?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('open');
    mobileOverlay?.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  hamburger?.addEventListener('click', () => {
    const willOpen = !mobileMenu?.classList.contains('open');
    hamburger.classList.toggle('active', willOpen);
    hamburger.setAttribute('aria-expanded', String(willOpen));
    mobileMenu?.classList.toggle('open', willOpen);
    mobileOverlay?.classList.toggle('open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
  });
  mobileOverlay?.addEventListener('click', closeMobileMenu);
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));
  submenuToggle?.addEventListener('click', () => {
    const willOpen = !mobileSubmenu?.classList.contains('open');
    mobileSubmenu?.classList.toggle('open', willOpen);
    submenuToggle.setAttribute('aria-expanded', String(willOpen));
  });
  window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 10), { passive: true });
  document.querySelectorAll('[data-footer-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('domain') || params.get('s') || 'werwerasfsf.com';

  const cleanDomain = (value) => {
    let result = String(value || '').trim().toLowerCase();
    result = result.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!result.includes('.')) result += '.com';
    return result.replace(/[^a-z0-9.-]/g, '') || 'yourbrand.com';
  };

  const domain = cleanDomain(requested);
  const stem = domain.split('.')[0] || 'yourbrand';
  const suggestions = [`${stem}.tw`, `${stem}.com.tw`, `${stem}.co`];
  const marketingDomain = `${stem}.link`;

  document.querySelectorAll('[data-domain]').forEach((node) => { node.textContent = domain; });
  document.querySelectorAll('[data-domain-value]').forEach((node) => { node.value = domain; });
  document.querySelectorAll('[data-suggestion]').forEach((node, index) => {
    node.textContent = suggestions[index] || `${stem}.net`;
  });
  document.querySelectorAll('[data-link-domain]').forEach((node) => {
    node.textContent = marketingDomain;
  });

  document.querySelectorAll('[data-search-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const field = form.querySelector('input[name="domain"]');
      const next = cleanDomain(field?.value);

      if (document.body.classList.contains('hub-page')) {
        document.querySelectorAll('[data-version-link]').forEach((link) => {
          const url = new URL(link.href);
          url.searchParams.set('domain', next);
          link.href = url.toString();
        });
        field.value = next;
        showToast(`已將 ${next} 套用到三個版本`);
        return;
      }

      window.location.search = `?domain=${encodeURIComponent(next)}`;
    });
  });

  document.querySelectorAll('[data-register]').forEach((button) => {
    button.addEventListener('click', () => {
      const hasMarketingDomain = document.querySelector('.domain-row-link input:checked, .perk-selectable input:checked');
      const selection = hasMarketingDomain ? `${domain} 與 ${marketingDomain}` : domain;
      showToast(`${selection} 已加入註冊清單（原型示意）`);
    });
  });

  document.querySelectorAll('[data-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('is-selected');
      button.textContent = button.classList.contains('is-selected') ? '已加入 ✓' : '加入';
    });
  });

  document.querySelectorAll('[data-bundle-checkbox]').forEach((checkbox) => {
    checkbox.addEventListener('change', updateBundle);
  });
  updateBundle();

  function updateBundle() {
    const checked = [...document.querySelectorAll('[data-bundle-checkbox]:checked')];
    const count = document.querySelector('[data-bundle-count]');
    const total = document.querySelector('[data-bundle-total]');
    if (count) count.textContent = `${checked.length} 個網域`;
    const basePrice = Number(total?.dataset.bundleBase || 0);
    const totalPrice = basePrice + checked.reduce((sum, checkbox) => sum + Number(checkbox.dataset.price || 399), 0);
    if (total) total.textContent = `NT$ ${totalPrice.toLocaleString('zh-TW')}`;
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(window.__lihiToastTimer);
    window.__lihiToastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }
})();
