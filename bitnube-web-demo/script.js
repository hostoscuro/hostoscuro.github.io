const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatMoney = (value) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function setupReveal() {
  document.querySelectorAll(".site-header, .hero-content, .security-orbit").forEach((item) => {
    item.classList.add("is-visible");
  });

  const items = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((item) => observer.observe(item));
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const target = Number(element.dataset.count || 0);
        const duration = prefersReducedMotion ? 1 : 1000;
        const start = performance.now();
        function tick(now) {
          const progress = clamp((now - start) / duration, 0, 1);
          element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(element);
      });
    },
    { threshold: 0.65 }
  );
  counters.forEach((counter) => observer.observe(counter));
}

function setupCircuitCanvas() {
  const canvas = document.getElementById("circuitCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let paths = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.floor(clamp(width / 55, 12, 34));
    paths = Array.from({ length: count }, (_, index) => {
      const y = 70 + Math.random() * (height - 140);
      const x = Math.random() * width;
      const length = 120 + Math.random() * 260;
      return {
        points: [
          [x, y],
          [x + length * 0.28, y],
          [x + length * 0.42, y + (index % 2 ? 34 : -34)],
          [x + length, y + (index % 2 ? 34 : -34)],
        ],
        speed: 0.00018 + Math.random() * 0.00022,
        phase: Math.random(),
      };
    });
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, width, height);
    paths.forEach((path, index) => {
      ctx.beginPath();
      path.points.forEach(([x, y], pointIndex) => {
        if (pointIndex === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = index % 3 === 0 ? "rgba(8, 120, 255, 0.18)" : "rgba(2, 200, 238, 0.16)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const segment = path.points[path.points.length - 1];
      const start = path.points[0];
      const t = (timestamp * path.speed + path.phase) % 1;
      const x = start[0] + (segment[0] - start[0]) * t;
      const y = start[1] + (segment[1] - start[1]) * t;
      ctx.fillStyle = index % 2 ? "#02c8ee" : "#0878ff";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      path.points.forEach(([px, py]) => {
        ctx.strokeStyle = "rgba(8, 120, 255, 0.18)";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.stroke();
      });
    });
    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

function setupShieldCanvas() {
  const canvas = document.getElementById("shieldCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  const nodes = [
    { label: "WEB", x: 0.18, y: 0.2, color: "#0878ff" },
    { label: "API", x: 0.5, y: 0.52, color: "#02c8ee" },
    { label: "POS", x: 0.8, y: 0.22, color: "#0052c8" },
    { label: "DB", x: 0.72, y: 0.78, color: "#0a75ff" },
    { label: "BK", x: 0.26, y: 0.78, color: "#55dfff" },
  ];
  const links = [
    [0, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 3],
    [3, 4],
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawShield() {
    const cx = width * 0.5;
    const cy = height * 0.48;
    ctx.save();
    ctx.strokeStyle = "rgba(8, 120, 255, 0.13)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 148);
    ctx.lineTo(cx + 132, cy - 92);
    ctx.lineTo(cx + 104, cy + 92);
    ctx.lineTo(cx, cy + 154);
    ctx.lineTo(cx - 104, cy + 92);
    ctx.lineTo(cx - 132, cy - 92);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, width, height);
    drawShield();

    links.forEach(([from, to], index) => {
      const a = nodes[from];
      const b = nodes[to];
      const ax = a.x * width;
      const ay = a.y * height;
      const bx = b.x * width;
      const by = b.y * height;
      ctx.strokeStyle = "rgba(8, 120, 255, 0.23)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      const pulse = (timestamp * 0.00025 + index * 0.16) % 1;
      const px = ax + (bx - ax) * pulse;
      const py = ay + (by - ay) * pulse;
      ctx.fillStyle = index % 2 ? "#02c8ee" : "#0878ff";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    nodes.forEach((node, index) => {
      const x = node.x * width;
      const y = node.y * height;
      const ring = 25 + Math.sin(timestamp * 0.002 + index) * 4;
      ctx.strokeStyle = `${node.color}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, ring, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#06174d";
      ctx.font = "700 11px Orbitron, sans-serif";
      ctx.fillText(node.label, x + 12, y - 12);
    });

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

function setupTilt() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -7}deg) rotateY(${x * 9}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function setupMagneticButtons() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.1}px, ${y * 0.16}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

function setupAsciiConsole() {
  const ascii = document.getElementById("asciiShield");
  const feed = document.getElementById("consoleFeed");
  if (!ascii || !feed) return;

  const art = String.raw`
       MORROSHIELD // BLUE DEFENSE NODE

              _________
           .-'  CLOUD  '-.
          /   .-------.   \
         |   /  FARO   \   |
         |   |  |||||  |   |
         |   |  |||||  |---+  pixels
          \  '---+---'  ___/
           '-.___|___.-'
                 |
          +------+------+
          |  WEB / POS  |
          |  API / DB   |
          +------+------+
                 |
             [ SHIELD ]

       ROUTE: LEAD -> CLOUD -> POS -> REPORT
  `;

  let index = 0;
  function type() {
    ascii.textContent = art.slice(0, index);
    index += prefersReducedMotion ? art.length : 3;
    if (index <= art.length) requestAnimationFrame(type);
    else ascii.textContent = art;
  }
  type();

  const feedItems = [
    ["scan:web-form", "clean"],
    ["cloud:vps-firewall", "armed"],
    ["pos:stock-sync", "live"],
    ["backup:daily-vault", "ok"],
  ];
  feed.innerHTML = feedItems.map(([task, status]) => `<span>${task}<i>${status}</i></span>`).join("");
}

function setupPosDemo() {
  const list = document.getElementById("productList");
  const total = document.getElementById("posTotal");
  const clock = document.getElementById("posClock");
  if (!list || !total || !clock) return;

  const products = [
    { name: "Servidor cloud", qty: 1, price: 120 },
    { name: "Modulo POS", qty: 2, price: 85 },
    { name: "Web MorroShield", qty: 1, price: 790 },
    { name: "Soporte Security", qty: 3, price: 55 },
  ];

  function render(activeIndex = 0) {
    list.innerHTML = products
      .map((product, index) => {
        const active = index === activeIndex ? ' style="border-color: rgba(8, 120, 255, 0.58)"' : "";
        return `
          <div class="product-row"${active}>
            <div>
              <strong>${product.name}</strong>
              <span>${product.qty} unidad${product.qty > 1 ? "es" : ""}</span>
            </div>
            <span>${formatMoney(product.price)}</span>
            <em>${formatMoney(product.price * product.qty)}</em>
          </div>
        `;
      })
      .join("");
    total.textContent = formatMoney(products.reduce((sum, product) => sum + product.price * product.qty, 0));
  }

  function tickClock() {
    clock.textContent = new Date().toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  let active = 0;
  render(active);
  tickClock();
  setInterval(tickClock, 1000);
  if (!prefersReducedMotion) {
    setInterval(() => {
      active = (active + 1) % products.length;
      render(active);
    }, 1800);
  }
}

function setupQuoteBuilder() {
  const checks = document.querySelectorAll(".option-grid input");
  const range = document.getElementById("branchRange");
  const branchValue = document.getElementById("branchValue");
  const packageName = document.getElementById("packageName");
  const description = document.getElementById("packageDescription");
  const quotePrice = document.getElementById("quotePrice");
  if (!range || !branchValue || !packageName || !description || !quotePrice) return;

  const prices = { web: 790, security: 420, cloud: 360, pos: 520, branch: 125 };

  function update() {
    const selected = [...checks].filter((check) => check.checked).map((check) => check.value);
    const branches = Number(range.value);
    const total = selected.reduce((sum, item) => sum + prices[item], 0) + branches * prices.branch;
    branchValue.textContent = branches;
    quotePrice.textContent = formatMoney(total);

    if (selected.includes("web") && selected.includes("security") && selected.includes("cloud") && selected.includes("pos")) {
      packageName.textContent = "Shield Commerce Max";
      description.textContent = "Web, cloud, seguridad IT y POS para operacion completa multi-sucursal.";
    } else if (selected.includes("security") && selected.includes("cloud")) {
      packageName.textContent = "Cloud Defense";
      description.textContent = "Servidor administrado, backups y defensa IT para continuidad diaria.";
    } else if (selected.includes("web")) {
      packageName.textContent = "Web Shield";
      description.textContent = "Pagina comercial con identidad MorroShield, velocidad y captura segura.";
    } else {
      packageName.textContent = "Base Shield";
      description.textContent = "Paquete inicial para ordenar y proteger la presencia digital.";
    }
  }

  checks.forEach((check) => check.addEventListener("change", update));
  range.addEventListener("input", update);
  update();
}

setupReveal();
setupCounters();
setupCircuitCanvas();
setupShieldCanvas();
setupTilt();
setupMagneticButtons();
setupAsciiConsole();
setupPosDemo();
setupQuoteBuilder();
