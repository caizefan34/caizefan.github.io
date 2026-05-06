(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toastEl = $('[data-toast]');
  const toastTextEl = $('[data-toast-text]');
  const toastCloseEl = $('[data-toast-close]');
  let toastTimer = null;

  function showToast(text) {
    if (!toastEl || !toastTextEl) return;
    toastTextEl.textContent = text;
    toastEl.classList.add('is-show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-show'), 2200);
  }

  function setTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ga_theme', theme);
    } catch {
      // ignore
    }
    const icon = $('[data-theme-icon]');
    if (icon) icon.textContent = theme === 'light' ? '☀' : '☾';
  }

  function initTheme() {
    let theme = 'dark';
    try {
      theme = localStorage.getItem('ga_theme') || theme;
    } catch {
      // ignore
    }
    const prefersLight =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    if (!localStorage.getItem('ga_theme') && prefersLight) theme = 'light';
    setTheme(theme);
  }

  function initHeaderElevation() {
    const header = document.querySelector('[data-elevate-on-scroll]');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-elevated');
      else header.classList.remove('is-elevated');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initNavToggle() {
    const btn = $('[data-nav-toggle]');
    const links = $('[data-nav-links]');
    if (!btn || !links) return;
    btn.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    $$('.nav-link', links).forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initScrollSpy() {
    const spyLinks = $$('[data-spy]');
    if (!spyLinks.length) return;

    const targets = spyLinks
      .map((a) => {
        const id = (a.getAttribute('href') || '').slice(1);
        const el = id ? document.getElementById(id) : null;
        return el ? { a, el } : null;
      })
      .filter(Boolean);

    const setActive = (activeEl) => {
      spyLinks.forEach((a) => a.classList.remove('is-active'));
      const found = targets.find((t) => t.el === activeEl);
      if (found) found.a.classList.add('is-active');
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target);
      },
      { root: null, rootMargin: '-22% 0px -70% 0px', threshold: [0.1, 0.2, 0.35, 0.5, 0.7] }
    );

    targets.forEach((t) => io.observe(t.el));
  }

  function initTimelineFilter() {
    const items = $$('[data-timeline] .t-item');
    const btns = $$('.filter-btn');
    if (!items.length || !btns.length) return;

    const apply = (kind) => {
      items.forEach((it) => {
        const k = it.getAttribute('data-kind') || '';
        const show = kind === 'all' || k === kind;
        it.classList.toggle('is-hidden', !show);
      });
    };

    btns.forEach((b) => {
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.remove('is-active'));
        b.classList.add('is-active');
        apply(b.getAttribute('data-filter') || 'all');
      });
    });
  }

  function initAccordion() {
    const root = $('[data-accordion]');
    if (!root) return;
    const btns = $$('.acc-btn', root);
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const panel = btn.nextElementSibling;
        if (panel && panel.classList.contains('acc-panel')) {
          panel.classList.toggle('is-open', !expanded);
        }
        const icon = $('.acc-icon', btn);
        if (icon) icon.textContent = expanded ? '+' : '–';
      });
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'true');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  function initCopyLink() {
    const btn = $('[data-copy-link]');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const text = window.location.href;
      const ok = await copyText(text);
      showToast(ok ? '已复制链接（本地路径）' : '复制失败（浏览器限制）');
    });
  }

  function initBackToTop() {
    const btns = $$('[data-back-to-top]');
    if (!btns.length) return;
    btns.forEach((b) => {
      b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    });
  }

  function initFooterYear() {
    const y = $('[data-year]');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function initLightbox() {
    const root = $('[data-lightbox-root]');
    const imgEl = $('[data-lightbox-img]');
    const capEl = $('[data-lightbox-caption]');
    const closeEls = $$('[data-lightbox-close]');
    const triggers = $$('[data-lightbox]');
    if (!root || !imgEl || !triggers.length) return;

    let lastActive = null;

    const open = (src, caption) => {
      lastActive = document.activeElement;
      imgEl.src = src;
      imgEl.alt = caption || '图片预览';
      if (capEl) capEl.textContent = caption || '';
      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const closeBtn = $('.lightbox-close', root);
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      root.classList.remove('is-open');
      root.setAttribute('aria-hidden', 'true');
      imgEl.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
    };

    triggers.forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-lightbox');
        const caption = btn.getAttribute('data-caption') || btn.textContent.trim();
        if (src) open(src, caption);
      });
    });

    closeEls.forEach((c) => c.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('is-open')) close();
    });
  }

  function initToastClose() {
    if (!toastEl || !toastCloseEl) return;
    toastCloseEl.addEventListener('click', () => toastEl.classList.remove('is-show'));
  }

  function initThemeToggle() {
    const btn = $('[data-theme-toggle]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(cur === 'light' ? 'dark' : 'light');
      showToast('已切换主题');
    });
  }

  initTheme();
  initHeaderElevation();
  initNavToggle();
  initScrollSpy();
  initTimelineFilter();
  initAccordion();
  initCopyLink();
  initBackToTop();
  initFooterYear();
  initLightbox();
  initToastClose();
  initThemeToggle();
})();

