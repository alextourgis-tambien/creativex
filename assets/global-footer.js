/* Business column parallax */
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {

  gsap.matchMedia().add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {

  const section = ".section.section-bussiness";

  // COLUMN 1
  gsap.to(".bussines-cards-vertical.is-1", {
    y: "-5rem",
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2
    }
  });

  // COLUMN 2 — opposite vertical direction
  gsap.to(".bussines-cards-vertical.is-2", {
    y: "9rem",
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2
    }
  });

  // COLUMN 3
  gsap.to(".bussines-cards-vertical.is-3", {
    y: "-6.5rem",
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2
    }
  });

  ScrollTrigger.refresh();

  });
});

/* id="cx-marquee-parallax" */
/* Partnership marquees — opposing horizontal scroll parallax. */
(function () {
  'use strict';
  if (window.cxPartnershipParallax) return;
  window.cxPartnershipParallax = true;
  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      document.querySelectorAll('.marquee.is-1,.marquee.is-2').forEach(row => {
        if (row.closest('[data-cx-motion="off"]')) return;
        const initialX = Number(gsap.getProperty(row, 'x')) || 0;
        const reverse = row.classList.contains('is-2');
        const travel = () => Math.min(innerWidth < 768 ? 90 : 180, Math.max(0, row.scrollWidth - row.clientWidth));
        gsap.fromTo(row, {
          x: () => initialX - (reverse ? travel() : 0)
        }, {
          x: () => initialX - (reverse ? 0 : travel()),
          ease: 'none',
          scrollTrigger: {
            trigger: row.closest('.partnership-marquee') || row.parentElement,
            start: 'top bottom', end: 'bottom top', scrub: 1.1, invalidateOnRefresh: true
          }
        });
      });
    });
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts) document.fonts.ready.then(refresh);
    document.querySelectorAll('.marquee img').forEach(image => {
      if (!image.complete) image.addEventListener('load', refresh, { once: true });
    });
    refresh();
  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
})();

/* id="cx-algo-early-entrance" */
/* Start the algo sequence as the section enters the viewport, before it pins. */
(function () {
  'use strict';
  if (window.cxAlgoEarlyEntrance) return;
  window.cxAlgoEarlyEntrance = true;
  var adjusted = new WeakSet();
  function adjust(wrapper) {
    if (!window.ScrollTrigger) return;
    ScrollTrigger.getAll().forEach(function (trigger) {
      if (trigger.trigger !== wrapper || !trigger.animation || adjusted.has(trigger)) return;
      var percent = wrapper.querySelector('.cx-algo-percent');
      if (!percent) return;
      adjusted.add(trigger);
      var timeline = trigger.animation;
      var previousUpdate = timeline.eventCallback('onUpdate');
      var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
      var ease = gsap.parseEase('power2.inOut');
      var lastScore;
      function updateScore() {
        // Reveal 80% with the result card, hold briefly, then count down to 40%.
        var progress = Math.max(0, Math.min(1, (timeline.time() - 5.95) / .5));
        var score = reduceMotion.matches ? 40 : Math.round(80 - 40 * ease(progress));
        if (score !== lastScore) {
          percent.textContent = score + '%';
          lastScore = score;
        }
      }
      timeline.eventCallback('onUpdate', function () {
        if (previousUpdate) previousUpdate.apply(this, arguments);
        updateScore();
      });
      updateScore();
      trigger.vars.start = 'top 75%';
      trigger.vars.scrub = .45;
      trigger.scrubDuration(.45);
      trigger.refresh();
    });
  }
  function init() {
    document.querySelectorAll('.algo__wrapper').forEach(function (wrapper) {
      var code = wrapper.querySelector('.algo__code');
      if (!code) return;
      new MutationObserver(function () { adjust(wrapper); }).observe(code, { childList: true });
      adjust(wrapper);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

/* id="cx-career-parallax" */
/* Career columns and interview images — opposing vertical scroll motion. */
(function () {
  'use strict';
  if (window.cxCareerParallax) return;
  window.cxCareerParallax = true;
  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var motion = gsap.matchMedia();
    motion.add({mobile:'(max-width: 767px)', desktop:'(min-width: 768px)', animate:'(prefers-reduced-motion: no-preference)'}, function (context) {
      if (!context.conditions.animate) return;
      var mobile = context.conditions.mobile;
      function move(element, trigger, distance) {
        var baseY = Number(gsap.getProperty(element, 'y')) || 0;
        gsap.fromTo(element, {y:baseY}, {
          y:baseY + distance, ease:'none',
          scrollTrigger:{trigger:trigger, start:'top bottom', end:'bottom top', scrub:.7, invalidateOnRefresh:true}
        });
      }
      document.querySelectorAll('.bussines-cards-wrapper').forEach(function (wrapper) {
        if (!wrapper.querySelector('.is-1-career,.is-2-career,.is-3-career')) return;
        var columns = Array.from(wrapper.children).filter(function (element) {return element.classList.contains('bussines-cards-vertical');});
        var classesCorrect = [1,2,3].every(function (number) {return columns.filter(function (element) {return element.classList.contains('is-' + number + '-career');}).length === 1;});
        var travel = mobile ? [-55,70,-60] : [-100,130,-115];
        columns.forEach(function (column, index) {
          var order = classesCorrect ? [1,2,3].findIndex(function (number) {return column.classList.contains('is-' + number + '-career');}) : index;
          if (order < 3) move(column, wrapper, travel[order]);
        });
      });
      document.querySelectorAll('.interview-image.is-1,.interview-image-box').forEach(function (element) {
        var distance = (mobile ? 50 : 100) * (element.matches('.interview-image.is-1') ? -1 : 1);
        move(element, element.closest('.interview-image-grid') || element.parentElement, distance);
      });
    });
    ScrollTrigger.refresh();
  }
  if (document.readyState === 'complete') init(); else window.addEventListener('load', init, {once:true});
})();
