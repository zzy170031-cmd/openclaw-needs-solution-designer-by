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
  const value = Math.sin(seed * 91.37 + seed * 0.73) * 43758.5453;
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
    container.innerHTML = '<div class="empty-state">No wireframe data yet.</div>';
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
    return { rx: 170 * viewState.zoom, ry: 128 * viewState.zoom, tilt: 10 };
  }
  if (orbit === 2) {
    return { rx: 270 * viewState.zoom, ry: 192 * viewState.zoom, tilt: -8 };
  }
  return { rx: 338 * viewState.zoom, ry: 248 * viewState.zoom, tilt: 16 };
}

function computePositions(nodes) {
  const positions = new Map();
  nodes.forEach((node) => {
    if (node.orbit === 0) {
      positions.set(node.id, { x: CENTER_X, y: CENTER_Y });
      return;
    }
    const orbit = orbitSpec(node.orbit);
    const speed = node.orbit === 1 ? 1.08 : node.orbit === 2 ? 0.7 : 0.44;
    const radians = ((node.angle + viewState.rotation * speed) * Math.PI) / 180;
    const tilt = (orbit.tilt * Math.PI) / 180;
    positions.set(node.id, {
      x: CENTER_X + Math.cos(radians + tilt) * orbit.rx,
      y: CENTER_Y + Math.sin(radians) * orbit.ry,
    });
  });
  return positions;
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

function edgePath(source, target, strength) {
  const mx = (source.x + target.x) / 2;
  const my = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const bend = 0.08 + strength * 0.05;
  return `M ${source.x} ${source.y} Q ${mx - dy * bend} ${my + dx * bend} ${target.x} ${target.y}`;
}

function buildDustField(count) {
  let markup = "";
  for (let index = 0; index < count; index += 1) {
    const x = seeded(index + 11) * WIDTH;
    const y = seeded(index + 71) * HEIGHT;
    const r = 0.55 + seeded(index + 131) * 1.15;
    const opacity = 0.08 + seeded(index + 191) * 0.22;
    markup += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,${opacity.toFixed(3)})"></circle>`;
  }
  return markup;
}

function renderGalaxy() {
  const svg = document.getElementById("galaxy-svg");
  if (!svg) return;

  const nodes = visibleNodes();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const positions = computePositions(nodes);
  const edges = visibleEdges(nodeMap);
  const pulse = (Math.sin(viewState.rotation * 0.045) + 1) / 2;

  const orbitMarkup = [1, 2, 3]
    .map((orbit, index) => {
      const spec = orbitSpec(orbit);
      const sweep = (viewState.rotation * (0.16 + index * 0.05)) % 360;
      return `
        <g transform="rotate(${spec.tilt} ${CENTER_X} ${CENTER_Y})">
          <ellipse
            cx="${CENTER_X}"
            cy="${CENTER_Y}"
            rx="${spec.rx}"
            ry="${spec.ry}"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            stroke-width="1.1"
            stroke-dasharray="5 9"
          ></ellipse>
          <path
            d="${orbitArc(CENTER_X, CENTER_Y, spec.rx, spec.ry, sweep, sweep + 68)}"
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            stroke-width="1.7"
            stroke-linecap="round"
          ></path>
        </g>
      `;
    })
    .join("");

  const edgeMarkup = edges
    .map((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return "";
      const highlighted =
        viewState.hoveredNodeId &&
        (edge.source === viewState.hoveredNodeId || edge.target === viewState.hoveredNodeId);
      return `
        <path
          d="${edgePath(source, target, edge.strength)}"
          fill="none"
          stroke="${highlighted ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.24)"}"
          stroke-width="${highlighted ? 2.1 : 0.9 + edge.strength}"
          stroke-linecap="round"
        ></path>
      `;
    })
    .join("");

  const nodeMarkup = nodes
    .map((node) => {
      const point = positions.get(node.id);
      if (!point) return "";
      const hovered = viewState.hoveredNodeId === node.id;
      const baseRadius = node.orbit === 0 ? node.size + pulse * 1.4 : node.size;
      const ringRadius = baseRadius + 6;
      const labelWidth = Math.max(86, Math.min(210, node.label.length * 10));
      const detailWidth = Math.max(84, Math.min(210, node.detail.length * 7));
      return `
        <g class="galaxy-node" data-node-id="${escapeHtml(node.id)}" transform="translate(${point.x} ${point.y})">
          <circle r="${ringRadius + (hovered ? 5 : 0)}" fill="none" stroke="${hovered ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.16)"}" stroke-width="${hovered ? 1.8 : 1.1}"></circle>
          <circle r="${baseRadius}" fill="rgba(255,255,255,0.98)" stroke="rgba(0,0,0,0.88)" stroke-width="${node.orbit === 0 ? 2.2 : 1.5}"></circle>
          <circle r="${Math.max(3.5, baseRadius * 0.26)}" fill="rgba(0,0,0,0.94)"></circle>
          <g transform="translate(0 ${baseRadius + 18})">
            <rect x="${-labelWidth / 2}" y="0" width="${labelWidth}" height="26" rx="13" fill="rgba(255,255,255,0.98)" stroke="rgba(0,0,0,0.12)"></rect>
            <text x="0" y="17.5" text-anchor="middle" fill="#111" font-size="${node.orbit === 0 ? 15 : 13}" font-weight="700">${escapeHtml(node.label)}</text>
          </g>
          <g transform="translate(0 ${baseRadius + 48})" opacity="${hovered || node.orbit === 0 ? "1" : "0.84"}">
            <rect x="${-detailWidth / 2}" y="0" width="${detailWidth}" height="20" rx="10" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.1)"></rect>
            <text x="0" y="13.5" text-anchor="middle" fill="rgba(0,0,0,0.56)" font-size="10.5">${escapeHtml(node.detail)}</text>
          </g>
        </g>
      `;
    })
    .join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="28" fill="rgba(252,252,251,1)"></rect>
    <rect x="20" y="20" width="${WIDTH - 40}" height="${HEIGHT - 40}" rx="24" fill="none" stroke="rgba(0,0,0,0.08)"></rect>
    <g opacity="0.65">${buildDustField(120)}</g>
    <g opacity="0.92">
      <text x="52" y="60" fill="#111" font-size="12" font-weight="700" letter-spacing="2.5">SLG WIRE OBSERVATORY</text>
      <text x="52" y="82" fill="rgba(0,0,0,0.48)" font-size="11">drag to rotate · wheel to zoom · click to focus</text>
    </g>
    ${orbitMarkup}
    <g transform="translate(${CENTER_X} ${CENTER_Y})">
      <circle r="${118 + pulse * 3}" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="1.4"></circle>
      <circle r="82" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-dasharray="3 7"></circle>
      <circle r="34" fill="rgba(255,255,255,1)" stroke="rgba(0,0,0,0.96)" stroke-width="2.3"></circle>
      <circle r="8" fill="rgba(0,0,0,0.98)"></circle>
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
