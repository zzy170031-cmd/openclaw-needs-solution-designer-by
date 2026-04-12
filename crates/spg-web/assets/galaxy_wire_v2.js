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
  summary: null,
  default_tab: "games",
  games: [],
  initial_focus: {
    focus_id: "empty",
    focus_kind: "game",
    title: "Waiting for focus",
    subtitle: "No detail yet",
    nodes: [],
    edges: [],
    narrative: [],
    available_layers: ["games", "events", "sources"],
  },
  unlock_state: null,
};

const viewState = {
  currentTab: initial.default_tab || "games",
  games: initial.games || [],
  events: [],
  summary: initial.summary,
  unlockState: initial.unlock_state,
  focus: initial.initial_focus,
  filters: { games: true, events: true, sources: true },
  selectedId: initial.initial_focus?.focus_id || initial.games?.[0]?.id || null,
  rotation: 0,
  zoom: 1,
  drag: null,
  hoveredNodeId: null,
  eventsLoaded: false,
};

function listItems() {
  return viewState.currentTab === "events" ? viewState.events : viewState.games;
}

function scoreNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function currentGame() {
  if (viewState.focus?.focus_kind === "game") {
    return viewState.games.find((game) => game.id === viewState.focus.focus_id) || null;
  }

  const directEvent = viewState.events.find((event) => event.id === viewState.focus?.focus_id);
  if (directEvent) {
    return viewState.games.find((game) => game.id === directEvent.game_id) || null;
  }

  const gameNode = (viewState.focus?.nodes || []).find((node) => node.node_type === "game");
  if (!gameNode) return null;
  const matchId = gameNode.id.replace("game::", "");
  return viewState.games.find((game) => game.id === matchId) || null;
}

function focusEventNodes() {
  return (viewState.focus?.nodes || [])
    .filter((node) => node.node_type === "event")
    .map((node) => ({
      id: node.id.replace("event::", ""),
      title: node.label,
      note: node.detail,
      heat: Math.round(scoreNumber(node.size) * 4.8),
      source_count: Math.max(2, Math.round(scoreNumber(node.size) / 3)),
      event_type: "focus",
    }));
}

function focusSourceNodes() {
  return (viewState.focus?.nodes || [])
    .filter((node) => node.node_type === "source")
    .map((node) => ({
      id: node.id,
      title: node.label,
      note: node.detail,
      score: Math.round(scoreNumber(node.size) * 6),
    }));
}

function currentEventTitle() {
  if (viewState.focus?.focus_kind === "event") {
    return viewState.focus.title || "";
  }
  const topEvent = focusEventNodes()[0];
  return topEvent?.title || "";
}

function sourceLabelForHeat() {
  return focusSourceNodes()
    .slice(0, 2)
    .map((node) => node.title)
    .join(" / ");
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
    const r = 0.4 + seeded(index + 131) * 1.05;
    const opacity = 0.04 + seeded(index + 191) * 0.18;
    markup += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,${opacity.toFixed(3)})"></circle>`;
  }
  return markup;
}

