/* CreativeX — global Webflow motion. Existing section sequences stay independent. */
(function () {
  'use strict';
  if (window.CreativeX) return;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const exclude = '.section-observability,.section-bussiness,.images-loop-wrapper,[data-cx-motion="off"]';
  const cleanups = [], splits = [], tweens = [];
  const prepared = new Set(), revealed = new WeakSet();
  let gsap, ST, SplitText, ctx, lenis, curtain, ownLenis = false, active = false;
  let generation = 0, leaving = false, navigationTimer, refreshTimer;
  const api = window.CreativeX = {
    version: '0.2.0',
    get reducedMotion() { return media.matches; },
    get lenis() { return lenis; },
    refresh() { if (active) { ctx.add(prepare); ST.refresh(); } },
    destroy
  };
  function listen(target, name, fn) {
    target.addEventListener(name, fn);
    cleanups.push(() => target.removeEventListener(name, fn));
  }
  function dependency(name, url) {
    if (window[name]) return Promise.resolve(window[name]);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error(name + ' timed out')), 8000);
      function finish(error) {
        clearTimeout(timer); script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve(window[name]);
      }
      script.src = url;
      script.onload = () => finish(window[name] ? null : new Error(name + ' unavailable'));
      script.onerror = () => finish(new Error(name + ' unavailable'));
      document.head.appendChild(script);
    });
  }
  function reveal(element) {
    if (prepared.has(element) || !element.getClientRects().length || getComputedStyle(element).visibility === 'hidden' || element.closest(exclude)) return;
    if (element.querySelector('a,button,input,select,textarea,iframe,svg,img')) return;
    prepared.add(element);
    if (element.getBoundingClientRect().bottom < 0) { revealed.add(element); return; }
    const hero = !!element.closest('.section-hero'), title = /^H\d$/.test(element.tagName);
    splits.push(SplitText.create(element, {
      type: 'lines', mask: 'lines', linesClass: 'cx-line', autoSplit: true,
      onSplit(self) {
        if (revealed.has(element)) return gsap.set(self.lines, { yPercent: 0, opacity: 1 });
        const tween = gsap.fromTo(self.lines, { yPercent: title ? 110 : 65, opacity: title ? 1 : 0 }, {
          yPercent: 0, opacity: 1, duration: title ? 1.05 : 0.8, ease: 'power3.out',
          stagger: title ? 0.11 : 0.065, delay: hero ? (title ? 0.12 : 0.4) : 0,
          onComplete: () => revealed.add(element),
          scrollTrigger: hero ? undefined : { trigger: element, start: 'top 92%', once: true }
        });
        tweens.push(tween); return tween;
      }
    }));
  }
  function button(element, textElement) {
    if (prepared.has(element) || element.closest('[data-cx-motion="off"]')) return;
    const label = textElement || element.querySelector('.button-text');
    if (!label || !label.textContent.trim() || label.querySelector('a,button,input')) return;
    prepared.add(element);
    const leading = getComputedStyle(label).lineHeight;
    const previousLeading = label.style.getPropertyValue('--cx-original-leading');
    label.style.setProperty('--cx-original-leading', leading === 'normal' ? '1.4em' : leading);
    const row = document.createElement('span'); row.className = 'cx-button-row';
    while (label.firstChild) row.appendChild(label.firstChild);
    const copy = row.cloneNode(true);
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    copy.classList.add('cx-button-copy'); copy.setAttribute('aria-hidden', 'true');
    label.classList.add('cx-button-label'); label.append(row, copy);
    let tween;
    function move(enter) {
      if (tween) tween.kill();
      const distance = row.getBoundingClientRect().height + parseFloat(getComputedStyle(label).fontSize) * 0.35;
      tween = gsap.to([row, copy], { y: enter ? -distance : 0, duration: 0.45, ease: 'power3.out', overwrite: true });
    }
    listen(element, 'pointerenter', e => { if (e.pointerType !== 'touch') move(true); });
    listen(element, 'pointerleave', () => { if (!element.matches(':focus-visible')) move(false); });
    listen(element, 'focus', () => move(true)); listen(element, 'blur', () => move(false));
    cleanups.push(() => {
      if (tween) tween.kill(); copy.remove();
      while (row.firstChild) label.insertBefore(row.firstChild, row);
      row.remove(); label.classList.remove('cx-button-label');
      if (previousLeading) label.style.setProperty('--cx-original-leading', previousLeading);
      else label.style.removeProperty('--cx-original-leading');
    });
  }
  function prepare() {
    document.querySelectorAll('h1.title--1,h2.title--2,h2.title--3,h3.title--2,h3.title--3,p.paragraph,[data-cx-reveal]').forEach(reveal);
    document.querySelectorAll('a.button,button.button,[data-cx-button]').forEach(element => button(element));
    document.querySelectorAll('.nav__dropdown-wrapper').forEach(element => {
      button(element, element.querySelector('.navbar-link-text'));
    });
    document.querySelectorAll('.navbar-link-text').forEach(label => {
      button(label.closest('a,button,.nav__dropdown-wrapper') || label, label);
    });
    document.querySelectorAll('.footer-link').forEach(element => {
      button(element, element.querySelector('.footer-link-text') || element);
    });
  }
  function clearEntry() {
    document.documentElement.classList.remove('cx-entering'); clearTimeout(window.cxEntryFallback);
  }
  function reset() {
    clearTimeout(navigationTimer); leaving = false;
    if (curtain && gsap) { gsap.killTweensOf(curtain); gsap.set(curtain, { yPercent: 100 }); curtain.style.pointerEvents = 'none'; }
    if (lenis && ownLenis) lenis.start(); clearEntry();
  }
  function navigation() {
    curtain = document.createElement('div'); curtain.className = 'cx-transition';
    curtain.setAttribute('aria-hidden', 'true'); document.body.appendChild(curtain);
    const arriving = document.documentElement.classList.contains('cx-entering');
    gsap.set(curtain, { y: 0, yPercent: arriving ? 0 : 100 }); clearEntry();
    if (arriving) tweens.push(gsap.to(curtain, { yPercent: -100, duration: 0.7, ease: 'power3.inOut' }));
    listen(document, 'click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link || link.closest('[data-cx-transition="off"]') || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, location.href);
      if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) {
        if (url.hash.length < 2 || !lenis) return;
        let target;
        try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (_) { return; }
        if (!target) return;
        event.preventDefault(); lenis.scrollTo(target, { offset: -90 }); history.pushState(null, '', url.href);
        const oldTabindex = target.getAttribute('tabindex');
        if (oldTabindex === null) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (oldTabindex === null) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        return;
      }
      if (/\.(pdf|zip|docx?|xlsx?|png|jpe?g|svg|mp4|webm)$/i.test(url.pathname)) return;
      event.preventDefault(); if (leaving) return; leaving = true;
      if (lenis && ownLenis) lenis.stop(); curtain.style.pointerEvents = 'auto';
      function go() { try { sessionStorage.setItem('cx-next-page', url.href); } catch (_) {} location.assign(url.href); }
      navigationTimer = setTimeout(go, 1100);
      gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut', overwrite: true,
        onComplete: () => { clearTimeout(navigationTimer); go(); }
      });
    });
    listen(window, 'pageshow', event => { if (event.persisted) reset(); });
    listen(window, 'pagehide', () => clearTimeout(navigationTimer));
  }
  function destroy() {
    generation++; active = false; clearTimeout(refreshTimer); reset();
    cleanups.splice(0).reverse().forEach(fn => fn());
    tweens.splice(0).forEach(tween => tween.kill());
    if (ctx) { ctx.revert(); ctx = null; }
    splits.splice(0).forEach(split => split.revert()); prepared.clear();
    if (lenis && ownLenis) lenis.destroy(); lenis = null; ownLenis = false;
    if (curtain) curtain.remove(); curtain = null; clearEntry();
  }
  async function start() {
    const current = ++generation;
    if (media.matches) { clearEntry(); return; }
    try {
      gsap = await dependency('gsap', 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js');
      const libraries = await Promise.all([
        dependency('ScrollTrigger', 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js'),
        dependency('SplitText', 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js'),
        dependency('Lenis', 'https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js').catch(() => null)
      ]);
      if (current !== generation || media.matches) return;
      ST = libraries[0]; SplitText = libraries[1]; gsap.registerPlugin(ST, SplitText);
      if (document.fonts) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]);
      if (current !== generation || media.matches) return;
      active = true;
      ctx = gsap.context(() => {
        prepare();
        const heroButtons = document.querySelectorAll('.section-hero .button');
        if (heroButtons.length) gsap.from(heroButtons, { y: 18, opacity: 0, duration: 0.8, delay: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' });
      });
      if (window.lenis && typeof window.lenis.scrollTo === 'function') lenis = window.lenis;
      else if (libraries[2]) {
        ownLenis = true;
        lenis = new libraries[2]({ lerp: 0.14, smoothWheel: true, syncTouch: false, autoRaf: false,
          prevent: node => !!node.closest('[data-lenis-prevent],.w-dropdown-list,.w-nav-overlay') });
        lenis.on('scroll', ST.update);
        const tick = time => lenis && lenis.raf(time * 1000);
        gsap.ticker.add(tick); cleanups.push(() => gsap.ticker.remove(tick));
      }
      navigation(); listen(window, 'load', () => ST.refresh());
      listen(document, 'click', () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(api.refresh, 180); });
      ST.refresh();
    } catch (error) { destroy(); console.warn('[CreativeX] Motion unavailable; native content remains readable.', error); }
  }
  media.addEventListener('change', () => { destroy(); if (!media.matches) start(); });
  window.Webflow = window.Webflow || []; window.Webflow.push(start);
})();
