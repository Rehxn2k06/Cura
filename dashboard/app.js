/**
 * app.js  (v2 — 6 services, IF + LSTM dual scores)
 * Polls /state every 3 seconds and updates UI reactively.
 */

const API_BASE = '';
const POLL_INTERVAL = 3000;

const SERVICE_ICONS = {
  'frontend-service':  '🌐',
  'catalogue-service': '📦',
  'cart-service':      '🛒',
  'order-service':     '📋',
  'payment-service':   '💳',
  'database-service':  '🗄️',
};

// Two request paths for the graph visual
const GRAPH_ROW_CATALOGUE = ['frontend-service', 'catalogue-service', 'database-service'];
const GRAPH_ROW_ORDER     = ['frontend-service', 'cart-service', 'order-service', 'payment-service', 'database-service'];

let currentRootCause = null;
let anomalousServices = new Set();

// ─── Polling ─────────────────────────────────────────────────────────────────

async function fetchState() {
  try {
    const res = await fetch(`${API_BASE}/state`);
    if (!res.ok) return;
    const data = await res.json();
    updateAll(data);
  } catch (e) {
    console.warn('[AIOps] Fetch failed:', e.message);
  }
}

async function fetchAudit() {
  try {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) return;
    const { audit_log } = await res.json();
    renderAuditLog(audit_log);
  } catch (e) {}
}

// ─── Master update ────────────────────────────────────────────────────────────

function updateAll(data) {
  const { status, metrics, anomalies, rca, decision, graph } = data;

  updateBadge(status);

  document.getElementById('cycle-count').textContent = status.cycle_count;
  const anomCount = Object.values(anomalies).filter(a => a.is_anomaly).length;
  document.getElementById('anomaly-count').textContent = anomCount;
  document.getElementById('last-rca').textContent = rca.root_cause
    ? shortName(rca.root_cause) : '—';
  document.getElementById('confidence-stat').textContent = rca.root_cause
    ? `${(rca.confidence * 100).toFixed(0)}%` : '—';

  anomalousServices = new Set(
    Object.entries(anomalies).filter(([, v]) => v.is_anomaly).map(([k]) => k)
  );
  currentRootCause = rca.root_cause;

  renderServiceCards(metrics, anomalies);
  renderRCA(rca, decision);
  if (graph) renderGraph(graph, anomalies, rca.root_cause);
}

// ─── Header Badge ─────────────────────────────────────────────────────────────

function updateBadge(status) {
  const dot = document.getElementById('pulse-dot');
  const text = document.getElementById('badge-text');
  const injectBtn = document.getElementById('btn-inject');
  const clearBtn = document.getElementById('btn-clear');

  if (status.failure_active) {
    dot.className = 'pulse-dot failure';
    text.textContent = `⚠️ FAILURE MODE — ${status.failure_services.map(shortName).join(', ')}`;
    injectBtn.style.display = 'none';
    clearBtn.style.display = '';
  } else {
    dot.className = 'pulse-dot';
    text.textContent = status.running ? 'Pipeline Running' : 'Pipeline Stopped';
    injectBtn.style.display = '';
    clearBtn.style.display = 'none';
  }
}

// ─── Service Cards ─────────────────────────────────────────────────────────────

function renderServiceCards(metrics, anomalies) {
  const row = document.getElementById('services-row');
  if (!metrics || metrics.length === 0) return;

  const byService = {};
  metrics.forEach(m => { byService[m.service] = m; });

  const cards = Object.keys(SERVICE_ICONS).map(svc => {
    const m = byService[svc] || {};
    const anom = anomalies[svc] || { anomaly_score: 0, if_score: 0, lstm_score: 0, is_anomaly: false };
    const score = anom.anomaly_score || 0;
    const ifScore = anom.if_score || 0;
    const lstmScore = anom.lstm_score || 0;
    const isAnom = anom.is_anomaly;

    const cardClass = isAnom ? 'service-card anomaly' : 'service-card';
    const badgeClass = isAnom ? 'svc-badge anomaly' : 'svc-badge';
    const badgeText = isAnom ? 'ANOMALY' : 'NORMAL';
    const scoreClass = isAnom ? 'score-value anomaly' : (score > 0.4 ? 'score-value warning' : 'score-value');
    const ifClass = ifScore > 0.5 ? 'signal-val if-high' : 'signal-val';
    const lstmClass = lstmScore > 0.5 ? 'signal-val lstm-high' : 'signal-val';

    const cpu = (m.cpu || 0).toFixed(1);
    const mem = (m.memory || 0).toFixed(1);
    const lat = (m.latency || 0).toFixed(0);
    const err = ((m.error_rate || 0) * 100).toFixed(2);
    const thr = (m.throughput || 0).toFixed(0);

    const cpuHigh  = m.cpu > 70 ? 'high' : '';
    const latHigh  = m.latency > 200 ? 'high' : '';
    const errHigh  = m.error_rate > 0.1 ? 'high' : '';

    return `
      <div class="${cardClass}">
        <div class="svc-header">
          <div class="svc-name">${SERVICE_ICONS[svc]} ${shortName(svc)}</div>
          <div class="${badgeClass}">${badgeText}</div>
        </div>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">CPU</div>
            <div class="metric-value">${cpu}%</div>
            <div class="metric-bar"><div class="metric-bar-fill ${cpuHigh}" style="width:${Math.min(cpu,100)}%"></div></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Memory</div>
            <div class="metric-value">${mem}%</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width:${Math.min(mem,100)}%"></div></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Latency</div>
            <div class="metric-value">${lat}ms</div>
            <div class="metric-bar"><div class="metric-bar-fill ${latHigh}" style="width:${Math.min(lat/15,100)}%"></div></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Error Rate</div>
            <div class="metric-value">${err}%</div>
            <div class="metric-bar"><div class="metric-bar-fill ${errHigh}" style="width:${Math.min(err*5,100)}%"></div></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Throughput</div>
            <div class="metric-value">${thr} r/s</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width:${Math.min(thr/10,100)}%"></div></div>
          </div>
        </div>
        <div class="anomaly-score-row">
          <div class="score-main-row">
            <div class="score-label">Ensemble Score</div>
            <div class="${scoreClass}">${score.toFixed(3)}</div>
          </div>
          <div class="signal-row">
            <div class="signal-item">
              <span class="signal-label">IF</span>
              <span class="${ifClass}">${ifScore.toFixed(3)}</span>
            </div>
            <div class="signal-item">
              <span class="signal-label">LSTM</span>
              <span class="${lstmClass}">${lstmScore.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>`;
  });

  row.innerHTML = cards.join('');
}