function buildFrameMarkup() {
  return `
    <g stroke="rgba(0,0,0,0.08)" stroke-width="1" fill="none">
      <path d="M 34 84 H 126"></path>
      <path d="M 34 84 V 160"></path>
      <path d="M ${WIDTH - 34} 84 H ${WIDTH - 126}"></path>
      <path d="M ${WIDTH - 34} 84 V 160"></path>
      <path d="M 34 ${HEIGHT - 84} H 126"></path>
      <path d="M 34 ${HEIGHT - 84} V ${HEIGHT - 160}"></path>
      <path d="M ${WIDTH - 34} ${HEIGHT - 84} H ${WIDTH - 126}"></path>
      <path d="M ${WIDTH - 34} ${HEIGHT - 84} V ${HEIGHT - 160}"></path>
      <path d="M ${CENTER_X} 44 V 104"></path>
      <path d="M ${CENTER_X} ${HEIGHT - 44} V ${HEIGHT - 104}"></path>
      <path d="M 54 ${CENTER_Y} H 114"></path>
      <path d="M ${WIDTH - 54} ${CENTER_Y} H ${WIDTH - 114}"></path>
    </g>
  `;
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
            stroke="rgba(0,0,0,0.08)"
            stroke-width="1"
            stroke-dasharray="4 10"
          ></ellipse>
          <path
            d="${orbitArc(CENTER_X, CENTER_Y, spec.rx, spec.ry, sweep, sweep + 86)}"
            fill="none"
            stroke="rgba(0,0,0,0.24)"
            stroke-width="1.5"
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
          stroke="${highlighted ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.22)"}"
          stroke-width="${highlighted ? 2 : 0.9 + edge.strength * 0.9}"
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
      const labelWidth = Math.max(92, Math.min(220, node.label.length * 16));
      const detailWidth = Math.max(110, Math.min(230, node.detail.length * 8));
      return `
        <g class="galaxy-node" data-node-id="${escapeHtml(node.id)}" transform="translate(${point.x} ${point.y})">
          <circle r="${ringRadius + (hovered ? 5 : 0)}" fill="none" stroke="${hovered ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.14)"}" stroke-width="${hovered ? 1.8 : 1.1}"></circle>
          <circle r="${baseRadius}" fill="rgba(255,255,255,0.99)" stroke="rgba(0,0,0,0.88)" stroke-width="${node.orbit === 0 ? 2.2 : 1.5}"></circle>
          <circle r="${Math.max(3.5, baseRadius * 0.24)}" fill="rgba(0,0,0,0.96)"></circle>
          <path d="M -${ringRadius + 12} 0 H -${ringRadius + 4}" stroke="rgba(0,0,0,0.18)"></path>
          <path d="M ${ringRadius + 4} 0 H ${ringRadius + 12}" stroke="rgba(0,0,0,0.18)"></path>
          <path d="M 0 -${ringRadius + 12} V -${ringRadius + 4}" stroke="rgba(0,0,0,0.18)"></path>
          <path d="M 0 ${ringRadius + 4} V ${ringRadius + 12}" stroke="rgba(0,0,0,0.18)"></path>
          <g transform="translate(0 ${baseRadius + 18})">
            <rect x="${-labelWidth / 2}" y="0" width="${labelWidth}" height="28" rx="14" fill="rgba(255,255,255,0.99)" stroke="rgba(0,0,0,0.12)"></rect>
            <text x="0" y="18.2" text-anchor="middle" fill="#111" font-size="${node.orbit === 0 ? 15 : 13}" font-weight="700">${escapeHtml(node.label)}</text>
          </g>
          <g transform="translate(0 ${baseRadius + 52})" opacity="${hovered || node.orbit === 0 ? "1" : "0.82"}">
            <rect x="${-detailWidth / 2}" y="0" width="${detailWidth}" height="22" rx="11" fill="rgba(255,255,255,0.97)" stroke="rgba(0,0,0,0.1)"></rect>
            <text x="0" y="14.7" text-anchor="middle" fill="rgba(0,0,0,0.54)" font-size="10.5">${escapeHtml(node.detail)}</text>
          </g>
        </g>
      `;
    })
    .join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="28" fill="rgba(253,253,252,1)"></rect>
    <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" rx="24" fill="none" stroke="rgba(0,0,0,0.08)"></rect>
    ${buildFrameMarkup()}
    <g opacity="0.78">${buildDustField(160)}</g>
    <g opacity="0.94">
      <text x="52" y="60" fill="#111" font-size="12" font-weight="700" letter-spacing="2.5">SLG WIRE OBSERVATORY</text>
      <text x="52" y="82" fill="rgba(0,0,0,0.48)" font-size="11">drag to rotate · wheel to zoom · click to focus</text>
      <text x="${WIDTH - 178}" y="60" fill="rgba(0,0,0,0.48)" font-size="11">focus: ${escapeHtml(viewState.focus?.title || "none")}</text>
      <text x="${WIDTH - 178}" y="82" fill="rgba(0,0,0,0.48)" font-size="11">source arc: ${escapeHtml(sourceLabelForHeat() || "waiting")}</text>
    </g>
    ${orbitMarkup}
    <g transform="translate(${CENTER_X} ${CENTER_Y})">
      <circle r="${120 + pulse * 3}" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="1.3"></circle>
      <circle r="80" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="1.1" stroke-dasharray="3 7"></circle>
      <circle r="34" fill="rgba(255,255,255,1)" stroke="rgba(0,0,0,0.96)" stroke-width="2.3"></circle>
      <circle r="8" fill="rgba(0,0,0,0.98)"></circle>
    </g>
    ${edgeMarkup}
    ${nodeMarkup}
  `;
}

function buildHeatItems() {
  const gameItems = viewState.games.slice(0, 6).map((game) => ({
    key: `game-${game.id}`,
    title: game.name,
    meta: `${game.stage} · 游戏`,
    score: scoreNumber(game.signal_count),
  }));

  const eventItems = (viewState.events.length ? viewState.events : focusEventNodes()).slice(0, 6).map((event) => ({
    key: `event-${event.id || event.title}`,
    title: event.title,
    meta: `${event.game_name || currentGame()?.name || "SLG"} · 事件`,
    score: scoreNumber(event.heat),
  }));

  const sourceItems = focusSourceNodes().slice(0, 3).map((source) => ({
    key: `source-${source.id}`,
    title: source.title,
    meta: `${currentGame()?.name || "SLG"} · 来源`,
    score: source.score,
  }));

  return [...gameItems, ...eventItems, ...sourceItems]
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "zh-CN"))
    .slice(0, 8);
}

function renderHeatMarquee() {
  const track = document.getElementById("heat-marquee-track");
  if (!track) return;
  const items = buildHeatItems();
  if (!items.length) {
    track.innerHTML = '<div class="empty-state">Heat ranking will appear after data loads.</div>';
    return;
  }

  const duplicated = [...items, ...items];
  track.innerHTML = duplicated
    .map((item, index) => {
      const rank = (index % items.length) + 1;
      return `
        <div class="heat-chip">
          <span class="heat-chip-rank">#${rank}</span>
          <div>
            <span class="heat-chip-title">${escapeHtml(item.title)}</span>
            <span class="heat-chip-meta">${escapeHtml(item.meta)}</span>
          </div>
          <strong class="heat-chip-score">${escapeHtml(item.score)}</strong>
        </div>
      `;
    })
    .join("");
}

function searchUrlForPlatform(platform, query, officialUrl = "") {
  const normalized = String(platform || "").toLowerCase();
  const encoded = encodeURIComponent(query);
  if (officialUrl && /官方|official/.test(platform)) {
    return officialUrl;
  }
  if (normalized.includes("bilibili")) {
    return `https://search.bilibili.com/all?keyword=${encoded}`;
  }
  if (normalized.includes("抖音") || normalized.includes("douyin")) {
    return `https://www.douyin.com/search/${encoded}`;
  }
  if (normalized.includes("微博") || normalized.includes("weibo")) {
    return `https://s.weibo.com/weibo?q=${encoded}`;
  }
  if (normalized.includes("小红书")) {
    return `https://www.xiaohongshu.com/search_result?keyword=${encoded}`;
  }
  if (normalized.includes("youtube")) {
    return `https://www.youtube.com/results?search_query=${encoded}`;
  }
  if (normalized.includes("taptap")) {
    return `https://www.taptap.cn/search/${encoded}`;
  }
  return `https://www.baidu.com/s?wd=${encoded}`;
}

