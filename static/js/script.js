/* ============================================================
   AI Interview & Resume Coach — Core Interactions
   ============================================================ */

function safeInit(fn){
  try { fn(); } catch(err) { console.error(`[CoachAI] ${fn.name} failed:`, err); }
}

document.addEventListener('DOMContentLoaded', () => {
  safeInit(initIntro);
  safeInit(initTheme);
  safeInit(initNavbarScroll);
  safeInit(initCursorGlow);
  safeInit(initParticles);
  safeInit(initMagneticButtons);
  safeInit(initRipples);
  safeInit(initScrollReveal);
  safeInit(initOrb);
  safeInit(initSkillBubbles);
  safeInit(initAIPet);
  safeInit(initCube);
  safeInit(initGlobe);
  safeInit(initNeuralNetwork);
  safeInit(initPhysicsPlayground);
});

/* ---------------- Opening interactive interface ---------------- */
function initIntro(){
  const overlay = document.getElementById('intro-overlay');
  if(!overlay) return;

  if(sessionStorage.getItem('aicoach-intro-seen')){
    overlay.remove();
    return;
  }

  const fill = document.getElementById('intro-fill');
  const pct = document.getElementById('intro-pct');
  let progress = 0;
  const timer = setInterval(() => {
    progress += 8 + Math.random() * 14;
    if(progress >= 100){ progress = 100; clearInterval(timer); }
    fill.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
  }, 160);

  let dismissed = false;
  function dismiss(){
    if(dismissed) return;
    dismissed = true;
    sessionStorage.setItem('aicoach-intro-seen', '1');
    overlay.classList.add('intro-exit');
    setTimeout(() => overlay.remove(), 650);
  }
  overlay.addEventListener('click', dismiss);
  setTimeout(dismiss, 2800);
}

/* ---------------- Theme toggle + persistence ---------------- */
function initTheme(){
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('aicoach-theme') || 'dark';
  root.setAttribute('data-theme', saved);
  if(toggle) toggle.querySelector('.knob').textContent = saved === 'dark' ? '🌙' : '☀️';

  toggle && toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.classList.add('theme-transition');
    root.setAttribute('data-theme', next);
    localStorage.setItem('aicoach-theme', next);
    toggle.querySelector('.knob').textContent = next === 'dark' ? '🌙' : '☀️';
    setTimeout(() => document.body.classList.remove('theme-transition'), 500);
  });
}

/* ---------------- Navbar glass on scroll ---------------- */
function initNavbarScroll(){
  const nav = document.querySelector('.navbar-glass');
  if(!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  });
}

/* ---------------- Cursor glow ---------------- */
function initCursorGlow(){
  const glow = document.getElementById('cursor-glow');
  if(!glow || matchMedia('(pointer:coarse)').matches) { if(glow) glow.style.display='none'; return; }
  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

/* ---------------- tsParticles ambient network ---------------- */
function initParticles(){
  if(typeof tsParticles === 'undefined') return;
  tsParticles.load('tsparticles', {
    fpsLimit: 60,
    background: { color: 'transparent' },
    particles: {
      number: { value: 90, density: { enable: true, area: 900 } },
      color: { value: ['#ff2b3d', '#ff8a3d', '#ff1f5a'] },
      links: { enable: true, color: '#ff2b3d', distance: 140, opacity: 0.25, width: 1 },
      move: { enable: true, speed: 0.6, outModes: { default: 'out' } },
      size: { value: { min: 1, max: 3 } },
      opacity: { value: 0.5 },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
        onClick: { enable: true, mode: 'push' },
      },
      modes: {
        grab: { distance: 160, links: { opacity: 0.5 } },
        push: { quantity: 3 },
      },
    },
    detectRetina: true,
  });
}

/* ---------------- Magnetic buttons ---------------- */
function initMagneticButtons(){
  document.querySelectorAll('.magnetic').forEach(btn => {
    const strength = 22;
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x / r.width * strength}px, ${y / r.height * strength}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0,0)';
      btn.style.transition = 'transform .4s cubic-bezier(.2,1.4,.4,1)';
      setTimeout(() => btn.style.transition = '', 400);
    });
  });
}

