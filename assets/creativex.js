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
    if (element.matches('.button,[data-cx-button]')) { directionalButton(element, label); return; }
    const mask = document.createElement('span'); mask.className = 'cx-hover-mask';
    const row = document.createElement('span'); row.className = 'cx-hover-text';
    while (label.firstChild) row.appendChild(label.firstChild);
    const copy = row.cloneNode(true); copy.classList.add('cx-hover-copy');
    copy.setAttribute('aria-hidden', 'true');
    // Keep IDs unique if Webflow supplied styled spans inside the label.
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    label.classList.add('cx-hover-label'); mask.append(row, copy); label.append(mask);
    const original = SplitText.create(row, { type: 'words,chars', aria: 'auto' });
    const incoming = SplitText.create(copy, { type: 'words,chars', aria: 'none' });
    const stagger = { amount: Math.min(0.14, original.chars.length * 0.009), from: 'start' };
    const timeline = gsap.timeline({ paused: true, defaults: { duration: 0.55, ease: 'power3.inOut' } })
      .fromTo(original.chars, { yPercent: 0 }, { yPercent: -145, stagger }, 0)
      .fromTo(incoming.chars, { yPercent: 145 }, { yPercent: 0, stagger }, 0);
    let hovered = false, focused = false;
    function move() { if (hovered || focused) timeline.play(); else timeline.reverse(); }
    listen(element, 'pointerenter', e => { if (e.pointerType !== 'touch') { hovered = true; move(); } });
    listen(element, 'pointerleave', () => { hovered = false; move(); });
    listen(element, 'focus', () => { focused = true; move(); });
    listen(element, 'blur', () => { focused = false; move(); });
    cleanups.push(() => {
      timeline.kill(); original.revert(); incoming.revert();
      while (row.firstChild) label.insertBefore(row.firstChild, mask);
      mask.remove(); label.classList.remove('cx-hover-label');
    });
  }

  function directionalButton(element, label) {
    const clip = document.createElement('span'); clip.className = 'cx-button-fill';
    const circle = document.createElement('span'); circle.className = 'cx-button-circle';
    clip.setAttribute('aria-hidden', 'true'); clip.append(circle); element.prepend(clip);
    element.classList.add('cx-directional-button');
    const baseColor = getComputedStyle(label).color;
    const light = element.matches('.button-blue') || (!element.matches('.button-red') && baseColor === 'rgb(255, 255, 255)');
    const fillColor = element.getAttribute('data-cx-hover-bg') || (light ? '#cfe4fa' : '#003c4f');
    const textColor = element.getAttribute('data-cx-hover-color') || (light ? '#003c4f' : '#ffffff');
    circle.style.backgroundColor = fillColor;
    const previousColor = label.style.color;
    let hovered = false, focused = false, fillTween, colorTween;
    gsap.set(circle, { xPercent: -50, yPercent: -50, scale: 0 });
    function origin(event, animate) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = event ? Math.max(0, Math.min(rect.width, event.clientX - rect.left)) : rect.width / 2;
      const y = event ? Math.max(0, Math.min(rect.height, event.clientY - rect.top)) : rect.height / 2;
      // A circle must cover even the opposite corner when entered at an edge.
      const diameter = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) + 4;
      const vars = { left: x, top: y, width: diameter, height: diameter };
      if (animate) gsap.to(circle, { ...vars, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      else gsap.set(circle, vars);
    }
    function move() {
      const enter = hovered || focused;
      if (fillTween) fillTween.kill(); if (colorTween) colorTween.kill();
      fillTween = gsap.to(circle, { scale: enter ? 1 : 0, duration: enter ? 0.7 : 0.45,
        ease: enter ? 'back.out(1.5)' : 'power3.inOut', overwrite: 'auto' });
      colorTween = gsap.to(label, { color: enter ? textColor : baseColor, duration: enter ? 0.3 : 0.4, ease: 'power2.out', overwrite: 'auto' });
    }
    listen(element, 'pointerenter', event => {
      if (event.pointerType === 'touch') return;
      origin(event, hovered || focused); hovered = true; move();
    });
    listen(element, 'pointerleave', event => {
      hovered = false; if (!focused) origin(event, true); move();
    });
    listen(element, 'focus', () => {
      // Keyboard focus gets a centred fill; clicking must not latch the hover.
      focused = element.matches(':focus-visible');
      if (focused) { origin(null, hovered); move(); }
    });
    listen(element, 'blur', () => { focused = false; move(); });
    cleanups.push(() => {
      gsap.killTweensOf(circle); if (colorTween) colorTween.kill();
      label.style.color = previousColor; clip.remove(); element.classList.remove('cx-directional-button');
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
    document.querySelectorAll('.obs-card').forEach(floatCard);
  }
  function floatCard(card, index) {
    if (prepared.has(card) || card.closest('[data-cx-motion="off"]')) return;
    prepared.add(card);
    // Keep the scroll timeline on the card; float all image states together inside it.
    const layer = document.createElement('div'); layer.className = 'cx-obs-float-layer';
    while (card.firstChild) layer.appendChild(card.firstChild);
    card.appendChild(layer); card.classList.add('cx-obs-floating');
    const amplitude = () => (innerWidth < 768 ? 6 : 10) + index % 3 * 1.5;
    const loops = [
      gsap.fromTo(layer, { y: () => -amplitude() }, { y: amplitude, duration: 3.6 + index * 0.27, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
      gsap.fromTo(layer, { x: -3 }, { x: 3, duration: 5.2 + index * 0.31, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }),
      gsap.fromTo(layer, { rotation: -0.9 }, { rotation: 0.9, duration: 4.6 + index * 0.23, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true })
    ];
    loops.forEach((loop, axis) => loop.progress((index * 0.17 + axis * 0.23) % 1));
    let inView = false;
    function state() { loops.forEach(loop => loop.paused(!inView || document.hidden)); }
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; state(); }, { rootMargin: '70px' });
    observer.observe(card); listen(document, 'visibilitychange', state);
    cleanups.push(() => {
      observer.disconnect(); loops.forEach(loop => loop.kill());
      while (layer.firstChild) card.insertBefore(layer.firstChild, layer);
      layer.remove(); card.classList.remove('cx-obs-floating');
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