function buildEventRailItems() {
  const game = currentGame();
  const fromFocus = focusEventNodes();
  const fromList = viewState.events.filter((event) => !game || event.game_id === game.id);
  const currentEvent =
    viewState.focus?.focus_kind === "event"
      ? [{
          id: viewState.focus.focus_id,
          title: viewState.focus.title,
          note: viewState.focus.subtitle,
          heat: 96,
          source_count: focusSourceNodes().length || 3,
          event_type: "focused",
          game_name: game?.name || "",
        }]
      : [];

  return uniqueBy([...currentEvent, ...fromFocus, ...fromList], (item) => item.id || item.title)
    .sort((left, right) => scoreNumber(right.heat) - scoreNumber(left.heat))
    .slice(0, 4)
    .map((item, index) => {
      const query = `${game?.name || item.game_name || viewState.focus?.title || "SLG"} ${item.title}`;
      return {
        title: item.title,
        subtitle: item.note,
        tags: [
          item.event_type || "event",
          `heat ${item.heat || 0}`,
          `${item.source_count || 0} sources`,
        ],
        focusKind: "event",
        focusId: item.id,
        primaryLabel: index === 0 ? "聚焦查看" : "切换焦点",
        secondaryLabel: "追踪链接",
        secondaryUrl: searchUrlForPlatform("百度", query, ""),
      };
    });
}

