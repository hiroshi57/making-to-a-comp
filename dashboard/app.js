// ============================================================
//  Dashboard App — making-to-a-comp
//  APIモード: http://localhost:8000  /  スタンドアロン: data.js
// ============================================================

const API_BASE = (() => {
  const loc = window.location;
  if (loc.hostname === "localhost" || loc.hostname === "127.0.0.1") {
    return `${loc.protocol}//${loc.hostname}:${loc.port || 8000}`;
  }
  return null;
})();

// ── Auth guard ────────────────────────────────────
const _token = localStorage.getItem("auth_token");
const _user  = (() => { try { return JSON.parse(localStorage.getItem("auth_user")); } catch { return null; } })();

if (API_BASE && !_token) {
  // APIモードで未ログインならログインページへ
  location.replace("/login.html");
}

// apiFetch に Authorization ヘッダーを付与
const _authHeaders = () => _token ? { Authorization: `Bearer ${_token}` } : {};

// ── Fetch with fallback ──────────────────────────
async function apiFetch(path, fallback) {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(API_BASE + path, {
      headers: _authHeaders(),
      signal: AbortSignal.timeout(4000),
    });
    if (res.status === 401) { localStorage.removeItem("auth_token"); location.replace("/login.html"); return fallback; }
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch {
    console.warn(`[API] ${path} failed, using static data`);
    return fallback;
  }
}

// ── Helpers ──────────────────────────────────────
const fmtYen = v => v >= 1_000_000
  ? "¥" + (v / 1_000_000).toFixed(2) + "M"
  : "¥" + (v / 10_000).toFixed(0) + "万";
const fmtVal = (v, unit) => unit === "¥" ? fmtYen(v) : v.toLocaleString() + unit;

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#8e8e93", font: { size: 10 }, boxWidth: 12, padding: 10 } } },
  scales: {
    x: { ticks: { color: "#8e8e93", font: { size: 10 } }, grid: { color: "#e5e5ea" } },
    y: { ticks: { color: "#8e8e93", font: { size: 10 } }, grid: { color: "#e5e5ea" } },
  },
};

// ── Init ─────────────────────────────────────────
const dateStr = new Date().toLocaleDateString("ja-JP",
  { year:"numeric", month:"long", day:"numeric", weekday:"short" });
document.getElementById("headerDate").textContent = dateStr;
document.getElementById("sidebarDate").textContent = dateStr;

// ── Nav (IntersectionObserver) ────────────────────
const SECTION_NAMES = {
  kpi: "KPI サマリー", trend: "売上・コストトレンド",
  orders: "受注一覧",  team: "チームメンバー",
  snga: "販売費及び一般管理費", agents: "AIエージェントログ",
  forecast: "売上予測（TimesFM 2.5）",
};
const navItems   = document.querySelectorAll(".nav-item[data-target]");
const headerTitle = document.getElementById("headerTitle");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    document.getElementById(item.dataset.target)
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navItems.forEach(n => n.classList.toggle("active", n.dataset.target === id));
      headerTitle.textContent = SECTION_NAMES[id] || id;
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll("section[id]").forEach(s => observer.observe(s));

// ── KPI Cards ────────────────────────────────────
const KPI_CONF = [
  { key:"revenue",   color:"#5856d6" },
  { key:"profit",    color:"#30d158" },
  { key:"costs",     color:"#ff2d55" },
  { key:"orders",    color:"#007aff" },
  { key:"clients",   color:"#ff9500" },
  { key:"agentRuns", color:"#af52de" },
];

async function renderKPI() {
  const kpi = await apiFetch("/api/kpi", typeof KPI !== "undefined" ? KPI : {});
  const grid = document.getElementById("kpiGrid");
  grid.innerHTML = "";
  KPI_CONF.forEach(({ key, color }) => {
    const d = kpi[key]; if (!d) return;
    const pct = ((d.value - d.prev) / d.prev * 100).toFixed(1);
    const up  = d.value >= d.prev;
    grid.innerHTML += `
      <div class="kpi-card" style="--kpi-color:${color}">
        <div class="kpi-label">${d.label}</div>
        <div class="kpi-value">${fmtVal(d.value, d.unit)}</div>
        <div class="kpi-delta ${up ? "delta-up" : "delta-down"}">
          ${up ? "▲" : "▼"} ${Math.abs(pct)}%
          <span class="delta-label">前期比</span>
        </div>
      </div>`;
  });
}