/* ---------------- Ripple on click ---------------- */
function initRipples(){
  document.querySelectorAll('.btn-ai').forEach(btn => {
    btn.addEventListener('click', function(e){
      const r = document.createElement('span');
      r.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + 'px';
      r.style.left = (e.clientX - rect.left - size/2) + 'px';
      r.style.top = (e.clientY - rect.top - size/2) + 'px';
      this.appendChild(r);
      setTimeout(() => r.remove(), 650);
    });
  });
}

/* ---------------- Scroll reveal ---------------- */
function initScrollReveal(){
  const els = document.querySelectorAll('.feature-card, .reveal-up');
  if(typeof IntersectionObserver === 'undefined'){
    els.forEach(el => el.classList.add('reveal', 'in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting){
        en.target.classList.add('reveal', 'in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}

/* ---------------- Floating AI Orb: drag, momentum, bounce, tips ---------------- */
const ORB_TIPS = [
  "Tailor every bullet to the job description's exact keywords.",
  "Quantify results: 'improved X by 30%' beats 'responsible for X'.",
  "In interviews, structure answers with the STAR method.",
  "Keep your resume to one page unless you have 10+ years experience.",
  "Practice your 'tell me about yourself' until it's 60 seconds, not 6 minutes.",
  "Match your resume's language to the ATS's parsed keywords.",
  "Ask the interviewer a thoughtful question — it shows genuine interest.",
  "Lead with impact, not duties. Verbs first, numbers second.",
];

function initOrb(){
  const orb = document.getElementById('ai-orb');
  const stage = document.querySelector('.hero-orb-stage');
  if(!orb || !stage) return;

  let x = 0, y = 0, vx = 0.6, vy = 0.4;
  let dragging = false, dragStartX, dragStartY, lastX, lastY, lastT;
  let hue = 0;

  function bounds(){
    return { w: stage.clientWidth, h: stage.clientHeight, r: orb.clientWidth/2 };
  }

  // initialize centered
  const b0 = bounds();
  x = b0.w/2; y = b0.h/2;

  function render(){
    orb.style.left = x + 'px';
    orb.style.top = y + 'px';
  }

  function step(){
    if(!dragging){
      const b = bounds();
      x += vx; y += vy;
      if(x - b.r < 0){ x = b.r; vx *= -0.92; }
      if(x + b.r > b.w){ x = b.w - b.r; vx *= -0.92; }
      if(y - b.r < 0){ y = b.r; vy *= -0.92; }
      if(y + b.r > b.h){ y = b.h - b.r; vy *= -0.92; }
      // gentle drift damping toward a min speed so it never fully stops
      const speed = Math.hypot(vx, vy);
      if(speed < 0.25){
        vx += (Math.random()-0.5) * 0.05;
        vy += (Math.random()-0.5) * 0.05;
      }
      render();
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  function pointerDown(e){
    dragging = true;
    orb.style.animationPlayState = 'paused';
    const p = e.touches ? e.touches[0] : e;
    lastX = p.clientX; lastY = p.clientY; lastT = Date.now();
    dragStartX = p.clientX; dragStartY = p.clientY;
    orb.style.cursor = 'grabbing';
  }
  function pointerMove(e){
    if(!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const rect = stage.getBoundingClientRect();
    const b = bounds();
    let nx = p.clientX - rect.left;
    let ny = p.clientY - rect.top;
    nx = Math.max(b.r, Math.min(b.w - b.r, nx));
    ny = Math.max(b.r, Math.min(b.h - b.r, ny));
    const now = Date.now();
    const dt = Math.max(1, now - lastT);
    vx = (p.clientX - lastX) / dt * 14;
    vy = (p.clientY - lastY) / dt * 14;
    lastX = p.clientX; lastY = p.clientY; lastT = now;
    x = nx; y = ny;
    render();
  }
  function pointerUp(){
    if(!dragging) return;
    dragging = false;
    orb.style.cursor = 'grab';
    orb.style.animationPlayState = 'running';
  }

  orb.addEventListener('mousedown', pointerDown);
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerUp);
  orb.addEventListener('touchstart', pointerDown, { passive: true });
  window.addEventListener('touchmove', pointerMove, { passive: true });
  window.addEventListener('touchend', pointerUp);

  orb.addEventListener('mouseenter', () => orb.classList.add('hovered'));
  orb.addEventListener('mouseleave', () => orb.classList.remove('hovered'));

  orb.addEventListener('dblclick', () => {
    hue = (hue + 70) % 360;
    orb.style.filter = `hue-rotate(${hue}deg)`;
  });

  orb.addEventListener('click', (e) => {
    // avoid firing a tip right after a drag-release
    if(Math.abs(e.clientX - dragStartX) > 6 || Math.abs(e.clientY - dragStartY) > 6) return;
    showOrbTip();
  });

  function showOrbTip(){
    document.querySelectorAll('.orb-tip').forEach(t => t.remove());
    const tip = document.createElement('div');
    tip.className = 'orb-tip glass';
    tip.textContent = ORB_TIPS[Math.floor(Math.random() * ORB_TIPS.length)];
    tip.style.left = (x + 40) + 'px';
    tip.style.top = (y - 60) + 'px';
    stage.appendChild(tip);
    setTimeout(() => tip.remove(), 4200);
  }
}

/* ---------------- Skill bubbles: lightweight drag + drift + collide ---------------- */
function initSkillBubbles(){
  const stage = document.getElementById('bubble-stage');
  if(!stage) return;
  const skills = ['Python','AI','Machine Learning','Deep Learning','Flask','LangChain','RAG','OpenAI','Gemini','FAISS','Prompt Eng.','Agentic AI'];
  const bubbles = [];

  skills.forEach((label, i) => {
    const size = 70 + Math.random() * 40;
    const el = document.createElement('div');
    el.className = 'skill-bubble';
    el.textContent = label;
    el.style.width = el.style.height = size + 'px';
    stage.appendChild(el);
    bubbles.push({
      el, size,
      x: Math.random() * (stage.clientWidth - size),
      y: Math.random() * (stage.clientHeight - size),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      dragging: false,
    });
  });

  function attachDrag(b){
    b.el.addEventListener('mousedown', e => {
      b.dragging = true;
      const rect = stage.getBoundingClientRect();
      const move = ev => {
        b.x = ev.clientX - rect.left - b.size/2;
        b.y = ev.clientY - rect.top - b.size/2;
      };
      const up = () => {
        b.dragging = false;
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
    b.el.addEventListener('click', () => {
      b.el.classList.add('glow');
      setTimeout(() => b.el.classList.remove('glow'), 500);
    });
  }
  bubbles.forEach(attachDrag);

  function tick(){
    const w = stage.clientWidth, h = stage.clientHeight;
    bubbles.forEach(b => {
      if(!b.dragging){
        b.x += b.vx; b.y += b.vy;
        if(b.x <= 0 || b.x + b.size >= w) b.vx *= -1;
        if(b.y <= 0 || b.y + b.size >= h) b.vy *= -1;
        b.x = Math.max(0, Math.min(w - b.size, b.x));
        b.y = Math.max(0, Math.min(h - b.size, b.y));
      }
      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
    });
    // simple pairwise collision (cheap, small N)
    for(let i=0;i<bubbles.length;i++){
      for(let j=i+1;j<bubbles.length;j++){
        const a = bubbles[i], c = bubbles[j];
        const dx = (a.x+a.size/2)-(c.x+c.size/2);
        const dy = (a.y+a.size/2)-(c.y+c.size/2);
        const dist = Math.hypot(dx,dy);
        const minDist = (a.size+c.size)/2;
        if(dist < minDist && dist > 0){
          const overlap = (minDist - dist) / 2;
          const nx = dx/dist, ny = dy/dist;
          if(!a.dragging){ a.x += nx*overlap; a.y += ny*overlap; }
          if(!c.dragging){ c.x -= nx*overlap; c.y -= ny*overlap; }
          [a.vx,c.vx] = [c.vx,a.vx];
          [a.vy,c.vy] = [c.vy,a.vy];
        }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------------- AI Assistant Pet ---------------- */
function initAIPet(){
  const pet = document.getElementById('ai-pet');
  if(!pet) return;
  const messages = ["Upload your Resume!", "Need Interview Tips?", "Ask me Anything!", "Let's improve your ATS Score!"];
  let bubbleTimer;

  function speak(){
    document.querySelectorAll('.pet-bubble').forEach(b => b.remove());
    const bubble = document.createElement('div');
    bubble.className = 'pet-bubble glass';
    bubble.textContent = messages[Math.floor(Math.random()*messages.length)];
    document.getElementById('ai-pet-wrap').appendChild(bubble);
    setTimeout(() => bubble.remove(), 3200);
  }

  clearInterval(bubbleTimer);
  bubbleTimer = setInterval(speak, 9000);
  setTimeout(speak, 2500);

  pet.addEventListener('click', () => { window.location.href = '/chat'; });

  // subtle mouse-follow tilt
  window.addEventListener('mousemove', e => {
    const r = pet.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width/2);
    const tilt = Math.max(-10, Math.min(10, dx / 60));
    pet.style.transform = `rotate(${tilt}deg)`;
  });
}

/* ---------------- CSS 3D cube: drag to rotate ---------------- */
function initCube(){
  const cube = document.getElementById('ai-cube');
  if(!cube) return;
  let rotX = -20, rotY = 35, dragging = false, lastX, lastY;

  cube.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('mousemove', e => {
    if(!dragging) return;
    rotY += (e.clientX - lastX) * 0.5;
    rotX -= (e.clientY - lastY) * 0.5;
    lastX = e.clientX; lastY = e.clientY;
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  cube.querySelectorAll('.cube-face').forEach(face => {
    face.addEventListener('click', (e) => {
      if(dragging) return;
      const href = face.dataset.href;
      if(href) window.location.href = href;
    });
  });

  let auto = true;
  function spin(){
    if(auto && !dragging){
      rotY += 0.15;
      cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }
    requestAnimationFrame(spin);
  }
  cube.addEventListener('mouseenter', () => auto = false);
  cube.addEventListener('mouseleave', () => auto = true);
  requestAnimationFrame(spin);
}

/* ---------------- 3D Globe (Three.js): rotate, zoom, click cities ---------------- */
function initGlobe(){
  const container = document.getElementById('globe-canvas');
  if(!container || typeof THREE === 'undefined') return;

  const width = container.clientWidth, height = container.clientHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 4.4;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const wireGeo = new THREE.SphereGeometry(1.6, 34, 34);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xff2b3d, wireframe: true, transparent: true, opacity: 0.35 });
  globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

  const coreGeo = new THREE.SphereGeometry(1.56, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x0a0e1a, transparent: true, opacity: 0.85 });
  globeGroup.add(new THREE.Mesh(coreGeo, coreMat));

  const cities = [
    { name: 'India', lat: 20.59, lon: 78.96 },
    { name: 'USA', lat: 37.09, lon: -95.71 },
    { name: 'Germany', lat: 51.16, lon: 10.45 },
    { name: 'Japan', lat: 36.20, lon: 138.25 },
    { name: 'Canada', lat: 56.13, lon: -106.35 },
  ];

  function latLonToVec3(lat, lon, radius){
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  const markers = [];
  cities.forEach(c => {
    const pos = latLonToVec3(c.lat, c.lon, 1.6);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d });
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), markerMat);
    marker.position.copy(pos);
    marker.userData.name = c.name;
    globeGroup.add(marker);
    markers.push(marker);

    const haloMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.25 });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), haloMat);
    halo.position.copy(pos);
    globeGroup.add(halo);
  });

  for(let i = 0; i < markers.length; i++){
    for(let j = i + 1; j < markers.length; j++){
      const lineGeo = new THREE.BufferGeometry().setFromPoints([markers[i].position, markers[j].position]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xff2b3d, transparent: true, opacity: 0.18 });
      globeGroup.add(new THREE.Line(lineGeo, lineMat));
    }
  }

  let dragging = false, lastX, lastY, rotY = 0.4, rotX = 0.2, autoRotate = true;

  container.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('mousemove', e => {
    if(!dragging) return;
    rotY += (e.clientX - lastX) * 0.006;
    rotX += (e.clientY - lastY) * 0.006;
    rotX = Math.max(-1.1, Math.min(1.1, rotX));
    lastX = e.clientX; lastY = e.clientY;
  });
  container.addEventListener('wheel', e => {
    e.preventDefault();
    camera.position.z = Math.max(2.6, Math.min(7, camera.position.z + e.deltaY * 0.0025));
  }, { passive: false });
  container.addEventListener('mouseenter', () => autoRotate = false);
  container.addEventListener('mouseleave', () => autoRotate = true);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  container.addEventListener('click', e => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(markers);
    if(hits.length) showToast(`📍 ${hits[0].object.userData.name} — active candidates coached here right now.`);
  });

  function animate(){
    requestAnimationFrame(animate);
    if(autoRotate && !dragging) rotY += 0.0022;
    globeGroup.rotation.y = rotY;
    globeGroup.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    if(!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/* ---------------- Interactive Neural Network (canvas 2D) ---------------- */
function initNeuralNetwork(){
  const canvas = document.getElementById('neural-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const N = 14;
  const nodes = [];
  for(let i = 0; i < N; i++){
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 7 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    });
  }

  const edges = [];
  nodes.forEach((n, i) => {
    const ranked = nodes
      .map((m, j) => ({ j, d: Math.hypot(n.x - m.x, n.y - m.y) }))
      .filter(o => o.j !== i)
      .sort((a, b) => a.d - b.d);
    for(let k = 0; k < 2; k++){
      const j = ranked[k].j;
      if(!edges.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) edges.push([i, j]);
    }
  });

  const pulses = [];
  setInterval(() => {
    if(edges.length) pulses.push({ edge: edges[Math.floor(Math.random() * edges.length)], t: 0 });
  }, 450);

  let dragNode = null, dragStart = null, moved = false, selectedNode = null, hoverNode = null;

  function nodeAt(x, y){
    return nodes.find(n => Math.hypot(n.x - x, n.y - y) < n.r + 8);
  }

  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const n = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if(n){ dragNode = n; dragStart = { x: e.clientX, y: e.clientY }; moved = false; }
  });
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    hoverNode = nodeAt(x, y);
    if(dragNode){
      if(Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > 4) moved = true;
      if(moved){ dragNode.x = x; dragNode.y = y; }
    }
  });
  window.addEventListener('mouseup', () => {
    if(dragNode && !moved){
      const idx = nodes.indexOf(dragNode);
      if(selectedNode === null) selectedNode = idx;
      else if(selectedNode !== idx){
        const exists = edges.some(e => (e[0] === selectedNode && e[1] === idx) || (e[0] === idx && e[1] === selectedNode));
        if(!exists) edges.push([selectedNode, idx]);
        selectedNode = null;
      } else selectedNode = null;
    }
    dragNode = null; moved = false;
  });

  function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(n => {
      if(n !== dragNode){
        n.x += n.vx; n.y += n.vy;
        if(n.x < 12 || n.x > canvas.width - 12) n.vx *= -1;
        if(n.y < 12 || n.y > canvas.height - 12) n.vy *= -1;
      }
    });
    edges.forEach(([i, j]) => {
      const a = nodes[i], b = nodes[j];
      const highlighted = hoverNode && (a === hoverNode || b === hoverNode);
      ctx.strokeStyle = highlighted ? 'rgba(255,43,61,0.9)' : 'rgba(255,43,61,0.18)';
      ctx.lineWidth = highlighted ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
    for(let p = pulses.length - 1; p >= 0; p--){
      const pulse = pulses[p];
      pulse.t += 0.018;
      if(pulse.t >= 1){ pulses.splice(p, 1); continue; }
      const a = nodes[pulse.edge[0]], b = nodes[pulse.edge[1]];
      const x = a.x + (b.x - a.x) * pulse.t, y = a.y + (b.y - a.y) * pulse.t;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8a3d'; ctx.shadowColor = '#ff8a3d'; ctx.shadowBlur = 9;
      ctx.fill(); ctx.shadowBlur = 0;
    }
    nodes.forEach((n, i) => {
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = i === selectedNode ? '#ff1f5a' : (n === hoverNode ? '#ff5c3d' : '#ff2b3d');
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
      ctx.fill(); ctx.shadowBlur = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------------- Physics Playground (Matter.js) ---------------- */
function initPhysicsPlayground(){
  const container = document.getElementById('physics-stage');
  if(!container || typeof Matter === 'undefined') return;

  const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Events, Body } = Matter;
  const width = container.clientWidth, height = container.clientHeight;

  const engine = Engine.create();
  engine.gravity.y = 0.55;

  const render = Render.create({
    element: container,
    engine,
    options: { width, height, wireframes: false, background: 'transparent' },
  });

  const wallOpts = { isStatic: true, render: { visible: false } };
  World.add(engine.world, [
    Bodies.rectangle(width / 2, -10, width, 20, wallOpts),
    Bodies.rectangle(width / 2, height + 10, width, 20, wallOpts),
    Bodies.rectangle(-10, height / 2, 20, height, wallOpts),
    Bodies.rectangle(width + 10, height / 2, 20, height, wallOpts),
  ]);

  const labels = ['Py', 'Gem', 'AI', 'Flask', 'Lang', 'RAG', 'FAISS', 'TF', 'Torch'];
  const colors = ['#ff2b3d', '#ff8a3d', '#ff1f5a', '#ffcf3d', '#ff5c3d'];
  const startPositions = [];
  const balls = labels.map((label, i) => {
    const sx = 50 + (i % 5) * (width - 100) / 4;
    const sy = 40 + Math.floor(i / 5) * 60;
    startPositions.push({ x: sx, y: sy });
    const ball = Bodies.circle(sx, sy, 27, {
      restitution: 0.78, friction: 0.03, frictionAir: 0.006,
      render: { fillStyle: colors[i % colors.length] },
    });
    ball.customLabel = label;
    return ball;
  });
  World.add(engine.world, balls);

  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse, constraint: { stiffness: 0.2, render: { visible: false } },
  });
  World.add(engine.world, mouseConstraint);
  render.mouse = mouse;

  Events.on(render, 'afterRender', () => {
    const c = render.context;
    balls.forEach(b => {
      c.save();
      c.translate(b.position.x, b.position.y);
      c.font = '600 12px Inter, sans-serif';
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(b.customLabel, 0, 0);
      c.restore();
    });
  });

  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  const resetBtn = document.getElementById('physics-reset');
  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      balls.forEach((b, i) => {
        Body.setPosition(b, startPositions[i]);
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
      });
    });
  }

  window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    if(!w || !h) return;
    render.canvas.width = w; render.canvas.height = h;
    render.options.width = w; render.options.height = h;
  });
}

/* ---------------- Animated counters (used on dashboard/landing stats) ---------------- */
function animateCounters(selector = '.counter'){
  document.querySelectorAll(selector).forEach(el => {
    const target = parseFloat(el.dataset.target || el.textContent);
    const suffix = el.dataset.suffix || '';
    let cur = 0;
    const step = Math.max(1, target / 60);
    const tick = () => {
      cur += step;
      if(cur >= target){ el.textContent = target + suffix; return; }
      el.textContent = Math.floor(cur) + suffix;
      requestAnimationFrame(tick);
    };
    tick();
  });
}
window.animateCounters = animateCounters;

/* ---------------- Toast helper ---------------- */
function showToast(message){
  const t = document.createElement('div');
  t.className = 'toast-ai glass';
  t.innerHTML = `<strong>AI Coach</strong><div class="text-muted-c" style="font-size:.85rem;margin-top:4px;">${message}</div>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
window.showToast = showToast;
