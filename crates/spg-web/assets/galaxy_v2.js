const root = document.getElementById("galaxy-root");
const WIDTH = 960;
const HEIGHT = 620;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

function decodeState(encoded) {
  if (!encoded) return null;
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

function seeded(seed) {
  const value = Math.sin(seed * 127.1 + seed * seed * 0.013) * 43758.5453;
  return value - Math.floor(value);
}

const initial = decodeState(root?.dataset.state || "") || {
  default_tab: "games",
  games: [],
  initial_focus: {
    nodes: [],
    edges: [],
    narrative: [],
    available_layers: ["games", "events", "sources"],
  },
};

const viewState = {
  currentTab: initial.default_tab || "games",
  games: initial.games || [],
  events: [],
  focus: initial.initial_focus,
  filters: { games: true, events: true, sources: true },
  selectedId: initial.initial_focus?.focus_id || initial.games?.[0]?.id || null,
  rotation: 0,
  zoom: 1,
  drag: null,
  hoveredNodeId: null,
};

function listItems() {
  return viewState.currentTab === "events" ? viewState.events : viewState.games;
}

function renderList() {
  const container = document.getElementById("galaxy-list");
  if (!container) return;
  const items = listItems();
  if (!items.length) {
    container.innerHTML = '<div class="empty-state">No galaxy data yet.</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      if (viewState.currentTab === "events") {
        return `
          <button class="list-item ${viewState.selectedId === item.id ? "active" : ""}" data-kind="event" data-id="${escapeHtml(item.id)}" type="button">
            <div class="list-item-top">
              <strong>${escapeHtml(item.title)}</strong>
              <span class="list-pill">${escapeHtml(item.event_type)}</span>
            </div>
            <p>${escapeHtml(item.note)}</p>
            <div class="list-item-meta">
              <span>${escapeHtml(item.game_name)}</span>
              <span>${escapeHtml(item.source_count)} sources</span>
              <span>heat ${escapeHtml(item.heat)}</span>
            </div>
          </button>
        `;
      }

      const aliases = (item.aliases || []).join(" / ");
      return `
        <button class="list-item ${viewState.selectedId === item.id ? "active" : ""}" data-kind="game" data-id="${escapeHtml(item.id)}" type="button">
          <div class="list-item-top">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="list-pill">${escapeHtml(item.stage)}</span>
          </div>
          <p>${escapeHtml(item.note)}</p>
          <div class="list-item-meta">
            <span>${escapeHtml(item.studio)}</span>
            <span>${escapeHtml(aliases)}</span>
            <span>${escapeHtml(item.signal_count)} signals</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderFocus() {
  const title = document.getElementById("focus-title");
  const subtitle = document.getElementById("focus-subtitle");
  const narrative = document.getElementById("focus-narrative");
  if (title) title.textContent = viewState.focus?.title || "Waiting for focus";
  if (subtitle) subtitle.textContent = viewState.focus?.subtitle || "No detail yet";
  if (narrative) {
    const items = viewState.focus?.narrative || [];
    narrative.innerHTML = items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>No focus narrative yet.</li>";
  }
}

function visibleNodes() {
  return (viewState.focus?.nodes || []).filter((node) => {
    if (node.orbit === 0) return true;
    if (node.node_type === "game") return viewState.filters.games;
    if (node.node_type === "event") return viewState.filters.events;
    if (node.node_type === "source") return viewState.filters.sources;
    return true;
  });
}

function visibleEdges(nodeMap) {
  return (viewState.focus?.edges || []).filter(
    (edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target)
  );
}

function orbitSpec(orbit) {
  if (orbit === 1) {
    return { rx: 172 * viewState.zoom, ry: 126 * viewState.zoom, tilt: 12 };
  }
  if (orbit === 2) {
    return { rx: 272 * viewState.zoom, ry: 194 * viewState.zoom, tilt: -10 };
  }
  return { rx: 346 * viewState.zoom, ry: 248 * viewState.zoom, tilt: 18 };
}

function computePositions(nodes) {
  const positions = new Map();
  nodes.forEach((node) => {
    if (node.orbit === 0) {
      positions.set(node.id, { x: CENTER_X, y: CENTER_Y });
      return;
    }

    const orbit = orbitSpec(node.orbit);
    const speed = node.orbit === 1 ? 1.15 : node.orbit === 2 ? 0.72 : 0.42;
    const radians = ((node.angle + viewState.rotation * speed) * Math.PI) / 180;
    const tilt = (orbit.tilt * Math.PI) / 180;
    positions.set(node.id, {
      x: CENTER_X + Math.cos(radians + tilt) * orbit.rx,
      y: CENTER_Y + Math.sin(radians) * orbit.ry,
    });
  });
  return positions;
}

function buildStarLayer(layerIndex, count) {
  const pulse = (Math.sin(viewState.rotation * 0.04 + layerIndex) + 1) / 2;
  let markup = "";
  for (let index = 0; index < count; index += 1) {
    const seed = layerIndex * 1000 + index;
    const x = seeded(seed + 1) * WIDTH;
    const y = seeded(seed + 2) * HEIGHT;
    const size = 0.6 + seeded(seed + 3) * (layerIndex === 0 ? 1.1 : 1.9);
    const opacity = 0.16 + seeded(seed + 4) * 0.55;
    const drift = (viewState.rotation * (0.02 + layerIndex * 0.006) + seeded(seed + 5) * 60) % 360;
    const driftX = Math.cos((drift * Math.PI) / 180) * (layerIndex + 1) * 0.5;
    const driftY = Math.sin((drift * Math.PI) / 180) * (layerIndex + 1) * 0.45;
    markup += `
      <circle
        cx="${x + driftX}"
        cy="${y + driftY}"
        r="${size}"
        fill="rgba(255,255,255,${(opacity + pulse * 0.08).toFixed(3)})"
      ></circle>
    `;
  }
  return markup;
}

function pointOnEllipse(cx, cy, rx, ry, angleDeg) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * rx,
    y: cy + Math.sin(radians) * ry,
  };
}

function orbitArc(cx, cy, rx, ry, startDeg, endDeg) {
  const start = pointOnEllipse(cx, cy, rx, ry, startDeg);
  const end = pointOnEllipse(cx, cy, rx, ry, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function orbitMarkup() {
  return [1, 2, 3]
    .map((orbit, index) => {
      const spec = orbitSpec(orbit);
      const sweep = (viewState.rotation * (0.18 + index * 0.05)) % 360;
      return `
        <g transform="rotate(${spec.tilt} ${CENTER_X} ${CENTER_Y})">
          <ellipse
            cx="${CENTER_X}"
            cy="${CENTER_Y}"
            rx="${spec.rx}"
            ry="${spec.ry}"
            fill="none"
            stroke="rgba(104,150,255,0.18)"
            stroke-width="${orbit === 1 ? 1.6 : 1.2}"
            stroke-dasharray="${orbit === 1 ? "6 10" : "8 14"}"
          ></ellipse>
          <path
            d="${orbitArc(CENTER_X, CENTER_Y, spec.rx, spec.ry, sweep, sweep + 72)}"
            fill="none"
            stroke="rgba(121,204,255,0.34)"
            stroke-width="2.4"
            stroke-linecap="round"
          ></path>
        </g>
      `;
    })
    .join("");
}

function edgePath(source, target, strength) {
  const mx = (source.x + target.x) / 2;
  const my = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const bend = 0.1 + strength * 0.05;
  return `M ${source.x} ${source.y} Q ${mx - dy * bend} ${my + dx * bend} ${target.x} ${target.y}`;
}

function nodeFill(node) {
  if (node.node_type === "game") return "url(#node-game)";
  if (node.node_type === "event") return "url(#node-event)";
  return "url(#node-source)";
}

function nodeHalo(node) {
  if (node.node_type === "game") return "rgba(58,127,255,0.22)";
  if (node.node_type === "event") return "rgba(118,179,255,0.24)";
  return "rgba(132,215,255,0.22)";
}

function detailWidth(text) {
  return Math.max(92, Math.min(220, text.length * 9.4));
}

function renderGalaxy() {
  const svg = document.getElementById("galaxy-svg");
  if (!svg) return;

  const nodes = visibleNodes();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const positions = computePositions(nodes);
  const edges = visibleEdges(nodeMap);
  const pulse = (Math.sin(viewState.rotation * 0.05) + 1) / 2;
  const backgroundStars =
    buildStarLayer(0, 90) + buildStarLayer(1, 54) + buildStarLayer(2, 24);

  const edgeMarkup = edges
    .map((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return "";
      const highlighted =
        viewState.hoveredNodeId &&
        (edge.source === viewState.hoveredNodeId || edge.target === viewState.hoveredNodeId);
      const path = edgePath(source, target, edge.strength);
      return `
        <path
          d="${path}"
          fill="none"
          stroke="${highlighted ? "rgba(62,135,255,0.62)" : "rgba(86,144,255,0.18)"}"
          stroke-width="${highlighted ? 2.4 : 0.9 + edge.strength * 1.2}"
          stroke-linecap="round"
          filter="url(#edge-glow)"
        ></path>
      `;
    })
    .join("");

  const nodeMarkup = nodes
    .map((node) => {
      const point = positions.get(node.id);
      if (!point) return "";
      const hovered = viewState.hoveredNodeId === node.id;
      const radius = node.orbit === 0 ? node.size + pulse * 1.6 : node.size;
      const haloRadius = hovered ? radius + 14 : radius + 10;
      const label = escapeHtml(node.label);
      const labelWidth = detailWidth(label);
      const labelY = radius + 18;
      const subtitleWidth = Math.max(88, Math.min(220, node.detail.length * 7.2));
      return `
        <g class="galaxy-node" data-node-id="${escapeHtml(node.id)}" transform="translate(${point.x} ${point.y})">
          <circle r="${haloRadius}" fill="${nodeHalo(node)}" opacity="${hovered ? "0.95" : "0.7"}" filter="url(#soft-blur)"></circle>
          <circle r="${radius + 5}" fill="none" stroke="${hovered ? "rgba(52,125,255,0.45)" : "rgba(52,125,255,0.18)"}" stroke-width="${hovered ? 2.4 : 1.4}"></circle>
          <circle r="${radius}" fill="${nodeFill(node)}" stroke="rgba(255,255,255,0.92)" stroke-width="${node.orbit === 0 ? 2.6 : 2}"></circle>
          <circle r="${Math.max(4, radius * 0.32)}" fill="rgba(255,255,255,0.82)"></circle>
          <g transform="translate(0 ${labelY})">
            <rect x="${-labelWidth / 2}" y="0" width="${labelWidth}" height="28" rx="14" fill="rgba(250,252,255,0.86)" stroke="rgba(89,145,255,0.16)"></rect>
            <text x="0" y="18.5" text-anchor="middle" fill="#16345e" font-size="${node.orbit === 0 ? 15 : 13}" font-weight="700">${label}</text>
          </g>
          <g transform="translate(0 ${labelY + 32})" opacity="${hovered || node.orbit === 0 ? "1" : "0.78"}">
            <rect x="${-subtitleWidth / 2}" y="0" width="${subtitleWidth}" height="22" rx="11" fill="rgba(238,245,255,0.82)" stroke="rgba(118,179,255,0.12)"></rect>
            <text x="0" y="14.5" text-anchor="middle" fill="#6680a4" font-size="11">${escapeHtml(node.detail)}</text>
          </g>
        </g>
      `;
    })
    .join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="space-panel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(250,252,255,0.98)"></stop>
        <stop offset="55%" stop-color="rgba(236,244,255,0.96)"></stop>
        <stop offset="100%" stop-color="rgba(226,238,255,0.96)"></stop>
      </linearGradient>
      <radialGradient id="core-plasma" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.95)"></stop>
        <stop offset="18%" stop-color="rgba(162,221,255,0.85)"></stop>
        <stop offset="48%" stop-color="rgba(96,164,255,0.42)"></stop>
        <stop offset="100%" stop-color="rgba(96,164,255,0)"></stop>
      </radialGradient>
      <radialGradient id="nebula-a" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(116,193,255,0.36)"></stop>
        <stop offset="100%" stop-color="rgba(116,193,255,0)"></stop>
      </radialGradient>
      <radialGradient id="nebula-b" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(142,165,255,0.28)"></stop>
        <stop offset="100%" stop-color="rgba(142,165,255,0)"></stop>
      </radialGradient>
      <linearGradient id="node-game" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a8d3ff"></stop>
        <stop offset="100%" stop-color="#2d7bff"></stop>
      </linearGradient>
      <linearGradient id="node-event" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d8e7ff"></stop>
        <stop offset="100%" stop-color="#6aa5ff"></stop>
      </linearGradient>
      <linearGradient id="node-source" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d9f8ff"></stop>
        <stop offset="100%" stop-color="#73c6ff"></stop>
      </linearGradient>
      <filter id="soft-blur" x="-160%" y="-160%" width="420%" height="420%">
        <feGaussianBlur stdDeviation="10"></feGaussianBlur>
      </filter>
      <filter id="edge-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="1.8"></feGaussianBlur>
      </filter>
    </defs>
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="28" fill="url(#space-panel)"></rect>
    <ellipse cx="${CENTER_X - 210}" cy="${CENTER_Y - 120}" rx="190" ry="120" fill="url(#nebula-a)" filter="url(#soft-blur)" opacity="0.92"></ellipse>
    <ellipse cx="${CENTER_X + 210}" cy="${CENTER_Y + 126}" rx="220" ry="148" fill="url(#nebula-b)" filter="url(#soft-blur)" opacity="0.82"></ellipse>
    <ellipse cx="${CENTER_X + 24}" cy="${CENTER_Y + 6}" rx="340" ry="220" fill="rgba(255,255,255,0.14)"></ellipse>
    ${backgroundStars}
    ${orbitMarkup()}
    <g transform="translate(${CENTER_X} ${CENTER_Y})">
      <circle r="${124 + pulse * 4}" fill="url(#core-plasma)"></circle>
      <circle r="66" fill="rgba(255,255,255,0.32)"></circle>
      <circle r="42" fill="rgba(255,255,255,0.76)"></circle>
      <circle r="28" fill="rgba(183,226,255,0.9)"></circle>
      <circle r="12" fill="rgba(255,255,255,0.96)"></circle>
    </g>
    <g opacity="0.92">
      <text x="54" y="64" fill="#255393" font-size="13" font-weight="700" letter-spacing="2.2">SLG OBSERVATION WINDOW</text>
      <text x="54" y="86" fill="#6e88ac" font-size="12">drag to orbit - wheel to zoom - click to focus</text>
    </g>
    ${edgeMarkup}
    ${nodeMarkup}
  `;
}

async function loadList(tab) {
  const response = await fetchJson(`/api/galaxy/list?tab=${tab}`);
  if (tab === "events") {
    viewState.events = response.events || [];
  } else {
    viewState.games = response.games || [];
  }
  viewState.currentTab = tab;
  renderList();
  updateTabs();
}

async function loadFocus(kind, id) {
  const response = await fetchJson(`/api/galaxy/focus/${kind}/${id}`);
  viewState.focus = response;
  viewState.selectedId = id;
  renderList();
  renderFocus();
  renderGalaxy();
}

function updateTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === viewState.currentTab);
  });
}