// ── Trend Charts ──────────────────────────────────
async function renderTrend() {
  const [monthly, forecast] = await Promise.all([
    apiFetch("/api/monthly",  typeof MONTHLY  !== "undefined" ? MONTHLY  : {}),
    apiFetch("/api/forecast", typeof FORECAST !== "undefined" ? FORECAST : {}),
  ]);
  const nullPad = n => new Array(n).fill(null);

  new Chart(document.getElementById("trendChart").getContext("2d"), {
    type: "line",
    data: {
      labels: [...monthly.labels, ...forecast.labels],
      datasets: [
        { label:"売上（実績）",  data:[...monthly.revenue, ...nullPad(forecast.revenue.length)],
          borderColor:"#5856d6", backgroundColor:"rgba(88,86,214,.06)", borderWidth:2, pointRadius:3, tension:.4, fill:true },
        { label:"コスト（実績）",data:[...monthly.costs, ...nullPad(forecast.revenue.length)],
          borderColor:"#ff2d55", borderWidth:2, pointRadius:3, tension:.4 },
        { label:"予測（TimesFM）",data:[...nullPad(monthly.revenue.length), ...forecast.revenue],
          borderColor:"#30d158", borderWidth:2, borderDash:[5,3], pointRadius:3, tension:.4 },
      ],
    },
    options: { ...CHART_OPTS,
      scales: { ...CHART_OPTS.scales,
        y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => v + "万" } } } },
  });

  new Chart(document.getElementById("ordersChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: monthly.labels,
      datasets: [{ label:"受注件数", data:monthly.orders,
        backgroundColor:"rgba(88,86,214,.15)", borderColor:"#5856d6",
        borderWidth:1.5, borderRadius:5 }],
    },
    options: { ...CHART_OPTS, plugins:{ legend:{ display:false } },
      scales: { x:CHART_OPTS.scales.x,
        y:{ ...CHART_OPTS.scales.y, ticks:{ ...CHART_OPTS.scales.y.ticks, stepSize:2 } } } },
  });
}

// ── Forecast Section ──────────────────────────────
async function renderForecast() {
  const fc = await apiFetch("/api/forecast", typeof FORECAST !== "undefined" ? FORECAST : {});

  const srcBadge = document.getElementById("forecastSource");
  if (srcBadge) {
    const src = fc.source || "mock";
    srcBadge.textContent = src === "timesfm" ? "TimesFM 2.5" : src === "linear_fallback" ? "線形外挿" : "モック";
    srcBadge.className = "badge " + (src === "timesfm" ? "badge-blue" : "badge-gray");
  }

  new Chart(document.getElementById("forecastChart").getContext("2d"), {
    type: "line",
    data: {
      labels: fc.labels,
      datasets: [
        { label:"予測売上", data:fc.revenue,
          borderColor:"#5856d6", backgroundColor:"rgba(88,86,214,.08)",
          borderWidth:2.5, pointRadius:4, tension:.4, fill:true },
        { label:"上限(90th)", data:fc.upper,
          borderColor:"rgba(48,209,88,.4)", backgroundColor:"rgba(48,209,88,.05)",
          borderWidth:1, borderDash:[4,3], pointRadius:0, fill:"+1" },
        { label:"下限(10th)", data:fc.lower,
          borderColor:"rgba(255,59,48,.4)", borderWidth:1, borderDash:[4,3], pointRadius:0 },
      ],
    },
    options: { ...CHART_OPTS,
      scales: { ...CHART_OPTS.scales,
        y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => v + "万" } } } },
  });

  const ftbody = document.getElementById("forecastTable");
  fc.labels.forEach((label, i) => {
    ftbody.innerHTML += `
      <tr>
        <td><strong>${label}</strong></td>
        <td style="color:var(--accent);font-family:'Syne',sans-serif;font-weight:700">${fc.revenue[i]}万円</td>
        <td style="color:var(--muted)">${fc.lower[i]}万円</td>
        <td style="color:var(--muted)">${fc.upper[i]}万円</td>
      </tr>`;
  });
}

