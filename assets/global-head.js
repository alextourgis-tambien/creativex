/* id="cx-fast-page-transitions-script" */
(function () {
  'use strict';
  if (window.cxFastPageTransitions) return;
  window.cxFastPageTransitions = true;
  var root = document.documentElement;
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var timer, leaving = false, destination;
  function clear() {
    clearTimeout(timer);
    root.classList.remove('cx-page-loading', 'cx-page-arriving', 'cx-page-leaving');
    leaving = false; destination = null;
  }
  function go() {
    if (!destination) return;
    var url = destination; destination = null; clearTimeout(timer);
    location.assign(url);
  }
  if (!motion.matches) {
    root.classList.add('cx-page-loading');
    timer = setTimeout(clear, 1800);
    document.addEventListener('DOMContentLoaded', function () {
      if (leaving || motion.matches) return;
      clearTimeout(timer);
      root.classList.replace('cx-page-loading', 'cx-page-arriving');
      timer = setTimeout(clear, 500);
    }, { once: true });
  }
  document.addEventListener('animationend', function (event) {
    if (event.target !== root || event.pseudoElement !== '::after') return;
    if (event.animationName === 'cx-page-close') go();
    else if (event.animationName === 'cx-page-open' && !leaving) clear();
  });
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.closest('[data-cx-transition="off"]') || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    var url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (/\.(pdf|zip|docx?|xlsx?|png|jpe?g|svg|mp4|webm)$/i.test(url.pathname)) return;
    if (motion.matches) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (leaving) return;
    clear(); leaving = true; destination = url.href;
    root.classList.add('cx-page-leaving');
    timer = setTimeout(go, 400);
  }, true);
  window.addEventListener('pageshow', function (event) { if (event.persisted) clear(); });
  window.addEventListener('pagehide', clear);
  motion.addEventListener('change', clear);
})();