function buildVideoRailItems() {
  const game = currentGame();
  const focusTitle = currentEventTitle() || viewState.focus?.title || game?.name || "SLG";
  const sources = focusSourceNodes();
  const preferred = sources.length
    ? sources
    : [
        { title: "Bilibili", note: "长视频拆解", score: 22 },
        { title: "抖音", note: "高频二创切片", score: 18 },
        { title: "微博", note: "话题扩散", score: 14 },
      ];

  const items = preferred.slice(0, 4).map((source, index) => {
    const platform = source.title;
    const query = `${game?.name || viewState.focus?.title || "SLG"} ${focusTitle} ${index === 0 ? "攻略" : index === 1 ? "实战" : "热点"}`;
    return {
      title: `${platform} ${index === 0 ? "主看入口" : index === 1 ? "跟拍方向" : "延展入口"}`,
      subtitle: source.note,
      tags: [platform, `score ${source.score || 0}`],
      focusKind: game ? "game" : null,
      focusId: game?.id || null,
      primaryLabel: "回到主体",
      secondaryLabel: "打开链接",
      secondaryUrl: searchUrlForPlatform(platform, query, game?.official_url || ""),
    };
  });

  if (game?.official_url) {
    items.unshift({
      title: "官方入口",
      subtitle: "查看官方公告、活动页和一手更新。",
      tags: ["official", game.name],
      focusKind: "game",
      focusId: game.id,
      primaryLabel: "聚焦主体",
      secondaryLabel: "打开官网",
      secondaryUrl: game.official_url,
    });
  }

  return items.slice(0, 4);
}

function renderRail(containerId, items, emptyText) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    return;
  }

  container.innerHTML = items
    .map((item) => `
      <article class="rail-item">
        <div class="rail-item-top">
          <h4 class="rail-item-title">${escapeHtml(item.title)}</h4>
          <span class="rail-tag">${escapeHtml(item.tags?.[0] || "focus")}</span>
        </div>
        <p class="rail-item-subtitle">${escapeHtml(item.subtitle || "")}</p>
        <div class="rail-item-meta">
          ${(item.tags || [])
            .slice(1)
            .map((tag) => `<span class="rail-tag">${escapeHtml(tag)}</span>`)
            .join("")}
        </div>
        <div class="rail-links">
          ${
            item.focusKind && item.focusId
              ? `<a class="rail-link rail-link-primary" href="#" data-focus-kind="${escapeHtml(item.focusKind)}" data-focus-id="${escapeHtml(item.focusId)}">${escapeHtml(item.primaryLabel || "聚焦")}</a>`
              : ""
          }
          <a class="rail-link" href="${escapeHtml(item.secondaryUrl || "#")}" target="_blank" rel="noreferrer">${escapeHtml(item.secondaryLabel || "打开")}</a>
        </div>
      </article>
    `)
    .join("");
}

function analysisCardMarkup(item) {
  const keywords = item.keywords?.length
    ? `<div class="keyword-strip">${item.keywords
        .map((keyword) => `<span class="keyword-chip">${escapeHtml(keyword)}</span>`)
        .join("")}</div>`
    : "";
  return `
    <article class="analysis-item">
      <span class="analysis-kicker">${escapeHtml(item.kicker || "analysis")}</span>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.body)}</p>
      ${keywords}
    </article>
  `;
}

