const root = document.getElementById("galaxy-root");

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

const initial = decodeState(root?.dataset.state || "") || {
  default_tab: "games",
  games: [],
  initial_focus: { nodes: [], edges: [], narrative: [], available_layers: ["games", "events", "sources"] },
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

function itemKind() {
  return viewState.currentTab === "events" ? "event" : "game";
}

function renderList() {
  const container = document.getElementById("galaxy-list");
  if (!container) return;
  const items = listItems();
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">暂无 ${viewState.currentTab === "events" ? "事件" : "游戏"} 数据。</div>`;
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
              <span>${escapeHtml(item.source_count)} 来源</span>
              <span>热度 ${escapeHtml(item.heat)}</span>
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
  if (title) title.textContent = viewState.focus?.title || "等待焦点";
  if (subtitle) subtitle.textContent = viewState.focus?.subtitle || "暂无说明";
  if (narrative) {
    const items = viewState.focus?.narrative || [];
    narrative.innerHTML = items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>暂无焦点叙述。</li>";
  }
}

function currentFilters() {
  const map = { game: "games", event: "events", source: "sources" };
  return new Set(
    Object.entries(viewState.filters)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)
      .concat("focus")
  );
}

function visibleNodes() {
  const filters = currentFilters();
  return (viewState.focus?.nodes || []).filter((node) => {
    if (node.orbit === 0) return true;
    if (node.node_type === "game") return filters.has("games");
    if (node.node_type === "event") return filters.has("events");
    if (node.node_type === "source") return filters.has("sources");
    return true;
  });
}

function visibleEdges(nodeMap) {
  return (viewState.focus?.edges || []).filter(
    (edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target)
  );
}

function orbitRadius(orbit) {
  if (orbit === 0) return 0;
  if (orbit === 1) return 150 * viewState.zoom;
  if (orbit === 2) return 235 * viewState.zoom;
  return 305 * viewState.zoom;
}

function computePositions(nodes) {
  const centerX = 480;
  const centerY = 310;
  const positions = new Map();
  nodes.forEach((node) => {
    if (node.orbit === 0) {
      positions.set(node.id, { x: centerX, y: centerY });
      return;
    }
    const speed = node.orbit === 1 ? 1 : node.orbit === 2 ? 0.66 : 0.42;
    const radians = ((node.angle + viewState.rotation * speed) * Math.PI) / 180;
    const radius = orbitRadius(node.orbit);
    positions.set(node.id, {
      x: centerX + Math.cos(radians) * radius,
      y: centerY + Math.sin(radians) * radius,
    });
  });
  return positions;
}

function renderGalaxy() {
  const svg = document.getElementById("galaxy-svg");
  if (!svg) return;

  const nodes = visibleNodes();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const positions = computePositions(nodes);
  const edges = visibleEdges(nodeMap);

  const orbitMarkup = [1, 2, 3]
    .map((orbit) => {
      const radius = orbitRadius(orbit);
      return `<circle cx="480" cy="310" r="${radius}" fill="none" stroke="rgba(77,128,255,0.16)" stroke-width="1.4" stroke-dasharray="8 10"></circle>`;
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
        <line
          x1="${source.x}"
          y1="${source.y}"
          x2="${target.x}"
          y2="${target.y}"
          stroke="${highlighted ? "rgba(45,121,255,0.55)" : "rgba(92,146,255,0.22)"}"
          stroke-width="${highlighted ? 2.4 : 1 + edge.strength}"
        ></line>
      `;
    })
    .join("");

  const nodeMarkup = nodes
    .map((node) => {
      const point = positions.get(node.id);
      if (!point) return "";
      const hovered = viewState.hoveredNodeId === node.id;
      const radius = hovered ? node.size + 3 : node.size;
      return `
        <g class="galaxy-node" data-node-id="${escapeHtml(node.id)}" transform="translate(${point.x} ${point.y})">
          <circle
            r="${radius}"
            fill="${escapeHtml(node.accent)}"
            fill-opacity="${node.orbit === 0 ? "0.96" : "0.82"}"
            stroke="rgba(255,255,255,0.88)"
            stroke-width="${hovered ? 3 : 2}"
          ></circle>
          <circle
            r="${radius + 8}"
            fill="none"
            stroke="${hovered ? "rgba(45,121,255,0.22)" : "rgba(45,121,255,0.1)"}"
            stroke-width="2"
          ></circle>
          <text x="0" y="${radius + 20}" text-anchor="middle" fill="#143057" font-size="${node.orbit === 0 ? 15 : 13}" font-weight="700">
            ${escapeHtml(node.label)}
          </text>
        </g>
      `;
    })
    .join("");

  svg.innerHTML = `
    <defs>
      <radialGradient id="galaxy-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(90,170,255,0.38)"></stop>
        <stop offset="100%" stop-color="rgba(90,170,255,0)"></stop>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="960" height="620" rx="28" fill="rgba(247,251,255,0.76)"></rect>
    <circle cx="480" cy="310" r="118" fill="url(#galaxy-core)"></circle>
    ${orbitMarkup}
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
    const active = button.dataset.tab === viewState.currentTab;
    button.classList.toggle("active", active);
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
    viewState.rotation += delta * 0.012;
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
      viewState.rotation += deltaX * 0.3;
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
      const nextZoom = viewState.zoom + (event.deltaY < 0 ? 0.06 : -0.06);
      viewState.zoom = Math.max(0.72, Math.min(1.44, nextZoom));
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
      const eventId = nodeId.replace("event::", "");
      loadFocus("event", eventId).catch((error) => console.error(error));
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
        window.alert(`切换列表失败：${error.message || error}`);
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
      window.alert(`加载焦点失败：${error.message || error}`);
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