// ── Orders ────────────────────────────────────────
const STATUS_BADGE = { "受注":"badge-orange", "請求済":"badge-blue", "入金済":"badge-green" };
const STATUS_NEXT  = { "受注":"請求済", "請求済":"入金済" };

async function renderOrders() {
  const orders = await apiFetch("/api/orders", typeof ORDERS !== "undefined" ? ORDERS : []);
  document.getElementById("orderCount").textContent = orders.length + "件";
  document.getElementById("orderSub").textContent   = `全 ${orders.length} 件`;
  const tbody = document.getElementById("ordersTable");
  tbody.innerHTML = "";
  orders.forEach(o => {
    const next = STATUS_NEXT[o.status];
    const actionBtn = next && API_BASE
      ? `<button class="btn-secondary" style="font-size:10px;padding:4px 8px"
           onclick="advanceStatus('${o.id}','${next}')">→ ${next}</button>`
      : "";
    tbody.innerHTML += `
      <tr>
        <td><code style="color:var(--accent);font-size:11px">${o.id}</code></td>
        <td>${o.client}</td>
        <td style="font-family:'Syne',sans-serif;font-weight:700">¥${o.amount.toLocaleString()}</td>
        <td style="color:var(--muted)">${o.date}</td>
        <td>${o.agent}</td>
        <td><span class="badge ${STATUS_BADGE[o.status]||"badge-gray"}">${o.status}</span></td>
        <td>${actionBtn}</td>
      </tr>`;
  });
}

