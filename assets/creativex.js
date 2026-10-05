/* CreativeX — global Webflow motion. Existing section sequences stay independent. */
(function () {
  'use strict';
  if (window.CreativeX) return;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const titleSelectors = '.title--1,.title--3,.title--2,.title-main,.highligts__title,.text-55-serif-medium,.case__title-main,.nl__title,.contact__title,.report-highligts__title';
  const revealSelectors = 'h1.title--1,h2.title--2,h2.title--3,h3.title--2,h3.title--3,p.paragraph,.text-big,.text-greed-medium-small,.p-big,.text-greed-regular,[data-cx-reveal]';
  const exclude = '.section-observability,.section-bussiness,.section-tabs,.images-loop-wrapper,.blog-slider,[data-cx-motion="off"]';
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
    // Hidden FAQ answers must keep their native markup when the dropdown opens.
    if (element.matches('.paragraph') && element.closest('.faq__dropdown')) return;
    const styledTitle = element.matches(titleSelectors);
    if (styledTitle && element.parentElement.closest(titleSelectors)) return;
    if (!styledTitle && element.parentElement.closest(revealSelectors + ',a,button')) return;
    if (prepared.has(element) || !element.getClientRects().length || (getComputedStyle(element).visibility === 'hidden' && !element.closest('.cx-media-obs')) || (!styledTitle && element.closest(exclude))) return;
    if (element.querySelector('a,button,input,select,textarea,iframe,svg,img')) return;
    prepared.add(element);
    if (element.getBoundingClientRect().bottom < 0) revealed.add(element);
    const animate = !media.matches && element.matches(revealSelectors) && !element.closest(exclude);
    cleanups.push(() => element.classList.remove('cx-title-lines'));
    const hero = !!element.closest('.section-hero'), title = /^H\d$/.test(element.tagName);
    splits.push(SplitText.create(element, {
      type: 'lines', mask: animate ? 'lines' : undefined, linesClass: 'cx-line', autoSplit: true,
      onSplit(self) {
        element.classList.toggle('cx-title-lines', styledTitle && animate && self.lines.length > 1);
        if (styledTitle && self.lines.length > 1) {
          const lastLine = self.lines[self.lines.length - 1];
          // Keep the serif line's baseline strut, as with an inline span in Webflow.
          const span = document.createElement('span'); span.className = 'span__greed';
          while (lastLine.firstChild) span.appendChild(lastLine.firstChild);
          lastLine.append(span);
        }
        if (!animate) return;
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
    document.querySelectorAll('.filter').forEach(collectionFilter);
    document.querySelectorAll('.blog-slider').forEach(blogSlider);
    document.querySelectorAll('.belief-slider').forEach(beliefSlider);
    document.querySelectorAll('.slider-tab-wrapper').forEach(cardTabs);
    document.querySelectorAll('.testimonials-cms').forEach(testimonialSlider);
    document.querySelectorAll('.section-tabs').forEach(mediaObservability);
    document.querySelectorAll(titleSelectors + ',' + revealSelectors).forEach(reveal);
    document.querySelectorAll('.category-wrapper').forEach(categoryPreview);
    document.querySelectorAll('.system__wrapper').forEach(systemOrbit);
    document.querySelectorAll('.algo__wrapper').forEach(campaignDrift);
    if (media.matches) return;
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
    document.querySelectorAll('.logo-wrapper').forEach(logoMarquee);
    document.querySelectorAll('.images-loop-wrapper').forEach(radialCards);
    document.querySelectorAll('.bussines-cards').forEach(businessReveal);
    document.querySelectorAll('.cta-wrapper-right').forEach(ctaCards);
    document.querySelectorAll('.solution-hero-wrapper').forEach(solutionHeroParallax);
    document.querySelectorAll('.ver-carousel__wrapper').forEach(verticalCarousel);
    document.querySelectorAll('.h-ver__img-parent.is--1,.h-ver__img-parent.is--2,.h-ver__img-parent.is--3').forEach(verticalHeroParallax);
    document.querySelectorAll('.h-about__img-parent').forEach(aboutHeroParallax);
  }
  function collectionFilter(filter) {
    if (prepared.has(filter) || filter.closest('[data-cx-motion="off"]')) return;
    let scope = filter.parentElement;
    while (scope && !scope.querySelector('.articles-list,.case__collection-list')) scope = scope.parentElement;
    const list = scope && scope.querySelector('.articles-list,.case__collection-list');
    const nav = filter.querySelector('.filter__nav');
    const options = Array.from(filter.querySelectorAll('.filter__text-wrapper'));
    if (!list || !nav || !options.length) return;
    prepared.add(filter); filter.classList.add('cx-collection-filter');
    const normalize = value => value.trim().normalize('NFKC').toLocaleLowerCase();
    const items = Array.from(list.children).filter(item => item.classList.contains('w-dyn-item'));
    const saved = [list,...items,...options].map(element => ({ element,
      attributes: ['style','role','tabindex','aria-pressed','aria-hidden','inert','data-filter-status'].map(name => [name,element.getAttribute(name)]) }));
    const label = filter.querySelector('.filter__toggle .filter__text'), originalLabel = label?.textContent;
    const all = document.createElement('button'); all.type = 'button'; all.className = 'cx-filter-all filter__text-wrapper'; all.textContent = 'All';
    nav.prepend(all);
    const empty = document.createElement('p'); empty.className = 'cx-filter-empty'; empty.textContent = 'No results in this category.'; empty.hidden = true; empty.setAttribute('role','status'); list.after(empty);
    const status = document.createElement('span'); status.className = 'cx-algo-sr'; status.setAttribute('role','status'); list.after(status);
    const seen = new Set(), buttons = [all];
    options.forEach(option => {
      const key = normalize(option.textContent);
      if (seen.has(key)) { option.style.display = 'none'; return; }
      seen.add(key); buttons.push(option);
      option.setAttribute('role','button'); option.setAttribute('tabindex','0');
    });
    const categories = item => {
      const metadata = item.querySelector('.cx-filter-meta');
      if (metadata) return Array.from(metadata.querySelectorAll('.w-dyn-item')).map(tag => normalize(tag.textContent));
      return Array.from(item.querySelectorAll('[data-filter-name],.button-secondary-radius .button-text,.category-tag,.text-tag'))
        .map(tag => normalize(tag.getAttribute('data-filter-name') || tag.textContent));
    };
    let active = 'all', motion;
    function select(button, instant = false) {
      const target = button === all ? 'all' : normalize(button.textContent);
      if (!instant && target === active) return;
      active = target; if (motion) motion.kill();
      buttons.forEach(b => { const selected = b === button; b.setAttribute('aria-pressed',String(selected)); b.setAttribute('data-filter-status',selected ? 'active' : 'not-active'); });
      if (label) label.textContent = target === 'all' ? originalLabel : button.textContent.trim();
      const visible = items.filter(item => getComputedStyle(item).display !== 'none');
      const matched = items.filter(item => target === 'all' || categories(item).includes(target));
      const duration = instant || media.matches ? 0 : .2;
      motion = gsap.timeline();
      motion.to(visible, { opacity: 0, y: -6, scale: .985, duration, ease:'power2.out' });
      motion.add(() => {
        items.forEach(item => { const show = matched.includes(item);
          const originalStyle = saved.find(entry => entry.element === item).attributes.find(([name]) => name === 'style')[1];
          if (originalStyle === null) item.removeAttribute('style'); else item.setAttribute('style',originalStyle);
          if (!show) item.style.display = 'none';
          item.setAttribute('aria-hidden',String(!show)); item.toggleAttribute('inert',!show);
        });
        empty.hidden = matched.length !== 0;
        status.textContent = matched.length + (matched.length === 1 ? ' result' : ' results');
        gsap.set(matched,{opacity:0,y:12,scale:.985});
      });
      motion.to(matched,{opacity:1,y:0,scale:1,duration:duration ? .4 : 0,stagger:duration ? .035 : 0,ease:'power3.out',onComplete:()=>{ gsap.set(matched,{clearProps:'opacity,transform'}); ST.refresh(); }});
    }
    function activate(event) {
      const button = event.target.closest('.filter__text-wrapper');
      if (!buttons.includes(button)) return;
      if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
      event.preventDefault(); select(button);
    }
    listen(nav,'click',activate); listen(nav,'keydown',activate);
    buttons.forEach(button => { button.setAttribute('aria-pressed',String(button === all)); button.setAttribute('data-filter-status',button === all ? 'active' : 'not-active'); });
    cleanups.push(()=>{
      if (motion) motion.kill(); all.remove(); empty.remove(); status.remove(); filter.classList.remove('cx-collection-filter'); if (label) label.textContent = originalLabel;
      saved.forEach(({element,attributes})=>attributes.forEach(([name,value])=>value === null ? element.removeAttribute(name) : element.setAttribute(name,value)));
    });
  }
  function blogSlider(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const track = wrapper.querySelector('.blog__highlights-collection-list');
    const items = track ? Array.from(track.children).filter(item => item.classList.contains('w-dyn-item')) : [];
    const buttons = Array.from(wrapper.querySelectorAll('.button-slider.is-previous,.button-slider.is-next'));
    if (!items.length || !buttons.length) return;
    prepared.add(wrapper); wrapper.classList.add('cx-blog-slider');
    const saved = [track, ...items, ...buttons].map(element => ({ element,
      attributes: ['style','role','tabindex','aria-label','aria-hidden','aria-disabled','inert'].map(name => [name, element.getAttribute(name)]) }));
    const initialX = Number(gsap.getProperty(track, 'x')) || 0;
    let active = 0, motion;
    buttons.forEach(button => {
      button.setAttribute('role', 'button'); button.setAttribute('tabindex', '0');
      button.setAttribute('aria-label', button.classList.contains('is-next') ? 'Article suivant' : 'Article précédent');
      button.setAttribute('aria-disabled', String(items.length < 2));
    });
    function select(index, instant = false) {
      active = (index + items.length) % items.length;
      if (motion) motion.kill();
      const card = items[active].getBoundingClientRect(), viewport = track.parentElement.getBoundingClientRect();
      const destination = (Number(gsap.getProperty(track, 'x')) || 0) + viewport.left + viewport.width / 2 - card.left - card.width / 2;
      items.forEach((item, i) => { item.setAttribute('aria-hidden', String(i !== active)); item.toggleAttribute('inert', i !== active); });
      motion = gsap.to(track, { x: destination, duration: instant || media.matches ? 0 : .9, ease: 'power3.inOut', overwrite: true });
    }
    function navigate(event) {
      const button = event.target.closest('.button-slider');
      if (!buttons.includes(button)) return;
      if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
      event.preventDefault();
      if (items.length > 1) select(active + (button.classList.contains('is-next') ? 1 : -1));
    }
    listen(wrapper, 'click', navigate); listen(wrapper, 'keydown', navigate);
    const resize = new ResizeObserver(() => select(active, true)); resize.observe(wrapper);
    items.forEach(item => resize.observe(item)); select(0, true);
    cleanups.push(() => {
      resize.disconnect(); if (motion) motion.kill(); wrapper.classList.remove('cx-blog-slider');
      saved.forEach(({element,attributes}) => attributes.forEach(([name,value]) => value === null ? element.removeAttribute(name) : element.setAttribute(name,value)));
    });
  }
  function beliefSlider(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const track = wrapper.querySelector('.slider-list'), viewport = wrapper.querySelector('.slider-cms');
    const buttons = Array.from(wrapper.querySelectorAll('.button-slider-belief.is-previous,.button-slider-belief.is-next'));
    const items = track ? Array.from(track.children).filter(item => item.classList.contains('w-dyn-item')) : [];
    if (!viewport || !items.length || !buttons.length) return;
    prepared.add(wrapper); wrapper.classList.add('cx-belief-slider');
    const saved = [track, ...buttons].map(element => ({ element, attributes: ['style','role','tabindex','aria-label','aria-disabled'].map(name => [name, element.getAttribute(name)]) }));
    const initialX = Number(gsap.getProperty(track, 'x')) || 0;
    let active = 0, motion;
    buttons.forEach(button => {
      button.setAttribute('role', 'button'); button.setAttribute('tabindex', '0');
      button.setAttribute('aria-label', button.classList.contains('is-next') ? 'Croyance suivante' : 'Croyance précédente');
    });
    function select(index, instant = false) {
      active = Math.max(0, Math.min(items.length - 1, index));
      if (motion) motion.kill();
      const first = items[0].getBoundingClientRect(), last = items[items.length - 1].getBoundingClientRect();
      const maximum = Math.max(0, last.right - first.left - viewport.clientWidth);
      const offset = Math.min(maximum, items[active].getBoundingClientRect().left - first.left);
      buttons.forEach(button => button.setAttribute('aria-disabled', String(button.classList.contains('is-next') ? offset >= maximum - 1 : offset <= 1)));
      motion = gsap.to(track, { x: initialX - offset, duration: instant || media.matches ? 0 : .75, ease: 'power3.inOut', overwrite: true });
    }
    function navigate(event) {
      const button = event.target.closest('.button-slider-belief');
      if (!buttons.includes(button) || (event.type === 'keydown' && !['Enter',' '].includes(event.key))) return;
      event.preventDefault();
      if (button.getAttribute('aria-disabled') !== 'true') select(active + (button.classList.contains('is-next') ? 1 : -1));
    }
    listen(wrapper, 'click', navigate); listen(wrapper, 'keydown', navigate);
    const resize = new ResizeObserver(() => select(active, true)); resize.observe(viewport);
    items.forEach(item => resize.observe(item)); select(0, true);
    cleanups.push(() => {
      resize.disconnect(); if (motion) motion.kill(); wrapper.classList.remove('cx-belief-slider');
      saved.forEach(({element,attributes}) => attributes.forEach(([name,value]) => value === null ? element.removeAttribute(name) : element.setAttribute(name,value)));
    });
  }
  function verticalCarousel(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const logo = wrapper.querySelector('.ver-carousel__logo-wrapper');
    const groups = Array.from(wrapper.querySelectorAll('.ver-carousel__img-wrapper'));
    if (!logo || groups.length !== 2) return;
    prepared.add(wrapper); wrapper.classList.add('cx-ver-carousel');
    const timeline = gsap.timeline({ scrollTrigger: {
      trigger: wrapper, start: 'top 90%', end: 'center 35%', scrub: 1.2, invalidateOnRefresh: true
    } });
    groups.forEach((group, side) => {
      Array.from(group.querySelectorAll('.ver-carousel__img')).forEach((image, index) => {
        const previous = image.getAttribute('style');
        const initialX = Number(gsap.getProperty(image, 'x')) || 0;
        const initialY = Number(gsap.getProperty(image, 'y')) || 0;
        const initialScale = Number(gsap.getProperty(image, 'scaleX')) || 1;
        function destinationX() {
          const rect = image.getBoundingClientRect(), bounds = wrapper.getBoundingClientRect();
          const center = rect.left + rect.width / 2 - (Number(gsap.getProperty(image, 'x')) || 0) + initialX;
          const fraction = [0.02, 0.22, 0.35, 0.43][index % 4];
          return initialX + bounds.left + bounds.width * (side ? 1 - fraction : fraction) - center;
        }
        timeline.fromTo(image, { x: initialX, y: initialY, scale: initialScale }, {
          x: destinationX, y: initialY, scale: initialScale * .85,
          duration: 1, ease: 'none'
        }, 0);
        cleanups.push(() => {
          if (previous === null) image.removeAttribute('style'); else image.setAttribute('style', previous);
        });
      });
    });
    cleanups.push(() => { timeline.scrollTrigger.kill(); timeline.kill(); wrapper.classList.remove('cx-ver-carousel'); });
  }
  function aboutHeroParallax(image) {
    const variant = Array.from(image.classList).find(name => /^is--[1-9]$/.test(name));
    if (!variant || prepared.has(image) || image.closest('[data-cx-motion="off"]')) return;
    prepared.add(image);
    const previous = image.getAttribute('style');
    const initialY = Number(gsap.getProperty(image, 'y')) || 0;
    const distance = [-110, -160, -130, -95, 75, 100, 140, -100, 80][Number(variant.slice(4)) - 1];
    const tween = gsap.fromTo(image, { y: initialY }, {
      y: () => initialY + distance * (innerWidth < 768 ? 0.45 : 1),
      ease: 'none',
      scrollTrigger: {
        trigger: image.closest('section,.section') || image.parentElement,
        start: 'top top', end: 'bottom top', scrub: 1.1, invalidateOnRefresh: true
      }
    });
    cleanups.push(() => {
      tween.scrollTrigger.kill(); tween.kill();
      if (previous === null) image.removeAttribute('style'); else image.setAttribute('style', previous);
    });
  }
  function verticalHeroParallax(image) {
    if (prepared.has(image) || image.closest('[data-cx-motion="off"]')) return;
    prepared.add(image);
    const previous = image.getAttribute('style');
    const initialY = Number(gsap.getProperty(image, 'y')) || 0;
    const direction = image.classList.contains('is--3') ? 1 : -1;
    const tween = gsap.fromTo(image, { y: initialY }, {
      y: () => initialY + direction * (innerWidth < 768 ? 60 : 120),
      ease: 'none',
      scrollTrigger: {
        trigger: image.closest('section,.section') || image.parentElement,
        start: 'top top', end: 'bottom top', scrub: 1.1, invalidateOnRefresh: true
      }
    });
    cleanups.push(() => {
      tween.scrollTrigger.kill(); tween.kill();
      if (previous === null) image.removeAttribute('style'); else image.setAttribute('style', previous);
    });
  }
  function cardTabs(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const track = wrapper.querySelector('.slider-images'), controls = wrapper.querySelector('.slider-parent-wrapper');
    if (!track || !controls) return;
    const key = element => Array.from(element.classList).find(name => /^is--[1-5]$/.test(name));
    const pairs = Array.from(controls.querySelectorAll('.slider-button')).map(button => ({
      button, card: track.querySelector('.slider-image-card.' + key(button)), line: button.querySelector('.line.' + key(button))
    })).filter(pair => pair.card);
    if (!pairs.length) return;
    prepared.add(wrapper); wrapper.classList.add('cx-card-tabs');
    const elements = [track, controls, ...pairs.flatMap(pair => [pair.button, pair.card, pair.line].filter(Boolean))];
    const saved = elements.map(element => ({ element, attributes: ['style', 'id', 'role', 'tabindex', 'aria-selected', 'aria-controls', 'aria-labelledby', 'aria-hidden', 'inert'].map(name => [name, element.getAttribute(name)]) }));
    const initialX = Number(gsap.getProperty(track, 'x')) || 0;
    let active = 0, motion;
    const prefix = 'cx-card-tabs-' + document.querySelectorAll('.cx-card-tabs').length;
    controls.setAttribute('role', 'tablist');
    pairs.forEach(({ button, card }, index) => {
      button.id ||= prefix + '-tab-' + index; card.id ||= prefix + '-panel-' + index;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', card.id);
      card.setAttribute('role', 'tabpanel'); card.setAttribute('aria-labelledby', button.id);
    });
    const destination = () => {
      const card = pairs[active].card.getBoundingClientRect();
      if (active === 0 || active === pairs.length - 1) {
        const viewport = track.parentElement.getBoundingClientRect();
        const currentX = Number(gsap.getProperty(track, 'x')) || 0;
        return currentX + viewport.left + viewport.width / 2 - card.left - card.width / 2;
      }
      return initialX - (card.left - pairs[0].card.getBoundingClientRect().left);
    };
    function select(index, instant = false, focus = false) {
      active = index;
      if (motion) motion.kill();
      pairs.forEach(({ button, card, line }, i) => {
        button.setAttribute('aria-selected', String(i === active)); button.setAttribute('tabindex', i === active ? '0' : '-1');
        card.setAttribute('aria-hidden', String(i !== active)); card.toggleAttribute('inert', i !== active);
        if (line) gsap.to(line, { scaleX: i === active ? 1 : 0, transformOrigin: 'left center', duration: instant || media.matches ? 0 : 0.55, ease: 'power3.inOut', overwrite: true });
      });
      motion = gsap.to(track, { x: destination(), duration: instant || media.matches ? 0 : 0.9, ease: 'power3.inOut', overwrite: true });
      if (focus) pairs[active].button.focus({ preventScroll: true });
    }
    listen(controls, 'click', event => {
      const index = pairs.findIndex(pair => pair.button === event.target.closest('.slider-button'));
      if (index >= 0) { event.preventDefault(); select(index); }
    });
    listen(controls, 'keydown', event => {
      const index = pairs.findIndex(pair => pair.button === event.target.closest('.slider-button'));
      if (index < 0) return;
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % pairs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + pairs.length) % pairs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = pairs.length - 1;
      else if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); select(next, false, true);
    });
    const resize = new ResizeObserver(() => select(active, true)); resize.observe(wrapper);
    pairs.forEach(pair => resize.observe(pair.card));
    select(0, true);
    cleanups.push(() => {
      resize.disconnect(); if (motion) motion.kill(); gsap.killTweensOf(pairs.map(pair => pair.line).filter(Boolean));
      wrapper.classList.remove('cx-card-tabs');
      saved.forEach(({ element, attributes }) => attributes.forEach(([name, value]) => value === null ? element.removeAttribute(name) : element.setAttribute(name, value)));
    });
  }
  function testimonialSlider(cms) {
    if (prepared.has(cms) || cms.closest('[data-cx-motion="off"]')) return;
    const list = cms.querySelector('.testimonials-list');
    const items = list ? Array.from(list.children).filter(item => item.matches('.testimonials-item')) : [];
    if (!items.length || !cms.querySelector('.button-slider')) return;
    prepared.add(cms); cms.classList.add('cx-testimonial-slider');
    let current = 0, busy = false, transition;
    const saved = [list, ...items, ...cms.querySelectorAll('.button-slider')].map(element => ({
      element, attributes: ['style', 'aria-hidden', 'inert', 'role', 'tabindex', 'aria-label', 'aria-disabled'].map(name => [name, element.getAttribute(name)])
    }));
    const status = document.createElement('div'); status.className = 'cx-algo-sr';
    status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true'); cms.append(status);
    items.forEach((item, index) => {
      item.style.display = index ? 'none' : '';
      item.setAttribute('aria-hidden', index ? 'true' : 'false'); item.toggleAttribute('inert', !!index);
      item.querySelectorAll('.button-slider').forEach(control => {
        control.setAttribute('role', 'button'); control.setAttribute('tabindex', items.length > 1 ? '0' : '-1');
        control.setAttribute('aria-label', control.matches('.is-previous') ? 'Témoignage précédent' : 'Témoignage suivant');
        control.setAttribute('aria-disabled', items.length > 1 ? 'false' : 'true');
      });
    });
    const layers = item => Array.from(item.querySelectorAll('.testimonials-image,.testimonials-top,.testimonials-number,.testimonial-content-p'));
    function navigate(direction, control) {
      if (busy || items.length < 2) return;
      busy = true;
      const outgoing = items[current], next = (current + direction + items.length) % items.length, incoming = items[next];
      const restoreFocus = outgoing.contains(document.activeElement);
      const oldHeight = list.getBoundingClientRect().height;
      list.style.height = oldHeight + 'px';
      incoming.style.display = ''; incoming.setAttribute('aria-hidden', 'false'); incoming.removeAttribute('inert');
      const newHeight = incoming.getBoundingClientRect().height;
      outgoing.setAttribute('aria-hidden', 'true'); outgoing.setAttribute('inert', '');
      const enter = layers(incoming), leave = layers(outgoing);
      gsap.set(enter, { autoAlpha: 0, x: direction * 24, y: 8 });
      transition = gsap.timeline({ onComplete: () => {
        outgoing.style.display = 'none'; current = next; busy = false; list.style.height = '';
        gsap.set([...enter, ...leave], { clearProps: 'opacity,visibility,transform' });
        status.textContent = 'Témoignage ' + (next + 1) + ' sur ' + items.length;
        if (restoreFocus) incoming.querySelector(direction < 0 ? '.button-slider.is-previous' : '.button-slider.is-next').focus({ preventScroll: true });
        ST.refresh();
      } });
      const duration = media.matches ? 0 : 0.55;
      transition.to(leave, { autoAlpha: 0, x: -direction * 18, duration: duration * 0.65, ease: 'power2.inOut' }, 0)
        .to(enter, { autoAlpha: 1, x: 0, y: 0, duration, stagger: media.matches ? 0 : 0.045, ease: 'power3.out' }, duration * 0.25)
        .to(list, { height: newHeight, duration, ease: 'power3.inOut' }, 0);
    }
    listen(cms, 'click', event => {
      const control = event.target.closest('.button-slider');
      if (!control || !cms.contains(control)) return;
      event.preventDefault(); navigate(control.matches('.is-previous') ? -1 : 1, control);
    });
    listen(cms, 'keydown', event => {
      const control = event.target.closest('.button-slider');
      if (!control || !['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : control.matches('.is-previous') ? -1 : 1, control);
    });
    cleanups.push(() => {
      if (transition) transition.kill(); status.remove(); cms.classList.remove('cx-testimonial-slider');
      items.forEach(item => gsap.set(layers(item), { clearProps: 'opacity,visibility,transform' }));
      saved.forEach(({ element, attributes }) => attributes.forEach(([name, value]) => value === null ? element.removeAttribute(name) : element.setAttribute(name, value)));
    });
  }
  function solutionHeroParallax(hero) {
    if (prepared.has(hero) || hero.closest('[data-cx-motion="off"]')) return;
    const content = hero.querySelector('.solution-hero-content');
    const images = Array.from(hero.querySelectorAll('.solutions-h__img-wrapper, .solution-h__element-wrapper'));
    if (!content || !images.length) return;
    prepared.add(hero);
    images.forEach((image, index) => {
      const previous = image.getAttribute('style');
      const initialY = Number(gsap.getProperty(image, 'y')) || 0;
      function destination() {
        const rect = image.getBoundingClientRect(), text = content.getBoundingClientRect();
        const currentY = Number(gsap.getProperty(image, 'y')) || 0;
        const top = rect.top - currentY + initialY, bottom = rect.bottom - currentY + initialY;
        const factor = innerWidth < 768 ? 0.4 : 1;
        let distance = [70, 120, 96, 85, -90, 100][index % 6] * factor;
        // Clamp the full travel against the native text area, including on resize.
        if (rect.right > text.left && rect.left < text.right) {
          if (top >= text.bottom) distance = Math.max(distance, text.bottom + 14 - top);
          else if (bottom <= text.top) distance = Math.min(distance, text.top - 14 - bottom);
          else distance = 0;
        }
        return initialY + distance;
      }
      const tween = gsap.fromTo(image, { y: initialY }, {
        y: destination, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.1, invalidateOnRefresh: true }
      });
      cleanups.push(() => {
        tween.scrollTrigger.kill(); tween.kill();
        if (previous === null) image.removeAttribute('style'); else image.setAttribute('style', previous);
      });
    });
  }
  function campaignDrift(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const code = wrapper.querySelector('.algo__code');
    if (!code) return;
    prepared.add(wrapper); code.classList.add('cx-algo-code');
    const scene = document.createElement('div'); scene.className = 'cx-algo-scene';
    // Assets may be overridden on the Webflow wrapper without changing the runtime.
    const defaults = {
      avatar: 'https://cdn.prod.website-files.com/6aa7d07d0a5547ba570016cd/6ac3762f1faeb02a0ce4d0e8_Rectangle%20427322441.avif',
      campaign: 'https://cdn.prod.website-files.com/6aa7d07d0a5547ba570016cd/6ac3762d06045b7bd5a1f006_Frame%2014671.avif'
    };
    const asset = name => wrapper.getAttribute('data-cx-' + name) || defaults[name];
    scene.innerHTML = `
      <div class="cx-algo-brief">
        <img class="cx-algo-avatar" alt="Campaign team member" width="50" height="50">
        <div class="cx-algo-message">Hey team, we need to work on this campaign</div>
        <div class="cx-algo-plan"><strong>SpritzNYC Summer Campaign</strong><br>Australia 2026</div>
      </div>
      <div class="cx-algo-headlines">
        <p>Drift between what was planned and what shipped</p>
        <p>Drift between what shipped and what worked</p>
        <p>The drift is often invisible until the campaign is over.</p>
      </div>
      <article class="cx-algo-campaign">
        <img alt="SpritzNYC drinks campaign by the pool" width="380" height="282">
        <span class="cx-algo-assets">156 ASSETS</span>
        <div><strong>SpritzNYC Summer Campaign</strong><br>Australia 2026</div>
      </article>
      <div class="cx-algo-result"><span class="cx-algo-percent">40%</span><span class="cx-algo-spend">↓ OBSERVABLE MEDIA SPEND</span></div>`;
    const avatar = scene.querySelector('.cx-algo-avatar'), campaignImage = scene.querySelector('.cx-algo-campaign img');
    if (asset('avatar')) avatar.src = asset('avatar');
    if (asset('campaign')) campaignImage.src = asset('campaign');
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 1148 876'); svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true'); svg.classList.add('cx-algo-paths');
    const defs = document.createElementNS(namespace, 'defs'); svg.append(defs);
    const id = 'cx-drift-' + document.querySelectorAll('.cx-algo-scene').length;
    const draws = [-650, -505, -370, -230, -80, 95, 235, 370, 505, 650].map((spread, index) => {
      const d = `M580 212 C${580 + spread} 224 ${590 + spread} 598 590 616`;
      const mask = document.createElementNS(namespace, 'mask'); mask.id = id + '-' + index;
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', '0'); mask.setAttribute('y', '0'); mask.setAttribute('width', '1148'); mask.setAttribute('height', '876');
      const draw = document.createElementNS(namespace, 'path'); draw.setAttribute('d', d);
      draw.setAttribute('fill', 'none'); draw.setAttribute('stroke', 'white'); draw.setAttribute('stroke-width', '4');
      mask.append(draw); defs.append(mask);
      const path = document.createElementNS(namespace, 'path'); path.setAttribute('d', d);
      path.setAttribute('mask', `url(#${mask.id})`); svg.append(path); return draw;
    });
    scene.prepend(svg); code.append(scene);
    const check = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="m6 10 3 3 5-6"/></svg>';
    const cross = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="m7 7 6 6m0-6-6 6"/></svg>';
    const definitions = [
      ['MESSAGING', 30.8, 30.2, false], ['CHANNELS', 42.2, 36.2, true],
      ['TARGET AUDIENCE', 68.6, 34.9, true], ['MARKETS', 53.7, 49.5, true],
      ['PLATFORMS', 77.5, 51.5, false], ['BUDGET', 25.8, 56.5, true],
      ['DESIGN', 41.1, 59.2, true], ['GOALS', 67.5, 60.3, false]
    ];
    const tags = definitions.map(([label, x, y, fails]) => {
      const element = document.createElement('div'); element.className = 'cx-algo-tag';
      element.style.left = x + '%'; element.style.top = y + '%';
      element.innerHTML = `<span class="cx-algo-status"><span class="cx-algo-check">${check}</span><span class="cx-algo-cross">${cross}</span></span><span>${label}</span>`;
      const status = document.createElement('span'); status.className = 'cx-algo-sr'; status.textContent = ': validated'; element.append(status);
      scene.append(element); return { element, fails, status };
    });
    function fit() {
      const width = innerWidth < 768 ? 600 : 1148, height = innerWidth < 768 ? 930 : 876;
      scene.style.width = width + 'px'; scene.style.height = height + 'px';
      scene.style.setProperty('--cx-algo-scale', Math.min(code.clientWidth / width, Math.max(1, code.clientHeight - 96) / height));
    }
    fit(); const resize = new ResizeObserver(fit); resize.observe(code);
    const brief = scene.querySelector('.cx-algo-brief'), card = scene.querySelector('.cx-algo-campaign');
    const conversation = [avatar, scene.querySelector('.cx-algo-message'), scene.querySelector('.cx-algo-plan')];
    const headlines = Array.from(scene.querySelectorAll('.cx-algo-headlines p'));
    const result = scene.querySelector('.cx-algo-result');
    draws.forEach(draw => { const length = draw.getTotalLength(); gsap.set(draw, { strokeDasharray: length, strokeDashoffset: length }); });
    gsap.set([...conversation, ...tags.map(tag => tag.element), card, ...headlines, result], { autoAlpha: 0 });
    gsap.set(scene.querySelectorAll('.cx-algo-cross'), { autoAlpha: 0, scale: 0.6 });
    const timeline = gsap.timeline({ paused: media.matches, defaults: { ease: 'power3.inOut' } });
    timeline.fromTo(scene, { '--cx-algo-drift': '5px' }, { '--cx-algo-drift': '-5px', duration: 6.55, ease: 'none' }, 0)
      .fromTo(conversation, { scale: 0.92, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.48, stagger: 0.28, ease: 'power3.out' }, 0)
      .to(draws, { strokeDashoffset: 0, duration: 1.15, stagger: { amount: 0.25, from: 'center' }, ease: 'power2.inOut' }, 0.85)
      .fromTo(tags.map(tag => tag.element), { y: 14, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.06 }, 1.2)
      .fromTo(headlines[0], { y: 18 }, { autoAlpha: 1, y: 0, duration: 0.55 }, 1.4)
      .fromTo(card, { y: 28, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6 }, 1.9)
      .to(headlines[0], { autoAlpha: 0, y: -12, duration: 0.3 }, 3.0)
      .fromTo(headlines[1], { y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 3.18);
    tags.filter(tag => tag.fails).forEach((tag, index) => {
      const at = 3.25 + index * 0.1;
      timeline.to(tag.element.querySelector('.cx-algo-check'), { autoAlpha: 0, scale: 0.6, duration: 0.25 }, at)
        .to(tag.element.querySelector('.cx-algo-cross'), { autoAlpha: 1, scale: 1, duration: 0.35 }, at + 0.12);
    });
    timeline.to(headlines[1], { autoAlpha: 0, y: -12, duration: 0.3 }, 4.65)
      .fromTo(headlines[2], { y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 4.83)
      .fromTo(scene, { '--cx-algo-result-x': '-6px', '--cx-algo-result-y': '10px' }, { '--cx-algo-result-x': '6px', '--cx-algo-result-y': '-10px', duration: 1.3, ease: 'none' }, 5.25)
      .fromTo(result, { y: 24, scale: 0.88 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.65 }, 5.25)
      .to({}, { duration: 0.65 }, 5.9);
    let trigger;
    if (media.matches) timeline.progress(1);
    else trigger = ST.create({ trigger: wrapper, start: 'top top', end: 'bottom bottom', animation: timeline, scrub: 0.85 });
    // Synchronize accessible status with scroll, including reverse scrolling.
    function updateStatus() {
      tags.forEach(tag => { tag.status.textContent = tag.fails && timeline.time() >= 3.37 + tags.filter(t => t.fails).indexOf(tag) * 0.1 ? ': drift detected' : ': validated'; });
    }
    timeline.eventCallback('onUpdate', updateStatus); updateStatus();
    // Ambient motion uses individual CSS translate, leaving scroll transforms intact.
    let inView = false;
    const updateMotion = () => scene.classList.toggle('cx-algo-running', inView && !document.hidden && !media.matches);
    const visibility = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; updateMotion(); });
    visibility.observe(code);
    document.addEventListener('visibilitychange', updateMotion);
    cleanups.push(() => { visibility.disconnect(); document.removeEventListener('visibilitychange', updateMotion); resize.disconnect(); if (trigger) trigger.kill(); timeline.kill(); scene.remove(); code.classList.remove('cx-algo-code'); });
  }
  function systemOrbit(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const logo = wrapper.querySelector('.cx__logo');
    if (!logo) return;
    prepared.add(wrapper); wrapper.classList.add('cx-system-orbit');
    const stage = document.createElement('div'); stage.className = 'cx-system-stage';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 1000'); svg.setAttribute('aria-hidden', 'true');
    [370, 240].forEach(radius => {
      const circle = document.createElementNS(svg.namespaceURI, 'circle');
      circle.setAttribute('cx', '500'); circle.setAttribute('cy', '500'); circle.setAttribute('r', String(radius));
      svg.append(circle);
    });
    stage.append(svg); wrapper.prepend(stage);
    const definitions = [
      ['BRAND STRATEGY', 0.37, -53, ''], ['GEN AI', 0.37, -20, 'orange'],
      ['INSIGHTS & REPORTING', 0.37, 33, 'green'], ['OUTCOMES', 0.37, 65, ''],
      ['COMMERCIAL GOALS', 0.37, 132, ''], ['MEDIA AGENCIES', 0.37, 162, 'blue'],
      ['DAMS', 0.37, 212, 'pink'], ['CAMPAIGN CONTEXT', 0.24, -115, ''],
      ['DATA LAKES', 0.24, -172, ''], ['CREATIVE AGENCIES', 0.24, 8, '']
    ];
    const nodes = definitions.map(([label, radius, angle, theme]) => {
      const element = document.createElement('div'); element.className = 'cx-system-node';
      if (theme) element.classList.add('is-' + theme);
      else { const dot = document.createElement('span'); dot.className = 'cx-system-dot'; dot.setAttribute('aria-hidden', 'true'); element.append(dot); }
      if (label === 'OUTCOMES' || label === 'DATA LAKES') element.classList.add('cx-label-left');
      const text = document.createElement('span'); text.textContent = label; element.append(text); stage.append(element);
      return { element, radius, angle };
    });
    const particles = Array.from({ length: 14 }, (_, index) => {
      const element = document.createElement('span'); element.className = 'cx-system-particle';
      element.setAttribute('aria-hidden', 'true'); stage.append(element);
      return { element, radius: index % 2 ? 0.24 : 0.37, angle: index * 137.5 };
    });
    // Anchor the dot, not the combined width of the dot and its label.
    const moving = [...nodes, ...particles];
    moving.forEach(item => {
      gsap.set(item.element, { xPercent: -50, yPercent: -50, force3D: true });
      item.setX = gsap.quickSetter(item.element, 'x', 'px');
      item.setY = gsap.quickSetter(item.element, 'y', 'px');
    });
    let size = stage.getBoundingClientRect().width, orbit = 0, signal = 0, inView = false;
    function position(item, degrees) {
      const angle = degrees * Math.PI / 180;
      item.setX(Math.cos(angle) * item.radius * size);
      item.setY(Math.sin(angle) * item.radius * size);
    }
    function render() {
      nodes.forEach(node => position(node, node.angle + orbit));
      particles.forEach((particle, index) => {
        position(particle, particle.angle + signal * (index % 2 ? -1 : 1));
        particle.element.style.opacity = String(0.18 + 0.58 * (0.5 + 0.5 * Math.sin((signal + index * 35) * Math.PI / 180)));
      });
    }
    render();
    // One transform-only render per frame; no left/top layout or repeat reset.
    function tick(time, deltaTime) {
      if (!inView || document.hidden) return;
      const delta = Math.min(deltaTime / 1000, 0.064);
      orbit = (orbit + delta * 360 / 140) % 360;
      signal = (signal + delta * 360 / 22) % 360;
      render();
    }
    if (!media.matches) gsap.ticker.add(tick);
    const resize = new ResizeObserver(() => { size = stage.getBoundingClientRect().width; render(); });
    resize.observe(stage);
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; });
    observer.observe(wrapper);
    const entrance = media.matches ? null : gsap.from(stage, { autoAlpha: 0, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: wrapper, start: 'top 88%', once: true } });
    cleanups.push(() => {
      observer.disconnect(); resize.disconnect(); gsap.ticker.remove(tick);
      if (entrance) { if (entrance.scrollTrigger) entrance.scrollTrigger.kill(); entrance.kill(); }
      stage.remove(); wrapper.classList.remove('cx-system-orbit');
    });
  }
  function mediaObservability(section) {
    if (prepared.has(section) || section.closest('[data-cx-motion="off"]')) return;
    const box = section.querySelector('.tab-box');
    if (!box) return;
    prepared.add(section); section.classList.add('cx-media-obs');
    const initialCopy = Array.from(section.querySelectorAll('.title--3.is--media-obs-1,.paragraph.is--media-obs-1'));
    const finalCopy = Array.from(section.querySelectorAll('.title--3.is--media-obs-2,.paragraph.is--media-obs-2'));
    const counters = ['.text-medium.is--1', '.text-medium.is--2'].map(selector => box.querySelector(selector));
    const counterText = counters.map(element => element ? element.textContent : '');
    const starts = counterText.map(text => Number(text.replace(/[^\d.]/g, '')) || 0);
    const ends = counters.map((element, index) => {
      const configured = element && element.getAttribute('data-cx-count-to');
      return configured !== null && configured !== '' && Number.isFinite(Number(configured)) ? Number(configured) : [100, 55][index];
    });
    const state = { progress: 0 };
    function count() {
      counters.forEach((element, index) => {
        if (!element) return;
        const value = Math.round(starts[index] + (ends[index] - starts[index]) * state.progress);
        element.textContent = counterText[index].replace(/[\d.,]+/, String(value));
      });
    }
    gsap.set(finalCopy, { autoAlpha: 0, y: 20 });
    const timeline = gsap.timeline({ paused: true });
    timeline.fromTo(state, { progress: 0 }, { progress: 1, duration: 0.7, ease: 'sine.inOut', onUpdate: count }, 0.12);
    Array.from(box.querySelectorAll('.tab-grid-wrapper')).forEach((row, rowIndex) => {
      Array.from(row.querySelectorAll('.tab-icon')).forEach((cell, columnIndex) => {
        const before = cell.querySelector('.tab-icon-image.is-1');
        const after = cell.querySelector('.tab-icon-image.is-2');
        if (!before || !after) return;
        gsap.set(after, { display: 'block', autoAlpha: 0, scale: 0.75, y: 5 });
        const at = 0.14 + rowIndex * 0.024 + Math.max(0, columnIndex - 1) * 0.07;
        timeline.to(before, { autoAlpha: 0, scale: 0.8, y: -4, duration: 0.12, ease: 'power2.inOut' }, at);
        timeline.to(after, { autoAlpha: 1, scale: 1, y: 0, duration: 0.18, ease: 'power3.out' }, at + 0.04);
      });
    });
    timeline.to(box.querySelectorAll('.tab-tag'), { backgroundColor: '#baffb2', duration: 0.55, ease: 'sine.inOut' }, 0.22);
    timeline.to(box.querySelectorAll('.tab-tag .greed-small'), { color: '#0c513d', duration: 0.55, ease: 'sine.inOut' }, 0.22);
    [1, 2].forEach(index => {
      timeline.fromTo(box.querySelectorAll('.arrow.is--' + index), { rotation: index === 1 ? 0 : 180 }, {
        rotation: index === 1 ? 180 : 360, duration: 0.48, ease: 'power2.inOut',
        filter: 'brightness(0) saturate(100%) invert(23%) sepia(42%) saturate(716%) hue-rotate(113deg) brightness(92%) contrast(94%)'
      }, 0.25);
    });
    timeline.to(initialCopy, { autoAlpha: 0, y: -16, duration: 0.12, ease: 'power2.inOut' }, 0.4);
    timeline.to(finalCopy, { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.025, ease: 'power3.out' }, 0.49);
    timeline.to({}, { duration: 0.18 }, 0.82);
    let trigger;
    if (media.matches) timeline.progress(1);
    else trigger = ST.create({ trigger: section, start: 'top top', end: 'bottom bottom',
      animation: timeline, scrub: 0.8, invalidateOnRefresh: true });
    tweens.push(timeline);
    cleanups.push(() => {
      if (trigger) trigger.kill(); timeline.kill(); section.classList.remove('cx-media-obs');
      counters.forEach((element, index) => { if (element) element.textContent = counterText[index]; });
    });
  }
  function categoryPreview(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const items = Array.from(wrapper.querySelectorAll('.category-item'));
    const images = Array.from(wrapper.querySelectorAll('.category-item-image .category-image-1,.category-item-image .category-image-2'));
    if (!items.length || !images.length) return;
    prepared.add(wrapper);
    const links = items.map(item => item.querySelector('.cat__wrapper') || item);
    const labels = items.map(item => item.querySelector('.category-text'));
    const arrows = items.map(item => item.querySelector('.category-arrow'));
    const elements = images.concat(labels, arrows).filter(Boolean);
    const saved = elements.map(element => ({ element, style: element.getAttribute('style'),
      attrs: ['src', 'srcset', 'sizes', 'alt'].map(name => [name, element.getAttribute(name)]) }));
    const sources = items.map(item => [item.querySelector('.category-image-1,.image-3'), item.querySelector('.category-image-2')]);
    const baseImages = images.map(image => image.cloneNode(false));
    const preloads = sources.flat().filter(Boolean).map(source => {
      const image = new Image(); image.src = source.getAttribute('src'); return image;
    });
    let hovered = -1, focused = -1, current = -1, sequence;
    const duration = value => media.matches ? 0 : value;
    function setImages(category) {
      images.forEach((image, index) => {
        const source = sources[category][index] || baseImages[index];
        ['src', 'srcset', 'sizes', 'alt'].forEach(name => {
          const value = source.getAttribute(name);
          if (value === null) image.removeAttribute(name); else image.setAttribute(name, value);
        });
      });
    }
    setImages(0);
    gsap.set(images, { autoAlpha: 1, y: 0, scale: 1, pointerEvents: 'none' });
    gsap.set(arrows.filter(Boolean), { autoAlpha: 0, x: -8, scale: 0.8 });
    function update() {
      const next = hovered >= 0 ? hovered : focused;
      if (next === current) return;
      const previousPreview = Math.max(0, current), preview = Math.max(0, next);
      current = next;
      labels.forEach((label, index) => {
        if (label) gsap.to(label, { opacity: next < 0 || next === index ? 1 : 0.35,
          duration: duration(0.3), ease: 'power2.out', overwrite: true });
      });
      arrows.forEach((arrow, index) => {
        if (arrow) gsap.to(arrow, { autoAlpha: next === index ? 1 : 0, x: next === index ? 0 : -8,
          scale: next === index ? 1 : 0.8, duration: duration(0.4), ease: 'power3.out', overwrite: true });
      });
      if (preview === previousPreview) return;
      if (sequence) sequence.kill();
      sequence = gsap.timeline();
      sequence.to(images, { autoAlpha: 0, y: -10, duration: duration(0.16), ease: 'power2.in' });
      sequence.call(() => setImages(preview));
      sequence.fromTo(images, { autoAlpha: 0, y: 24, scale: 0.97 }, {
        autoAlpha: 1, y: 0, scale: 1, duration: duration(0.65), stagger: duration(0.08), ease: 'power3.out'
      });
    }
    links.forEach((link, index) => {
      listen(link, 'pointerenter', event => { if (event.pointerType !== 'touch') { hovered = index; update(); } });
      listen(link, 'pointerleave', () => { if (hovered === index) { hovered = -1; update(); } });
      listen(link, 'focusin', () => { focused = index; update(); });
      listen(link, 'focusout', () => { if (focused === index) { focused = -1; update(); } });
      listen(link, 'pointerdown', event => { if (event.pointerType === 'touch') { focused = index; update(); } });
    });
    cleanups.push(() => {
      if (sequence) sequence.kill(); gsap.killTweensOf(elements); preloads.length = 0;
      saved.forEach(({ element, style, attrs }) => {
        if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style);
        attrs.forEach(([name, value]) => { if (value === null) element.removeAttribute(name); else element.setAttribute(name, value); });
      });
    });
  }
  function ctaCards(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const cards = Array.from(wrapper.children).filter(card => card.matches('.card'));
    if (!cards.length) return;
    prepared.add(wrapper);
    const paths = [
      { x: [-10, 8], y: [26, -22], rotation: [-2, 2] },
      { x: [12, -8], y: [36, -28], rotation: [2, -2] },
      { x: [10, -12], y: [18, -20], rotation: [-2, 2] },
      { x: [-12, 10], y: [42, -32], rotation: [2.5, -2.5] }
    ];
    const factor = () => innerWidth < 768 ? 0.55 : 1;
    const timeline = gsap.timeline({ scrollTrigger: {
      trigger: wrapper.closest('.cta-wrapper') || wrapper,
      start: 'top bottom', end: 'bottom top', scrub: 1.1, invalidateOnRefresh: true
    } });
    cards.forEach((card, index) => {
      const path = paths[index % paths.length];
      // Retain the rotations designed in Webflow, adding small scroll offsets.
      const base = { x: Number(gsap.getProperty(card, 'x')) || 0, y: Number(gsap.getProperty(card, 'y')) || 0, rotation: Number(gsap.getProperty(card, 'rotation')) || 0 };
      timeline.fromTo(card, {
        x: () => base.x + path.x[0] * factor(), y: () => base.y + path.y[0] * factor(),
        rotation: () => base.rotation + path.rotation[0] * factor()
      }, {
        x: () => base.x + path.x[1] * factor(), y: () => base.y + path.y[1] * factor(),
        rotation: () => base.rotation + path.rotation[1] * factor(), duration: 1, ease: 'none'
      }, 0);
    });
    tweens.push(timeline); cleanups.push(() => timeline.scrollTrigger.kill());
  }
  function businessReveal(card) {
    if (prepared.has(card) || card.closest('[data-cx-motion="off"]')) return;
    prepared.add(card);
    if (card.getBoundingClientRect().bottom < 0) return;
    const content = card.querySelector('.bussines-cards-content');
    const targets = content ? Array.from(content.children) : ['.bussines__img', '.bussines__text', '.bussiness__name-wrapper'].map(selector => card.querySelector(selector)).filter(Boolean);
    if (!targets.length) return;
    const column = card.closest('.bussines-cards-vertical');
    const delay = column && column.matches('.is-2') ? 0.07 : column && column.matches('.is-3') ? 0.14 : 0;
    // Animate inner content only: the columns retain their existing scroll parallax.
    const tween = gsap.fromTo(targets, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.85, stagger: 0.09, delay, ease: 'power3.out',
      clearProps: 'transform,opacity', scrollTrigger: { trigger: card, start: 'top 92%', once: true }
    });
    tweens.push(tween);
  }
  function radialCards(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const track = wrapper.querySelector('.images-loop-track');
    if (!track) return;
    const originals = Array.from(track.children).filter(card => card.matches('.card,.loop-card'));
    if (!originals.length) return;
    prepared.add(wrapper); wrapper.classList.add('cx-radial');
    const previousTrackStyle = track.getAttribute('style');
    const originalStyles = originals.map(card => card.getAttribute('style'));
    originals.forEach(card => card.classList.add('cx-radial-card'));
    const state = { offset: 0 };
    let copies = [], cards = [], setters = [], spacing = 0, total = 0, width = 0, radius = 0, cardWidth = 0, resizeTimer;
    function render() {
      if (!spacing || !total) return;
      cards.forEach((card, index) => {
        const x = ((index * spacing - state.offset + spacing * 2) % total + total) % total - spacing * 2;
        const relative = x + cardWidth / 2 - width / 2;
        const angle = Math.asin(Math.max(-0.95, Math.min(0.95, relative / radius)));
        setters[index].x(x);
        setters[index].y(-Math.min(84, cardWidth * 0.3) + radius * (1 - Math.cos(angle)));
        setters[index].rotation(angle * 180 / Math.PI);
      });
    }
    function measure() {
      copies.forEach(card => card.remove()); copies = [];
      width = wrapper.clientWidth; cardWidth = originals[0].offsetWidth;
      if (!width || !cardWidth) return;
      spacing = cardWidth + (innerWidth < 768 ? 28 : 52);
      radius = Math.max(width * 1.05, cardWidth * 3.4);
      const groups = Math.max(1, Math.ceil((width + spacing * 4) / (spacing * originals.length)));
      for (let group = 1; group < groups; group++) originals.forEach((card, index) => {
        const copy = card.cloneNode(true);
        if (originalStyles[index] === null) copy.removeAttribute('style'); else copy.setAttribute('style', originalStyles[index]);
        copy.setAttribute('aria-hidden', 'true'); copy.setAttribute('inert', ''); copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        copy.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
        track.append(copy); copies.push(copy);
      });
      cards = originals.concat(copies); total = cards.length * spacing;
      setters = cards.map(card => ({ x: gsap.quickSetter(card, 'x', 'px'), y: gsap.quickSetter(card, 'y', 'px'), rotation: gsap.quickSetter(card, 'rotation', 'deg') }));
      // Keep the original one-row footprint: the arc is cropped by the section.
      track.style.height = Math.ceil(originals[0].offsetHeight) + 'px';
      render();
      clearTimeout(resizeTimer); resizeTimer = setTimeout(() => ST.refresh(), 100);
    }
    measure();
    const motion = gsap.fromTo(state, { offset: 0 }, { offset: () => Math.max(spacing * 1.5, width * 0.55), ease: 'none',
      onUpdate: render, scrollTrigger: { trigger: wrapper, start: 'top bottom', end: 'bottom top', scrub: 1.2, invalidateOnRefresh: true } });
    const resize = new ResizeObserver(measure); resize.observe(wrapper);
    originals.forEach(card => card.querySelectorAll('img').forEach(img => { resize.observe(img); listen(img, 'load', measure); }));
    cleanups.push(() => {
      clearTimeout(resizeTimer); resize.disconnect(); motion.scrollTrigger.kill(); motion.kill();
      copies.forEach(card => card.remove()); wrapper.classList.remove('cx-radial');
      originals.forEach((card, index) => {
        card.classList.remove('cx-radial-card'); gsap.set(card, { clearProps: 'transform,translate,rotate,scale' });
        if (originalStyles[index] === null) card.removeAttribute('style'); else card.setAttribute('style', originalStyles[index]);
      });
      if (previousTrackStyle === null) track.removeAttribute('style'); else track.setAttribute('style', previousTrackStyle);
    });
  }
  function logoMarquee(wrapper) {
    if (prepared.has(wrapper) || wrapper.closest('[data-cx-motion="off"]')) return;
    const list = wrapper.querySelector('.logos-list');
    if (!list) return;
    const items = Array.from(list.children).filter(item => item.matches('.logos-item'));
    if (!items.length) return;
    const originalStyles = items.map(item => item.getAttribute('style'));
    prepared.add(wrapper); wrapper.classList.add('cx-logos-marquee');
    let copies = [], cycle = 0, position = 0, speed = 0, inView = false, focusing = false;
    const previousStyle = list.getAttribute('style');
    const setX = gsap.quickSetter(list, 'x', 'px');
    function measure() {
      const previousCycle = cycle;
      copies.forEach(copy => copy.remove()); copies = [];
      const first = items[0].getBoundingClientRect(), last = items[items.length - 1].getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      cycle = last.right - first.left + gap;
      if (cycle <= 0 || !wrapper.clientWidth) { cycle = 0; return; }
      if (previousCycle) position = position / previousCycle * cycle;
      const count = Math.ceil(wrapper.clientWidth / cycle) + 1;
      for (let group = 0; group < count; group++) items.forEach((item, index) => {
        const copy = item.cloneNode(true);
        // A resize during the entrance must not freeze copies in the hidden state.
        if (originalStyles[index] === null) copy.removeAttribute('style');
        else copy.setAttribute('style', originalStyles[index]);
        copy.setAttribute('aria-hidden', 'true'); copy.setAttribute('inert', '');
        copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        copy.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
        list.append(copy); copies.push(copy);
      });
      setX(-position);
    }
    const velocity = ST.create({ trigger: wrapper, start: 'top bottom', end: 'bottom top' });
    function tick(time, delta) {
      if (!inView || document.hidden || !cycle) return;
      const dt = Math.min(delta / 1000, 0.064);
      const configuredSpeed = parseFloat(wrapper.getAttribute('data-cx-marquee-speed'));
      const base = configuredSpeed > 0 ? configuredSpeed : innerWidth < 768 ? 24 : 34;
      const target = focusing ? 0 : base + Math.min(Math.abs(velocity.getVelocity()) * 0.045, 90);
      speed += (target - speed) * (1 - Math.exp(-dt * 4));
      position = (position + speed * dt) % cycle; setX(-position);
    }
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }, { rootMargin: '60px' });
    observer.observe(wrapper);
    const resize = new ResizeObserver(measure); resize.observe(wrapper);
    items.forEach(item => item.querySelectorAll('img').forEach(img => {
      resize.observe(img); listen(img, 'load', measure);
    }));
    listen(wrapper, 'focusin', () => { focusing = true; });
    listen(wrapper, 'focusout', event => { focusing = wrapper.contains(event.relatedTarget); });
    measure(); gsap.ticker.add(tick);
    const entrance = gsap.from(items, { y: 12, opacity: 0, duration: 0.75, stagger: 0.045,
      ease: 'power3.out', scrollTrigger: { trigger: wrapper, start: 'top 95%', once: true }, clearProps: 'transform,opacity' });
    cleanups.push(() => {
      gsap.ticker.remove(tick); observer.disconnect(); resize.disconnect(); velocity.kill();
      if (entrance.scrollTrigger) entrance.scrollTrigger.kill(); entrance.kill();
      copies.forEach(copy => copy.remove()); wrapper.classList.remove('cx-logos-marquee');
      gsap.set(list, { clearProps: 'transform,translate,rotate,scale' });
      if (previousStyle === null) list.removeAttribute('style'); else list.setAttribute('style', previousStyle);
    });
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
    let inView = false, entered = false;
    function state() { loops.forEach(loop => loop.paused(!entered || !inView || document.hidden)); }
    const entrance = gsap.fromTo(layer, { scale: 0.82, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.95, ease: 'back.out(1.25)',
      scrollTrigger: { trigger: card, start: 'top 92%', once: true },
      onComplete: () => { entered = true; state(); }
    });
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; state(); }, { rootMargin: '70px' });
    observer.observe(card); listen(document, 'visibilitychange', state);
    cleanups.push(() => {
      observer.disconnect(); loops.forEach(loop => loop.kill());
      if (entrance.scrollTrigger) entrance.scrollTrigger.kill(); entrance.kill();
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
    if (media.matches) clearEntry();
    try {
      gsap = await dependency('gsap', 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js');
      const libraries = await Promise.all([
        dependency('ScrollTrigger', 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js'),
        dependency('SplitText', 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js'),
        media.matches ? Promise.resolve(null) : dependency('Lenis', 'https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js').catch(() => null)
      ]);
      if (current !== generation) return;
      ST = libraries[0]; SplitText = libraries[1]; gsap.registerPlugin(ST, SplitText);
      if (document.fonts) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]);
      if (current !== generation) return;
      active = true;
      ctx = gsap.context(() => {
        prepare();
        const heroButtons = document.querySelectorAll('.section-hero .button');
        if (!media.matches && heroButtons.length) gsap.from(heroButtons, { y: 18, opacity: 0, duration: 0.8, delay: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' });
      });
      if (!media.matches && window.lenis && typeof window.lenis.scrollTo === 'function') lenis = window.lenis;
      else if (libraries[2]) {
        ownLenis = true;
        lenis = new libraries[2]({ lerp: 0.14, smoothWheel: true, syncTouch: false, autoRaf: false,
          prevent: node => !!node.closest('[data-lenis-prevent],.w-dropdown-list,.w-nav-overlay') });
        lenis.on('scroll', ST.update);
        const tick = time => lenis && lenis.raf(time * 1000);
        gsap.ticker.add(tick); cleanups.push(() => gsap.ticker.remove(tick));
      }
      if (!media.matches) navigation();
      listen(window, 'load', () => ST.refresh());
      listen(document, 'click', () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(api.refresh, 180); });
      listen(window, 'resize', () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(api.refresh, 180); });
      ST.refresh();
    } catch (error) { destroy(); console.warn('[CreativeX] Motion unavailable; native content remains readable.', error); }
  }
  media.addEventListener('change', () => { destroy(); start(); });
  window.Webflow = window.Webflow || []; window.Webflow.push(start);
})();
