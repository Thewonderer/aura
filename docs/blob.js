(() => {
  // ── Slide-out panel ──
  const toggle = document.getElementById("howto-toggle");
  const panel = document.getElementById("howto-panel");
  const close = document.getElementById("howto-close");

  toggle.addEventListener("click", () => panel.classList.add("open"));
  close.addEventListener("click", () => panel.classList.remove("open"));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") panel.classList.remove("open");
  });

  // ── Background floating particles ──
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  let w, h;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener("resize", () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    resize();
  });

  const particles = [];
  const count = 40;

  const colors = [
    "rgba(245, 158, 11, ",
    "rgba(239, 68, 68, ",
    "rgba(168, 85, 247, ",
    "rgba(96, 165, 250, ",
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.3 + 0.05,
      alphaDir: (Math.random() - 0.5) * 0.003,
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      p.alpha += p.alphaDir;

      if (p.alpha > 0.35 || p.alpha < 0.03) p.alphaDir *= -1;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ")";
      ctx.fill();
    }

    requestAnimationFrame(drawParticles);
  }

  drawParticles();
})();
