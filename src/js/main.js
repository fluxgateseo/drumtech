// Small progressive enhancements. Every page works without this file.
(() => {
  // Mobile navigation.
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  // Tab lists: arrow-key navigation between tabs.
  const arrowKeys = (list, onSelect) => {
    list.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = [...list.querySelectorAll('[role="tab"]')];
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      onSelect(next);
    });
  };

  // Homepage directory filter.
  const dirTabs = document.querySelector('[data-filter-group="directory"]');
  if (dirTabs) {
    const rows = [...document.querySelectorAll('.directory__row')];
    const select = (tab) => {
      dirTabs.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      const f = tab.dataset.filter;
      rows.forEach((r) => (r.hidden = f !== 'all' && r.dataset.group !== f));
    };
    dirTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab);
    });
    arrowKeys(dirTabs, select);
  }

  // "How it works" steps.
  const steps = document.querySelector('.steps');
  if (steps) {
    const select = (tab) => {
      steps.querySelectorAll('[role="tab"]').forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    steps.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab);
    });
    arrowKeys(steps, select);
  }

  // Listing search.
  const search = document.querySelector('[data-search]');
  if (search) {
    const cards = [...document.querySelectorAll(`#${search.dataset.search} .card`)];
    const empty = document.getElementById(`${search.dataset.search}-empty`);
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach((c) => {
        const hit = !q || c.dataset.title.includes(q) || c.textContent.toLowerCase().includes(q);
        c.hidden = !hit;
        if (hit) shown += 1;
      });
      if (empty) empty.hidden = shown > 0;
    });
  }

  // Table of contents: highlight the section being read.
  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const headings = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const setActive = (id) => tocLinks.forEach((a) => a.classList.toggle('is-active', a === byId.get(id)));
    const observer = new IntersectionObserver(
      () => {
        // Active = last heading that has scrolled past the top third.
        const line = window.innerHeight * 0.33;
        let current = headings[0];
        for (const h of headings) if (h.getBoundingClientRect().top < line) current = h;
        setActive(current.id);
      },
      { rootMargin: '0px 0px -60% 0px', threshold: [0, 1] }
    );
    headings.forEach((h) => observer.observe(h));
    setActive(headings[0]?.id);
  }
})();