// Basketball Game (Canvas)
(() => {
  const canvas = document.getElementById('bb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const scoreEl = document.querySelector('[data-bb-score]');
  const shotEl = document.querySelector('[data-bb-shot]');
  const totalShotEl = document.querySelector('[data-bb-total-shot]');
  const bestEl = document.querySelector('[data-bb-best]');
  const overlayEl = document.querySelector('[data-bb-overlay]');
  const statusEl = document.querySelector('[data-bb-status]');
  const tipEl = document.querySelector('[data-bb-tip]');
  const startBtn = document.querySelector('[data-bb-start]');
  const restartBtn = document.querySelector('[data-bb-restart]');

  const world = {
    w: 900,
    h: 540,
    groundY: 450,
    hoopX: 720,
    hoopY: 230,
    rimR: 30,
    ballR: 14,
    backboardX: 760,
    backboardTopY: 150,
    backboardBottomY: 310,
    ballStartX: 200,
    ballStartY: 450 - 14,
  };

  const GRAVITY = 1600; // px/s^2
  const MIN_ANGLE = (20 * Math.PI) / 180;
  const MAX_ANGLE = (63 * Math.PI) / 180;
  const MIN_DX = 60;
  const MAX_POINTER_DIST = 560;

  const AIM_POWER_SWISH_THRESHOLD = 0.78;

  let dpr = 1;

  function resizeForDpr() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(world.w * dpr);
    canvas.height = Math.floor(world.h * dpr);
  }

  resizeForDpr();
  window.addEventListener('resize', resizeForDpr, { passive: true });

  function setText(el, text) {
    if (el) el.textContent = String(text);
  }

  function setOverlayVisible(visible) {
    if (!overlayEl) return;
    overlayEl.classList.toggle('is-visible', Boolean(visible));
    if (overlayEl) overlayEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  let score = 0;
  let shotIndex = 1;
  const totalShots = 10;
  let best = 0;

  const LS_BEST_KEY = 'bb_best_score_v1';

  function loadBest() {
    try {
      const v = Number(localStorage.getItem(LS_BEST_KEY) || '0');
      best = Number.isFinite(v) ? v : 0;
    } catch {
      best = 0;
    }
    setText(bestEl, best);
  }

  function saveBest(next) {
    best = Math.max(best, next);
    setText(bestEl, best);
    try {
      localStorage.setItem(LS_BEST_KEY, String(best));
    } catch {
      // ignore
    }
  }

  loadBest();
  if (totalShotEl) setText(totalShotEl, totalShots);

  const ball = {
    x: world.ballStartX,
    y: world.ballStartY,
    vx: 0,
    vy: 0,
    active: false,
    scored: false,
    fadeT: 0,
  };

  let mode = 'idle'; // idle | ready | aiming | flying | result | gameover
  let aiming = false;
  let aimPoint = { x: world.ballStartX, y: world.ballStartY };
  let aimData = null; // {power, angle, speed, vx, vy}
  let predicted = [];
  let prev = { x: ball.x, y: ball.y, vy: 0 };

  let result = {
    kind: 'miss', // score | miss
    text: '',
    t: 0,
    dur: 0.9,
  };

  function resetBallToStart() {
    ball.x = world.ballStartX;
    ball.y = world.ballStartY;
    ball.vx = 0;
    ball.vy = 0;
    ball.active = false;
    ball.scored = false;
    ball.fadeT = 0;
  }

  function updateUi() {
    setText(scoreEl, score);
    setText(shotEl, shotIndex);
  }

  function getPointerPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * world.w;
    const y = ((e.clientY - rect.top) / rect.height) * world.h;
    return { x, y };
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function computeAimDataFromPoint(p) {
    const dx = p.x - world.ballStartX;
    const dy = p.y - world.ballStartY; // y+ is down

    if (dx < MIN_DX) return null;

    const dist = Math.hypot(dx, dy);
    const power = clamp(dist / MAX_POINTER_DIST, 0.08, 1);

    const angle = clamp(Math.atan2(-dy, dx), MIN_ANGLE, MAX_ANGLE);
    const speed = lerp(460, 1000, power);

    const vx = speed * Math.cos(angle);
    const vy = -speed * Math.sin(angle); // upward: negative y
    return { power, angle, speed, vx, vy };
  }

  function simulateTrajectory(data) {
    if (!data) return [];
    const pts = [];
    let x = world.ballStartX;
    let y = world.ballStartY;
    let vx = data.vx;
    let vy = data.vy;

    const dt = 0.05;
    const drag = 0.012;

    for (let i = 0; i < 54; i++) {
      prev = { x, y, vy };
      // Semi-implicit Euler
      vy += GRAVITY * dt;
      vx *= 1 - drag * dt;
      x += vx * dt;
      y += vy * dt;

      if (y > world.groundY + 120) break;
      if (x < -120 || x > world.w + 120) break;
      pts.push({ x, y });
    }
    return pts;
  }

  function setResult(kind, text) {
    result.kind = kind;
    result.text = text;
    result.t = 0;
    result.dur = kind === 'score' ? 0.85 : 0.95;
    setOverlayVisible(true);
    if (statusEl) statusEl.textContent = text;
    if (tipEl) tipEl.textContent = kind === 'score' ? '好球！下一球继续挑战。' : '没进也没关系，下一球再来。';
    mode = 'result';
  }

  function startNextShot() {
    resetBallToStart();
    mode = 'ready';
    aiming = false;
    aimData = null;
    predicted = [];
    setOverlayVisible(true);
    if (statusEl) statusEl.textContent = `第 ${shotIndex} 球`;
    if (tipEl) tipEl.textContent = '拖拽瞄准，松手投篮';
    updateUi();
  }

  function endGame() {
    mode = 'gameover';
    setOverlayVisible(true);
    const msg = `挑战结束！最终得分：${score} 分`;
    if (statusEl) statusEl.textContent = msg;
    if (tipEl) tipEl.textContent = '点击“重开”再来一局';
    saveBest(score);
  }

  function applyShotFromAim() {
    if (!aimData) return false;
    ball.active = true;
    ball.scored = false;
    ball.fadeT = 0;
    ball.x = world.ballStartX;
    ball.y = world.ballStartY;
    ball.vx = aimData.vx;
    ball.vy = aimData.vy;
    ball.hasScored = false;
    mode = 'flying';
    aiming = false;
    setOverlayVisible(false);
    return true;
  }

  function shootIfPossible() {
    if (mode !== 'ready') return;
    if (!aimData) return;
    const ok = applyShotFromAim();
    if (!ok) {
      setOverlayVisible(true);
      if (statusEl) statusEl.textContent = '瞄准不够到位，请把目标拖向篮筐方向';
      if (tipEl) tipEl.textContent = '向右拖拽更容易出手';
    }
  }

  function handleStart() {
    score = 0;
    shotIndex = 1;
    updateUi();
    resetBallToStart();
    startNextShot();
  }

  function handleRestart() {
    score = 0;
    shotIndex = 1;
    updateUi();
    resetBallToStart();
    startNextShot();
  }

  if (startBtn) startBtn.addEventListener('click', handleStart);
  if (restartBtn) restartBtn.addEventListener('click', handleRestart);

  // Pointer interactions: aiming by drag
  function pointerDown(e) {
    if (mode !== 'ready') return;
    aiming = true;
    setOverlayVisible(false);
    canvas.setPointerCapture?.(e.pointerId);
    aimPoint = getPointerPoint(e);
    aimData = computeAimDataFromPoint(aimPoint);
    if (!aimData) {
      aiming = false;
      setOverlayVisible(true);
      if (statusEl) statusEl.textContent = '瞄准不够到位：把目标拖向篮筐方向';
      if (tipEl) tipEl.textContent = '向右拖拽更容易出手';
      return;
    }
    predicted = simulateTrajectory(aimData);
  }

  function pointerMove(e) {
    if (!aiming) return;
    aimPoint = getPointerPoint(e);
    aimData = computeAimDataFromPoint(aimPoint);
    if (!aimData) {
      aiming = false;
      setOverlayVisible(true);
      if (statusEl) statusEl.textContent = '瞄准不够到位：把目标拖向篮筐方向';
      if (tipEl) tipEl.textContent = '向右拖拽更容易出手';
      predicted = [];
      return;
    }
    predicted = simulateTrajectory(aimData);
  }

  function pointerUp() {
    if (!aiming) return;
    aiming = false;
    // 重新校验一下：只要拖拽没算出合理参数就不出手
    if (aimData && mode === 'ready') {
      applyShotFromAim();
    } else if (mode === 'ready') {
      setOverlayVisible(true);
      if (statusEl) statusEl.textContent = '把目标拖到篮筐方向再松手';
      if (tipEl) tipEl.textContent = '提示：向右拖拽 + 适当上抬';
    }
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

  function worldToScreenLine() {
    // not needed: we draw in world coords with ctx transform
  }

  function drawCourt() {
    // clear
    ctx.clearRect(0, 0, world.w, world.h);

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, world.h);
    bg.addColorStop(0, 'rgba(255,255,255,.03)');
    bg.addColorStop(1, 'rgba(255,255,255,.01)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, world.w, world.h);

    // ground
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    ctx.fillRect(0, world.groundY, world.w, world.h - world.groundY);

    // court line
    ctx.strokeStyle = 'rgba(110,231,255,.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, world.groundY);
    ctx.lineTo(world.w - 40, world.groundY);
    ctx.stroke();

    // 3pt arc (stylized)
    const threeR = 260;
    ctx.strokeStyle = 'rgba(167,139,250,.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(world.hoopX, world.hoopY, threeR, -Math.PI / 1.4, Math.PI / 1.4, false);
    ctx.stroke();
    ctx.setLineDash([]);

    // paint area
    const laneW = 130;
    const laneH = 140;
    const laneX = world.hoopX - laneW / 2;
    const laneY = world.hoopY - 70;
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(laneX, laneY, laneW, laneH);
  }

  function drawHoop() {
    // Backboard
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.strokeStyle = 'rgba(255,255,255,.26)';
    ctx.lineWidth = 3;
    const bx = world.backboardX;
    ctx.beginPath();
    const bw = 12;
    const bh = world.backboardBottomY - world.backboardTopY;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bx, world.backboardTopY, bw, bh, 10);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(bx, world.backboardTopY, bw, bh);
      ctx.strokeRect(bx, world.backboardTopY, bw, bh);
    }

    // Rim
    const cx = world.hoopX;
    const cy = world.hoopY;
    const rimStroke = 10;
    ctx.strokeStyle = 'rgba(251,191,36,.95)';
    ctx.lineWidth = rimStroke;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, world.rimR, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.stroke();

    // Net (stylized curves)
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const x = cx - world.rimR + t * (world.rimR * 2);
      const y0 = cy + 2;
      const y1 = cy + 88;
      const ctrlX = x + (t - 0.5) * 22;
      const ctrlY = cy + 52 + Math.abs(t - 0.5) * 10;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(ctrlX, ctrlY, x, y1);
      ctx.stroke();
    }
  }

  function drawBall(alpha = 1) {
    if (!ball.active && !ball.scored) return;
    const a = clamp(alpha, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;

    // shadow
    const height = Math.max(0, ball.y - world.groundY);
    const shadowScale = 1 - clamp(height / 200, 0, 1) * 0.35;
    ctx.fillStyle = `rgba(0,0,0,${0.22 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(ball.x, world.groundY + 8, ballR * 1.1, ballR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // ball body
    const grad = ctx.createRadialGradient(
      ball.x - ballR * 0.35,
      ball.y - ballR * 0.35,
      ballR * 0.2,
      ball.x,
      ball.y,
      ballR
    );
    grad.addColorStop(0, '#fff7ed');
    grad.addColorStop(0.22, '#fdba74');
    grad.addColorStop(0.6, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(0,0,0,.30)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, world.ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // seams
    ctx.strokeStyle = 'rgba(90,25,0,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, world.ballR * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ball.x - world.ballR * 0.55, ball.y - world.ballR * 0.2);
    ctx.quadraticCurveTo(ball.x, ball.y + world.ballR * 0.05, ball.x + world.ballR * 0.55, ball.y - world.ballR * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  function drawAim() {
    if (mode !== 'ready' || !aiming || !aimData) return;
    // Aim line
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(110,231,255,.70)';
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(world.ballStartX, world.ballStartY);
    ctx.lineTo(aimPoint.x, aimPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Predicted trajectory
    if (predicted && predicted.length > 5) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(167,139,250,.32)';
      ctx.beginPath();
      ctx.moveTo(predicted[0].x, predicted[0].y);
      for (let i = 1; i < predicted.length; i++) {
        ctx.lineTo(predicted[i].x, predicted[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawResultText() {
    // kept for future, current UI is in overlay
  }

  function update(dt) {
    if (mode === 'idle' || mode === 'ready') return;

    if (mode === 'flying') {
      prev = { x: ball.x, y: ball.y, vy: ball.vy };

      // Integrate
      ball.vy += GRAVITY * dt;
      ball.vx *= 1 - 0.012 * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Rim collision & scoring
      const cx = world.hoopX;
      const cy = world.hoopY;
      const dist = Math.hypot(ball.x - cx, ball.y - cy);
      const passDown = prev.y < cy && ball.y >= cy && ball.vy > 0;

      if (!ball.scored && passDown && dist < world.rimR - 6) {
        const points = aimData && aimData.power > AIM_POWER_SWISH_THRESHOLD ? 3 : 2;
        score += points;
        updateUi();
        ball.scored = true;
        ball.active = false;
        setResult('score', `进球！+${points} 分`);
        return;
      }

      // Physical bounce off the rim circle
      if (!ball.scored) {
        const targetDist = world.rimR - world.ballR * 0.18;
        if (dist > 0.0001 && dist < targetDist) {
          const nx = (ball.x - cx) / dist;
          const ny = (ball.y - cy) / dist;
          const push = targetDist - dist;
          ball.x += nx * push;
          ball.y += ny * push;

          const restitution = 0.35;
          const vn = ball.vx * nx + ball.vy * ny;
          if (vn < 0) {
            ball.vx -= (1 + restitution) * vn * nx;
            ball.vy -= (1 + restitution) * vn * ny;
          }
        }
      }

      // Backboard simple collision (vertical plane)
      if (!ball.scored && ball.vx > 0 && ball.x + world.ballR > world.backboardX) {
        const yMid = ball.y;
        if (yMid > world.backboardTopY && yMid < world.backboardBottomY) {
          ball.x = world.backboardX - world.ballR;
          ball.vx = -ball.vx * 0.35;
          ball.vy *= 0.75;
        }
      }

      // Ground bounce
      if (ball.y + world.ballR >= world.groundY) {
        ball.y = world.groundY - world.ballR;
        if (ball.vy > 0) ball.vy = -ball.vy * 0.45;
        ball.vx *= 0.86;

        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed < 190 && Math.abs(ball.vy) < 120) {
          ball.active = false;
          setResult('miss', '未进，再来！');
          return;
        }
      }

      // Out of bounds -> miss
      if (
        ball.y > world.groundY + 140 ||
        ball.x < -140 ||
        ball.x > world.w + 140
      ) {
        ball.active = false;
        setResult('miss', '未进，再来！');
        return;
      }
    } else if (mode === 'result') {
      result.t += dt;
      ball.fadeT += dt;

      if (result.t >= result.dur) {
        shotIndex += 1;
        if (shotIndex > totalShots) {
          endGame();
        } else {
          startNextShot();
        }
      }
    } else if (mode === 'gameover') {
      // nothing
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCourt();
    drawHoop();

    drawAim();

    const alpha = mode === 'result' ? 1 - clamp(ball.fadeT / 0.7, 0, 1) : 1;
    if (ball.active || ball.scored) drawBall(alpha);

    // center hint dots
    if (mode === 'ready') {
      ctx.save();
      ctx.fillStyle = 'rgba(110,231,255,.18)';
      ctx.beginPath();
      ctx.arc(world.ballStartX, world.ballStartY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  let lastT = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - lastT) / 1000);
    lastT = now;
    update(dt);
    draw();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // init UI
  resetBallToStart();
  mode = 'idle';
  setOverlayVisible(true);
  if (statusEl) statusEl.textContent = '准备开始';
  if (tipEl) tipEl.textContent = '点击“开始”，然后拖拽瞄准投篮';
  updateUi();
})();


