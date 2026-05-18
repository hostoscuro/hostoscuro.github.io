const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatMoney = (value) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function setupCursorGlow() {
  const glow = document.querySelector(".cursor-glow");
  if (!glow || prefersReducedMotion) return;

  window.addEventListener("pointermove", (event) => {
    glow.style.opacity = "1";
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });

  window.addEventListener("pointerleave", () => {
    glow.style.opacity = "0";
  });
}

function setupRevealAnimations() {
  const targets = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  targets.forEach((target) => observer.observe(target));
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count || 0);
        const duration = prefersReducedMotion ? 1 : 1100;
        const start = performance.now();

        function tick(now) {
          const progress = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = Math.round(target * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(element);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setupNetworkCanvas() {
  const canvas = document.getElementById("networkCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let pointer = { x: 0, y: 0, active: false };

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.floor(clamp(width / 9, 65, 155));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.42,
      size: index % 7 === 0 ? 2.4 : 1.35,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function drawDevice(x, y, scale, label, accent) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = accent;
    ctx.fillStyle = "rgba(6, 15, 18, 0.74)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(-58, -38, 116, 76, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = accent;
    ctx.fillRect(-42, -18, 84, 7);
    ctx.fillRect(-42, 0, 66, 7);
    ctx.fillRect(-42, 18, 48, 7);
    ctx.fillStyle = "rgba(245, 251, 255, 0.88)";
    ctx.font = "700 12px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, 0, 57);
    ctx.restore();
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(27, 231, 214, 0.18)");
    gradient.addColorStop(0.48, "rgba(148, 255, 106, 0.08)");
    gradient.addColorStop(1, "rgba(255, 184, 77, 0.14)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((point, index) => {
      if (!prefersReducedMotion) {
        point.x += point.vx;
        point.y += point.vy;
        point.pulse += 0.018;
      }

      if (point.x < -20) point.x = width + 20;
      if (point.x > width + 20) point.x = -20;
      if (point.y < -20) point.y = height + 20;
      if (point.y > height + 20) point.y = -20;

      const wave = Math.sin(point.pulse + timestamp * 0.001) * 0.65 + 1;
      ctx.beginPath();
      ctx.fillStyle = index % 9 === 0 ? "rgba(255, 184, 77, 0.9)" : "rgba(27, 231, 214, 0.72)";
      ctx.arc(point.x, point.y, point.size * wave, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 124) {
          ctx.strokeStyle = `rgba(27, 231, 214, ${0.16 * (1 - distance / 124)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (pointer.active) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(148, 255, 106, 0.42)";
      ctx.lineWidth = 1;
      ctx.arc(pointer.x, pointer.y, 92 + Math.sin(timestamp * 0.004) * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawDevice(width * 0.76, height * 0.26, 0.96, "CLOUD", "rgba(27, 231, 214, 0.96)");
    drawDevice(width * 0.88, height * 0.63, 0.72, "POS", "rgba(255, 184, 77, 0.96)");

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    };
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

function setupArchitectureCanvas() {
  const canvas = document.getElementById("architectureCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  const nodes = [
    { key: "WEB", x: 0.18, y: 0.22, color: "#94ff6a" },
    { key: "API", x: 0.53, y: 0.51, color: "#1be7d6" },
    { key: "POS", x: 0.79, y: 0.25, color: "#ff5c7a" },
    { key: "DB", x: 0.76, y: 0.76, color: "#ffb84d" },
    { key: "BACKUP", x: 0.26, y: 0.78, color: "#6ab8ff" },
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
    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawHexGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
    ctx.lineWidth = 1;
    for (let y = 28; y < height; y += 38) {
      for (let x = 24; x < width; x += 44) {
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = Math.PI / 3 * i;
          const px = x + Math.cos(angle) * 12;
          const py = y + Math.sin(angle) * 12;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, width, height);
    drawHexGrid();

    links.forEach(([from, to], index) => {
      const a = nodes[from];
      const b = nodes[to];
      const ax = a.x * width;
      const ay = a.y * height;
      const bx = b.x * width;
      const by = b.y * height;
      const pulse = (timestamp * 0.00024 + index * 0.17) % 1;

      ctx.strokeStyle = "rgba(27, 231, 214, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      const px = ax + (bx - ax) * pulse;
      const py = ay + (by - ay) * pulse;
      ctx.fillStyle = index % 2 ? "#ffb84d" : "#94ff6a";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    nodes.forEach((node, index) => {
      const x = node.x * width;
      const y = node.y * height;
      const ring = 26 + Math.sin(timestamp * 0.002 + index) * 5;

      ctx.strokeStyle = `${node.color}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, ring, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(245, 251, 255, 0.8)";
      ctx.font = "700 11px JetBrains Mono, monospace";
      ctx.fillText(node.key, x + 14, y - 12);
    });

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

function setupAsciiConsole() {
  const ascii = document.getElementById("asciiRig");
  const feed = document.getElementById("consoleFeed");
  if (!ascii || !feed) return;

  const art = String.raw`
      BITNUBE LABS // CLOUD POS ARRAY

              .----------------.
           .-'  WEB STORE      '-.
          /   CDN  SSL  SEO       \
         ;  .------------------.   ;
         |  |  API GATEWAY     |   |
         |  '--------+---------'   |
          \          |            /
           '-.       |         .-'
              '------|--------'
                     |
        +------------+-------------+
        |  VPS CLUSTER / BACKUPS   |
        |  [01] [02] [03] [04]     |
        +------------+-------------+
                     |
            .--------+--------.
            |  POS TERMINAL   |
            |  SCAN > SELL    |
            |  STOCK > REPORT |
            '-----------------'

      ROUTE: web -> cloud -> pos -> report
  `;

  const feedItems = [
    ["deploy:web-ui", "OK"],
    ["secure:ssl-cert", "OK"],
    ["backup:cloud-db", "OK"],
    ["sync:pos-stock", "LIVE"],
  ];

  let index = 0;
  function type() {
    ascii.textContent = art.slice(0, index);
    index += prefersReducedMotion ? art.length : 3;
    if (index <= art.length) {
      requestAnimationFrame(type);
    } else {
      ascii.textContent = art;
    }
  }
  type();

  feed.innerHTML = feedItems.map(([task, status]) => `<span>${task}<i>${status}</i></span>`).join("");

  if (!prefersReducedMotion) {
    setInterval(() => {
      const rows = [...feed.querySelectorAll("span")];
      const active = rows[Math.floor(Math.random() * rows.length)];
      active.animate(
        [
          { transform: "translateX(0)", borderColor: "rgba(27, 231, 214, 0.14)" },
          { transform: "translateX(5px)", borderColor: "rgba(148, 255, 106, 0.55)" },
          { transform: "translateX(0)", borderColor: "rgba(27, 231, 214, 0.14)" },
        ],
        { duration: 520, easing: "ease-out" }
      );
    }, 1400);
  }
}

function setupTiltCards() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
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
      button.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

function setupPosDemo() {
  const list = document.getElementById("productList");
  const totalElement = document.getElementById("posTotal");
  const clock = document.getElementById("posClock");
  if (!list || !totalElement || !clock) return;

  const products = [
    { name: "Hosting cloud", qty: 1, price: 89 },
    { name: "Licencia POS", qty: 2, price: 45 },
    { name: "Web premium", qty: 1, price: 690 },
    { name: "Soporte IT", qty: 4, price: 25 },
  ];

  function renderProducts(activeIndex = 0) {
    list.innerHTML = products
      .map((product, index) => {
        const active = index === activeIndex ? " style=\"border-color: rgba(148, 255, 106, 0.45)\"" : "";
        return `
          <div class="product-row"${active}>
            <div>
              <strong>${product.name}</strong>
              <span>${product.qty} unidad${product.qty > 1 ? "es" : ""}</span>
            </div>
            <span>${formatMoney(product.price)}</span>
            <em>${formatMoney(product.qty * product.price)}</em>
          </div>
        `;
      })
      .join("");

    const total = products.reduce((sum, product) => sum + product.qty * product.price, 0);
    totalElement.textContent = formatMoney(total);
  }

  function tickClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  let active = 0;
  renderProducts(active);
  tickClock();
  setInterval(tickClock, 1000);
  if (!prefersReducedMotion) {
    setInterval(() => {
      active = (active + 1) % products.length;
      renderProducts(active);
    }, 1800);
  }
}

function setupQuoteBuilder() {
  const billingButtons = document.querySelectorAll("[data-billing]");
  const serviceChecks = document.querySelectorAll(".builder-options input");
  const range = document.getElementById("branchRange");
  const branchValue = document.getElementById("branchValue");
  const packageName = document.getElementById("packageName");
  const packageDescription = document.getElementById("packageDescription");
  const quotePrice = document.getElementById("quotePrice");
  if (!range || !branchValue || !packageName || !packageDescription || !quotePrice) return;

  const prices = {
    proyecto: { web: 680, cloud: 320, it: 240, pos: 480, branch: 115 },
    mensual: { web: 95, cloud: 110, it: 140, pos: 120, branch: 42 },
  };
  let billing = "proyecto";

  function updateQuote() {
    const selected = [...serviceChecks].filter((check) => check.checked).map((check) => check.value);
    const branches = Number(range.value);
    const subtotal = selected.reduce((sum, key) => sum + prices[billing][key], 0);
    const total = subtotal + prices[billing].branch * branches;

    branchValue.textContent = branches;
    quotePrice.textContent = billing === "mensual" ? `${formatMoney(total)}/mes` : formatMoney(total);

    if (selected.includes("web") && selected.includes("cloud") && selected.includes("pos")) {
      packageName.textContent = "Nube Comercial";
      packageDescription.textContent =
        "Web de alto impacto, servidor administrado y POS listo para una operacion con varias cajas.";
    } else if (selected.includes("it") && selected.includes("cloud")) {
      packageName.textContent = "IT Operativo";
      packageDescription.textContent =
        "Soporte preventivo, servidor estable, backups y monitoreo para continuidad diaria.";
    } else if (selected.includes("web")) {
      packageName.textContent = "Web de Conversion";
      packageDescription.textContent =
        "Presencia digital rapida, visual y preparada para capturar contactos comerciales.";
    } else {
      packageName.textContent = "Base Tecnologica";
      packageDescription.textContent =
        "Paquete inicial para ordenar tu infraestructura y preparar el siguiente crecimiento.";
    }
  }

  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      billing = button.dataset.billing;
      billingButtons.forEach((item) => item.classList.toggle("active", item === button));
      updateQuote();
    });
  });

  serviceChecks.forEach((check) => check.addEventListener("change", updateQuote));
  range.addEventListener("input", updateQuote);
  updateQuote();
}

function setupFormPulse() {
  const formButton = document.querySelector(".contact-form button");
  if (!formButton) return;

  formButton.addEventListener("click", () => {
    formButton.textContent = "Solicitud preparada";
    formButton.style.background = "linear-gradient(135deg, var(--green), var(--amber))";
    setTimeout(() => {
      formButton.innerHTML = '<span aria-hidden="true">&gt;</span> Enviar solicitud';
      formButton.style.background = "";
    }, 1800);
  });
}

setupCursorGlow();
setupRevealAnimations();
setupCounters();
setupNetworkCanvas();
setupArchitectureCanvas();
setupAsciiConsole();
setupTiltCards();
setupMagneticButtons();
setupPosDemo();
setupQuoteBuilder();
setupFormPulse();