function updateFilters() {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    const layer = button.dataset.layer;
    button.classList.toggle("active", !!viewState.filters[layer]);
  });
}

function startAnimation() {
  let last = performance.now();
  function frame(now) {
    const delta = now - last;
    last = now;
    viewState.rotation += delta * 0.013;
    renderGalaxy();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function bindInteractions() {
  const svg = document.getElementById("galaxy-svg");
  if (!(svg instanceof SVGSVGElement)) return;

  svg.addEventListener("mousemove", (event) => {
    if (viewState.drag) {
      const deltaX = event.clientX - viewState.drag.x;
      viewState.rotation += deltaX * 0.28;
      viewState.drag = { x: event.clientX, y: event.clientY };
      svg.classList.add("dragging");
      return;
    }

    const node = event.target.closest?.(".galaxy-node");
    viewState.hoveredNodeId = node?.dataset?.nodeId || null;
  });

  svg.addEventListener("mouseleave", () => {
    viewState.hoveredNodeId = null;
    svg.classList.remove("dragging");
  });

  svg.addEventListener("mousedown", (event) => {
    viewState.drag = { x: event.clientX, y: event.clientY };
  });

  window.addEventListener("mouseup", () => {
    viewState.drag = null;
    svg.classList.remove("dragging");
  });

  svg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const nextZoom = viewState.zoom + (event.deltaY < 0 ? 0.07 : -0.07);
      viewState.zoom = Math.max(0.72, Math.min(1.38, nextZoom));
      renderGalaxy();
    },
    { passive: false }
  );

  svg.addEventListener("click", (event) => {
    const node = event.target.closest?.(".galaxy-node");
    if (!node) return;
    const nodeId = node.dataset.nodeId || "";
    const [kind, rawId] = nodeId.split("::");
    if (kind === "game" && rawId) {
      loadFocus("game", rawId).catch((error) => console.error(error));
    }
    if (kind === "event" && rawId) {
      loadFocus("event", nodeId.replace("event::", "")).catch((error) => console.error(error));
    }
  });
}

document.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const tabButton = target.closest(".tab-button");
  if (tabButton instanceof HTMLElement) {
    const tab = tabButton.dataset.tab;
    if (tab && tab !== viewState.currentTab) {
      try {
        await loadList(tab);
      } catch (error) {
        console.error(error);
        window.alert(`Failed to switch list: ${error.message || error}`);
      }
    }
    return;
  }

  const filterButton = target.closest(".filter-chip");
  if (filterButton instanceof HTMLElement) {
    const layer = filterButton.dataset.layer;
    if (layer) {
      viewState.filters[layer] = !viewState.filters[layer];
      updateFilters();
      renderGalaxy();
    }
    return;
  }

  const listItem = target.closest(".list-item");
  if (listItem instanceof HTMLElement) {
    const kind = listItem.dataset.kind;
    const id = listItem.dataset.id;
    if (!kind || !id) return;
    try {
      await loadFocus(kind, id);
    } catch (error) {
      console.error(error);
      window.alert(`Failed to load focus: ${error.message || error}`);
    }
  }
});

renderList();
renderFocus();
renderGalaxy();
updateTabs();
updateFilters();
bindInteractions();
startAnimation();

if (!viewState.games.length) {
  loadList("games").catch((error) => console.error(error));
}
