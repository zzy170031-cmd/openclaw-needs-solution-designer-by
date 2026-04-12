const root = document.getElementById("setup-root");

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

function statusClass(status) {
  return `status-pill status-${String(status).replaceAll("_", "-")}`;
}

function renderProviderCard(provider) {
  const verified = provider.last_verified_at || "尚未验证";
  const latency = provider.latency_ms ? `${provider.latency_ms} ms` : "未测试";
  const error = provider.last_error || "暂无错误";
  const keyHint = provider.api_key
    ? `已保存：${provider.api_key}。输入新值后保存才会覆盖当前 Key。`
    : "未保存任何 Key";

  return `
    <article class="provider-card" data-provider="${escapeHtml(provider.provider)}" data-saved-key-mask="${escapeHtml(provider.api_key || "")}">
      <div class="provider-card-top">
        <div>
          <p class="provider-name">${escapeHtml(provider.display_name)}</p>
          <p class="provider-desc">${escapeHtml(provider.description)}</p>
        </div>
        <span class="${statusClass(provider.status)}">${escapeHtml(provider.status)}</span>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>启用</span>
          <input class="toggle-input" name="enabled" type="checkbox" ${provider.enabled ? "checked" : ""}/>
        </label>
        <label class="field field-wide">
          <span>API Key</span>
          <input class="text-input" name="api_key" type="password" value="${escapeHtml(provider.api_key || "")}" placeholder="输入新的 API Key" autocomplete="new-password" spellcheck="false" data-lpignore="true" data-1p-ignore="true"/>
          <small class="field-hint">${escapeHtml(keyHint)}</small>
        </label>
        <label class="field field-wide">
          <span>Base URL</span>
          <input class="text-input" name="base_url" type="text" value="${escapeHtml(provider.base_url)}"/>
        </label>
        <label class="field">
          <span>Monthly Limit</span>
          <input class="text-input" name="monthly_limit" type="number" value="${escapeHtml(provider.monthly_limit)}"/>
        </label>
        <label class="field">
          <span>Daily Soft Limit</span>
          <input class="text-input" name="daily_soft_limit" type="number" value="${escapeHtml(provider.daily_soft_limit)}"/>
        </label>
        <label class="field field-wide">
          <span>Default Role</span>
          <input class="text-input" name="default_role" type="text" value="${escapeHtml(provider.default_role)}"/>
        </label>
        <label class="field">
          <span>Priority</span>
          <input class="text-input" name="priority" type="number" value="${escapeHtml(provider.priority)}"/>
        </label>
      </div>

      <div class="provider-meta">
        <div>
          <span class="meta-label">最近验证</span>
          <strong>${escapeHtml(verified)}</strong>
        </div>
        <div>
          <span class="meta-label">延迟</span>
          <strong>${escapeHtml(latency)}</strong>
        </div>
        <div class="provider-error">
          <span class="meta-label">最近错误</span>
          <strong>${escapeHtml(error)}</strong>
        </div>
      </div>

      <div class="provider-actions">
        <button class="secondary-button action-button" data-action="save" type="button">保存配置</button>
        <button class="primary-button action-button" data-action="test" type="button">测试 Provider</button>
      </div>
    </article>
  `;
}

function renderUnlockPanel(unlockState) {
  const blockers = unlockState.blockers.length
    ? unlockState.blockers.map((blocker) => `<li>${escapeHtml(blocker)}</li>`).join("")
    : "<li>所有 Provider 均已通过。</li>";
  const actionHref = unlockState.unlocked ? "/galaxy" : "#";
  const actionClass = unlockState.unlocked
    ? "primary-button inline-link"
    : "primary-button inline-link disabled-link";
  const copy = unlockState.unlocked
    ? "全部 Provider 已通过测试，你现在可以进入主系统。"
    : "仍有 Provider 未完成授权或最近测试失败，主系统保持锁定。";

  return `
    <p class="section-label">Unlock State</p>
    <h3>${unlockState.ready_count} / ${unlockState.total_count} Ready</h3>
    <p class="status-copy">${escapeHtml(copy)}</p>
    <ul class="blocker-list">${blockers}</ul>
    <div class="unlock-actions">
      <a class="secondary-button inline-link" href="/setup/providers">刷新当前页</a>
      <a class="${actionClass}" href="${actionHref}">进入主系统</a>
    </div>
  `;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

function readCardPayload(card) {
  const apiKeyInput = card.querySelector('[name="api_key"]');
  const apiKey = apiKeyInput.value.trim();
  const savedKeyMask = (card.dataset.savedKeyMask || "").trim();

  return {
    enabled: card.querySelector('[name="enabled"]').checked,
    api_key: apiKey.length > 0 && apiKey !== savedKeyMask ? apiKey : null,
    base_url: card.querySelector('[name="base_url"]').value.trim(),
    monthly_limit: Number(card.querySelector('[name="monthly_limit"]').value || 0),
    daily_soft_limit: Number(card.querySelector('[name="daily_soft_limit"]').value || 0),
    default_role: card.querySelector('[name="default_role"]').value.trim(),
    priority: Number(card.querySelector('[name="priority"]').value || 0),
  };
}

function syncHeroMetrics(unlockState) {
  const metricValues = document.querySelectorAll(".metric-card strong");
  if (metricValues[0]) {
    metricValues[0].textContent = `${unlockState.ready_count}/${unlockState.total_count}`;
  }
  if (metricValues[1]) {
    metricValues[1].textContent = unlockState.unlocked ? "已解锁" : "锁定中";
  }
}

async function refreshState() {
  const [providers, unlockState] = await Promise.all([
    fetchJson("/api/providers"),
    fetchJson("/api/unlock-state"),
  ]);
  state.providers = providers;
  state.unlock_state = unlockState;
  render();
}

async function saveProvider(provider, card) {
  const payload = readCardPayload(card);
  await fetchJson(`/api/providers/${provider}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await refreshState();
}

async function testProvider(provider) {
  await fetchJson(`/api/providers/${provider}/test`, {
    method: "POST",
  });
  await refreshState();
}

async function testAll() {
  await fetchJson("/api/providers/test-all", {
    method: "POST",
  });
  await refreshState();
}

function render() {
  const cards = document.getElementById("provider-cards");
  const unlockPanel = document.getElementById("unlock-panel");
  if (!cards || !unlockPanel) return;

  cards.innerHTML = state.providers.map(renderProviderCard).join("");
  unlockPanel.innerHTML = renderUnlockPanel(state.unlock_state);
  syncHeroMetrics(state.unlock_state);
}

let state = decodeState(root?.dataset.state || "") || {
  mode: "setup",
  providers: [],
  unlock_state: { ready_count: 0, total_count: 6, unlocked: false, blockers: [] },
};

document.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.id === "test-all-btn") {
    target.setAttribute("disabled", "true");
    try {
      await testAll();
    } finally {
      target.removeAttribute("disabled");
    }
    return;
  }

  const actionButton = target.closest("[data-action]");
  if (!(actionButton instanceof HTMLElement)) return;
  const card = actionButton.closest(".provider-card");
  if (!(card instanceof HTMLElement)) return;
  const provider = card.dataset.provider;
  if (!provider) return;

  actionButton.setAttribute("disabled", "true");
  try {
    if (actionButton.dataset.action === "save") {
      await saveProvider(provider, card);
    } else if (actionButton.dataset.action === "test") {
      await testProvider(provider);
    }
  } catch (error) {
    console.error(error);
    window.alert(`操作失败：${error.message || error}`);
  } finally {
    actionButton.removeAttribute("disabled");
  }
});

render();
