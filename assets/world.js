/* CreativeX globe. Geographic contours: Natural Earth (public domain).
   Campaigns are illustrative fixtures, not live customer analytics. */
(function () {
  'use strict';
  if (window.CreativeXWorld) return;
  const assetBase = new URL('.', document.currentScript.src).href;
  const radians = Math.PI / 180;
  const cities = [
    { name: 'LONDON', lat: 51.51, lon: -0.13, campaign: 'BRAND LAUNCH', score: 96 },
    { name: 'PARIS', lat: 48.86, lon: 2.35, campaign: 'SPRING CAMPAIGN', score: 94 },
    { name: 'NEW YORK', lat: 40.71, lon: -74.01, campaign: 'GLOBAL LAUNCH', score: 98 },
    { name: 'MEXICO CITY', lat: 19.43, lon: -99.13, campaign: 'BRAND AWARENESS', score: 91 },
    { name: 'SÃO PAULO', lat: -23.55, lon: -46.63, campaign: 'SUMMER CAMPAIGN', score: 93 },
    { name: 'CAPE TOWN', lat: -33.92, lon: 18.42, campaign: 'REGIONAL LAUNCH', score: 89 },
    { name: 'DUBAI', lat: 25.20, lon: 55.27, campaign: 'NEW COLLECTION', score: 95 },
    { name: 'SINGAPORE', lat: 1.35, lon: 103.82, campaign: 'BRAND ACTIVATION', score: 97 },
    { name: 'TOKYO', lat: 35.68, lon: 139.69, campaign: 'Q3 SUMMER PUSH', score: 100 },
    { name: 'SYDNEY', lat: -33.87, lon: 151.21, campaign: 'HOLIDAY CAMPAIGN', score: 29 }
  ];
  const routes = [[0,2],[1,6],[1,5],[2,4],[2,3],[4,5],[6,7],[7,8],[8,9],[5,9]];
  const tags = [
    ['creative', 45, -20], ['media', 22, 28], ['signals', -8, 10],
    ['campaigns', 60, 70], ['outcomes', -25, 95], ['quality', 30, -110],
    ['content', -10, -70], ['performance', 12, 125]
  ];
  const instances = [];
  let land = [];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const vector = (lat, lon) => {
    const a = lat * radians, b = lon * radians;
    return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
  };
  cities.forEach(city => { city.vector = vector(city.lat, city.lon); });
  const paths = routes.map(([a,b]) => {
    const from = cities[a].vector, to = cities[b].vector;
    const angle = Math.acos(Math.max(-1, Math.min(1, from.reduce((s,v,i) => s + v * to[i], 0))));
    const points = [];
    for (let step = 0; step <= 56; step++) {
      const t = step / 56, sin = Math.sin(angle) || 1;
      const first = Math.sin((1-t)*angle)/sin, second = Math.sin(t*angle)/sin;
      const lift = 1 + Math.sin(Math.PI*t) * 0.13;
      points.push(from.map((v,i) => (v*first + to[i]*second) * lift));
    }
    return { points, color: cities[a].score < 50 || cities[b].score < 50 ? '#ff526d' : '#25c671' };
  });

  function create(wrapper, gsap) {
    if (wrapper.querySelector('.cx-world')) return;
    const root = document.createElement('div'); root.className = 'cx-world';
    root.setAttribute('role','img');
    root.setAttribute('aria-label','Illustration of a connected world, with example marketing campaigns across global cities.');
    const canvas = document.createElement('canvas'); canvas.className = 'cx-world-canvas';
    canvas.setAttribute('aria-hidden','true'); root.appendChild(canvas);
    const cards = cities.map(city => {
      const card = document.createElement('div'); card.className = 'cx-world-card';
      card.setAttribute('aria-hidden','true');
      const icon = document.createElement('span'); icon.className = 'cx-world-status';
      icon.textContent = city.score < 50 ? '!' : '✓';
      if (city.score < 50) card.classList.add('is-alert');
      const label = document.createElement('span'); label.className = 'cx-world-card-copy';
      label.textContent = city.name + ': ' + city.campaign + ' ';
      const score = document.createElement('strong'); score.textContent = city.score + '%';
      label.appendChild(score); card.append(icon,label); root.appendChild(card);
      return { element: card, opacity: 0, x: null, y: null };
    });
    wrapper.appendChild(root);
    const ctx = canvas.getContext('2d');
    if (!ctx) { root.remove(); return; }
    const model = { rotation: -18, reveal: media.matches ? 1 : 0 };
    let width=0, height=0, radius=0, cx=0, cy=0, last=0, destroyed=false;
    let onScreen=true, hovered=false;
    const spin = gsap.to(model, { rotation: '-=360', duration: 95, ease: 'none', repeat: -1, paused: true });
    const entrance = gsap.to(model, { reveal: 1, duration: 1.5, ease: 'power2.out', paused: media.matches });

    function project(v) {
      const yaw = model.rotation * radians, tilt = 9 * radians;
      const x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw);
      const z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);
      const y=v[1]*Math.cos(tilt)-z*Math.sin(tilt);
      const depth=v[1]*Math.sin(tilt)+z*Math.cos(tilt);
      const r=radius*(0.94+model.reveal*0.06);
      return { x:cx+x*r, y:cy-y*r, z:depth };
    }
    function line(points,color,alpha,lineWidth) {
      ctx.strokeStyle=color;ctx.globalAlpha=alpha*model.reveal;ctx.lineWidth=lineWidth;
      ctx.beginPath(); let started=false;
      points.forEach(v => {
        const p=project(v);
        if (p.z < 0.02) { started=false; return; }
        if (!started) { ctx.moveTo(p.x,p.y);started=true; } else ctx.lineTo(p.x,p.y);
      }); ctx.stroke();ctx.globalAlpha=1;
    }
    function contours() {
      ctx.fillStyle='rgba(168,190,200,0.23)';ctx.strokeStyle='rgba(157,179,190,0.17)';ctx.lineWidth=0.45;
      land.forEach(ring => {
        const projected=ring.map(project), clipped=[];
        for(let i=0;i<projected.length;i++) {
          const a=projected[i],b=projected[(i+1)%projected.length];
          if(a.z>=0) clipped.push(a);
          if((a.z>=0)!==(b.z>=0)) {
            // Normalize the limb intersection to the sphere silhouette.
            const t=a.z/(a.z-b.z), x=a.x+(b.x-a.x)*t-cx, y=a.y+(b.y-a.y)*t-cy;
            const length=Math.hypot(x,y)||1;
            clipped.push({x:cx+x/length*radius*(0.94+model.reveal*0.06),y:cy+y/length*radius*(0.94+model.reveal*0.06)});
          }
        }
        if(clipped.length<3)return;
        ctx.beginPath();clipped.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.closePath();ctx.fill();ctx.stroke();
      });
    }
    function render(time) {
      if(destroyed||!width||!height)return;
      if(time && time-last<1/30)return;
      last=time||last;
      const r=radius*(0.94+model.reveal*0.06);
      ctx.clearRect(0,0,width,height);
      ctx.globalAlpha=model.reveal;
      const ocean=ctx.createRadialGradient(cx-r*.38,cy-r*.45,r*.1,cx+r*.25,cy+r*.1,r*1.25);
      ocean.addColorStop(0,'rgba(255,255,255,0.93)');ocean.addColorStop(.6,'rgba(240,247,250,0.87)');ocean.addColorStop(1,'rgba(210,226,234,0.88)');
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=ocean;ctx.fill();
      ctx.save();ctx.clip(); contours();
      for(let lat=-60;lat<=60;lat+=30) {
        const points=[];for(let lon=-180;lon<=180;lon+=4)points.push(vector(lat,lon));
        line(points,'#c4d5dc',.17,.55);
      }
      for(let lon=-180;lon<180;lon+=30) {
        const points=[];for(let lat=-90;lat<=90;lat+=4)points.push(vector(lat,lon));
        line(points,'#c4d5dc',.17,.55);
      }
      ctx.font='500 '+Math.max(7,width*.017)+'px monospace';ctx.textAlign='center';
      tags.forEach(([text,lat,lon])=>{
        const p=project(vector(lat,lon));if(p.z<.25)return;
        ctx.globalAlpha=p.z*.3*model.reveal; const w=ctx.measureText(text).width+12;
        ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(p.x-w/2,p.y-7,w,14,7);ctx.fill();
        ctx.fillStyle='#849ba6';ctx.fillText(text,p.x,p.y+2.5);
      });ctx.globalAlpha=model.reveal;
      ctx.restore();
      ctx.strokeStyle='rgba(255,255,255,0.88)';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
      paths.forEach((route,index)=>{
        line(route.points,route.color,.64,.8);
        const phase=media.matches ? 0.5 :((last*.055+index*.13)%1);
        const packet=project(route.points[Math.round(phase*56)]);
        if(packet.z>.05){
          ctx.globalAlpha=.8*model.reveal;ctx.fillStyle=route.color;
          ctx.beginPath();ctx.arc(packet.x,packet.y,1.6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
        }
      });
      const visible=cities.map((city,index)=>({ city,index,p:project(city.vector) })).filter(v=>v.p.z>.22).sort((a,b)=>b.p.z-a.p.z);
      // Show geographically separated cities, avoiding stacked Europe labels.
      const selected=[];
      visible.forEach(item=>{
        if(selected.length>=(width<480?3:4))return;
        if(selected.some(v=>Math.hypot(v.p.x-item.p.x,v.p.y-item.p.y)<radius*.22))return;
        selected.push(item);
      });
      const occupied=[];
      cities.forEach((city,index)=>{
        const card=cards[index], p=project(city.vector), item=selected.find(v=>v.index===index);
        const target=item?Math.min(1,(p.z-.18)*3)*model.reveal:0;
        card.opacity=media.matches?target:card.opacity+(target-card.opacity)*.12;
        card.element.style.opacity=card.opacity.toFixed(3);
        if(card.opacity<.015){card.element.style.visibility='hidden';return;}
        card.element.style.visibility='visible';
        const box=card.element.getBoundingClientRect(), w=box.width,h=box.height;
        const side=p.x<cx?-1:1;
        const x=Math.max(4,Math.min(width-w-4,p.x+(side<0?-w-12:12)));
        let y=Math.max(5,Math.min(height-h-5,p.y-h/2));
        for(const offset of [0,-h-10,h+10,-2*h-20,2*h+20]) {
          const candidate=Math.max(5,Math.min(height-h-5,p.y-h/2+offset));
          if(!occupied.some(b=>x<b.x+b.w+5&&x+w+5>b.x&&candidate<b.y+b.h+5&&candidate+h+5>b.y)) {y=candidate;break;}
        }
        const immediate=media.matches||card.x===null||card.opacity<.03;
        card.x=immediate?x:card.x+(x-card.x)*.14;
        card.y=immediate?y:card.y+(y-card.y)*.14;
        occupied.push({x:card.x,y:card.y,w,h});
        card.element.style.transform='translate3d('+card.x.toFixed(2)+'px,'+card.y.toFixed(2)+'px,0)';
        ctx.globalAlpha=card.opacity;
        ctx.strokeStyle=city.score<50?'#ff526d':'#25c671';ctx.lineWidth=.65;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(side<0?card.x+w:card.x,card.y+h/2);ctx.stroke();
        ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.62)';ctx.fill();
        ctx.beginPath();ctx.arc(p.x,p.y,2.1,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();
      });ctx.globalAlpha=1;
    }
    function resize() {
      const rect=wrapper.getBoundingClientRect();width=rect.width;height=rect.height;
      if(!width||!height)return;
      const ratio=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      cx=width/2;cy=height*.49;radius=Math.min(width*.40,height*.41);
      root.style.setProperty('--cx-world-font',Math.max(6.5,Math.min(9,width*.019))+'px');
      render();
    }
    function state() {
      const playing=onScreen&&!document.hidden&&!hovered&&!media.matches;
      if(playing) {spin.resume();gsap.ticker.add(render);} else {spin.pause();gsap.ticker.remove(render);}
      if(media.matches) {entrance.pause();model.reveal=1;}
      else if(model.reveal<1&&playing)entrance.resume();
      render();
    }
    const observer=new ResizeObserver(resize);observer.observe(wrapper);
    const intersection=new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;state();},{rootMargin:'80px'});intersection.observe(wrapper);
    const enter=()=>{if(hover.matches){hovered=true;state();}},leave=()=>{hovered=false;state();};
    wrapper.addEventListener('pointerenter',enter);wrapper.addEventListener('pointerleave',leave);
    document.addEventListener('visibilitychange',state);media.addEventListener('change',state);
    resize();state();
    const instance={render, destroy(){
      destroyed=true;spin.kill();entrance.kill();gsap.ticker.remove(render);
      observer.disconnect();intersection.disconnect();
      wrapper.removeEventListener('pointerenter',enter);wrapper.removeEventListener('pointerleave',leave);
      document.removeEventListener('visibilitychange',state);media.removeEventListener('change',state);root.remove();
    }};instances.push(instance);
  }
  async function init() {
    const wrappers=document.querySelectorAll('.world__wrapper');if(!wrappers.length)return;
    if(!window.gsap) { await new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js';
      script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
    }); }
    wrappers.forEach(wrapper=>create(wrapper,window.gsap));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(new URL('world-land.json',assetBase),{signal:controller.signal});
      if(!response.ok)throw new Error('Map unavailable');
      const polygons=await response.json();
      land=polygons.map(ring=>ring.map(([lon,lat])=>vector(lat,lon)));
      instances.forEach(instance=>instance.render());
    } catch(error) {console.warn('[CreativeX globe] Geographic contours unavailable.',error);}
    finally {clearTimeout(timer);}
  }
  window.CreativeXWorld={destroy(){instances.splice(0).forEach(instance=>instance.destroy());}};
  window.Webflow=window.Webflow||[];
  window.Webflow.push(()=>init().catch(error=>console.warn('[CreativeX globe] Unable to initialize.',error)));
})();