async function advanceStatus(id, status) {
  await fetch(`${API_BASE}/api/orders/${id}?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
  document.getElementById('ordersTable').innerHTML = '';
  await renderOrders();
}

// ── SG&A ─────────────────────────────────────────
async function renderSnga() {
  const sg = await apiFetch("/api/snga", typeof SNGA !== "undefined" ? SNGA : {});

  // KPI
  const sngaKpiEl = document.getElementById("sngaKpi");
  const t = sg.total, [c1] = ["#ff9500"];
  const tPct = ((t.value - t.prev) / t.prev * 100).toFixed(1);
  const tUp  = t.value >= t.prev;
  sngaKpiEl.innerHTML = `
    <div class="kpi-card" style="--kpi-color:#ff9500">
      <div class="kpi-label">${t.label}</div>
      <div class="kpi-value">${fmtYen(t.value)}</div>
      <div class="kpi-delta ${tUp?"delta-down":"delta-up"}">
        ${tUp?"▲":"▼"} ${Math.abs(tPct)}% <span class="delta-label">前月比</span>
      </div>
    </div>`;

  const r = sg.ratio;
  const rDelta = (r.value - r.prev).toFixed(1);
  const rOk = r.value < r.prev;
  sngaKpiEl.innerHTML += `
    <div class="kpi-card" style="--kpi-color:#ff2d55">
      <div class="kpi-label">販管費率（売上比）</div>
      <div class="kpi-value">${r.value}<span style="font-size:16px;color:var(--muted)">%</span></div>
      <div class="kpi-delta ${rOk?"delta-up":"delta-down"}">
        ${rOk?"▼":"▲"} ${Math.abs(rDelta)}pt <span class="delta-label">前月比（低いほど良）</span>
      </div>
    </div>`;

  const p = sg.breakdown[0];
  sngaKpiEl.innerHTML += `
    <div class="kpi-card" style="--kpi-color:#5856d6">
      <div class="kpi-label">人件費（最大費目）</div>
      <div class="kpi-value">${fmtYen(p.amount)}</div>
      <div class="kpi-delta" style="color:var(--muted)">構成比 ${p.pct}%</div>
    </div>`;

  // Stacked bar
  const m = sg.monthly;
  new Chart(document.getElementById("sngaTrendChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: m.labels,
      datasets: [
        { label:"人件費",     data:m.personnel, backgroundColor:"rgba(88,86,214,.8)",  stack:"s" },
        { label:"広告宣伝費", data:m.ad,         backgroundColor:"rgba(0,122,255,.8)",  stack:"s" },
        { label:"賃借料",     data:m.rent,       backgroundColor:"rgba(48,209,88,.8)",  stack:"s" },
        { label:"その他",     data:m.other,      backgroundColor:"rgba(142,142,147,.7)",stack:"s" },
      ],
    },
    options: { ...CHART_OPTS,
      scales: { x:CHART_OPTS.scales.x,
        y:{ ...CHART_OPTS.scales.y, stacked:true,
          ticks:{ ...CHART_OPTS.scales.y.ticks, callback:v=>v+"万" } } } },
  });

  // Donut
  new Chart(document.getElementById("sngaDonut").getContext("2d"), {
    type: "doughnut",
    data: {
      labels:   sg.breakdown.map(d => d.label),
      datasets: [{ data:sg.breakdown.map(d=>d.amount),
        backgroundColor:sg.breakdown.map(d=>d.color), borderWidth:2, borderColor:"#fff", hoverOffset:6 }],
    },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:"62%",
      plugins: {
        legend:{ position:"right", labels:{color:"#8e8e93",font:{size:10},boxWidth:10,padding:8} },
        tooltip:{ callbacks:{ label:ctx=>`${ctx.label}: ¥${ctx.raw.toLocaleString()} (${sg.breakdown[ctx.dataIndex].pct}%)` } },
      },
    },
  });

  // Table
  const sngaTbody = document.getElementById("sngaTable");
  sg.breakdown.forEach(row => {
    sngaTbody.innerHTML += `
      <tr>
        <td>
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;
            background:${row.color};margin-right:8px;vertical-align:middle"></span>
          ${row.label}
        </td>
        <td style="font-family:'Syne',sans-serif;font-weight:700">¥${row.amount.toLocaleString()}</td>
        <td>${row.pct}%</td>
        <td><span class="badge badge-gray">—</span></td>
        <td style="width:140px">
          <div style="background:var(--border);border-radius:3px;height:6px;overflow:hidden">
            <div style="width:${row.pct}%;height:100%;background:${row.color};border-radius:3px"></div>
          </div>
        </td>
      </tr>`;
  });
}

// ── Employees ─────────────────────────────────────
async function renderEmployees() {
  // API から取得する場合は company/employees.json の構造に合わせてマッピング
  // スタンドアロン時は data.js の EMPLOYEES を使う
  const emps = (typeof EMPLOYEES !== "undefined") ? EMPLOYEES : [];
  const grid  = document.getElementById("empGrid");
  const MONTHS_SHORT = ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"];

  emps.forEach(emp => {
    const [c1, c2] = emp.avatarBg;
    const skillEntries = Object.entries(emp.skills);

    const skillsHtml = skillEntries.map(([k,v]) => `
      <div class="skill-row">
        <span class="skill-label">${k}</span>
        <div class="skill-bar">
          <div class="skill-fill" style="width:${v}%;background:linear-gradient(90deg,${c1},${c2})"></div>
        </div>
        <span class="skill-val">${v}</span>
      </div>`).join("");

    const meritHtml   = emp.merit.map(m => `
      <div class="md-item"><div class="md-dot" style="background:var(--up)"></div><span>${m}</span></div>`).join("");
    const demeritHtml = emp.demerit.map(d => `
      <div class="md-item"><div class="md-dot" style="background:var(--down)"></div><span>${d}</span></div>`).join("");
    const tagsHtml    = emp.tags.map(t => `<span class="emp-tag">${t}</span>`).join("");
    const personHtml  = emp.personality.map(p =>
      `<span class="badge" style="background:${c1}18;color:${c1};font-size:10px;margin-right:4px">${p}</span>`).join("");

    const totalContrib = emp.contribution.reduce((a,b) => a+b, 0);

    const card = document.createElement("div");
    card.className = "emp-card";
    card.innerHTML = `
      <div class="emp-card-top">
        <div class="emp-avatar" style="background:linear-gradient(135deg,${c1},${c2})">
          <span class="emp-avatar-emoji">${emp.emoji}</span>
        </div>
        <div class="emp-meta">
          <span class="emp-role-badge" style="background:${c1}18;color:${c1}">${emp.role} — ${emp.roleJa}</span>
          <div class="emp-name">${emp.name}</div>
          <div class="emp-name-en">${emp.nameEn} / ${emp.age}歳 / ${emp.dept}</div>
          <div style="margin-bottom:6px">${personHtml}</div>
          <div class="emp-tags">${tagsHtml}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px">年間貢献</div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:${c1}">${totalContrib}万円</div>
          <div style="font-size:10px;color:var(--muted)">${emp.email}</div>
        </div>
      </div>
      <div class="emp-card-body">
        <div>
          <div class="emp-section-title">月次売上貢献（万円）</div>
          <div class="sparkline-wrap"><canvas id="spark-${emp.id}" height="40"></canvas></div>
        </div>
        <div>
          <div class="emp-section-title">スキルレベル</div>
          ${skillsHtml}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div class="emp-section-title" style="color:var(--up)">強み（メリット）</div>
            <div class="md-list">${meritHtml}</div>
          </div>
          <div>
            <div class="emp-section-title" style="color:var(--down)">課題（デメリット）</div>
            <div class="md-list">${demeritHtml}</div>
          </div>
        </div>
        <div>
          <div class="emp-section-title">夢・ビジョン</div>
          <div class="dream-box">${emp.dream}</div>
        </div>
        <div class="quote-box">${emp.quote}</div>
      </div>`;

    grid.appendChild(card);

    requestAnimationFrame(() => {
      const ctx = document.getElementById(`spark-${emp.id}`);
      if (!ctx) return;
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: MONTHS_SHORT,
          datasets: [{
            data: emp.contribution,
            backgroundColor: emp.contribution.map((_, i) =>
              i === emp.contribution.length - 1 ? c1 : `${c1}55`),
            borderRadius: 3, borderSkipped: false,
          }],
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:ctx=>` ${ctx.raw}万円` } } },
          scales: {
            x:{ display:true, ticks:{color:"#8e8e93",font:{size:8}}, grid:{display:false} },
            y:{ display:false },
          },
        },
      });
    });
  });
}

// ── Agent Log ─────────────────────────────────────
async function renderAgentLog() {
  const logs = await apiFetch("/api/agent-logs",
    typeof AGENT_LOG !== "undefined" ? AGENT_LOG : []);
  const el = document.getElementById("agentLog");
  logs.forEach(log => {
    const scoreColor = log.score >= .8 ? "var(--up)" : log.score >= .6 ? "var(--warn)" : "var(--down)";
    const sb = log.status === "completed" ? "badge-green" : "badge-red";
    const tags = log.agents.map(a => `<span class="agent-tag">${a}</span>`).join("");
    el.innerHTML += `
      <div class="log-row">
        <span class="log-ts">${log.ts}</span>
        <div>
          <div class="log-task">${log.task}</div>
          <div class="log-agents">${tags}</div>
        </div>
        <span class="badge ${sb}">${log.status==="completed"?"完了":"失敗"}</span>
        <div class="score-wrap">
          <div class="score-bar">
            <div class="score-fill" style="width:${log.score*100}%;background:${scoreColor}"></div>
          </div>
          <div class="score-text">${(log.score*100).toFixed(0)}%</div>
        </div>
      </div>`;
  });
}

// ── Pipeline Runner UI ────────────────────────────
function renderPipelineRunner() {
  const agentsSection = document.getElementById("agents");
  if (!agentsSection) return;

  const runner = document.createElement("div");
  runner.className = "card";
  runner.style.marginTop = "14px";
  runner.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">マーケティングパイプライン実行</div>
        <div class="card-sub">課題を入力してAIエージェントを起動</div>
      </div>
      <span class="badge ${API_BASE ? "badge-green" : "badge-gray"}">${API_BASE ? "APIオンライン" : "スタンドアロン"}</span>
    </div>
    <div style="padding:16px 20px;display:flex;gap:10px">
      <input id="pipelineInput" type="text"
        placeholder="例: 新規SaaS製品のマーケティング戦略を立てたい"
        style="flex:1;padding:10px 14px;border:1px solid var(--border);border-radius:10px;
               font-size:13px;font-family:inherit;outline:none;background:var(--hover);color:var(--text)">
      <button id="pipelineBtn" onclick="submitPipeline()"
        style="padding:10px 20px;background:var(--accent);color:white;border:none;
               border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;
               font-size:13px;cursor:pointer;white-space:nowrap;transition:opacity .15s">
        実行 →
      </button>
    </div>
    <div id="pipelineResult" style="padding:0 20px 16px;font-size:12px;color:var(--muted);display:none"></div>`;

  agentsSection.appendChild(runner);
}

async function submitPipeline() {
  const input = document.getElementById("pipelineInput");
  const btn   = document.getElementById("pipelineBtn");
  const result = document.getElementById("pipelineResult");
  const task  = input.value.trim();
  if (!task) return;

  if (!API_BASE) {
    result.style.display = "block";
    result.innerHTML = `<span style="color:var(--warn)">⚠ APIサーバーが起動していません。<br>
      <code>uvicorn api.main:app --reload --port 8000</code> を実行してから試してください。</span>`;
    return;
  }

  btn.textContent = "実行中…";
  btn.disabled = true;
  result.style.display = "block";
  result.innerHTML = `<span style="color:var(--muted)">⏳ エージェントパイプライン起動中...</span>`;

  try {
    const res = await fetch(`${API_BASE}/api/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
    });
    const job = await res.json();
    result.innerHTML = `<span style="color:var(--up)">✓ ジョブ開始 (ID: ${job.job_id})<br>
      ログは <code>logs/pipeline_${job.job_id}.json</code> に保存されます。</span>`;

    // ポーリング
    const poll = setInterval(async () => {
      const s = await fetch(`${API_BASE}/api/pipeline/status/${job.job_id}`).then(r=>r.json());
      if (s.status !== "running") {
        clearInterval(poll);
        result.innerHTML = s.status === "completed"
          ? `<span style="color:var(--up)">✅ 完了！ログを確認してください: logs/pipeline_${job.job_id}.json</span>`
          : `<span style="color:var(--down)">❌ 失敗: ${s.error || "不明なエラー"}</span>`;
        btn.textContent = "実行 →";
        btn.disabled = false;
      }
    }, 3000);
  } catch(e) {
    result.innerHTML = `<span style="color:var(--down)">❌ エラー: ${e.message}</span>`;
    btn.textContent = "実行 →";
    btn.disabled = false;
  }
}

// ── Modal helpers ────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// 背景クリックで閉じる
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) {
    e.target.classList.remove('open');
  }
});

// ── 受注フォーム ──────────────────────────────────
function openOrderForm() {
  // 今日の日付をデフォルトセット
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('orderMsg').textContent = '';
  openModal('orderModal');
}

async function submitOrder() {
  const client = document.getElementById('f-client').value.trim();
  const amount = parseInt(document.getElementById('f-amount').value);
  const msg    = document.getElementById('orderMsg');

  if (!client) { msg.style.color = 'var(--down)'; msg.textContent = '取引先名を入力してください'; return; }
  if (!amount || amount <= 0) { msg.style.color = 'var(--down)'; msg.textContent = '金額を正しく入力してください'; return; }

  const body = {
    client,
    amount,
    date:   document.getElementById('f-date').value,
    agent:  document.getElementById('f-agent').value,
    status: document.getElementById('f-status').value,
    note:   document.getElementById('f-note').value,
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const order = await res.json();
    msg.style.color = 'var(--up)';
    msg.textContent = `✓ ${order.id} を登録しました`;
    // テーブルを再描画
    document.getElementById('ordersTable').innerHTML = '';
    await renderOrders();
    setTimeout(() => closeModal('orderModal'), 1200);
  } catch(e) {
    msg.style.color = 'var(--down)';
    msg.textContent = `エラー: ${e.message}`;
  }
}

// ── CSVインポート ──────────────────────────────────
let _csvFile = null;

function openCsvImport() {
  _csvFile = null;
  document.getElementById('csvFileName').textContent = 'CSVファイルを選択';
  document.getElementById('csvImportBtn').disabled = true;
  document.getElementById('csvMsg').textContent = '';
  document.getElementById('csvFile').value = '';
  openModal('csvModal');
}

function onCsvSelect(e) {
  _csvFile = e.target.files[0];
  if (_csvFile) {
    document.getElementById('csvFileName').textContent = _csvFile.name;
    document.getElementById('csvImportBtn').disabled = false;
  }
}

// ドラッグ＆ドロップ
const csvDrop = document.getElementById('csvDrop');
if (csvDrop) {
  csvDrop.addEventListener('dragover', e => { e.preventDefault(); csvDrop.classList.add('drag'); });
  csvDrop.addEventListener('dragleave', () => csvDrop.classList.remove('drag'));
  csvDrop.addEventListener('drop', e => {
    e.preventDefault(); csvDrop.classList.remove('drag');
    const f = e.dataTransfer.files[0];
    if (f) { _csvFile = f; document.getElementById('csvFileName').textContent = f.name;
             document.getElementById('csvImportBtn').disabled = false; }
  });
}

async function submitCsv() {
  if (!_csvFile) return;
  const msg = document.getElementById('csvMsg');
  const fd  = new FormData();
  fd.append('file', _csvFile);

  try {
    const res = await fetch(`${API_BASE}/api/import/orders-csv`, { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '不明なエラー');
    }
    const data = await res.json();
    msg.style.color = 'var(--up)';
    msg.textContent = `✓ ${data.imported} 件インポートしました`;
    document.getElementById('ordersTable').innerHTML = '';
    await renderOrders();
    setTimeout(() => closeModal('csvModal'), 1500);
  } catch(e) {
    msg.style.color = 'var(--down)';
    msg.textContent = `エラー: ${e.message}`;
  }
}

// ── 設定パネル ────────────────────────────────────
async function openSettings() {
  openModal('settingsModal');
  document.getElementById('settingsMsg').textContent = '';

  // 現在の設定を読み込む
  if (API_BASE) {
    try {
      const s = await fetch(`${API_BASE}/api/settings`).then(r => r.json());
      document.getElementById('s-name').value    = s.company_name    || '';
      document.getElementById('s-name-ja').value = s.company_name_ja || '';
      document.getElementById('s-location').value = s.location       || '';
    } catch {}

    // Pipeline status
    try {
      const p = await fetch(`${API_BASE}/api/pipeline/check`).then(r => r.json());
      const el = document.getElementById('pipelineStatus');
      if (p.ready) {
        el.style.background = 'rgba(48,209,88,.1)';
        el.style.color = 'var(--up)';
        el.innerHTML = `✓ Claude API 接続済み — モデル: <strong>${p.model}</strong>`;
      } else {
        el.style.background = 'rgba(255,59,48,.08)';
        el.style.color = 'var(--down)';
        el.textContent = `✗ ${p.message}`;
      }
      document.getElementById('s-model').value = p.model || 'claude-sonnet-4-6';
    } catch {}
  }
}

async function submitSettings() {
  const body = {
    company_name:    document.getElementById('s-name').value.trim(),
    company_name_ja: document.getElementById('s-name-ja').value.trim(),
    location:        document.getElementById('s-location').value.trim(),
  };
  const msg = document.getElementById('settingsMsg');

  try {
    await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // 画面の会社名を即時反映
    if (body.company_name) {
      document.getElementById('companyName').textContent = body.company_name;
      document.getElementById('pageTitle').textContent   = `${body.company_name} — Operations Dashboard`;
    }
    msg.style.color = 'var(--up)';
    msg.textContent = '✓ 保存しました';
    setTimeout(() => closeModal('settingsModal'), 1000);
  } catch(e) {
    msg.style.color = 'var(--down)';
    msg.textContent = `エラー: ${e.message}`;
  }
}

// ── Auth UI ───────────────────────────────────────
function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  location.replace("/login.html");
}

function renderUserBadge() {
  const el = document.getElementById("sidebarUser");
  if (!el || !_user) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:28px;height:28px;border-radius:8px;
                  background:linear-gradient(135deg,var(--accent),#af52de);
                  display:flex;align-items:center;justify-content:center;
                  font-size:11px;font-weight:700;color:white;flex-shrink:0">
        ${(_user.name||"?").charAt(0)}
      </div>
      <div style="min-width:0">
        <div style="font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_user.name||""}</div>
        <div style="font-size:9px;color:var(--muted)">${_user.role_ja||_user.role||""}</div>
      </div>
    </div>`;
}

// ── Bootstrap ─────────────────────────────────────
(async () => {
  renderUserBadge();
  // 会社名
  try {
    const company = await apiFetch("/api/company",
      typeof COMPANY !== "undefined" ? COMPANY : { name: "TBD Inc." });
    document.getElementById("companyName").textContent = company.name || company.name_ja || "TBD Inc.";
  } catch {}

  // 並列レンダリング
  await Promise.all([
    renderKPI(),
    renderTrend(),
    renderOrders(),
    renderSnga(),
    renderForecast(),
    renderEmployees(),
    renderAgentLog(),
  ]);

  renderPipelineRunner();
})();