function buildAnalysisContent() {
  const game = currentGame();
  const focusTitle = viewState.focus?.title || game?.name || "当前焦点";
  const topEvent = buildEventRailItems()[0];
  const topVideo = buildVideoRailItems()[0];
  const topSources = focusSourceNodes()
    .slice(0, 3)
    .map((node) => node.title)
    .join(" / ");

  return {
    event: [
      {
        kicker: "trigger",
        title: "当前最值得拆的热点",
        body: `${topEvent?.title || focusTitle} 是现在最适合继续跟进的主轴，建议优先拆它的起因、爆点和扩散人群。`,
        keywords: [game?.name || "SLG", "热度抬升", "事件时间线"],
      },
      {
        kicker: "spread",
        title: "扩散路径建议",
        body: `当前传播更像“主体 -> ${topSources || "多平台"} -> 二次扩散”的链路，适合做来源分层和节点对比。`,
        keywords: ["官方源头", "平台搬运", "二创扩散"],
      },
      {
        kicker: "watchpoint",
        title: "下一步观察点",
        body: `继续观察 ${game?.name || focusTitle} 的版本更新、赛季变化和社区争议，新的增量通常会先出现在高频来源节点。`,
        keywords: ["版本公告", "赛季节奏", "社区反馈"],
      },
    ],
    video: [
      {
        kicker: "hook",
        title: "重点视频共性",
        body: `${topVideo?.title || "爆款视频"} 更适合用“冲突切片 + 结果展示 + 简洁结论”的方式起手，前 8 秒必须直接给出情绪点。`,
        keywords: ["前 8 秒", "冲突镜头", "结果先行"],
      },
      {
        kicker: "angle",
        title: "建议优先制作的角度",
        body: `围绕 ${focusTitle} 做“值不值得追”“版本变化影响什么”“玩家为什么在讨论”三类角度，比较容易形成点击。`,
        keywords: ["值得追吗", "版本变化", "玩家讨论"],
      },
      {
        kicker: "template",
        title: "可直接套用的视频模板",
        body: "开头给结论，中段用 3 个信息点拆核心变化，结尾加一句判断和评论引导，适合短视频与中视频通用。",
        keywords: ["结论先行", "三段拆解", "评论引导"],
      },
    ],
    guide: [
      {
        kicker: "opening",
        title: "开场建议",
        body: `第一句直接点名 ${focusTitle}，不要先铺背景，先说“现在为什么值得看”。`,
        keywords: ["直给主题", "先说价值", "不要铺垫过长"],
      },
      {
        kicker: "rhythm",
        title: "叙事节奏建议",
        body: "建议按“发生了什么 -> 为什么放大 -> 对玩家意味着什么”推进，结构比纯资料堆砌更容易看完。",
        keywords: ["发生什么", "为什么放大", "对玩家意味着什么"],
      },
      {
        kicker: "publish",
        title: "发布与跟更建议",
        body: "先发一版快反，再根据评论区追问补第二版深拆，节奏上会比一次写满更有连续热度。",
        keywords: ["快反首发", "评论追问", "二次深拆"],
      },
    ],
  };
}

function renderAnalysis() {
  const content = buildAnalysisContent();
  const eventContainer = document.getElementById("event-breakdown");
  const videoContainer = document.getElementById("video-breakdown");
  const guideContainer = document.getElementById("creation-guide");
  if (eventContainer) eventContainer.innerHTML = content.event.map(analysisCardMarkup).join("");
  if (videoContainer) videoContainer.innerHTML = content.video.map(analysisCardMarkup).join("");
  if (guideContainer) guideContainer.innerHTML = content.guide.map(analysisCardMarkup).join("");
}

function renderEnhancements() {
  renderHeatMarquee();
  renderRail("event-rail", buildEventRailItems(), "热点事件将跟随焦点更新。");
  renderRail("video-rail", buildVideoRailItems(), "重点视频入口将跟随焦点更新。");
  renderAnalysis();
}

async function ensureEventsLoaded() {
  if (viewState.eventsLoaded) return;
  const response = await fetchJson("/api/galaxy/list?tab=events");
  viewState.events = response.events || [];
  viewState.eventsLoaded = true;
}

async function loadList(tab) {
  const response = await fetchJson(`/api/galaxy/list?tab=${tab}`);
  if (tab === "events") {
    viewState.events = response.events || [];
    viewState.eventsLoaded = true;
  } else {
    viewState.games = response.games || [];
  }
  viewState.currentTab = tab;
  renderList();
  updateTabs();
  renderHeatMarquee();
}

async function loadFocus(kind, id) {
  const response = await fetchJson(`/api/galaxy/focus/${kind}/${id}`);
  viewState.focus = response;
  viewState.selectedId = id;
  renderList();
  renderFocus();
  renderGalaxy();
  renderEnhancements();
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

  const focusLink = target.closest("[data-focus-kind][data-focus-id]");
  if (focusLink instanceof HTMLElement) {
    event.preventDefault();
    const kind = focusLink.dataset.focusKind;
    const id = focusLink.dataset.focusId;
    if (kind && id) {
      try {
        await loadFocus(kind, id);
      } catch (error) {
        console.error(error);
        window.alert(`Failed to load focus: ${error.message || error}`);
      }
    }
    return;
  }

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
renderEnhancements();
bindInteractions();
startAnimation();

ensureEventsLoaded()
  .then(() => {
    renderHeatMarquee();
    renderEnhancements();
  })
  .catch((error) => console.error(error));

if (!viewState.games.length) {
  loadList("games").catch((error) => console.error(error));
}
