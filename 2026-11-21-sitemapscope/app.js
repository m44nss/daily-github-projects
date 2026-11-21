/* Demo XML is intentionally embedded so the app works without a network request. */
const DEMO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-11-10</lastmod>
  </url>
  <url>
    <loc>https://example.com/about/</loc>
    <lastmod>2026-10-02</lastmod>
  </url>
  <url>
    <loc>https://example.com/products/?ref=main-nav</loc>
    <lastmod>2026-11-18</lastmod>
  </url>
  <url>
    <loc>http://example.com/legacy-page/</loc>
    <lastmod>2024-01-15</lastmod>
  </url>
  <url>
    <loc>https://example.com/blog/launch-notes/</loc>
  </url>
  <url>
    <loc>https://example.com/about/</loc>
    <lastmod>2026-10-02</lastmod>
  </url>
  <url>
    <loc>ht!tp://broken-location</loc>
  </url>
  <url>
    <loc>https://example.com/contact/</loc>
    <lastmod>2026-11-20</lastmod>
  </url>
</urlset>`;


(() => {
  'use strict';

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const state = { entries: [], sourceName: '', filter: 'all', search: '', sort: 'url' };
  const $ = (selector) => document.querySelector(selector);
  const fileInput = $('#file-input');
  const resultsBody = $('#results-body');
  const toast = $('#toast');
  let toastTimer;

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function parseXML(xmlText, sourceName) {
    const documentXML = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (documentXML.querySelector('parsererror')) {
      throw new Error('This file is not valid XML. Check the file and try again.');
    }

    const root = documentXML.documentElement;
    const rootName = root?.localName?.toLowerCase();
    if (!['urlset', 'sitemapindex'].includes(rootName)) {
      throw new Error('Expected a <urlset> or <sitemapindex> XML document.');
    }

    const isIndex = rootName === 'sitemapindex';
    const itemTag = isIndex ? 'sitemap' : 'url';
    const items = Array.from(documentXML.getElementsByTagNameNS('*', itemTag));
    const entries = items.map((item, index) => {
      const locNode = Array.from(item.children).find((node) => node.localName.toLowerCase() === 'loc');
      const dateNode = Array.from(item.children).find((node) => node.localName.toLowerCase() === 'lastmod');
      return analyzeEntry(index + 1, locNode?.textContent?.trim() || '', dateNode?.textContent?.trim() || '', isIndex ? 'Child sitemap' : 'URL');
    });

    if (!entries.length) throw new Error('No <url> or <sitemap> entries were found in this XML file.');

    const counts = new Map();
    entries.forEach((entry) => {
      if (entry.normalized) counts.set(entry.normalized, (counts.get(entry.normalized) || 0) + 1);
    });
    entries.forEach((entry) => {
      entry.duplicate = Boolean(entry.normalized && counts.get(entry.normalized) > 1);
      entry.flags = buildFlags(entry);
    });

    return { entries, sourceName, type: isIndex ? 'sitemap index' : 'URL sitemap' };
  }

  function analyzeEntry(index, rawURL, lastmod, kind) {
    let parsed = null;
    try {
      parsed = new URL(rawURL);
      if (!['http:', 'https:'].includes(parsed.protocol)) parsed = null;
    } catch (_) {
      parsed = null;
    }
    const normalized = parsed ? `${parsed.origin}${parsed.pathname}${parsed.search}` : '';
    const lastmodDate = lastmod ? new Date(lastmod) : null;
    const validLastmod = Boolean(lastmodDate && !Number.isNaN(lastmodDate.getTime()));
    const ageDays = validLastmod ? Math.floor((Date.now() - lastmodDate.getTime()) / 86400000) : null;
    return {
      index, rawURL, lastmod, kind, parsed, normalized,
      duplicate: false,
      query: Boolean(parsed?.search),
      http: parsed?.protocol === 'http:',
      missing: !lastmod,
      invalid: !parsed,
      validLastmod,
      stale: validLastmod && ageDays > 365,
      ageDays
    };
  }

  function buildFlags(entry) {
    const flags = [];
    if (entry.duplicate) flags.push(['Duplicate', 'duplicate']);
    if (entry.query) flags.push(['Query string', 'query']);
    if (entry.http) flags.push(['HTTP', 'http']);
    if (entry.invalid) flags.push(['Invalid URL', 'invalid']);
    if (entry.missing) flags.push(['Missing lastmod', 'missing']);
    else if (!entry.validLastmod) flags.push(['Invalid lastmod', 'missing']);
    if (entry.stale) flags.push(['Old lastmod', 'stale']);
    return flags;
  }

  function getFilteredEntries() {
    const query = state.search.trim().toLowerCase();
    let rows = state.entries.filter((entry) => {
      const matchesSearch = !query || entry.rawURL.toLowerCase().includes(query) || entry.lastmod.toLowerCase().includes(query);
      let matchesFilter = true;
      switch (state.filter) {
        case 'issues': matchesFilter = entry.flags.length > 0; break;
        case 'duplicate': matchesFilter = entry.duplicate; break;
        case 'query': matchesFilter = entry.query; break;
        case 'http': matchesFilter = entry.http; break;
        case 'missing': matchesFilter = entry.missing || (entry.lastmod && !entry.validLastmod); break;
        case 'invalid': matchesFilter = entry.invalid; break;
        case 'stale': matchesFilter = entry.stale; break;
      }
      return matchesSearch && matchesFilter;
    });

    rows.sort((a, b) => {
      if (state.sort === 'newest' || state.sort === 'oldest') {
        const aTime = a.validLastmod ? new Date(a.lastmod).getTime() : (state.sort === 'newest' ? -Infinity : Infinity);
        const bTime = b.validLastmod ? new Date(b.lastmod).getTime() : (state.sort === 'newest' ? -Infinity : Infinity);
        return state.sort === 'newest' ? bTime - aTime : aTime - bTime;
      }
      if (state.sort === 'issues') return b.flags.length - a.flags.length || a.index - b.index;
      return a.rawURL.localeCompare(b.rawURL);
    });
    return rows;
  }

  function formatDate(entry) {
    if (!entry.lastmod) return '<span class="date-main">Not provided</span>';
    if (!entry.validLastmod) return `<span class="date-main">${escapeHTML(entry.lastmod)}</span><span class="date-age">Unrecognized date</span>`;
    const date = new Date(entry.lastmod);
    const label = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    let age = 'Today';
    if (entry.ageDays > 1) age = `${entry.ageDays} days ago`;
    else if (entry.ageDays === 1) age = 'Yesterday';
    else if (entry.ageDays < 0) age = 'Future date';
    return `<span class="date-main">${escapeHTML(label)}</span><span class="date-age">${escapeHTML(age)}</span>`;
  }

  function renderRows() {
    if (!state.entries.length) {
      resultsBody.innerHTML = '<tr class="empty-row"><td colspan="5"><div class="empty-state"><div class="empty-icon">⌁</div><strong>Your URL inventory will appear here</strong><span>Upload an XML sitemap or explore the demo to get started.</span></div></td></tr>';
      return;
    }

    const rows = getFilteredEntries();
    if (!rows.length) {
      resultsBody.innerHTML = '<tr class="empty-row"><td colspan="5"><div class="empty-state"><div class="empty-icon">⌕</div><strong>No matching entries</strong><span>Try another filter or clear your search.</span></div></td></tr>';
      return;
    }

    resultsBody.innerHTML = rows.map((entry) => {
      const urlMarkup = entry.parsed
        ? `<a class="url-main" href="${escapeHTML(entry.parsed.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(entry.rawURL)}</a>`
        : `<span class="url-main">${escapeHTML(entry.rawURL || '(empty location)')}</span>`;
      const flags = entry.flags.length
        ? entry.flags.map(([label, type]) => `<span class="flag flag-${type}">${escapeHTML(label)}</span>`).join('')
        : '<span class="flag flag-clean">Looks clean</span>';
      return `<tr>
        <td class="row-number">${entry.index.toString().padStart(2, '0')}</td>
        <td class="url-cell">${urlMarkup}<span class="url-kind">${escapeHTML(entry.kind)}</span></td>
        <td>${formatDate(entry)}</td>
        <td><div class="badges">${flags}</div></td>
        <td><button class="copy-button" type="button" data-copy="${entry.index}" aria-label="Copy URL ${entry.index}">Copy</button></td>
      </tr>`;
    }).join('');
  }

  function renderStats() {
    const entries = state.entries;
    $('#stat-total').textContent = entries.length || '—';
    $('#stat-duplicates').textContent = entries.length ? entries.filter((entry) => entry.duplicate).length : '—';
    $('#stat-queries').textContent = entries.length ? entries.filter((entry) => entry.query).length : '—';
    $('#stat-http').textContent = entries.length ? entries.filter((entry) => entry.http).length : '—';
    $('#stat-missing').textContent = entries.length ? entries.filter((entry) => entry.missing || (entry.lastmod && !entry.validLastmod)).length : '—';
    const visible = getFilteredEntries().length;
    $('#results-caption').textContent = entries.length ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} parsed · ${entries.filter((entry) => entry.flags.length).length} with at least one flag` : 'Load a sitemap to inspect its entries.';
    $('#visible-count').textContent = entries.length ? `Showing ${visible} of ${entries.length} entries` : 'Waiting for a sitemap';
    $('#source-name').textContent = state.sourceName || 'No sitemap loaded';
    $('#source-pill').title = state.sourceName || '';
    ['#search-input', '#filter-select', '#sort-select', '#export-button', '#clear-button'].forEach((selector) => { $(selector).disabled = !entries.length; });
  }

  function render() { renderStats(); renderRows(); }

  function loadXML(xmlText, sourceName) {
    const parsed = parseXML(xmlText, sourceName);
    state.entries = parsed.entries;
    state.sourceName = `${sourceName} · ${parsed.type}`;
    state.filter = 'all';
    state.search = '';
    state.sort = 'url';
    $('#search-input').value = '';
    $('#filter-select').value = 'all';
    $('#sort-select').value = 'url';
    render();
    notify(`Loaded ${parsed.entries.length} ${parsed.type === 'URL sitemap' ? 'locations' : 'child sitemaps'}.`);
  }

  function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportCSV() {
    const rows = getFilteredEntries();
    if (!rows.length) return notify('There are no rows to export.');
    const header = ['URL', 'Last modified', 'Type', 'Duplicate', 'Query string', 'HTTP', 'Invalid URL', 'Missing/invalid lastmod', 'Older than 1 year'];
    const lines = rows.map((entry) => [entry.rawURL, entry.lastmod, entry.kind, entry.duplicate, entry.query, entry.http, entry.invalid, entry.missing || (entry.lastmod && !entry.validLastmod), entry.stale].map(csvCell).join(','));
    downloadFile(`\uFEFF${[header.map(csvCell).join(','), ...lines].join('\r\n')}`, 'sitemapscope-report.csv', 'text/csv;charset=utf-8');
    notify(`Exported ${rows.length} rows to CSV.`);
  }

  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const temporary = document.createElement('textarea');
        temporary.value = value;
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand('copy');
        temporary.remove();
        if (!copied) throw new Error('Copy was blocked');
      }
      notify('URL copied to clipboard.');
    } catch (_) { notify('Could not copy automatically. Select the URL to copy it.'); }
  }

  $('#choose-file-button').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      notify('File is larger than 5 MB. Choose a smaller sitemap.');
      fileInput.value = '';
      return;
    }
    try { loadXML(await file.text(), file.name); }
    catch (error) { notify(error.message || 'Unable to read this XML file.'); }
    fileInput.value = '';
  });

  $('#load-demo-button').addEventListener('click', () => {
    try { loadXML(DEMO_XML, 'demo-sitemap.xml'); }
    catch (error) { notify(error.message); }
  });
  $('#search-input').addEventListener('input', (event) => { state.search = event.target.value; render(); });
  $('#filter-select').addEventListener('change', (event) => { state.filter = event.target.value; render(); });
  $('#sort-select').addEventListener('change', (event) => { state.sort = event.target.value; render(); });
  $('#export-button').addEventListener('click', exportCSV);
  $('#clear-button').addEventListener('click', () => {
    state.entries = []; state.sourceName = ''; state.search = ''; state.filter = 'all'; state.sort = 'url';
    $('#search-input').value = ''; $('#filter-select').value = 'all'; $('#sort-select').value = 'url';
    render(); notify('Analysis cleared. Your original file was not changed.');
  });
  resultsBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const entry = state.entries.find((item) => item.index === Number(button.dataset.copy));
    if (entry?.rawURL) copyText(entry.rawURL);
  });

  render();
})();