// ─── RCA Panel ────────────────────────────────────────────────────────────────

function renderRCA(rca, decision) {
  const box = document.getElementById('rca-box');
  if (!rca.root_cause) {
    box.innerHTML = `<div class="no-data">✅ No anomalies — System is healthy</div>`;
    return;
  }

  const pct = (rca.confidence * 100).toFixed(1);
  const chainNodes = rca.anomalous_services.map(s => {
    const isRoot = s === rca.root_cause;
    return `<span class="chain-node ${isRoot ? 'root-node' : ''}">${SERVICE_ICONS[s] || '●'} ${shortName(s)}</span>`;
  }).join(' → ');

  const actionHtml = decision && decision.action !== 'no_action' ? `
    <div class="decision-box">
      <div class="action-badge">${decision.action.replace(/_/g, ' ')}</div>
      <div class="decision-desc">${decision.description}</div>
    </div>` : '';

  box.innerHTML = `
    <div class="rca-root">⚠️ ${shortName(rca.root_cause)}</div>
    <div class="rca-confidence">
      <div class="confidence-bar">
        <div class="confidence-fill" style="width:${pct}%"></div>
      </div>
      <div class="confidence-pct">${pct}%</div>
    </div>
    <div class="rca-explanation">${rca.explanation}</div>
    <div class="rca-chain">${chainNodes}</div>
    ${actionHtml}
  `;
}

// ─── Dependency Graph ─────────────────────────────────────────────────────────

function renderGraph(graph, anomalies, rootCause) {
  const container = document.getElementById('graph-visual');

  function makeRow(chain, label) {
    const parts = chain.map((svc, i) => {
      const isAnomaly = anomalies[svc] && anomalies[svc].is_anomaly;
      const isRoot = svc === rootCause;
      const circleClass = isRoot     ? 'node-circle root-node-circle'  :
                          isAnomaly  ? 'node-circle anomaly-node'       : 'node-circle';
      const arrow = i < chain.length - 1 ? `<div class="graph-arrow">→</div>` : '';
      return `
        <div class="graph-node">
          <div class="${circleClass}">${SERVICE_ICONS[svc] || '●'}</div>
          <div class="node-label">${shortName(svc)}</div>
        </div>
        ${arrow}`;
    });
    return `
      <div class="graph-row">
        <div class="graph-row-label">${label}</div>
        ${parts.join('')}
      </div>`;
  }

  container.innerHTML = `
    <div class="graph-rows">
      ${makeRow(GRAPH_ROW_CATALOGUE, 'Catalogue')}
      ${makeRow(GRAPH_ROW_ORDER,     'Orders')}
    </div>`;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

function renderAuditLog(logs) {
  const list = document.getElementById('audit-list');
  if (!logs || logs.length === 0) {
    list.innerHTML = '<div class="no-data">No actions yet</div>';
    return;
  }

  const entries = [...logs].reverse().slice(0, 20).map(entry => {
    const ts = new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false });
    const svc = entry.target_service ? shortName(entry.target_service) : '—';
    const dryTag = entry.dry_run ? `<span class="audit-dry-run">DRY-RUN</span>` : '';
    return `
      <div class="audit-entry">
        <div class="audit-action">${entry.action.replace(/_/g, ' ')}</div>
        <div class="audit-service">${SERVICE_ICONS[entry.target_service] || ''} ${svc} ${dryTag}</div>
        <div class="audit-ts">${ts}</div>
      </div>`;
  });

  list.innerHTML = entries.join('');
}

// ─── Actions ─────────────────────────────────────────────────────────────────

async function injectFailure() {
  try {
    await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        services: Object.keys(SERVICE_ICONS),
        duration_s: 60,
      }),
    });
  } catch (e) { console.error(e); }
}

async function clearFailure() {
  try {
    await fetch(`${API_BASE}/clear`, { method: 'POST' });
  } catch (e) { console.error(e); }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function shortName(svc) {
  if (!svc) return '—';
  return svc.replace('-service', '')
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

(function init() {
  fetchState();
  fetchAudit();
  setInterval(fetchState, POLL_INTERVAL);
  setInterval(fetchAudit, POLL_INTERVAL + 500);
})();
