import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Temporary read-only dashboard for manually inspecting meeting mappings,
 * summary retrieval status and processing logs during development.
 * Not intended for production use.
 */
export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.type('text/html').send(DASHBOARD_HTML);
  });
}

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Zoom CRM POC - Dashboard</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; background: #f5f6f8; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p.subtitle { color: #666; margin-top: 0; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 13px; vertical-align: top; }
  th { background: #fafafa; position: sticky; top: 0; }
  tr:hover { background: #fbfbfd; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .badge-success { background: #e3f7e8; color: #1a7f37; }
  .badge-pending { background: #fff4e5; color: #b95000; }
  .badge-failure { background: #fdeaea; color: #c0392b; }
  .badge-none { background: #eee; color: #666; }
  .muted { color: #999; }
  .summary-cell { max-width: 320px; white-space: pre-wrap; word-break: break-word; }
  #refresh { margin-bottom: 12px; }
  button { cursor: pointer; padding: 6px 14px; border-radius: 6px; border: 1px solid #ccc; background: #fff; }
  button:hover { background: #f0f0f0; }
</style>
</head>
<body>
  <h1>Zoom CRM POC — Meeting Dashboard</h1>
  <p class="subtitle">Temporary internal view: meeting details, CRM mapping, summary retrieval and processing status.</p>
  <div id="refresh"><button onclick="loadData()">Refresh</button> <span id="status" class="muted"></span></div>
  <table>
    <thead>
      <tr>
        <th>Meeting</th>
        <th>Host</th>
        <th>Start Time</th>
        <th>CRM Mapping</th>
        <th>Summary Status</th>
        <th>Latest Summary</th>
        <th>Processing Log</th>
      </tr>
    </thead>
    <tbody id="rows">
      <tr><td colspan="7" class="muted">Loading...</td></tr>
    </tbody>
  </table>

<script>
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function summaryBadge(meeting) {
  if (meeting.summaryRetrieved) {
    return '<span class="badge badge-success">Fetched</span>';
  }
  var lastLog = (meeting.logs || [])[0];
  if (lastLog && lastLog.status === 'FAILURE') {
    return '<span class="badge badge-failure">Failed</span>';
  }
  if (lastLog && lastLog.status === 'IN_PROGRESS') {
    return '<span class="badge badge-pending">In Progress</span>';
  }
  if (String(meeting.id || '').indexOf('mapping-') === 0) {
    return '<span class="badge badge-pending">Mapped, awaiting webhook</span>';
  }
  return '<span class="badge badge-none">Not fetched</span>';
}

function logBadge(log) {
  if (!log) return '<span class="muted">-</span>';
  var cls = log.status === 'SUCCESS' ? 'badge-success' : log.status === 'FAILURE' ? 'badge-failure' : 'badge-pending';
  var text = escapeHtml(log.step) + ': ' + escapeHtml(log.status);
  var extra = log.error ? '<br><span class="muted">' + escapeHtml(log.error) + '</span>' : '';
  return '<span class="badge ' + cls + '">' + text + '</span>' + extra;
}

function latestSummaryText(meeting) {
  var summaries = meeting.summaries || [];
  if (!summaries.length) return '<span class="muted">-</span>';
  var latest = summaries[summaries.length - 1];
  var text = latest.summary || '';
  if (text.length > 300) text = text.slice(0, 300) + '…';
  return escapeHtml(text);
}

function mappingText(mapping) {
  if (!mapping) return '<span class="muted">Not mapped</span>';
  var parts = [];
  if (mapping.crmLeadId) parts.push('CRM: ' + escapeHtml(mapping.crmLeadId));
  if (mapping.customerId) parts.push('Customer: ' + escapeHtml(mapping.customerId));
  if (mapping.calendarEventId) parts.push('Event: ' + escapeHtml(mapping.calendarEventId));
  return parts.join('<br>') || '<span class="muted">-</span>';
}

async function loadData() {
  var status = document.getElementById('status');
  var rows = document.getElementById('rows');
  status.textContent = 'Loading...';
  try {
    var res = await fetch('/meetings');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var meetings = await res.json();

    if (!meetings.length) {
      rows.innerHTML = '<tr><td colspan="7" class="muted">No meetings recorded yet.</td></tr>';
      status.textContent = 'Updated ' + new Date().toLocaleTimeString();
      return;
    }

    rows.innerHTML = meetings.map(function (meeting) {
      var lastLog = (meeting.logs || [])[0];
      return '<tr>' +
        '<td><strong>' + escapeHtml(meeting.topic || '(untitled)') + '</strong><br><span class="muted">' + escapeHtml(meeting.meetingId) + '</span></td>' +
        '<td>' + escapeHtml(meeting.hostId || '-') + '</td>' +
        '<td>' + (meeting.startTime ? new Date(meeting.startTime).toLocaleString() : '<span class="muted">-</span>') + '</td>' +
        '<td>' + mappingText(meeting.mapping) + '</td>' +
        '<td>' + summaryBadge(meeting) + '</td>' +
        '<td class="summary-cell">' + latestSummaryText(meeting) + '</td>' +
        '<td>' + logBadge(lastLog) + '</td>' +
        '</tr>';
    }).join('');

    status.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    rows.innerHTML = '<tr><td colspan="7" class="badge badge-failure">Failed to load: ' + escapeHtml(err.message) + '</td></tr>';
    status.textContent = '';
  }
}

loadData();
setInterval(loadData, 10000);
</script>
</body>
</html>`;