/* id="cx-business-mobile-static-script" */
(function () {
  var mobile = matchMedia('(max-width: 767px)');
  function update() {
    document.querySelectorAll('.bussines-cards-wrapper.is--home').forEach(function (wrapper) {
      if (mobile.matches && !wrapper.hasAttribute('data-cx-motion')) {
        wrapper.setAttribute('data-cx-motion', 'off');
        wrapper.setAttribute('data-cx-mobile-static', '');
      } else if (!mobile.matches && wrapper.hasAttribute('data-cx-mobile-static')) {
        wrapper.removeAttribute('data-cx-motion');
        wrapper.removeAttribute('data-cx-mobile-static');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update, {once:true});
  else update();
  mobile.addEventListener('change', update);
})();

/* id="cx-mobile-menu-script" */
(function () {
  'use strict';
  if (window.cxMobileMenu) return;
  window.cxMobileMenu = true;
  function init() {
    var burger = document.querySelector('.menu__burger');
    var menu = document.querySelector('.menu-mob__content');
    if (!burger || !menu) return;
    var mobile = matchMedia('(max-width: 991px)');
    var reduced = matchMedia('(prefers-reduced-motion: reduce)');
    var open = false, locked = false, timer, savedY = 0, bodyStyles, htmlOverflow;
    var properties = ['position', 'top', 'left', 'width', 'overflow'];
    var background = [];
    menu.id = menu.id || 'cx-mobile-navigation';
    menu.classList.add('cx-mobile-menu-ready');
    menu.setAttribute('data-lenis-prevent', '');
    menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', 'Navigation');
    menu.setAttribute('tabindex', '-1'); menu.setAttribute('aria-hidden', 'true'); menu.inert = true;
    menu.querySelectorAll('.footer-top,.footer-center-col').forEach(function (group, index) {
      group.classList.add('cx-menu-reveal'); group.style.setProperty('--cx-menu-order', index);
    });
    if (!/^(BUTTON|A)$/.test(burger.tagName)) { burger.setAttribute('role', 'button'); burger.setAttribute('tabindex', '0'); }
    burger.setAttribute('aria-controls', menu.id); burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    function lock() {
      if (locked) return;
      locked = true; savedY = window.scrollY;
      bodyStyles = properties.map(function (name) { return [name, document.body.style.getPropertyValue(name), document.body.style.getPropertyPriority(name)]; });
      htmlOverflow = [document.documentElement.style.getPropertyValue('overflow'), document.documentElement.style.getPropertyPriority('overflow')];
      document.documentElement.style.setProperty('overflow', 'hidden');
      document.body.style.setProperty('position', 'fixed'); document.body.style.setProperty('top', -savedY + 'px');
      document.body.style.setProperty('left', '0'); document.body.style.setProperty('width', '100%'); document.body.style.setProperty('overflow', 'hidden');
      background = Array.from(document.querySelectorAll('main,body > footer')).filter(function (element) { return !element.contains(menu) && !element.contains(burger); }).map(function (element) {
        var value = element.inert; element.inert = true; return [element, value];
      });
    }
    function unlock() {
      if (!locked) return;
      locked = false;
      bodyStyles.forEach(function (entry) { if (entry[1]) document.body.style.setProperty(entry[0], entry[1], entry[2]); else document.body.style.removeProperty(entry[0]); });
      if (htmlOverflow[0]) document.documentElement.style.setProperty('overflow', htmlOverflow[0], htmlOverflow[1]); else document.documentElement.style.removeProperty('overflow');
      background.forEach(function (entry) { entry[0].inert = entry[1]; }); background = [];
      var root = document.documentElement, behavior = root.style.getPropertyValue('scroll-behavior'), priority = root.style.getPropertyPriority('scroll-behavior');
      root.style.setProperty('scroll-behavior', 'auto', 'important'); window.scrollTo(0, savedY);
      if (behavior) root.style.setProperty('scroll-behavior', behavior, priority); else root.style.removeProperty('scroll-behavior');
    }
    function setOpen(next, immediate) {
      if (next && !mobile.matches) return;
      clearTimeout(timer); open = next;
      burger.setAttribute('aria-expanded', String(next)); burger.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
      menu.classList.toggle('cx-mobile-menu-open', next);
      menu.setAttribute('aria-hidden', String(!next)); menu.inert = !next;
      if (next) { menu.setAttribute('aria-modal', 'true'); lock(); menu.focus({preventScroll:true}); }
      else {
        menu.removeAttribute('aria-modal');
        if (menu.contains(document.activeElement)) burger.focus({preventScroll:true});
        if (immediate || reduced.matches) unlock(); else timer = setTimeout(unlock, 330);
      }
    }
    document.addEventListener('click', function (event) {
      if (!event.target.closest || !event.target.closest('.menu__burger')) return;
      event.preventDefault(); event.stopImmediatePropagation(); setOpen(!open);
    }, true);
    burger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(!open); }
    });
    document.addEventListener('keydown', function (event) {
      if (!open) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
      if (event.key !== 'Tab') return;
      var items = [burger].concat(Array.from(menu.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')).filter(function (element) { return !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden'; }));
      var index = items.indexOf(document.activeElement), next = event.shiftKey ? index - 1 : index + 1;
      if (index < 0) next = event.shiftKey ? items.length - 1 : 0;
      event.preventDefault(); items[(next + items.length) % items.length].focus({preventScroll:false});
    });
    function preventBackgroundScroll(event) { if (locked && !menu.contains(event.target)) event.preventDefault(); }
    document.addEventListener('wheel', preventBackgroundScroll, {passive:false,capture:true});
    document.addEventListener('touchmove', preventBackgroundScroll, {passive:false,capture:true});
    menu.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (link && link.getAttribute('href') !== '#') setOpen(false);
    });
    mobile.addEventListener('change', function () { if (!mobile.matches) setOpen(false, true); });
    window.addEventListener('pagehide', function () { setOpen(false, true); });
    window.addEventListener('pageshow', function (event) { if (event.persisted) setOpen(false, true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();

/* id="cx-burger-animation-script" */
(function () {
  function init() {
    document.querySelectorAll('.menu__burger').forEach(function (burger) {
      var line = burger.querySelector('.menu__line');
      if (!line) return;
      function measure() {
        var height = burger.getBoundingClientRect().height;
        if (height) burger.style.setProperty('--cx-burger-shift', Math.max(0, (height - parseFloat(getComputedStyle(line).height)) / 2) + 'px');
      }
      measure();
      new ResizeObserver(measure).observe(burger);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();

/* id="cx-native-scroll" */
/* Disable Lenis while the pinned motion bundle is migrated to native scroll. */
(function () {
  'use strict';
  var disabled = new WeakSet();
  function disable(instance) {
    if (!instance || disabled.has(instance)) return;
    disabled.add(instance);
    instance.destroy();
    // The existing bundle retains a reference; keep its navigation hooks native.
    instance.raf = instance.start = instance.stop = function () {};
    instance.scrollTo = function (target, options) {
      options = options || {};
      if (typeof target === 'string') {
        if (target === 'top') target = 0;
        else if (target === 'bottom') target = document.documentElement.scrollHeight - innerHeight;
        else { try { target = document.querySelector(target); } catch (_) { return; } }
      }
      var top = typeof target === 'number' ? target : target && target.getBoundingClientRect ? scrollY + target.getBoundingClientRect().top : null;
      if (top === null) return;
      window.scrollTo({top: top + (Number(options.offset) || 0), behavior: 'auto'});
      if (typeof options.onComplete === 'function') options.onComplete();
    };
  }
  function check() {
    if (window.CreativeX) disable(window.CreativeX.lenis);
    disable(window.lenis);
  }
  new MutationObserver(check).observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded', check, {once:true});
  window.addEventListener('load', check, {once:true});
  check();
})();

/* id="cx-rich-text-headings" */
/* Normalize existing and newly inserted rich text headings before motion runs. */
(function () {
  function normalize(root) {
    root.querySelectorAll('.w-richtext h1,.w-richtext h2,.w-richtext h3,.w-richtext h4,.w-richtext h6').forEach(function (heading) {
      var replacement = document.createElement('h5');
      Array.from(heading.attributes).forEach(function (attribute) {
        replacement.setAttribute(attribute.name, attribute.value);
      });
      while (heading.firstChild) replacement.appendChild(heading.firstChild);
      heading.replaceWith(replacement);
    });
  }
  function init() {
    normalize(document);
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes).some(function (node) {
          return node.nodeType === 1 && (node.matches('.w-richtext,h1,h2,h3,h4,h6') || node.querySelector('.w-richtext,h1,h2,h3,h4,h6'));
        });
      })) normalize(document);
    }).observe(document.body, {childList: true, subtree: true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
