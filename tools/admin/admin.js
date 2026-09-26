/* eslint-disable */
let entries = [];
    let config = { arcs: [], ifRoutes: [], characters: [], topics: [] };
    let currentId = null;
    let isExactDuplicate = false;
    let isDirty = false;
    let dupDebounceTimer = null;
    let tagDebounceTimer = null;
    const DRAFT_KEY = 'od_lagna_admin_draft';

    async function init() {
      await reloadConfigAndEntries();
      populateArcSelects();
      populateDaySelect();
      populateYearSelect();
      populateTriviaDaySelect();
      populateTriviaYearSelect();
      setupAutocomplete('characters', 'char-autocomplete', 'characters');
      setupAutocomplete('topics', 'topic-autocomplete', 'topics');
      setupAutocomplete('trivia-characters', 'trivia-char-autocomplete', 'characters');
      setupAutocomplete('trivia-topics', 'trivia-topic-autocomplete', 'topics');
      setupKeyboardShortcuts();
      
      // Check if draft exists
      if (!currentId && hasStoredDraft()) {
        showDraftBanner();
      } else {
        createNew();
      }

      if (!selectedTriviaId && hasStoredTriviaDraft()) {
        showTriviaDraftBanner();
      }
    }

    async function reloadConfigAndEntries() {
      const [cfgRes, listRes, triviaRes, storiesRes] = await Promise.all([
        fetch('/api/config').then(r => r.json()),
        fetch('/api/entries').then(r => r.json()),
        fetch('/api/trivia').then(r => r.json()).catch(() => []),
        fetch('/api/stories').then(r => r.json()).catch(() => [])
      ]);
      config = cfgRes;
      entries = listRes;
      if (Array.isArray(triviaRes)) allTrivia = triviaRes;
      document.getElementById('total-count').textContent = entries.length.toLocaleString() + ' Q&As';
      const navQna = document.getElementById('nav-qna-count');
      if (navQna) navQna.textContent = entries.length.toLocaleString();
      const navTrivia = document.getElementById('nav-trivia-count');
      if (navTrivia) navTrivia.textContent = allTrivia.length;
      const navStories = document.getElementById('nav-stories-count');
      if (navStories && Array.isArray(storiesRes)) navStories.textContent = storiesRes.length;
      renderTagClouds();
      renderTriviaTagClouds();
      renderEntryList();
      renderQnaFilterPanes();
      renderQnaActiveChips();
      renderTriviaList();
      renderTriviaFilterPanes();
      renderTriviaActiveChips();
    }

    function populateArcSelects() {
      const formSelect = document.getElementById('arc');
      formSelect.innerHTML = '<option value="general">General / No Story Spoilers</option>';
      
      const formArcs = document.createElement('optgroup');
      formArcs.label = 'Canonical Arcs';
      config.arcs.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.slug;
        opt.textContent = 'Arc ' + a.order + ': ' + a.name;
        formArcs.appendChild(opt);
      });
      formSelect.appendChild(formArcs);

      const formIf = document.createElement('optgroup');
      formIf.label = 'IF / What-If Timelines';
      config.ifRoutes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.slug;
        opt.textContent = r.name;
        formIf.appendChild(opt);
      });
      formSelect.appendChild(formIf);

      const filterSelect = document.getElementById('filter-arc');
      filterSelect.innerHTML = '<option value="">All Arcs &amp; IF Routes</option><option value="general">General / No Spoilers</option>';
      
      const filterArcs = document.createElement('optgroup');
      filterArcs.label = 'Canonical Arcs';
      config.arcs.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.slug;
        opt.textContent = 'Arc ' + a.order + ': ' + a.name;
        filterArcs.appendChild(opt);
      });
      filterSelect.appendChild(filterArcs);

      const filterIf = document.createElement('optgroup');
      filterIf.label = 'IF / What-If Timelines';
      config.ifRoutes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.slug;
        opt.textContent = r.name;
        filterIf.appendChild(opt);
      });
      filterSelect.appendChild(filterIf);
    }

    /* --- Q&A Multi-Dimensional Filter Engine --- */
    const qnaFilters = {
      text: '',
      verified: 'all', // 'all' | 'verified' | 'unverified'
      arcs: new Set(),
      characters: new Set(),
      topics: new Set(),
      years: new Set(),
      charMatchMode: 'any', // 'any' | 'all'
      activeTab: 'arcs'
    };
    let filteredQnaEntries = [];

    function handleQnaSearchInput() {
      const input = document.getElementById('filter-input');
      const clearBtn = document.getElementById('filter-clear-btn');
      const val = input ? input.value.trim() : '';
      qnaFilters.text = val.toLowerCase();
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
      renderEntryList();
      renderQnaActiveChips();
    }

    function clearQnaSearch() {
      const input = document.getElementById('filter-input');
      const clearBtn = document.getElementById('filter-clear-btn');
      if (input) input.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      qnaFilters.text = '';
      renderEntryList();
      renderQnaActiveChips();
      if (input) input.focus();
    }

    function setQnaVerifiedFilter(mode) {
      qnaFilters.verified = mode;
      ['all', 'verified', 'unverified'].forEach(m => {
        const btn = document.getElementById('btn-v-' + m);
        if (btn) btn.classList.toggle('active', m === mode);
      });
      renderEntryList();
      renderQnaActiveChips();
    }

    function toggleQnaFilterDrawer() {
      const drawer = document.getElementById('qna-filters-drawer');
      const btn = document.getElementById('btn-toggle-qna-filters');
      const chevron = document.getElementById('qna-filter-chevron');
      if (!drawer) return;
      const isOpen = drawer.style.display !== 'none';
      drawer.style.display = isOpen ? 'none' : 'flex';
      if (btn) btn.classList.toggle('open', !isOpen);
      if (chevron) chevron.textContent = isOpen ? '▾' : '▴';
      if (!isOpen) {
        renderQnaFilterPanes();
      }
    }

    function switchQnaFilterTab(tabName) {
      qnaFilters.activeTab = tabName;
      ['arcs', 'characters', 'topics', 'years'].forEach(t => {
        const tabBtnId = t === 'characters' ? 'tab-qna-filter-chars' : 'tab-qna-filter-' + t;
        const tabBtn = document.getElementById(tabBtnId);
        const pane = document.getElementById('pane-qna-filter-' + t);
        if (tabBtn) tabBtn.classList.toggle('active', t === tabName);
        if (pane) pane.classList.toggle('active', t === tabName);
      });
      renderQnaFilterPanes();
    }

    function matchesQnaEntry(e) {
      if (qnaFilters.text) {
        const q = qnaFilters.text;
        const inId = e.id && e.id.toLowerCase().includes(q);
        const inQ = e.question && e.question.toLowerCase().includes(q);
        const inArc = e.arc && e.arc.toLowerCase().includes(q);
        const inChars = Array.isArray(e.characters) && e.characters.some(c => c.toLowerCase().includes(q));
        const inTopics = Array.isArray(e.topics) && e.topics.some(t => t.toLowerCase().includes(q));
        if (!inId && !inQ && !inArc && !inChars && !inTopics) return false;
      }

      if (qnaFilters.verified === 'verified' && !e.verified) return false;
      if (qnaFilters.verified === 'unverified' && e.verified) return false;

      if (qnaFilters.arcs.size > 0 && !qnaFilters.arcs.has(e.arc)) return false;

      if (qnaFilters.characters.size > 0) {
        const itemChars = (e.characters || []).map(c => c.toLowerCase());
        if (qnaFilters.charMatchMode === 'all') {
          for (const reqChar of qnaFilters.characters) {
            if (!itemChars.includes(reqChar)) return false;
          }
        } else {
          let hasAny = false;
          for (const selChar of qnaFilters.characters) {
            if (itemChars.includes(selChar)) {
              hasAny = true;
              break;
            }
          }
          if (!hasAny) return false;
        }
      }

      if (qnaFilters.topics.size > 0) {
        const itemTopics = (e.topics || []).map(t => t.toLowerCase());
        let hasAny = false;
        for (const selTopic of qnaFilters.topics) {
          if (itemTopics.includes(selTopic)) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) return false;
      }

      if (qnaFilters.years.size > 0) {
        const rawDate = e.dateTime || e.date || '';
        const matchYear = rawDate.match(/^(\d{4})/);
        const yearStr = matchYear ? matchYear[1] : 'undated';
        if (!qnaFilters.years.has(yearStr)) return false;
      }

      return true;
    }

    function renderEntryList() {
      const list = document.getElementById('entry-list');
      if (!list) return;
      list.innerHTML = '';

      filteredQnaEntries = entries.filter(matchesQnaEntry);

      const countEl = document.getElementById('filtered-count');
      if (countEl) {
        countEl.textContent = 'Showing ' + filteredQnaEntries.length.toLocaleString() + ' of ' + entries.length.toLocaleString();
      }

      updateQnaNavButtons();

      if (filteredQnaEntries.length === 0) {
        list.innerHTML = '<li style="color: var(--text-muted); text-align: center; padding: 2.5rem 1rem;">' +
          'No matching Q&amp;As found.<br>' +
          '<button type="button" class="btn-clear-all-filters" style="margin-top:0.75rem;" onclick="clearAllQnaFilters()">Reset Filters</button>' +
          '</li>';
        return;
      }

      const fragment = document.createDocumentFragment();
      filteredQnaEntries.forEach(e => {
        const li = document.createElement('li');
        if (e.id === currentId) li.className = 'active';
        li.onclick = () => {
          if (isDirty && !confirm('You have unsaved changes. Discard and open entry #' + e.id + '?')) {
            return;
          }
          loadEntry(e.id);
        };

        const verifiedBadge = e.verified
          ? '<span class="badge-verified-mini" title="Verified Primary Source">✓</span>'
          : '<span class="badge-unverified-mini" title="Unverified">⚠</span>';

        const dateTag = e.dateTime
          ? '<span class="entry-date-text">' + escapeHtml(e.dateTime.length > 10 ? e.dateTime.slice(0, 10) : e.dateTime) + '</span>'
          : '';

        const chars = Array.isArray(e.characters) ? e.characters : [];
        let chipsHtml = '';
        if (chars.length > 0) {
          const previewChars = chars.slice(0, 2);
          const moreCount = chars.length - previewChars.length;
          chipsHtml = '<div class="entry-chips-row">' +
            previewChars.map(c => '<span class="mini-char-chip">' + escapeHtml(c) + '</span>').join('') +
            (moreCount > 0 ? '<span class="mini-char-chip more">+' + moreCount + '</span>' : '') +
            '</div>';
        }

        li.innerHTML =
          '<div class="entry-meta">' +
            '<div class="entry-meta-left">' +
              '<span class="badge-entry-id">#' + escapeHtml(e.id) + '</span>' +
              verifiedBadge +
              '<span class="badge-arc-mini">' + escapeHtml(e.arc) + '</span>' +
            '</div>' +
            '<div class="entry-meta-right">' + dateTag + '</div>' +
          '</div>' +
          '<div class="entry-q">' + escapeHtml(e.question || 'Untitled') + '</div>' +
          chipsHtml;

        fragment.appendChild(li);
      });
      list.appendChild(fragment);
    }

    function updateQnaNavButtons() {
      const prevBtn = document.getElementById('btn-prev-entry');
      const nextBtn = document.getElementById('btn-next-entry');
      if (!prevBtn || !nextBtn) return;

      const idx = filteredQnaEntries.findIndex(e => e.id === currentId);
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx < 0 || idx >= filteredQnaEntries.length - 1;
      prevBtn.title = idx > 0 ? 'Previous: #' + filteredQnaEntries[idx - 1].id + ' (Alt+[)' : 'No previous entry';
      nextBtn.title = (idx >= 0 && idx < filteredQnaEntries.length - 1) ? 'Next: #' + filteredQnaEntries[idx + 1].id + ' (Alt+])' : 'No next entry';
    }

    function navigateToPrevEntry() {
      const idx = filteredQnaEntries.findIndex(e => e.id === currentId);
      if (idx > 0) {
        if (isDirty && !confirm('You have unsaved changes. Discard and navigate?')) return;
        loadEntry(filteredQnaEntries[idx - 1].id);
      }
    }

    function navigateToNextEntry() {
      const idx = filteredQnaEntries.findIndex(e => e.id === currentId);
      if (idx >= 0 && idx < filteredQnaEntries.length - 1) {
        if (isDirty && !confirm('You have unsaved changes. Discard and navigate?')) return;
        loadEntry(filteredQnaEntries[idx + 1].id);
      }
    }

    function renderQnaFilterPanes() {
      const bArcs = document.getElementById('badge-qna-f-arcs');
      const bChars = document.getElementById('badge-qna-f-chars');
      const bTopics = document.getElementById('badge-qna-f-topics');
      const bYears = document.getElementById('badge-qna-f-years');
      if (bArcs) bArcs.textContent = qnaFilters.arcs.size > 0 ? '(' + qnaFilters.arcs.size + ')' : '';
      if (bChars) bChars.textContent = qnaFilters.characters.size > 0 ? '(' + qnaFilters.characters.size + ')' : '';
      if (bTopics) bTopics.textContent = qnaFilters.topics.size > 0 ? '(' + qnaFilters.topics.size + ')' : '';
      if (bYears) bYears.textContent = qnaFilters.years.size > 0 ? '(' + qnaFilters.years.size + ')' : '';

      if (qnaFilters.activeTab === 'arcs') renderQnaArcsChecklist();
      else if (qnaFilters.activeTab === 'characters') renderQnaCharChecklist();
      else if (qnaFilters.activeTab === 'topics') renderQnaTopicChecklist();
      else if (qnaFilters.activeTab === 'years') renderQnaYearsGrid();
    }

    function renderQnaArcsChecklist() {
      const container = document.getElementById('qna-filter-arcs-list');
      if (!container) return;
      container.innerHTML = '';

      const counts = {};
      entries.forEach(e => {
        const a = e.arc || 'general';
        counts[a] = (counts[a] || 0) + 1;
      });

      const items = [
        { slug: 'general', name: 'General / No Spoilers' },
        ...(config.arcs || []).map(a => ({ slug: a.slug, name: 'Arc ' + a.order + ': ' + a.name })),
        ...(config.ifRoutes || []).map(r => ({ slug: r.slug, name: r.name }))
      ];

      items.forEach(item => {
        const row = document.createElement('label');
        row.className = 'filter-check-row';
        const isChecked = qnaFilters.arcs.has(item.slug);
        const count = counts[item.slug] || 0;
        row.innerHTML =
          '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>' +
          '<span class="filter-check-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="filter-check-count">' + count + '</span>';

        row.querySelector('input').onchange = (e) => {
          if (e.target.checked) qnaFilters.arcs.add(item.slug);
          else qnaFilters.arcs.delete(item.slug);
          renderEntryList();
          renderQnaActiveChips();
          renderQnaFilterPanes();
        };
        container.appendChild(row);
      });
    }

    function selectAllQnaArcs() {
      qnaFilters.arcs.add('general');
      (config.arcs || []).forEach(a => qnaFilters.arcs.add(a.slug));
      (config.ifRoutes || []).forEach(r => qnaFilters.arcs.add(r.slug));
      renderEntryList();
      renderQnaActiveChips();
      renderQnaFilterPanes();
    }

    function clearQnaArcs() {
      qnaFilters.arcs.clear();
      renderEntryList();
      renderQnaActiveChips();
      renderQnaFilterPanes();
    }

    function renderQnaCharChecklist() {
      const container = document.getElementById('qna-filter-chars-list');
      if (!container) return;
      const searchVal = (document.getElementById('qna-filter-char-search')?.value || '').toLowerCase().trim();
      container.innerHTML = '';

      const counts = new Map();
      entries.forEach(e => {
        if (Array.isArray(e.characters)) {
          e.characters.forEach(c => {
            if (!c) return;
            const lower = c.toLowerCase();
            if (!counts.has(lower)) counts.set(lower, { name: c, count: 0 });
            counts.get(lower).count++;
          });
        }
      });
      (config.characters || []).forEach(c => {
        const lower = c.toLowerCase();
        if (!counts.has(lower)) counts.set(lower, { name: c, count: 0 });
      });

      let list = Array.from(counts.values());
      if (searchVal) {
        list = list.filter(item => item.name.toLowerCase().includes(searchVal));
      }

      list.sort((a, b) => {
        const aChecked = qnaFilters.characters.has(a.name.toLowerCase());
        const bChecked = qnaFilters.characters.has(b.name.toLowerCase());
        if (aChecked !== bChecked) return aChecked ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      if (list.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.75rem; padding:0.5rem;">No characters matched.</span>';
        return;
      }

      const fragment = document.createDocumentFragment();
      list.forEach(item => {
        const row = document.createElement('label');
        row.className = 'filter-check-row';
        const lower = item.name.toLowerCase();
        const isChecked = qnaFilters.characters.has(lower);
        row.innerHTML =
          '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>' +
          '<span class="filter-check-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="filter-check-count">' + item.count + '</span>';

        row.querySelector('input').onchange = (e) => {
          if (e.target.checked) qnaFilters.characters.add(lower);
          else qnaFilters.characters.delete(lower);
          renderEntryList();
          renderQnaActiveChips();
          renderQnaFilterPanes();
        };
        fragment.appendChild(row);
      });
      container.appendChild(fragment);
    }

    function toggleQnaCharMatchMode() {
      qnaFilters.charMatchMode = qnaFilters.charMatchMode === 'any' ? 'all' : 'any';
      const btn = document.getElementById('btn-qna-char-match-mode');
      if (btn) btn.textContent = qnaFilters.charMatchMode === 'any' ? 'Match: Any (OR)' : 'Match: All (AND)';
      renderEntryList();
    }

    function clearQnaChars() {
      qnaFilters.characters.clear();
      renderEntryList();
      renderQnaActiveChips();
      renderQnaFilterPanes();
    }

    function renderQnaTopicChecklist() {
      const container = document.getElementById('qna-filter-topics-list');
      if (!container) return;
      const searchVal = (document.getElementById('qna-filter-topic-search')?.value || '').toLowerCase().trim();
      container.innerHTML = '';

      const counts = new Map();
      entries.forEach(e => {
        if (Array.isArray(e.topics)) {
          e.topics.forEach(t => {
            if (!t) return;
            const lower = t.toLowerCase();
            if (!counts.has(lower)) counts.set(lower, { name: t, count: 0 });
            counts.get(lower).count++;
          });
        }
      });
      (config.topics || []).forEach(t => {
        const lower = t.toLowerCase();
        if (!counts.has(lower)) counts.set(lower, { name: t, count: 0 });
      });

      let list = Array.from(counts.values());
      if (searchVal) {
        list = list.filter(item => item.name.toLowerCase().includes(searchVal));
      }

      list.sort((a, b) => {
        const aChecked = qnaFilters.topics.has(a.name.toLowerCase());
        const bChecked = qnaFilters.topics.has(b.name.toLowerCase());
        if (aChecked !== bChecked) return aChecked ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      if (list.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.75rem; padding:0.5rem;">No topics matched.</span>';
        return;
      }

      const fragment = document.createDocumentFragment();
      list.forEach(item => {
        const row = document.createElement('label');
        row.className = 'filter-check-row';
        const lower = item.name.toLowerCase();
        const isChecked = qnaFilters.topics.has(lower);
        row.innerHTML =
          '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>' +
          '<span class="filter-check-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="filter-check-count">' + item.count + '</span>';

        row.querySelector('input').onchange = (e) => {
          if (e.target.checked) qnaFilters.topics.add(lower);
          else qnaFilters.topics.delete(lower);
          renderEntryList();
          renderQnaActiveChips();
          renderQnaFilterPanes();
        };
        fragment.appendChild(row);
      });
      container.appendChild(fragment);
    }

    function clearQnaTopics() {
      qnaFilters.topics.clear();
      renderEntryList();
      renderQnaActiveChips();
      renderQnaFilterPanes();
    }

    function renderQnaYearsGrid() {
      const container = document.getElementById('qna-filter-years-grid');
      if (!container) return;
      container.innerHTML = '';

      const counts = {};
      entries.forEach(e => {
        const rawDate = e.dateTime || e.date || '';
        const matchYear = rawDate.match(/^(\d{4})/);
        const y = matchYear ? matchYear[1] : 'undated';
        counts[y] = (counts[y] || 0) + 1;
      });

      const years = Object.keys(counts).filter(y => y !== 'undated').sort((a, b) => b.localeCompare(a));
      if (counts['undated']) years.push('undated');

      years.forEach(y => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isSelected = qnaFilters.years.has(y);
        btn.className = 'year-filter-pill' + (isSelected ? ' active' : '');
        btn.innerHTML = '<span>' + (y === 'undated' ? 'Undated' : y) + '</span><span class="year-count">(' + counts[y] + ')</span>';
        btn.onclick = () => {
          if (qnaFilters.years.has(y)) qnaFilters.years.delete(y);
          else qnaFilters.years.add(y);
          renderEntryList();
          renderQnaActiveChips();
          renderQnaYearsGrid();
          renderQnaFilterPanes();
        };
        container.appendChild(btn);
      });
    }

    function clearQnaYears() {
      qnaFilters.years.clear();
      renderEntryList();
      renderQnaActiveChips();
      renderQnaFilterPanes();
    }

    function renderQnaActiveChips() {
      const container = document.getElementById('qna-active-chips');
      const badge = document.getElementById('qna-filter-count-badge');
      const filterToggleBtn = document.getElementById('btn-toggle-qna-filters');
      const clearAllBtn = document.getElementById('btn-qna-clear-all');
      if (!container) return;

      const chips = [];

      qnaFilters.arcs.forEach(slug => {
        let label = slug;
        if (slug === 'general') label = 'General';
        else {
          const arcObj = (config.arcs || []).find(a => a.slug === slug);
          if (arcObj) label = 'Arc ' + arcObj.order;
          else {
            const ifObj = (config.ifRoutes || []).find(r => r.slug === slug);
            if (ifObj) label = ifObj.name;
          }
        }
        chips.push({
          label: label.startsWith('Arc ') ? label : (slug === 'general' ? 'General' : 'Story: ' + label),
          onRemove: () => { qnaFilters.arcs.delete(slug); onFilterChange(); }
        });
      });

      qnaFilters.characters.forEach(lower => {
        const matchChar = (config.characters || []).find(c => c.toLowerCase() === lower);
        chips.push({
          label: 'Char: ' + (matchChar || lower),
          onRemove: () => { qnaFilters.characters.delete(lower); onFilterChange(); }
        });
      });

      qnaFilters.topics.forEach(lower => {
        const matchTopic = (config.topics || []).find(t => t.toLowerCase() === lower);
        chips.push({
          label: 'Topic: ' + (matchTopic || lower),
          onRemove: () => { qnaFilters.topics.delete(lower); onFilterChange(); }
        });
      });

      qnaFilters.years.forEach(year => {
        chips.push({
          label: 'Year: ' + (year === 'undated' ? 'Undated' : year),
          onRemove: () => { qnaFilters.years.delete(year); onFilterChange(); }
        });
      });

      if (qnaFilters.verified !== 'all') {
        chips.push({
          label: 'Status: ' + (qnaFilters.verified === 'verified' ? 'Verified' : 'Unverified'),
          onRemove: () => { setQnaVerifiedFilter('all'); }
        });
      }

      const totalDrawerFilters = qnaFilters.arcs.size + qnaFilters.characters.size + qnaFilters.topics.size + qnaFilters.years.size;
      if (badge) {
        badge.textContent = totalDrawerFilters;
        badge.style.display = totalDrawerFilters > 0 ? 'inline-block' : 'none';
      }
      if (filterToggleBtn) {
        filterToggleBtn.classList.toggle('has-active', totalDrawerFilters > 0);
      }

      const hasAnyFilters = chips.length > 0 || !!qnaFilters.text;
      if (clearAllBtn) {
        clearAllBtn.style.display = hasAnyFilters ? 'inline-block' : 'none';
      }

      if (chips.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
      }

      container.style.display = 'flex';
      container.innerHTML = '';
      chips.forEach(chip => {
        const chipEl = document.createElement('span');
        chipEl.className = 'filter-chip';
        chipEl.innerHTML = escapeHtml(chip.label) + ' <button type="button" class="filter-chip-remove" title="Remove filter">&times;</button>';
        chipEl.querySelector('button').onclick = (e) => {
          e.stopPropagation();
          chip.onRemove();
        };
        container.appendChild(chipEl);
      });

      function onFilterChange() {
        renderEntryList();
        renderQnaActiveChips();
        renderQnaFilterPanes();
      }
    }

    function clearAllQnaFilters() {
      qnaFilters.text = '';
      qnaFilters.verified = 'all';
      qnaFilters.arcs.clear();
      qnaFilters.characters.clear();
      qnaFilters.topics.clear();
      qnaFilters.years.clear();

      const filterInput = document.getElementById('filter-input');
      if (filterInput) filterInput.value = '';
      const clearBtn = document.getElementById('filter-clear-btn');
      if (clearBtn) clearBtn.style.display = 'none';

      ['all', 'verified', 'unverified'].forEach(m => {
        const btn = document.getElementById('btn-v-' + m);
        if (btn) btn.classList.toggle('active', m === 'all');
      });

      renderEntryList();
      renderQnaActiveChips();
      renderQnaFilterPanes();
    }

    function handleQuestionInput() {
      markFormDirty();
      const q = document.getElementById('question').value;
      document.getElementById('q-len').textContent = q.length + ' chars';

      clearTimeout(dupDebounceTimer);
      dupDebounceTimer = setTimeout(() => {
        checkDuplicateRealtime(q);
      }, 200);

      triggerTagSuggestions();
    }

    function handleAnswerInput() {
      markFormDirty();
      const a = document.getElementById('answer').value;
      document.getElementById('a-len').textContent = a.length + ' chars';
      triggerTagSuggestions();
    }

    async function checkDuplicateRealtime(question) {
      const warnBox = document.getElementById('duplicate-warning');
      const saveBtn = document.getElementById('btn-save');

      if (!question || question.trim().length < 5) {
        warnBox.className = 'dup-alert';
        warnBox.innerHTML = '';
        isExactDuplicate = false;
        saveBtn.disabled = false;
        saveBtn.classList.remove('disabled');
        return;
      }

      try {
        const res = await fetch('/api/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, currentId })
        });
        const data = await res.json();

        if (data.isExactDuplicate && data.exactMatch) {
          isExactDuplicate = true;
          saveBtn.disabled = true;
          saveBtn.classList.add('disabled');
          warnBox.className = 'dup-alert exact';
          warnBox.innerHTML = '';

          const head = document.createElement('div');
          head.className = 'dup-alert-head';
          const title = document.createElement('span');
          title.textContent = '🚫 Exact Duplicate Question!';
          const jumpBtn = document.createElement('button');
          jumpBtn.type = 'button';
          jumpBtn.className = 'btn-jump-entry';
          jumpBtn.textContent = 'Open Entry #' + data.exactMatch.id;
          jumpBtn.onclick = () => jumpToEntry(data.exactMatch.id);
          head.appendChild(title);
          head.appendChild(jumpBtn);

          const desc = document.createElement('div');
          desc.innerHTML = 'Question identical to existing entry <strong>#' + data.exactMatch.id + '</strong>. Duplicates are strictly blocked from being saved.';

          warnBox.appendChild(head);
          warnBox.appendChild(desc);
        } else if (data.similarMatches && data.similarMatches.length > 0) {
          isExactDuplicate = false;
          saveBtn.disabled = false;
          saveBtn.classList.remove('disabled');
          warnBox.className = 'dup-alert similar';
          warnBox.innerHTML = '';

          const head = document.createElement('div');
          head.className = 'dup-alert-head';
          head.innerHTML = '<span>⚠️ Similar Questions Found In Database:</span>';
          warnBox.appendChild(head);

          const ul = document.createElement('ul');
          ul.className = 'dup-match-list';
          data.similarMatches.slice(0, 3).forEach(m => {
            const li = document.createElement('li');
            li.className = 'dup-match-item';
            
            const pct = Math.round(m.similarity * 100);
            const tag = document.createElement('span');
            tag.className = 'sim-tag';
            tag.textContent = pct + '% match';
            
            const text = document.createElement('span');
            text.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
            text.textContent = m.question;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-jump-entry';
            btn.textContent = '#' + m.id;
            btn.onclick = () => jumpToEntry(m.id);

            li.appendChild(tag);
            li.appendChild(text);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          warnBox.appendChild(ul);
        } else {
          isExactDuplicate = false;
          saveBtn.disabled = false;
          saveBtn.classList.remove('disabled');
          warnBox.className = 'dup-alert';
          warnBox.innerHTML = '';
        }
      } catch (err) {
        console.error('Duplicate check error:', err);
      }
    }

    function jumpToEntry(id) {
      if (isDirty && !confirm('Switching will discard unsaved edits. Open entry #' + id + '?')) {
        return;
      }
      loadEntry(id);
    }

    function triggerTagSuggestions() {
      clearTimeout(tagDebounceTimer);
      tagDebounceTimer = setTimeout(async () => {
        const fullText = document.getElementById('question').value + ' ' + document.getElementById('answer').value;
        if (fullText.trim().length < 8) {
          hideTagSuggestions();
          return;
        }

        try {
          const res = await fetch('/api/suggest-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText })
          });
          const data = await res.json();
          renderTagSuggestions(data.characters || [], data.topics || []);
        } catch (err) {
          console.error('Tag suggestion error:', err);
        }
      }, 250);
    }

    function renderTagSuggestions(suggestedChars, suggestedTopics) {
      const activeChars = getSelectedTagsSet('characters');
      const activeTopics = getSelectedTagsSet('topics');

      // Characters
      const newChars = suggestedChars.filter(c => !activeChars.has(c.toLowerCase()));
      const charShelf = document.getElementById('char-suggestions');
      const charCloud = document.getElementById('char-suggestions-cloud');

      if (newChars.length > 0) {
        charCloud.innerHTML = '';
        newChars.forEach(c => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'suggestion-pill';
          pill.textContent = '+ ' + c;
          pill.onclick = () => {
            toggleTag('characters', c);
            triggerTagSuggestions();
          };
          charCloud.appendChild(pill);
        });
        charShelf.classList.add('visible');
      } else {
        charShelf.classList.remove('visible');
      }

      // Topics
      const newTopics = suggestedTopics.filter(t => !activeTopics.has(t.toLowerCase()));
      const topicShelf = document.getElementById('topic-suggestions');
      const topicCloud = document.getElementById('topic-suggestions-cloud');

      if (newTopics.length > 0) {
        topicCloud.innerHTML = '';
        newTopics.forEach(t => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'suggestion-pill';
          pill.textContent = '+ ' + t;
          pill.onclick = () => {
            toggleTag('topics', t);
            triggerTagSuggestions();
          };
          topicCloud.appendChild(pill);
        });
        topicShelf.classList.add('visible');
      } else {
        topicShelf.classList.remove('visible');
      }
    }

    function hideTagSuggestions() {
      document.getElementById('char-suggestions').classList.remove('visible');
      document.getElementById('topic-suggestions').classList.remove('visible');
    }

    function addAllSuggestions(inputId, cloudId) {
      const cloud = document.getElementById(cloudId);
      const buttons = cloud.querySelectorAll('button');
      buttons.forEach(btn => {
        const tag = btn.textContent.replace(/^\+\s*/, '').trim();
        if (tag) {
          addSingleTag(inputId, tag);
        }
      });
      triggerTagSuggestions();
    }

    function addSingleTag(inputId, tag) {
      const input = document.getElementById(inputId);
      const tags = input.value.split(',').map(s => s.trim()).filter(Boolean);
      if (!tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
        tags.push(tag);
        input.value = tags.join(', ') + ', ';
        renderTagClouds();
        markFormDirty();
      }
    }

    function renderTagClouds() {
      renderCloud('characters', config.characters || [], 'character-chips', 'char-filter');
      renderCloud('topics', config.topics || [], 'topic-chips', 'topic-filter');
    }

    function renderCloud(inputId, allTags, containerId, filterId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const filterVal = (document.getElementById(filterId)?.value || '').toLowerCase().trim();
      const currentTags = getSelectedTagsSet(inputId);

      container.innerHTML = '';
      const matchingTags = allTags.filter(t => !filterVal || t.toLowerCase().includes(filterVal));

      if (matchingTags.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem; padding: 0.25rem;">No matching tags.</span>';
        return;
      }

      matchingTags.forEach(tag => {
        const pill = document.createElement('button');
        pill.type = 'button';
        const isSelected = currentTags.has(tag.toLowerCase());
        pill.className = 'tag-pill' + (isSelected ? ' active' : '');
        pill.textContent = (isSelected ? '✓ ' : '+ ') + tag;
        pill.title = isSelected ? 'Click to remove tag' : 'Click to add tag';
        pill.onclick = (e) => {
          e.preventDefault();
          toggleTag(inputId, tag);
        };
        container.appendChild(pill);
      });
    }

    function getSelectedTagsSet(inputId) {
      const val = document.getElementById(inputId)?.value || '';
      return new Set(val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    }

    function toggleTag(inputId, tag) {
      const input = document.getElementById(inputId);
      const tags = input.value.split(',').map(s => s.trim()).filter(Boolean);
      const existingIdx = tags.findIndex(t => t.toLowerCase() === tag.toLowerCase());

      if (existingIdx >= 0) {
        tags.splice(existingIdx, 1);
      } else {
        tags.push(tag);
      }

      input.value = tags.length > 0 ? tags.join(', ') + ', ' : '';
      renderTagClouds();
      markFormDirty();
    }

    function setupAutocomplete(inputId, dropdownId, configKey) {
      const input = document.getElementById(inputId);
      const dropdown = document.getElementById(dropdownId);

      input.addEventListener('input', () => {
        renderTagClouds();

        const val = input.value;
        const cursor = input.selectionStart || val.length;
        const textBefore = val.slice(0, cursor);
        const lastComma = textBefore.lastIndexOf(',');
        const currentQuery = textBefore.slice(lastComma + 1).trim().toLowerCase();

        if (!currentQuery) {
          dropdown.style.display = 'none';
          return;
        }

        const list = config[configKey] || [];
        const matches = list.filter(item => item.toLowerCase().includes(currentQuery));

        if (matches.length === 0) {
          dropdown.style.display = 'none';
          return;
        }

        dropdown.innerHTML = '';
        matches.slice(0, 10).forEach(item => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          div.textContent = item;
          div.onmousedown = (e) => {
            e.preventDefault();
            insertAutocomplete(inputId, item, lastComma);
            dropdown.style.display = 'none';
          };
          dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
      });

      input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 250);
      });
    }

    function insertAutocomplete(inputId, selectedTag, lastCommaIndex) {
      const input = document.getElementById(inputId);
      const val = input.value;
      const before = lastCommaIndex >= 0 ? val.slice(0, lastCommaIndex + 1).trim() + ' ' : '';
      
      const afterIndex = val.indexOf(',', lastCommaIndex + 1);
      const after = afterIndex >= 0 ? val.slice(afterIndex) : '';

      const currentTags = (before + selectedTag + (after ? after : '')).split(',').map(s => s.trim()).filter(Boolean);
      const uniqueTags = [];
      const seen = new Set();
      for (const t of currentTags) {
        const lower = t.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          uniqueTags.push(t);
        }
      }

      input.value = uniqueTags.join(', ') + ', ';
      renderTagClouds();
      markFormDirty();
      input.focus();
      if (input.setSelectionRange) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    /* Sources UI Management */
    function createSourceRowElement(type = 'url', value = '') {
      const row = document.createElement('div');
      row.className = 'source-row';

      const select = document.createElement('select');
      select.className = 'source-type-select';
      select.onchange = markFormDirty;

      const optUrl = document.createElement('option');
      optUrl.value = 'url';
      optUrl.textContent = 'URL Link';
      if (type === 'url') optUrl.selected = true;

      const optText = document.createElement('option');
      optText.value = 'text';
      optText.textContent = 'Free Text';
      if (type === 'text') optText.selected = true;

      select.appendChild(optUrl);
      select.appendChild(optText);

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'source-value-input';
      input.placeholder = 'https://x.com/... or 2018 Birthday Q&A';
      input.value = value || '';
      input.oninput = markFormDirty;

      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn-remove-source';
      btnRemove.title = 'Remove source';
      btnRemove.textContent = '✕';
      btnRemove.onclick = () => removeSourceRow(row);

      row.appendChild(select);
      row.appendChild(input);
      row.appendChild(btnRemove);

      return row;
    }

    function addSourceRowUI(type = 'url', value = '') {
      const container = document.getElementById('sources-list');
      const row = createSourceRowElement(type, value);
      container.appendChild(row);
      updateSourceRemoveButtons();
      markFormDirty();
      const input = row.querySelector('.source-value-input');
      if (input) input.focus();
    }

    function removeSourceRow(row) {
      const container = document.getElementById('sources-list');
      const rows = container.querySelectorAll('.source-row');
      if (rows.length > 1) {
        row.remove();
        updateSourceRemoveButtons();
        markFormDirty();
      } else {
        const input = row.querySelector('.source-value-input');
        if (input) input.value = '';
        const select = row.querySelector('.source-type-select');
        if (select) select.value = 'url';
        markFormDirty();
      }
    }

    function updateSourceRemoveButtons() {
      const container = document.getElementById('sources-list');
      const rows = container ? container.querySelectorAll('.source-row') : [];
      rows.forEach(r => {
        const btn = r.querySelector('.btn-remove-source');
        if (btn) {
          btn.style.opacity = rows.length === 1 ? '0.35' : '1';
          btn.title = rows.length === 1 ? 'Clear source' : 'Remove source';
        }
      });
    }

    function setSourcesInUI(sourcesList) {
      const container = document.getElementById('sources-list');
      if (!container) return;
      container.innerHTML = '';
      const list = (Array.isArray(sourcesList) && sourcesList.length > 0)
        ? sourcesList
        : [{ type: 'url', value: '' }];

      list.forEach(src => {
        const row = createSourceRowElement(src.type || 'url', src.value || '');
        container.appendChild(row);
      });
      updateSourceRemoveButtons();
    }

    function getSourcesFromUI() {
      const container = document.getElementById('sources-list');
      const rows = container ? container.querySelectorAll('.source-row') : [];
      const result = [];
      rows.forEach(r => {
        const type = r.querySelector('.source-type-select').value;
        const value = r.querySelector('.source-value-input').value.trim();
        if (value) {
          result.push({ type, value });
        }
      });
      return result;
    }

    async function createNew() {
      currentId = null;
      isExactDuplicate = false;
      document.getElementById('form-title').textContent = 'Create New Q&A';
      document.getElementById('entry-badge').textContent = 'ID: Auto-assigned on save';
      document.getElementById('btn-delete').style.display = 'none';
      document.getElementById('btn-clone').style.display = 'none';
      document.getElementById('qna-form').reset();
      document.getElementById('entry-id').value = '';
      document.getElementById('q-len').textContent = '0 chars';
      document.getElementById('a-len').textContent = '0 chars';
      clearDateFields();
      setSourcesInUI([]);
      hideStatus();
      hideTagSuggestions();
      document.getElementById('duplicate-warning').className = 'dup-alert';
      document.getElementById('duplicate-warning').innerHTML = '';
      document.getElementById('btn-save').disabled = false;
      document.getElementById('btn-save').classList.remove('disabled');
      renderEntryList();
      renderTagClouds();
      isDirty = false;
    }

    function confirmReset() {
      if (confirm('Clear form fields and start fresh?')) {
        clearStoredDraft();
        createNew();
      }
    }

    function cloneAsTemplate() {
      currentId = null;
      isExactDuplicate = false;
      document.getElementById('form-title').textContent = 'Create New Q&A (From Template)';
      document.getElementById('entry-badge').textContent = 'ID: Auto-assigned on save';
      document.getElementById('btn-delete').style.display = 'none';
      document.getElementById('btn-clone').style.display = 'none';
      document.getElementById('entry-id').value = '';
      document.getElementById('question').value = '';
      document.getElementById('answer').value = '';
      document.getElementById('q-len').textContent = '0 chars';
      document.getElementById('a-len').textContent = '0 chars';
      hideStatus();
      hideTagSuggestions();
      document.getElementById('duplicate-warning').className = 'dup-alert';
      document.getElementById('duplicate-warning').innerHTML = '';
      document.getElementById('btn-save').disabled = false;
      document.getElementById('btn-save').classList.remove('disabled');
      showStatus('Template copied: Date, Arc, and Source retained for rapid authoring!', 'success');
      markFormDirty();
      renderEntryList();
      document.getElementById('question').focus();
    }

    async function loadEntry(id) {
      currentId = id;
      isExactDuplicate = false;
      hideStatus();
      hideTagSuggestions();
      renderEntryList();

      const res = await fetch('/api/entries/' + id);
      if (!res.ok) {
        showStatus('Failed to load entry #' + id, 'error');
        return;
      }

      const data = await res.json();
      document.getElementById('form-title').textContent = 'Edit Entry #' + data.id;
      document.getElementById('entry-badge').textContent = 'ID: #' + data.id;
      document.getElementById('btn-delete').style.display = 'block';
      document.getElementById('btn-clone').style.display = 'inline-flex';

      document.getElementById('entry-id').value = data.id;
      document.getElementById('question').value = data.question || '';
      document.getElementById('answer').value = data.answer || '';
      document.getElementById('arc').value = data.arc;
      document.getElementById('verified').checked = !!data.verified;
      setDateFromValue(data.dateTime || data.date || '');
      document.getElementById('characters').value = (data.characters || []).join(', ');
      document.getElementById('topics').value = (data.topics || []).join(', ');
      const rawSources = Array.isArray(data.sources) && data.sources.length > 0
        ? data.sources
        : Array.isArray(data.source)
        ? data.source
        : data.source ? [data.source] : [];
      setSourcesInUI(rawSources);
      
      document.getElementById('q-len').textContent = (data.question || '').length + ' chars';
      document.getElementById('a-len').textContent = (data.answer || '').length + ' chars';

      document.getElementById('duplicate-warning').className = 'dup-alert';
      document.getElementById('duplicate-warning').innerHTML = '';
      document.getElementById('btn-save').disabled = false;
      document.getElementById('btn-save').classList.remove('disabled');

      renderTagClouds();
      isDirty = false;
    }

    async function handleSave(event) {
      event.preventDefault();
      hideStatus();

      if (isExactDuplicate) {
        showStatus('Cannot save: question is identical to an existing entry!', 'error');
        return;
      }

      const chars = document.getElementById('characters').value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const topics = document.getElementById('topics').value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const dayVal = document.getElementById('date-day').value;
      const monthVal = document.getElementById('date-month').value;
      const yearVal = document.getElementById('date-year').value;

      if ((dayVal || monthVal) && !yearVal) {
        showStatus('Please select a Year to complete the date.', 'error');
        return;
      }

      const dateTimeVal = getCombinedDateTime();
      const sources = getSourcesFromUI();
      const sourcePayload = sources.length > 1
        ? { sources: sources }
        : { source: sources[0] || { type: 'text', value: '' } };

      const payload = {
        question: document.getElementById('question').value.trim(),
        answer: document.getElementById('answer').value.trim(),
        arc: document.getElementById('arc').value,
        verified: document.getElementById('verified').checked,
        ...(dateTimeVal ? { dateTime: dateTimeVal } : {}),
        characters: chars,
        topics: topics,
        ...sourcePayload
      };

      const isEdit = !!currentId;
      const url = isEdit ? '/api/entries/' + currentId : '/api/entries';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          showStatus(data.error || 'Validation or write failed', 'error');
          return;
        }

        clearStoredDraft();
        isDirty = false;
        showStatus('Entry #' + data.entry.id + ' saved successfully!', 'success');
        
        await reloadConfigAndEntries();
        await loadEntry(data.entry.id);
      } catch (err) {
        showStatus(err.message, 'error');
      }
    }

    async function handleDelete() {
      if (!currentId) return;
      const confirmed = confirm('Are you sure you want to permanently delete Q&A entry #' + currentId + '?');
      if (!confirmed) return;

      try {
        const res = await fetch('/api/entries/' + currentId, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          showStatus(data.error || 'Failed to delete entry', 'error');
          return;
        }

        showStatus('Entry #' + currentId + ' deleted successfully.', 'success');
        clearStoredDraft();
        isDirty = false;
        await reloadConfigAndEntries();
        createNew();
      } catch (err) {
        showStatus(err.message, 'error');
      }
    }

    /* Quick Paste Modal Routines */
    function openQuickPasteModal() {
      document.getElementById('quick-paste-modal').classList.add('open');
      document.getElementById('quick-paste-text').focus();
    }

    function closeQuickPasteModal() {
      document.getElementById('quick-paste-modal').classList.remove('open');
    }

    function handleModalBackdrop(e) {
      if (e.target.id === 'quick-paste-modal') {
        closeQuickPasteModal();
      }
    }

    function insertQuickPasteSample() {
      document.getElementById('quick-paste-text').value = 
        "Q: Can Reinhard defeat Satella in a direct fight?\n" +
        "A: In a battle between Reinhard and Satella, there is no end. Because of his divine protections and her immortality, it would result in a permanent draw.\n" +
        "Date: 2014-05-18\n" +
        "Arc: arc-4\n" +
        "Source: https://twitter.com/nezumiironyanko/status/468045678912345678\n" +
        "Verified: yes";
    }

    async function applyQuickPaste() {
      const raw = document.getElementById('quick-paste-text').value;
      if (!raw.trim()) {
        alert('Please paste some text first.');
        return;
      }

      try {
        const res = await fetch('/api/parse-quick-paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: raw })
        });
        const { parsed } = await res.json();

        createNew();
        if (parsed.question) document.getElementById('question').value = parsed.question;
        if (parsed.answer) document.getElementById('answer').value = parsed.answer;
        if (parsed.arc) document.getElementById('arc').value = parsed.arc;
        if (parsed.dateTime) setDateFromValue(parsed.dateTime);
        if (parsed.verified !== undefined) document.getElementById('verified').checked = !!parsed.verified;
        if (parsed.source) {
          setSourcesInUI([parsed.source]);
        }
        if (parsed.characters && parsed.characters.length > 0) {
          document.getElementById('characters').value = parsed.characters.join(', ') + ', ';
        }
        if (parsed.topics && parsed.topics.length > 0) {
          document.getElementById('topics').value = parsed.topics.join(', ') + ', ';
        }

        closeQuickPasteModal();
        handleQuestionInput();
        handleAnswerInput();
        renderTagClouds();
        markFormDirty();
        showStatus('Quick paste parsed and fields populated successfully!', 'success');
      } catch (err) {
        alert('Quick paste failed: ' + err.message);
      }
    }

    /* Draft Autosave */
    function markFormDirty() {
      isDirty = true;
      saveDraftDebounced();
    }

    let draftSaveTimer = null;
    function saveDraftDebounced() {
      clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(() => {
        if (!currentId) {
          const draft = {
            question: document.getElementById('question').value,
            answer: document.getElementById('answer').value,
            arc: document.getElementById('arc').value,
            verified: document.getElementById('verified').checked,
            characters: document.getElementById('characters').value,
            topics: document.getElementById('topics').value,
            sources: getSourcesFromUI(),
            day: document.getElementById('date-day').value,
            month: document.getElementById('date-month').value,
            year: document.getElementById('date-year').value,
            time: document.getElementById('date-time-val').value,
            savedAt: new Date().toISOString()
          };
          if (draft.question.trim() || draft.answer.trim()) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          }
        }
      }, 1000);
    }

    function hasStoredDraft() {
      return !!localStorage.getItem(DRAFT_KEY);
    }

    function showDraftBanner() {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
        if (draft.question || draft.answer) {
          document.getElementById('draft-banner').classList.add('visible');
          if (draft.question) document.getElementById('question').value = draft.question;
          if (draft.answer) document.getElementById('answer').value = draft.answer;
          if (draft.arc) document.getElementById('arc').value = draft.arc;
          if (draft.verified) document.getElementById('verified').checked = draft.verified;
          if (draft.characters) document.getElementById('characters').value = draft.characters;
          if (draft.topics) document.getElementById('topics').value = draft.topics;
          if (draft.sources) {
            setSourcesInUI(draft.sources);
          } else if (draft.sourceValue || draft.sourceType) {
            setSourcesInUI([{ type: draft.sourceType || 'url', value: draft.sourceValue || '' }]);
          }
          if (draft.year) {
            ensureYearInSelect(draft.year);
            document.getElementById('date-year').value = draft.year;
            document.getElementById('date-month').value = draft.month || '';
            document.getElementById('date-day').value = draft.day || '';
            document.getElementById('date-time-val').value = draft.time || '';
            updateDatePreview();
          }
          handleQuestionInput();
          handleAnswerInput();
        }
      } catch (e) {
        clearStoredDraft();
      }
    }

    function discardDraft() {
      clearStoredDraft();
      document.getElementById('draft-banner').classList.remove('visible');
      createNew();
    }

    function clearStoredDraft() {
      localStorage.removeItem(DRAFT_KEY);
      document.getElementById('draft-banner').classList.remove('visible');
    }

    /* Keyboard shortcuts */
    function setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        const isTriviaActive = document.getElementById('tab-btn-trivia')?.classList.contains('active');
        const isQnaActive = document.getElementById('tab-btn-qna')?.classList.contains('active');

        // Ctrl+Enter or Cmd+Enter to save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (isTriviaActive) {
            const saveBtn = document.getElementById('btn-trivia-save');
            if (saveBtn && !saveBtn.disabled) {
              document.getElementById('trivia-form').requestSubmit();
            }
          } else if (isQnaActive) {
            const saveBtn = document.getElementById('btn-save');
            if (saveBtn && !saveBtn.disabled) {
              document.getElementById('qna-form').requestSubmit();
            }
          }
        }
        // Alt+N for new entry
        if (e.altKey && (e.key === 'n' || e.key === 'N')) {
          e.preventDefault();
          if (isTriviaActive) {
            if (!isTriviaDirty || confirm('Discard unsaved trivia edits and create new?')) {
              createNewTrivia();
            }
          } else if (isQnaActive) {
            if (!isDirty || confirm('Discard unsaved edits and create new?')) {
              createNew();
            }
          }
        }
        // Alt+[ for Prev entry
        if (e.altKey && (e.key === '[' || e.key === '{')) {
          e.preventDefault();
          if (isTriviaActive) navigateToPrevTrivia();
          else if (isQnaActive) navigateToPrevEntry();
        }
        // Alt+] for Next entry
        if (e.altKey && (e.key === ']' || e.key === '}')) {
          e.preventDefault();
          if (isTriviaActive) navigateToNextTrivia();
          else if (isQnaActive) navigateToNextEntry();
        }
        // Alt+F to focus search input
        if (e.altKey && (e.key === 'f' || e.key === 'F')) {
          e.preventDefault();
          if (isTriviaActive) {
            const inp = document.getElementById('trivia-filter-input');
            if (inp) { inp.focus(); inp.select(); }
          } else if (isQnaActive) {
            const inp = document.getElementById('filter-input');
            if (inp) { inp.focus(); inp.select(); }
          }
        }
        // Escape closes any open modal and filter drawer
        if (e.key === 'Escape') {
          closeQuickPasteModal();
          closeTriviaQuickPasteModal();
          closeSupplementModal();
          const qnaDrawer = document.getElementById('qna-filters-drawer');
          if (qnaDrawer && qnaDrawer.style.display !== 'none') toggleQnaFilterDrawer();
          const trvDrawer = document.getElementById('trivia-filters-drawer');
          if (trvDrawer && trvDrawer.style.display !== 'none') toggleTriviaFilterDrawer();
        }
      });

      window.addEventListener('beforeunload', (e) => {
        if (isDirty || isTriviaDirty) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    }

    function showStatus(msg, type) {
      const el = document.getElementById('status-msg');
      el.textContent = msg;
      el.className = type;
    }

    function hideStatus() {
      const el = document.getElementById('status-msg');
      el.className = '';
      el.style.display = 'none';
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* Date & Time helper routines */
    const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function populateDaySelect() {
      const sel = document.getElementById('date-day');
      sel.innerHTML = '<option value="">Day</option>';
      for (let d = 1; d <= 31; d++) {
        const opt = document.createElement('option');
        const val = String(d).padStart(2, '0');
        opt.value = val;
        opt.textContent = val;
        sel.appendChild(opt);
      }
    }

    function populateYearSelect() {
      const sel = document.getElementById('date-year');
      sel.innerHTML = '<option value="">Year</option>';
      const currentYear = new Date().getFullYear();
      for (let y = currentYear + 1; y >= 2011; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        sel.appendChild(opt);
      }
      const optOther = document.createElement('option');
      optOther.value = 'other';
      optOther.textContent = 'Other Year...';
      sel.appendChild(optOther);
    }

    function ensureYearInSelect(y) {
      if (!y) return;
      const sel = document.getElementById('date-year');
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === y) return;
      }
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      sel.insertBefore(opt, sel.lastElementChild);
    }

    function handleYearChange() {
      const sel = document.getElementById('date-year');
      if (sel.value === 'other') {
        const custom = prompt('Enter 4-digit Year (e.g. 2008):');
        if (custom && /^\d{4}$/.test(custom.trim())) {
          const cleanYear = custom.trim();
          ensureYearInSelect(cleanYear);
          sel.value = cleanYear;
        } else {
          sel.value = '';
        }
      }
      updateDatePreview();
      markFormDirty();
    }

    function getCombinedDateTime() {
      const day = document.getElementById('date-day').value;
      const month = document.getElementById('date-month').value;
      const year = document.getElementById('date-year').value;
      const time = document.getElementById('date-time-val').value;

      if (!year) return '';

      if (month && day) {
        let res = year + '-' + month + '-' + day;
        if (time) {
          res += 'T' + (time.length === 5 ? time + ':00' : time);
        }
        return res;
      }

      if (month) {
        return year + '-' + month;
      }

      return year;
    }

    function updateDatePreview() {
      const day = document.getElementById('date-day').value;
      const month = document.getElementById('date-month').value;
      const year = document.getElementById('date-year').value;
      const time = document.getElementById('date-time-val').value;
      const isoText = document.getElementById('date-preview-text');
      const humanText = document.getElementById('date-preview-human');

      const iso = getCombinedDateTime();
      if (!iso) {
        if (day || month) {
          isoText.textContent = 'Incomplete (Select Year)';
          isoText.style.color = '#f87171';
          humanText.textContent = '';
        } else {
          isoText.textContent = 'None';
          isoText.style.color = 'var(--text-muted)';
          humanText.textContent = '';
        }
        return;
      }

      isoText.textContent = iso;
      isoText.style.color = '#38bdf8';

      if (year && month && day) {
        const mIdx = parseInt(month, 10);
        const mName = MONTH_NAMES[mIdx] || month;
        const dNum = parseInt(day, 10);
        let human = '(' + mName + ' ' + dNum + ', ' + year;
        if (time) human += ' at ' + time;
        human += ')';
        humanText.textContent = human;
      } else if (year && month) {
        const mIdx = parseInt(month, 10);
        humanText.textContent = '(' + (MONTH_NAMES[mIdx] || month) + ' ' + year + ')';
      } else if (year) {
        humanText.textContent = '(' + year + ')';
      }
      markFormDirty();
    }

    function setDateFromValue(val) {
      clearDateFields();
      if (!val || typeof val !== 'string') return;
      const trimmed = val.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?:[T\s](\d{2}:\d{2}))?/);
      if (match) {
        const y = match[1];
        const m = match[2] || '';
        const d = match[3] || '';
        const t = match[4] || '';

        ensureYearInSelect(y);
        document.getElementById('date-year').value = y;
        document.getElementById('date-month').value = m;
        document.getElementById('date-day').value = d;
        document.getElementById('date-time-val').value = t;
      }
      updateDatePreview();
    }

    function setTodayDate() {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = String(now.getFullYear());
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      ensureYearInSelect(y);
      document.getElementById('date-year').value = y;
      document.getElementById('date-month').value = m;
      document.getElementById('date-day').value = d;
      document.getElementById('date-time-val').value = hh + ':' + mm;
      updateDatePreview();
      markFormDirty();
    }

    function clearDateFields() {
      document.getElementById('date-day').value = '';
      document.getElementById('date-month').value = '';
      document.getElementById('date-year').value = '';
      document.getElementById('date-time-val').value = '';
      updateDatePreview();
    }

    /* Trivia Date & Time helper routines */
    function populateTriviaDaySelect() {
      const sel = document.getElementById('trivia-date-day');
      if (!sel) return;
      sel.innerHTML = '<option value="">Day</option>';
      for (let d = 1; d <= 31; d++) {
        const opt = document.createElement('option');
        const val = String(d).padStart(2, '0');
        opt.value = val;
        opt.textContent = val;
        sel.appendChild(opt);
      }
    }

    function populateTriviaYearSelect() {
      const sel = document.getElementById('trivia-date-year');
      if (!sel) return;
      sel.innerHTML = '<option value="">Year</option>';
      const currentYear = new Date().getFullYear();
      for (let y = currentYear + 1; y >= 2011; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        sel.appendChild(opt);
      }
      const optOther = document.createElement('option');
      optOther.value = 'other';
      optOther.textContent = 'Other Year...';
      sel.appendChild(optOther);
    }

    function ensureTriviaYearInSelect(y) {
      if (!y) return;
      const sel = document.getElementById('trivia-date-year');
      if (!sel) return;
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === y) return;
      }
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      sel.insertBefore(opt, sel.lastElementChild);
    }

    function handleTriviaYearChange() {
      const sel = document.getElementById('trivia-date-year');
      if (!sel) return;
      if (sel.value === 'other') {
        const custom = prompt('Enter 4-digit Year (e.g. 2008):');
        if (custom && /^\d{4}$/.test(custom.trim())) {
          const cleanYear = custom.trim();
          ensureTriviaYearInSelect(cleanYear);
          sel.value = cleanYear;
        } else {
          sel.value = '';
        }
      }
      updateTriviaDatePreview();
      markTriviaFormDirty();
    }

    function getTriviaCombinedDateTime() {
      const day = document.getElementById('trivia-date-day')?.value;
      const month = document.getElementById('trivia-date-month')?.value;
      const year = document.getElementById('trivia-date-year')?.value;
      const time = document.getElementById('trivia-date-time-val')?.value;

      if (!year) return '';

      if (month && day) {
        let res = year + '-' + month + '-' + day;
        if (time) {
          res += 'T' + (time.length === 5 ? time + ':00' : time);
        }
        return res;
      }

      if (month) {
        return year + '-' + month;
      }

      return year;
    }

    function updateTriviaDatePreview() {
      const day = document.getElementById('trivia-date-day')?.value;
      const month = document.getElementById('trivia-date-month')?.value;
      const year = document.getElementById('trivia-date-year')?.value;
      const time = document.getElementById('trivia-date-time-val')?.value;
      const isoText = document.getElementById('trivia-date-preview-text');
      const humanText = document.getElementById('trivia-date-preview-human');
      if (!isoText || !humanText) return;

      const iso = getTriviaCombinedDateTime();
      if (!iso) {
        if (day || month) {
          isoText.textContent = 'Incomplete (Select Year)';
          isoText.style.color = '#f87171';
          humanText.textContent = '';
        } else {
          isoText.textContent = 'None';
          isoText.style.color = 'var(--text-muted)';
          humanText.textContent = '';
        }
        return;
      }

      isoText.textContent = iso;
      isoText.style.color = '#38bdf8';

      if (year && month && day) {
        const mIdx = parseInt(month, 10);
        const mName = MONTH_NAMES[mIdx] || month;
        const dNum = parseInt(day, 10);
        let human = '(' + mName + ' ' + dNum + ', ' + year;
        if (time) human += ' at ' + time;
        human += ')';
        humanText.textContent = human;
      } else if (year && month) {
        const mIdx = parseInt(month, 10);
        humanText.textContent = '(' + (MONTH_NAMES[mIdx] || month) + ' ' + year + ')';
      } else if (year) {
        humanText.textContent = '(' + year + ')';
      }
      markTriviaFormDirty();
    }

    function setTriviaDateFromValue(val) {
      clearTriviaDateFields();
      if (!val || typeof val !== 'string') return;
      const trimmed = val.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?:[T\s](\d{2}:\d{2}))?/);
      if (match) {
        const y = match[1];
        const m = match[2] || '';
        const d = match[3] || '';
        const t = match[4] || '';

        ensureTriviaYearInSelect(y);
        const yEl = document.getElementById('trivia-date-year');
        const mEl = document.getElementById('trivia-date-month');
        const dEl = document.getElementById('trivia-date-day');
        const tEl = document.getElementById('trivia-date-time-val');
        if (yEl) yEl.value = y;
        if (mEl) mEl.value = m;
        if (dEl) dEl.value = d;
        if (tEl) tEl.value = t;
      }
      updateTriviaDatePreview();
    }

    function setTriviaTodayDate() {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = String(now.getFullYear());
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      ensureTriviaYearInSelect(y);
      const yEl = document.getElementById('trivia-date-year');
      const mEl = document.getElementById('trivia-date-month');
      const dEl = document.getElementById('trivia-date-day');
      const tEl = document.getElementById('trivia-date-time-val');
      if (yEl) yEl.value = y;
      if (mEl) mEl.value = m;
      if (dEl) dEl.value = d;
      if (tEl) tEl.value = hh + ':' + mm;
      updateTriviaDatePreview();
      markTriviaFormDirty();
    }

    function clearTriviaDateFields() {
      const yEl = document.getElementById('trivia-date-year');
      const mEl = document.getElementById('trivia-date-month');
      const dEl = document.getElementById('trivia-date-day');
      const tEl = document.getElementById('trivia-date-time-val');
      if (dEl) dEl.value = '';
      if (mEl) mEl.value = '';
      if (yEl) yEl.value = '';
      if (tEl) tEl.value = '';
      updateTriviaDatePreview();
    }

    /* --- Stories & Supplements Management Controller --- */
    let allStories = [];
    let selectedStorySlug = null;
    let currentStoryData = null;

    function switchMainTab(tab) {
      const qnaView = document.getElementById('qna-view');
      const storiesView = document.getElementById('stories-view');
      const triviaView = document.getElementById('trivia-view');
      const qnaBtn = document.getElementById('tab-btn-qna');
      const storiesBtn = document.getElementById('tab-btn-stories');
      const triviaBtn = document.getElementById('tab-btn-trivia');

      qnaView.style.display = 'none';
      storiesView.style.display = 'none';
      triviaView.style.display = 'none';
      qnaBtn.classList.remove('active');
      storiesBtn.classList.remove('active');
      triviaBtn.classList.remove('active');

      if (tab === 'stories') {
        storiesView.style.display = 'flex';
        storiesBtn.classList.add('active');
        loadStories();
      } else if (tab === 'trivia') {
        triviaView.style.display = 'flex';
        triviaBtn.classList.add('active');
        loadTrivia();
      } else {
        qnaView.style.display = 'flex';
        qnaBtn.classList.add('active');
      }
    }

    async function loadStories() {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) throw new Error('Failed to load stories');
        allStories = await res.json();
        document.getElementById('stories-count').textContent = allStories.length;
        const navStories = document.getElementById('nav-stories-count');
        if (navStories) navStories.textContent = allStories.length;
        renderStoriesList();
        populateStoryDivergenceOptions();

        if (selectedStorySlug) {
          selectStory(selectedStorySlug);
        } else if (allStories.length > 0) {
          selectStory(allStories[0].slug);
        }
      } catch (err) {
        console.error('Error loading stories:', err);
      }
    }

    function populateStoryDivergenceOptions() {
      const sel = document.getElementById('story-diverges-from');
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = '<option value="">None (Independent divergence)</option>';
      if (config && config.arcs) {
        config.arcs.forEach(a => {
          const opt = document.createElement('option');
          opt.value = a.slug;
          opt.textContent = 'Arc ' + a.order + ': ' + a.name;
          sel.appendChild(opt);
        });
      }
      sel.value = currentVal;
    }

    function renderStoriesList() {
      const filterText = document.getElementById('stories-filter-input').value.toLowerCase().trim();
      const filterType = document.getElementById('stories-filter-type').value;
      const listEl = document.getElementById('stories-list');
      listEl.innerHTML = '';

      const filtered = allStories.filter(s => {
        const matchText = !filterText || s.name.toLowerCase().includes(filterText) || s.slug.toLowerCase().includes(filterText);
        const matchType = !filterType || (s.type || 'if') === filterType;
        return matchText && matchType;
      });

      if (filtered.length === 0) {
        listEl.innerHTML = '<li style="color: var(--text-muted); text-align: center; padding: 2rem;">No matching stories found.</li>';
        return;
      }

      filtered.forEach(s => {
        const li = document.createElement('li');
        if (s.slug === selectedStorySlug) li.classList.add('active');
        const isSide = s.type === 'side-story';
        const tagBg = isSide ? 'rgba(147, 51, 234, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        const tagColor = isSide ? '#d8b4fe' : '#fca5a5';
        const tagBorder = isSide ? '#9333ea' : '#ef4444';
        const suppCount = s.supplementCount || 0;

        li.innerHTML = 
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">' +
            '<span style="font-size: 0.7rem; font-family: monospace; padding: 0.1rem 0.4rem; border-radius: 4px; background: ' + tagBg + '; color: ' + tagColor + '; border: 1px solid ' + tagBorder + '; font-weight: 600;">' +
              (isSide ? 'Side Story' : 'IF Route') +
            '</span>' +
            '<span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">' +
              suppCount + ' supp' + (suppCount !== 1 ? 's' : '') +
            '</span>' +
          '</div>' +
          '<div style="font-size: 0.9rem; font-weight: 600; color: var(--text);">' + escapeHtml(s.name) + '</div>' +
          '<div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-top: 0.2rem;">' +
            escapeHtml(s.slug) + (isSide ? (s.timeline ? ' · ' + escapeHtml(s.timeline) : '') : (s.divergesFrom ? ' · ' + escapeHtml(s.divergesFrom) : '')) +
          '</div>';

        li.onclick = () => selectStory(s.slug);
        listEl.appendChild(li);
      });
    }

    function handleStoryTypeChange() {
      const type = document.getElementById('story-type').value;
      const isSide = type === 'side-story';
      document.getElementById('group-divergence').style.display = isSide ? 'none' : 'block';
      document.getElementById('group-timeline').style.display = isSide ? 'block' : 'none';
    }

    async function selectStory(slug) {
      selectedStorySlug = slug;
      renderStoriesList();
      try {
        const res = await fetch('/api/stories/' + encodeURIComponent(slug));
        if (!res.ok) throw new Error('Failed to load story');
        currentStoryData = await res.json();

        document.getElementById('story-form-title').textContent = 'Edit Story: ' + currentStoryData.name;
        document.getElementById('story-badge').textContent = 'Slug: ' + currentStoryData.slug;
        const slugInput = document.getElementById('story-slug');
        slugInput.value = currentStoryData.slug;
        slugInput.readOnly = true;
        document.getElementById('story-name').value = currentStoryData.name || '';
        document.getElementById('story-type').value = currentStoryData.type || 'if';
        document.getElementById('story-diverges-from').value = currentStoryData.divergesFrom || '';
        document.getElementById('story-timeline').value = currentStoryData.timeline || '';
        handleStoryTypeChange();
        document.getElementById('story-date-published').value = currentStoryData.datePublished || '';
        document.getElementById('story-description').value = currentStoryData.description || '';
        document.getElementById('btn-delete-story').style.display = 'inline-block';

        document.getElementById('supplements-section').style.display = 'block';
        document.getElementById('supp-story-name').textContent = currentStoryData.name;
        renderSupplementsList(currentStoryData.supplements || []);
      } catch (err) {
        console.error('Error selecting story:', err);
      }
    }

    function createNewStory() {
      selectedStorySlug = null;
      currentStoryData = null;
      renderStoriesList();

      document.getElementById('story-form-title').textContent = 'Create New Story';
      document.getElementById('story-badge').textContent = 'Slug: New';
      const slugInput = document.getElementById('story-slug');
      slugInput.value = '';
      slugInput.readOnly = false;
      document.getElementById('story-name').value = '';
      document.getElementById('story-type').value = 'if';
      document.getElementById('story-diverges-from').value = '';
      document.getElementById('story-timeline').value = '';
      handleStoryTypeChange();
      document.getElementById('story-date-published').value = '';
      document.getElementById('story-description').value = '';
      document.getElementById('btn-delete-story').style.display = 'none';

      document.getElementById('supplements-section').style.display = 'none';
      slugInput.focus();
    }

    function resetStoryForm() {
      if (selectedStorySlug) {
        selectStory(selectedStorySlug);
      } else {
        createNewStory();
      }
    }

    function showStoryStatus(msg, type) {
      const box = document.getElementById('story-status-msg');
      box.textContent = msg;
      box.className = type === 'error' ? 'error' : 'success';
      box.style.display = 'block';
      box.style.background = type === 'error' ? '#7f1d1d' : '#064e3b';
      box.style.color = type === 'error' ? '#fecaca' : '#a7f3d0';
      setTimeout(() => {
        box.style.display = 'none';
      }, 4000);
    }

    async function handleStorySave(e) {
      e.preventDefault();
      const slug = document.getElementById('story-slug').value.trim();
      const name = document.getElementById('story-name').value.trim();
      const type = document.getElementById('story-type').value;
      const divergesFrom = type === 'if' ? (document.getElementById('story-diverges-from').value || null) : null;
      const timeline = type === 'side-story' ? (document.getElementById('story-timeline').value.trim() || null) : null;
      const datePublished = document.getElementById('story-date-published').value.trim();
      const description = document.getElementById('story-description').value.trim();

      if (!slug || !name) {
        showStoryStatus('Slug and Name are required.', 'error');
        return;
      }

      const isNew = !selectedStorySlug;
      const url = isNew ? '/api/stories' : '/api/stories/' + encodeURIComponent(selectedStorySlug);
      const method = isNew ? 'POST' : 'PUT';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, name, type, divergesFrom, timeline, datePublished, description })
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to save story');
        }
        showStoryStatus('Story "' + name + '" saved successfully!', 'success');
        selectedStorySlug = slug;
        await loadStories();
      } catch (err) {
        showStoryStatus(err.message, 'error');
      }
    }

    async function handleStoryDelete() {
      if (!selectedStorySlug) return;
      if (!confirm('Are you sure you want to delete story "' + selectedStorySlug + '" and any associated supplements?')) {
        return;
      }

      try {
        const res = await fetch('/api/stories/' + encodeURIComponent(selectedStorySlug), {
          method: 'DELETE'
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to delete story');
        selectedStorySlug = null;
        await loadStories();
        showStoryStatus('Story deleted successfully.', 'success');
      } catch (err) {
        showStoryStatus(err.message, 'error');
      }
    }

    function renderSupplementsList(supplements) {
      const container = document.getElementById('supplements-list-container');
      container.innerHTML = '';

      if (!supplements || supplements.length === 0) {
        container.innerHTML = 
          '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border); border-radius: 8px;">' +
            'No supplements registered for this story yet. Click <strong>+ Add Supplement</strong> to create one.' +
          '</div>';
        return;
      }

      supplements.forEach(s => {
        const item = document.createElement('div');
        item.className = 'supp-item';
        const sourceHtml = s.source && s.source.value ? (
          '<div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.4rem; margin-top: 0.4rem;">' +
            'Source (' + escapeHtml(s.source.type) + '): ' +
            (s.source.type === 'url'
              ? '<a href="' + escapeHtml(s.source.value) + '" target="_blank" style="color: #38bdf8;">' + escapeHtml(s.source.value) + '</a>'
              : escapeHtml(s.source.value)) +
          '</div>'
        ) : '';

        item.innerHTML = 
          '<div class="supp-item-header">' +
            '<div>' +
              '<div class="supp-item-title">' + escapeHtml(s.title) + '</div>' +
              '<div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-top: 0.2rem;">' +
                'ID: ' + escapeHtml(s.id) + (s.date ? ' · Date: ' + escapeHtml(s.date) : '') +
              '</div>' +
            '</div>' +
            '<div class="supp-item-actions">' +
              '<button type="button" class="btn-sm-edit" onclick="openSupplementModal(\'' + escapeHtml(s.id) + '\')">Edit</button>' +
              '<button type="button" class="btn-sm-delete" onclick="handleSupplementDelete(\'' + escapeHtml(s.id) + '\')">Delete</button>' +
            '</div>' +
          '</div>' +
          '<div style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.5; white-space: pre-line; margin: 0.5rem 0;">' +
            escapeHtml(s.content) +
          '</div>' +
          sourceHtml;

        container.appendChild(item);
      });
    }

    function openSupplementModal(suppId) {
      const modal = document.getElementById('supplement-modal');
      const modalTitle = document.getElementById('supp-modal-title');
      const idInput = document.getElementById('supp-id');
      const titleInput = document.getElementById('supp-title');
      const dateInput = document.getElementById('supp-date');
      const typeInput = document.getElementById('supp-source-type');
      const valInput = document.getElementById('supp-source-val');
      const contentInput = document.getElementById('supp-content');

      if (suppId && currentStoryData && currentStoryData.supplements) {
        const supp = currentStoryData.supplements.find(s => s.id === suppId);
        if (supp) {
          modalTitle.textContent = 'Edit Supplement #' + supp.id;
          idInput.value = supp.id;
          titleInput.value = supp.title || '';
          dateInput.value = supp.date || '';
          typeInput.value = (supp.source && supp.source.type) ? supp.source.type : 'url';
          valInput.value = (supp.source && supp.source.value) ? supp.source.value : '';
          contentInput.value = supp.content || '';
        }
      } else {
        modalTitle.textContent = 'Add Supplement';
        idInput.value = '';
        titleInput.value = '';
        dateInput.value = '';
        typeInput.value = 'url';
        valInput.value = '';
        contentInput.value = '';
      }

      modal.classList.add('open');
      titleInput.focus();
    }

    function closeSupplementModal() {
      document.getElementById('supplement-modal').classList.remove('open');
    }

    function handleSupplementModalBackdrop(event) {
      if (event.target.id === 'supplement-modal') {
        closeSupplementModal();
      }
    }

    async function handleSupplementSave(e) {
      e.preventDefault();
      if (!selectedStorySlug) return;

      const id = document.getElementById('supp-id').value;
      const title = document.getElementById('supp-title').value.trim();
      const date = document.getElementById('supp-date').value.trim();
      const sourceType = document.getElementById('supp-source-type').value;
      const sourceValue = document.getElementById('supp-source-val').value.trim();
      const content = document.getElementById('supp-content').value.trim();

      if (!title || !content) {
        alert('Title and Content are required.');
        return;
      }

      const payload = {
        title,
        content,
        date: date || undefined,
        source: {
          type: sourceType,
          value: sourceValue || undefined
        }
      };

      const isEdit = Boolean(id);
      const url = isEdit
        ? '/api/stories/' + encodeURIComponent(selectedStorySlug) + '/supplements/' + encodeURIComponent(id)
        : '/api/stories/' + encodeURIComponent(selectedStorySlug) + '/supplements';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to save supplement');
        closeSupplementModal();
        await selectStory(selectedStorySlug);
        await loadStories();
      } catch (err) {
        alert('Error saving supplement: ' + err.message);
      }
    }

    async function handleSupplementDelete(suppId) {
      if (!confirm('Are you sure you want to delete supplement #' + suppId + '?')) return;
      try {
        const res = await fetch('/api/stories/' + encodeURIComponent(selectedStorySlug) + '/supplements/' + encodeURIComponent(suppId), {
          method: 'DELETE'
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to delete supplement');
        await selectStory(selectedStorySlug);
        await loadStories();
      } catch (err) {
        alert('Error deleting supplement: ' + err.message);
      }
    }

    /* --- Trivia Management Controller --- */
    let allTrivia = [];
    let selectedTriviaId = null;

    async function loadTrivia() {
      try {
        const res = await fetch('/api/trivia');
        if (!res.ok) throw new Error('Failed to load trivia');
        allTrivia = await res.json();
        const triviaCountEl = document.getElementById('trivia-count');
        if (triviaCountEl) triviaCountEl.textContent = allTrivia.length;
        const navTrivia = document.getElementById('nav-trivia-count');
        if (navTrivia) navTrivia.textContent = allTrivia.length;
        renderTriviaList();
        renderTriviaFilterPanes();
        renderTriviaActiveChips();
        populateTriviaArcSelect();

        if (selectedTriviaId) {
          selectTrivia(selectedTriviaId);
        } else if (hasStoredTriviaDraft()) {
          showTriviaDraftBanner();
        } else if (allTrivia.length > 0) {
          selectTrivia(allTrivia[0].id);
        } else {
          createNewTrivia();
        }
      } catch (err) {
        console.error('Error loading trivia:', err);
      }
    }

    function populateTriviaArcSelect() {
      const sel = document.getElementById('trivia-arc');
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = '<option value="general">General / No Story Spoilers</option>';

      if (config.arcs && config.arcs.length > 0) {
        const group = document.createElement('optgroup');
        group.label = 'Canonical Arcs';
        config.arcs.forEach(a => {
          const opt = document.createElement('option');
          opt.value = a.slug;
          opt.textContent = 'Arc ' + a.order + ': ' + a.name;
          group.appendChild(opt);
        });
        sel.appendChild(group);
      }

      if (config.ifRoutes && config.ifRoutes.length > 0) {
        const group = document.createElement('optgroup');
        group.label = 'IF Routes & Side Stories';
        config.ifRoutes.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.slug;
          opt.textContent = r.name;
          group.appendChild(opt);
        });
        sel.appendChild(group);
      }

      sel.value = currentVal || 'general';

      // Also populate trivia-filter-arc
      const filterSel = document.getElementById('trivia-filter-arc');
      if (filterSel && filterSel.options.length <= 1) {
        config.arcs.forEach(a => {
          const opt = document.createElement('option');
          opt.value = a.slug;
          opt.textContent = 'Arc ' + a.order + ': ' + a.name;
          filterSel.appendChild(opt);
        });
        config.ifRoutes.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.slug;
          opt.textContent = r.name;
          filterSel.appendChild(opt);
        });
      }
    }

    /* --- Trivia Multi-Dimensional Filter Engine --- */
    const triviaFilters = {
      text: '',
      verified: 'all', // 'all' | 'verified' | 'unverified'
      arcs: new Set(),
      characters: new Set(),
      topics: new Set(),
      years: new Set(),
      charMatchMode: 'any', // 'any' | 'all'
      activeTab: 'arcs'
    };
    let filteredTriviaEntries = [];

    function handleTriviaSearchInput() {
      const input = document.getElementById('trivia-filter-input');
      const clearBtn = document.getElementById('trivia-filter-clear-btn');
      const val = input ? input.value.trim() : '';
      triviaFilters.text = val.toLowerCase();
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
      renderTriviaList();
      renderTriviaActiveChips();
    }

    function clearTriviaSearch() {
      const input = document.getElementById('trivia-filter-input');
      const clearBtn = document.getElementById('trivia-filter-clear-btn');
      if (input) input.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      triviaFilters.text = '';
      renderTriviaList();
      renderTriviaActiveChips();
      if (input) input.focus();
    }

    function setTriviaVerifiedFilter(mode) {
      triviaFilters.verified = mode;
      ['all', 'verified', 'unverified'].forEach(m => {
        const btn = document.getElementById('btn-tv-' + m);
        if (btn) btn.classList.toggle('active', m === mode);
      });
      renderTriviaList();
      renderTriviaActiveChips();
    }

    function toggleTriviaFilterDrawer() {
      const drawer = document.getElementById('trivia-filters-drawer');
      const btn = document.getElementById('btn-toggle-trivia-filters');
      const chevron = document.getElementById('trivia-filter-chevron');
      if (!drawer) return;
      const isOpen = drawer.style.display !== 'none';
      drawer.style.display = isOpen ? 'none' : 'flex';
      if (btn) btn.classList.toggle('open', !isOpen);
      if (chevron) chevron.textContent = isOpen ? '▾' : '▴';
      if (!isOpen) {
        renderTriviaFilterPanes();
      }
    }

    function switchTriviaFilterTab(tabName) {
      triviaFilters.activeTab = tabName;
      ['arcs', 'characters', 'topics', 'years'].forEach(t => {
        const tabBtnId = t === 'characters' ? 'tab-trivia-filter-chars' : 'tab-trivia-filter-' + t;
        const tabBtn = document.getElementById(tabBtnId);
        const pane = document.getElementById('pane-trivia-filter-' + t);
        if (tabBtn) tabBtn.classList.toggle('active', t === tabName);
        if (pane) pane.classList.toggle('active', t === tabName);
      });
      renderTriviaFilterPanes();
    }

    function matchesTriviaEntry(t) {
      if (triviaFilters.text) {
        const q = triviaFilters.text;
        const inId = t.id && t.id.toLowerCase().includes(q);
        const inTitle = t.title && t.title.toLowerCase().includes(q);
        const inText = t.text && t.text.toLowerCase().includes(q);
        const inArc = t.arc && t.arc.toLowerCase().includes(q);
        const inChars = Array.isArray(t.characters) && t.characters.some(c => c.toLowerCase().includes(q));
        const inTopics = Array.isArray(t.topics) && t.topics.some(tp => tp.toLowerCase().includes(q));
        if (!inId && !inTitle && !inText && !inArc && !inChars && !inTopics) return false;
      }

      if (triviaFilters.verified === 'verified' && !t.verified) return false;
      if (triviaFilters.verified === 'unverified' && t.verified) return false;

      if (triviaFilters.arcs.size > 0 && !triviaFilters.arcs.has(t.arc)) return false;

      if (triviaFilters.characters.size > 0) {
        const itemChars = (t.characters || []).map(c => c.toLowerCase());
        if (triviaFilters.charMatchMode === 'all') {
          for (const reqChar of triviaFilters.characters) {
            if (!itemChars.includes(reqChar)) return false;
          }
        } else {
          let hasAny = false;
          for (const selChar of triviaFilters.characters) {
            if (itemChars.includes(selChar)) {
              hasAny = true;
              break;
            }
          }
          if (!hasAny) return false;
        }
      }

      if (triviaFilters.topics.size > 0) {
        const itemTopics = (t.topics || []).map(tp => tp.toLowerCase());
        let hasAny = false;
        for (const selTopic of triviaFilters.topics) {
          if (itemTopics.includes(selTopic)) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) return false;
      }

      if (triviaFilters.years.size > 0) {
        const rawDate = t.dateTime || t.date || '';
        const matchYear = rawDate.match(/^(\d{4})/);
        const yearStr = matchYear ? matchYear[1] : 'undated';
        if (!triviaFilters.years.has(yearStr)) return false;
      }

      return true;
    }

    function renderTriviaList() {
      const listEl = document.getElementById('trivia-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      filteredTriviaEntries = allTrivia.filter(matchesTriviaEntry);

      const countEl = document.getElementById('trivia-filtered-count');
      if (countEl) {
        countEl.textContent = 'Showing ' + filteredTriviaEntries.length.toLocaleString() + ' of ' + allTrivia.length.toLocaleString();
      }

      updateTriviaNavButtons();

      if (filteredTriviaEntries.length === 0) {
        listEl.innerHTML = '<li style="color: var(--text-muted); text-align: center; padding: 2.5rem 1rem;">' +
          'No matching trivia found.<br>' +
          '<button type="button" class="btn-clear-all-filters" style="margin-top:0.75rem;" onclick="clearAllTriviaFilters()">Reset Filters</button>' +
          '</li>';
        return;
      }

      const fragment = document.createDocumentFragment();
      filteredTriviaEntries.forEach(t => {
        const li = document.createElement('li');
        if (t.id === selectedTriviaId) li.className = 'active';
        li.onclick = () => {
          if (isTriviaDirty && !confirm('You have unsaved changes. Discard and open trivia #' + t.id + '?')) {
            return;
          }
          selectTrivia(t.id);
        };

        const verifiedBadge = t.verified
          ? '<span class="badge-verified-mini" title="Verified Primary Source">✓</span>'
          : '<span class="badge-unverified-mini" title="Unverified">⚠</span>';

        const dateTag = t.dateTime
          ? '<span class="entry-date-text">' + escapeHtml(t.dateTime.length > 10 ? t.dateTime.slice(0, 10) : t.dateTime) + '</span>'
          : '';

        const chars = Array.isArray(t.characters) ? t.characters : [];
        let chipsHtml = '';
        if (chars.length > 0) {
          const previewChars = chars.slice(0, 2);
          const moreCount = chars.length - previewChars.length;
          chipsHtml = '<div class="entry-chips-row">' +
            previewChars.map(c => '<span class="mini-char-chip">' + escapeHtml(c) + '</span>').join('') +
            (moreCount > 0 ? '<span class="mini-char-chip more">+' + moreCount + '</span>' : '') +
            '</div>';
        }

        const titleOrSnippet = t.title
          ? '<strong>' + escapeHtml(t.title) + '</strong>: ' + escapeHtml(t.text)
          : escapeHtml(t.text);

        li.innerHTML =
          '<div class="entry-meta">' +
            '<div class="entry-meta-left">' +
              '<span class="badge-entry-id">#' + escapeHtml(t.id) + '</span>' +
              verifiedBadge +
              '<span class="badge-arc-mini">' + escapeHtml(t.arc) + '</span>' +
            '</div>' +
            '<div class="entry-meta-right">' + dateTag + '</div>' +
          '</div>' +
          '<div class="entry-q">' + titleOrSnippet + '</div>' +
          chipsHtml;

        fragment.appendChild(li);
      });
      listEl.appendChild(fragment);
    }

    function updateTriviaNavButtons() {
      const prevBtn = document.getElementById('btn-trivia-prev-entry');
      const nextBtn = document.getElementById('btn-trivia-next-entry');
      if (!prevBtn || !nextBtn) return;

      const idx = filteredTriviaEntries.findIndex(t => t.id === selectedTriviaId);
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx < 0 || idx >= filteredTriviaEntries.length - 1;
      prevBtn.title = idx > 0 ? 'Previous: #' + filteredTriviaEntries[idx - 1].id + ' (Alt+[)' : 'No previous trivia';
      nextBtn.title = (idx >= 0 && idx < filteredTriviaEntries.length - 1) ? 'Next: #' + filteredTriviaEntries[idx + 1].id + ' (Alt+])' : 'No next trivia';
    }

    function navigateToPrevTrivia() {
      const idx = filteredTriviaEntries.findIndex(t => t.id === selectedTriviaId);
      if (idx > 0) {
        if (isTriviaDirty && !confirm('You have unsaved changes. Discard and navigate?')) return;
        selectTrivia(filteredTriviaEntries[idx - 1].id);
      }
    }

    function navigateToNextTrivia() {
      const idx = filteredTriviaEntries.findIndex(t => t.id === selectedTriviaId);
      if (idx >= 0 && idx < filteredTriviaEntries.length - 1) {
        if (isTriviaDirty && !confirm('You have unsaved changes. Discard and navigate?')) return;
        selectTrivia(filteredTriviaEntries[idx + 1].id);
      }
    }

    function renderTriviaFilterPanes() {
      const bArcs = document.getElementById('badge-trivia-f-arcs');
      const bChars = document.getElementById('badge-trivia-f-chars');
      const bTopics = document.getElementById('badge-trivia-f-topics');
      const bYears = document.getElementById('badge-trivia-f-years');
      if (bArcs) bArcs.textContent = triviaFilters.arcs.size > 0 ? '(' + triviaFilters.arcs.size + ')' : '';
      if (bChars) bChars.textContent = triviaFilters.characters.size > 0 ? '(' + triviaFilters.characters.size + ')' : '';
      if (bTopics) bTopics.textContent = triviaFilters.topics.size > 0 ? '(' + triviaFilters.topics.size + ')' : '';
      if (bYears) bYears.textContent = triviaFilters.years.size > 0 ? '(' + triviaFilters.years.size + ')' : '';

      if (triviaFilters.activeTab === 'arcs') renderTriviaArcsChecklist();
      else if (triviaFilters.activeTab === 'characters') renderTriviaCharChecklist();
      else if (triviaFilters.activeTab === 'topics') renderTriviaTopicChecklist();
      else if (triviaFilters.activeTab === 'years') renderTriviaYearsGrid();
    }

    function renderTriviaArcsChecklist() {
      const container = document.getElementById('trivia-filter-arcs-list');
      if (!container) return;
      container.innerHTML = '';

      const counts = {};
      allTrivia.forEach(t => {
        const a = t.arc || 'general';
        counts[a] = (counts[a] || 0) + 1;
      });

      const items = [
        { slug: 'general', name: 'General / No Spoilers' },
        ...(config.arcs || []).map(a => ({ slug: a.slug, name: 'Arc ' + a.order + ': ' + a.name })),
        ...(config.ifRoutes || []).map(r => ({ slug: r.slug, name: r.name }))
      ];

      items.forEach(item => {
        const row = document.createElement('label');
        row.className = 'filter-check-row';
        const isChecked = triviaFilters.arcs.has(item.slug);
        const count = counts[item.slug] || 0;
        row.innerHTML =
          '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>' +
          '<span class="filter-check-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="filter-check-count">' + count + '</span>';

        row.querySelector('input').onchange = (e) => {
          if (e.target.checked) triviaFilters.arcs.add(item.slug);
          else triviaFilters.arcs.delete(item.slug);
          renderTriviaList();
          renderTriviaActiveChips();
          renderTriviaFilterPanes();
        };
        container.appendChild(row);
      });
    }

    function selectAllTriviaArcs() {
      triviaFilters.arcs.add('general');
      (config.arcs || []).forEach(a => triviaFilters.arcs.add(a.slug));
      (config.ifRoutes || []).forEach(r => triviaFilters.arcs.add(r.slug));
      renderTriviaList();
      renderTriviaActiveChips();
      renderTriviaFilterPanes();
    }

    function clearTriviaArcs() {
      triviaFilters.arcs.clear();
      renderTriviaList();
      renderTriviaActiveChips();
      renderTriviaFilterPanes();
    }

    function renderTriviaCharChecklist() {
      const container = document.getElementById('trivia-filter-chars-list');
      if (!container) return;
      const searchVal = (document.getElementById('trivia-filter-char-search')?.value || '').toLowerCase().trim();
      container.innerHTML = '';

      const counts = new Map();
      allTrivia.forEach(t => {
        if (Array.isArray(t.characters)) {
          t.characters.forEach(c => {
            if (!c) return;
            const lower = c.toLowerCase();
            if (!counts.has(lower)) counts.set(lower, { name: c, count: 0 });
            counts.get(lower).count++;
          });
        }
      });
      (config.characters || []).forEach(c => {
        const lower = c.toLowerCase();
        if (!counts.has(lower)) counts.set(lower, { name: c, count: 0 });
      });

      let list = Array.from(counts.values());
      if (searchVal) {
        list = list.filter(item => item.name.toLowerCase().includes(searchVal));
      }

      list.sort((a, b) => {
        const aChecked = triviaFilters.characters.has(a.name.toLowerCase());
        const bChecked = triviaFilters.characters.has(b.name.toLowerCase());
        if (aChecked !== bChecked) return aChecked ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      if (list.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.75rem; padding:0.5rem;">No characters matched.</span>';
        return;
      }

      const fragment = document.createDocumentFragment();
      list.forEach(item => {
        const row = document.createElement('label');
        row.className = 'filter-check-row';
        const lower = item.name.toLowerCase();
        const isChecked = triviaFilters.characters.has(lower);
        row.innerHTML =
          '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>' +
          '<span class="filter-check-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="filter-check-count">' + item.count + '</span>';

        row.querySelector('input').onchange = (e) => {
          if (e.target.checked) triviaFilters.characters.add(lower);
          else triviaFilters.characters.delete(lower);
          renderTriviaList();
          renderTriviaActiveChips();
          renderTriviaFilterPanes();
        };
        fragment.appendChild(row);
      });
      container.appendChild(fragment);
    }

    function toggleTriviaCharMatchMode() {
      triviaFilters.charMatchMode = triviaFilters.charMatchMode === 'any' ? 'all' : 'any';
      const btn = document.getElementById('btn-trivia-char-match-mode');
      if (btn) btn.textContent = triviaFilters.charMatchMode === 'any' ? 'Match: Any (OR)' : 'Match: All (AND)';
      renderTriviaList();
    }

    function clearTriviaChars() {
      triviaFilters.characters.clear();
      renderTriviaList();
      renderTriviaActiveChips();
      renderTriviaFilterPanes();
    }

    function renderTriviaTopicChecklist() {
      const container = document.getElementById('trivia-filter-topics-list');
      if (!container) return;
      const searchVal = (document.getElementById('trivia-filter-topic-search')?.value || '').toLowerCase().trim();
      container.innerHTML = '';

      const counts = new Map();
      allTrivia.forEach(t => {
        if (Array.isArray(t.topics)) {
          t.topics.forEach(tp => {
            if (!tp) return;
            const lower = tp.toLowerCase();
            if (!counts.has(lower)) counts.set(lower, { name: tp, count: 0 });
            counts.get(lower).count++;
          });
        }
      });
      (config.topics || []).forEach(tp => {
        const lower = tp.toLowerCase();
        if (!counts.has(lower)) counts.set(lower, { name: tp, count: 0 });
      });

      let list = Array.from(counts.values());
      if (searchVal) {
        list = list.filter(item => item.name.toLowerCase().includes(searchVal));
      }

      list.sort((a, b) => {
        const aChecked = triviaFilters.topics.has(a.name.toLowerCase());
        const bChecked = triviaFilters.topics.has(b.name.toLowerCase());
        if (aChecked !== bChecked) return aChecked ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      if (list.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:0.75rem; padding:0.5rem;">No topics matched.</span>';
        return;
      }

      const fragment = document.createDocumentFragment();
      list.forEach(item => {
        const row = document.createElement('label');
        row.className = 'filter-check-row';
        const lower = item.name.toLowerCase();
        const isChecked = triviaFilters.topics.has(lower);
        row.innerHTML =
          '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>' +
          '<span class="filter-check-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="filter-check-count">' + item.count + '</span>';

        row.querySelector('input').onchange = (e) => {
          if (e.target.checked) triviaFilters.topics.add(lower);
          else triviaFilters.topics.delete(lower);
          renderTriviaList();
          renderTriviaActiveChips();
          renderTriviaFilterPanes();
        };
        fragment.appendChild(row);
      });
      container.appendChild(fragment);
    }

    function clearTriviaTopics() {
      triviaFilters.topics.clear();
      renderTriviaList();
      renderTriviaActiveChips();
      renderTriviaFilterPanes();
    }

    function renderTriviaYearsGrid() {
      const container = document.getElementById('trivia-filter-years-grid');
      if (!container) return;
      container.innerHTML = '';

      const counts = {};
      allTrivia.forEach(t => {
        const rawDate = t.dateTime || t.date || '';
        const matchYear = rawDate.match(/^(\d{4})/);
        const y = matchYear ? matchYear[1] : 'undated';
        counts[y] = (counts[y] || 0) + 1;
      });

      const years = Object.keys(counts).filter(y => y !== 'undated').sort((a, b) => b.localeCompare(a));
      if (counts['undated']) years.push('undated');

      years.forEach(y => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isSelected = triviaFilters.years.has(y);
        btn.className = 'year-filter-pill' + (isSelected ? ' active' : '');
        btn.innerHTML = '<span>' + (y === 'undated' ? 'Undated' : y) + '</span><span class="year-count">(' + counts[y] + ')</span>';
        btn.onclick = () => {
          if (triviaFilters.years.has(y)) triviaFilters.years.delete(y);
          else triviaFilters.years.add(y);
          renderTriviaList();
          renderTriviaActiveChips();
          renderTriviaYearsGrid();
          renderTriviaFilterPanes();
        };
        container.appendChild(btn);
      });
    }

    function clearTriviaYears() {
      triviaFilters.years.clear();
      renderTriviaList();
      renderTriviaActiveChips();
      renderTriviaFilterPanes();
    }

    function renderTriviaActiveChips() {
      const container = document.getElementById('trivia-active-chips');
      const badge = document.getElementById('trivia-filter-count-badge');
      const filterToggleBtn = document.getElementById('btn-toggle-trivia-filters');
      const clearAllBtn = document.getElementById('btn-trivia-clear-all');
      if (!container) return;

      const chips = [];

      triviaFilters.arcs.forEach(slug => {
        let label = slug;
        if (slug === 'general') label = 'General';
        else {
          const arcObj = (config.arcs || []).find(a => a.slug === slug);
          if (arcObj) label = 'Arc ' + arcObj.order;
          else {
            const ifObj = (config.ifRoutes || []).find(r => r.slug === slug);
            if (ifObj) label = ifObj.name;
          }
        }
        chips.push({
          label: label.startsWith('Arc ') ? label : (slug === 'general' ? 'General' : 'Story: ' + label),
          onRemove: () => { triviaFilters.arcs.delete(slug); onTriviaFilterChange(); }
        });
      });

      triviaFilters.characters.forEach(lower => {
        const matchChar = (config.characters || []).find(c => c.toLowerCase() === lower);
        chips.push({
          label: 'Char: ' + (matchChar || lower),
          onRemove: () => { triviaFilters.characters.delete(lower); onTriviaFilterChange(); }
        });
      });

      triviaFilters.topics.forEach(lower => {
        const matchTopic = (config.topics || []).find(t => t.toLowerCase() === lower);
        chips.push({
          label: 'Topic: ' + (matchTopic || lower),
          onRemove: () => { triviaFilters.topics.delete(lower); onTriviaFilterChange(); }
        });
      });

      triviaFilters.years.forEach(year => {
        chips.push({
          label: 'Year: ' + (year === 'undated' ? 'Undated' : year),
          onRemove: () => { triviaFilters.years.delete(year); onTriviaFilterChange(); }
        });
      });

      if (triviaFilters.verified !== 'all') {
        chips.push({
          label: 'Status: ' + (triviaFilters.verified === 'verified' ? 'Verified' : 'Unverified'),
          onRemove: () => { setTriviaVerifiedFilter('all'); }
        });
      }

      const totalDrawerFilters = triviaFilters.arcs.size + triviaFilters.characters.size + triviaFilters.topics.size + triviaFilters.years.size;
      if (badge) {
        badge.textContent = totalDrawerFilters;
        badge.style.display = totalDrawerFilters > 0 ? 'inline-block' : 'none';
      }
      if (filterToggleBtn) {
        filterToggleBtn.classList.toggle('has-active', totalDrawerFilters > 0);
      }

      const hasAnyFilters = chips.length > 0 || !!triviaFilters.text;
      if (clearAllBtn) {
        clearAllBtn.style.display = hasAnyFilters ? 'inline-block' : 'none';
      }

      if (chips.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
      }

      container.style.display = 'flex';
      container.innerHTML = '';
      chips.forEach(chip => {
        const chipEl = document.createElement('span');
        chipEl.className = 'filter-chip';
        chipEl.innerHTML = escapeHtml(chip.label) + ' <button type="button" class="filter-chip-remove" title="Remove filter">&times;</button>';
        chipEl.querySelector('button').onclick = (e) => {
          e.stopPropagation();
          chip.onRemove();
        };
        container.appendChild(chipEl);
      });

      function onTriviaFilterChange() {
        renderTriviaList();
        renderTriviaActiveChips();
        renderTriviaFilterPanes();
      }
    }

    function clearAllTriviaFilters() {
      triviaFilters.text = '';
      triviaFilters.verified = 'all';
      triviaFilters.arcs.clear();
      triviaFilters.characters.clear();
      triviaFilters.topics.clear();
      triviaFilters.years.clear();

      const filterInput = document.getElementById('trivia-filter-input');
      if (filterInput) filterInput.value = '';
      const clearBtn = document.getElementById('trivia-filter-clear-btn');
      if (clearBtn) clearBtn.style.display = 'none';

      ['all', 'verified', 'unverified'].forEach(m => {
        const btn = document.getElementById('btn-tv-' + m);
        if (btn) btn.classList.toggle('active', m === 'all');
      });

      renderTriviaList();
      renderTriviaActiveChips();
      renderTriviaFilterPanes();
    }

    /* --- Trivia Form, Input & Duplicate Detection Handlers --- */
    let isExactTriviaDuplicate = false;
    let triviaDupDebounceTimer = null;
    let triviaTagDebounceTimer = null;
    const TRIVIA_DRAFT_KEY = 'od_lagna_admin_trivia_draft';
    let isTriviaDirty = false;
    let triviaDraftSaveTimer = null;

    function handleTriviaTitleInput() {
      markTriviaFormDirty();
      const title = document.getElementById('trivia-title').value;
      const lenEl = document.getElementById('trivia-title-len');
      if (lenEl) lenEl.textContent = title.length + ' chars';
      triggerTriviaTagSuggestions();
    }

    function handleTriviaTextInput() {
      markTriviaFormDirty();
      const text = document.getElementById('trivia-text').value;
      const lenEl = document.getElementById('trivia-text-len');
      if (lenEl) lenEl.textContent = text.length + ' chars';

      clearTimeout(triviaDupDebounceTimer);
      triviaDupDebounceTimer = setTimeout(() => {
        checkTriviaDuplicateRealtime(text);
      }, 200);

      triggerTriviaTagSuggestions();
    }

    async function checkTriviaDuplicateRealtime(text) {
      const warnBox = document.getElementById('trivia-duplicate-warning');
      const saveBtn = document.getElementById('btn-trivia-save');
      if (!warnBox || !saveBtn) return;

      if (!text || text.trim().length < 5) {
        warnBox.className = 'dup-alert';
        warnBox.innerHTML = '';
        isExactTriviaDuplicate = false;
        saveBtn.disabled = false;
        saveBtn.classList.remove('disabled');
        return;
      }

      const currentId = selectedTriviaId || document.getElementById('trivia-entry-id')?.value?.trim() || null;

      try {
        const res = await fetch('/api/check-trivia-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, currentId })
        });
        const data = await res.json();

        if (data.isExactDuplicate && data.exactMatch) {
          isExactTriviaDuplicate = true;
          saveBtn.disabled = true;
          saveBtn.classList.add('disabled');
          warnBox.className = 'dup-alert exact';
          warnBox.innerHTML = '';

          const head = document.createElement('div');
          head.className = 'dup-alert-head';
          const title = document.createElement('span');
          title.textContent = '🚫 Exact Duplicate Trivia Statement!';
          const jumpBtn = document.createElement('button');
          jumpBtn.type = 'button';
          jumpBtn.className = 'btn-jump-entry';
          jumpBtn.textContent = 'Open Trivia #' + data.exactMatch.id;
          jumpBtn.onclick = () => jumpToTrivia(data.exactMatch.id);
          head.appendChild(title);
          head.appendChild(jumpBtn);

          const desc = document.createElement('div');
          desc.innerHTML = 'Statement identical to existing entry <strong>#' + data.exactMatch.id + '</strong>. Duplicates are strictly blocked from being saved.';

          warnBox.appendChild(head);
          warnBox.appendChild(desc);
        } else if (data.similarMatches && data.similarMatches.length > 0) {
          isExactTriviaDuplicate = false;
          saveBtn.disabled = false;
          saveBtn.classList.remove('disabled');
          warnBox.className = 'dup-alert similar';
          warnBox.innerHTML = '';

          const head = document.createElement('div');
          head.className = 'dup-alert-head';
          head.innerHTML = '<span>⚠️ Similar Trivia Statements Found In Database:</span>';
          warnBox.appendChild(head);

          const ul = document.createElement('ul');
          ul.className = 'dup-match-list';
          data.similarMatches.slice(0, 3).forEach(m => {
            const li = document.createElement('li');
            li.className = 'dup-match-item';

            const pct = Math.round(m.similarity * 100);
            const tag = document.createElement('span');
            tag.className = 'sim-tag';
            tag.textContent = pct + '% match';

            const previewText = document.createElement('span');
            previewText.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
            previewText.textContent = (m.title ? '[' + m.title + '] ' : '') + (m.text || m.question || '');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-jump-entry';
            btn.textContent = '#' + m.id;
            btn.onclick = () => jumpToTrivia(m.id);

            li.appendChild(tag);
            li.appendChild(previewText);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          warnBox.appendChild(ul);
        } else {
          isExactTriviaDuplicate = false;
          saveBtn.disabled = false;
          saveBtn.classList.remove('disabled');
          warnBox.className = 'dup-alert';
          warnBox.innerHTML = '';
        }
      } catch (err) {
        console.error('Trivia duplicate check error:', err);
      }
    }

    function jumpToTrivia(id) {
      if (isTriviaDirty && !confirm('Switching will discard unsaved edits. Open trivia #' + id + '?')) {
        return;
      }
      selectTrivia(id);
    }

    /* --- Smart Tag Suggestions & Tag Cloud --- */
    function triggerTriviaTagSuggestions() {
      clearTimeout(triviaTagDebounceTimer);
      triviaTagDebounceTimer = setTimeout(async () => {
        const fullText = (document.getElementById('trivia-title')?.value || '') + ' ' + (document.getElementById('trivia-text')?.value || '');
        if (fullText.trim().length < 8) {
          hideTriviaTagSuggestions();
          return;
        }

        try {
          const res = await fetch('/api/suggest-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText })
          });
          const data = await res.json();
          renderTriviaTagSuggestions(data.characters || [], data.topics || []);
        } catch (err) {
          console.error('Trivia tag suggestion error:', err);
        }
      }, 250);
    }

    function renderTriviaTagSuggestions(suggestedChars, suggestedTopics) {
      const activeChars = getSelectedTagsSet('trivia-characters');
      const activeTopics = getSelectedTagsSet('trivia-topics');

      // Characters
      const newChars = suggestedChars.filter(c => !activeChars.has(c.toLowerCase()));
      const charShelf = document.getElementById('trivia-char-suggestions');
      const charCloud = document.getElementById('trivia-char-suggestions-cloud');

      if (charShelf && charCloud) {
        if (newChars.length > 0) {
          charCloud.innerHTML = '';
          newChars.forEach(c => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'suggestion-pill';
            pill.textContent = '+ ' + c;
            pill.onclick = () => {
              toggleTag('trivia-characters', c);
              renderTriviaTagClouds();
              triggerTriviaTagSuggestions();
            };
            charCloud.appendChild(pill);
          });
          charShelf.classList.add('visible');
        } else {
          charShelf.classList.remove('visible');
        }
      }

      // Topics
      const newTopics = suggestedTopics.filter(t => !activeTopics.has(t.toLowerCase()));
      const topicShelf = document.getElementById('trivia-topic-suggestions');
      const topicCloud = document.getElementById('trivia-topic-suggestions-cloud');

      if (topicShelf && topicCloud) {
        if (newTopics.length > 0) {
          topicCloud.innerHTML = '';
          newTopics.forEach(t => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'suggestion-pill';
            pill.textContent = '+ ' + t;
            pill.onclick = () => {
              toggleTag('trivia-topics', t);
              renderTriviaTagClouds();
              triggerTriviaTagSuggestions();
            };
            topicCloud.appendChild(pill);
          });
          topicShelf.classList.add('visible');
        } else {
          topicShelf.classList.remove('visible');
        }
      }
    }

    function hideTriviaTagSuggestions() {
      document.getElementById('trivia-char-suggestions')?.classList.remove('visible');
      document.getElementById('trivia-topic-suggestions')?.classList.remove('visible');
    }

    function addAllTriviaSuggestions(inputId, cloudId) {
      const cloud = document.getElementById(cloudId);
      if (!cloud) return;
      const buttons = cloud.querySelectorAll('button');
      buttons.forEach(btn => {
        const tag = btn.textContent.replace(/^\+\s*/, '').trim();
        if (tag) {
          addSingleTag(inputId, tag);
        }
      });
      renderTriviaTagClouds();
      triggerTriviaTagSuggestions();
    }

    function renderTriviaTagClouds() {
      renderCloud('trivia-characters', config.characters || [], 'trivia-character-chips', 'trivia-char-filter');
      renderCloud('trivia-topics', config.topics || [], 'trivia-topic-chips', 'trivia-topic-filter');
    }

    /* --- Sources UI Management for Trivia --- */
    function createTriviaSourceRowElement(type = 'url', value = '') {
      const row = document.createElement('div');
      row.className = 'source-row';

      const select = document.createElement('select');
      select.className = 'source-type-select';
      select.onchange = markTriviaFormDirty;

      const optUrl = document.createElement('option');
      optUrl.value = 'url';
      optUrl.textContent = 'URL Link';
      if (type === 'url') optUrl.selected = true;

      const optText = document.createElement('option');
      optText.value = 'text';
      optText.textContent = 'Free Text';
      if (type === 'text') optText.selected = true;

      select.appendChild(optUrl);
      select.appendChild(optText);

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'source-value-input';
      input.placeholder = 'https://x.com/... or 2018 Birthday Tweet';
      input.value = value || '';
      input.oninput = markTriviaFormDirty;

      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn-remove-source';
      btnRemove.title = 'Remove source';
      btnRemove.textContent = '✕';
      btnRemove.onclick = () => removeTriviaSourceRow(row);

      row.appendChild(select);
      row.appendChild(input);
      row.appendChild(btnRemove);

      return row;
    }

    function addTriviaSourceRowUI(type = 'url', value = '') {
      const container = document.getElementById('trivia-sources-container');
      if (!container) return;
      const row = createTriviaSourceRowElement(type, value);
      container.appendChild(row);
      updateTriviaSourceRemoveButtons();
      markTriviaFormDirty();
      const input = row.querySelector('.source-value-input');
      if (input) input.focus();
    }

    function removeTriviaSourceRow(row) {
      const container = document.getElementById('trivia-sources-container');
      if (!container) return;
      const rows = container.querySelectorAll('.source-row');
      if (rows.length > 1) {
        row.remove();
        updateTriviaSourceRemoveButtons();
        markTriviaFormDirty();
      } else {
        const input = row.querySelector('.source-value-input');
        if (input) input.value = '';
        const select = row.querySelector('.source-type-select');
        if (select) select.value = 'url';
        markTriviaFormDirty();
      }
    }

    function updateTriviaSourceRemoveButtons() {
      const container = document.getElementById('trivia-sources-container');
      const rows = container ? container.querySelectorAll('.source-row') : [];
      rows.forEach(r => {
        const btn = r.querySelector('.btn-remove-source');
        if (btn) {
          btn.style.opacity = rows.length === 1 ? '0.35' : '1';
          btn.title = rows.length === 1 ? 'Clear source' : 'Remove source';
        }
      });
    }

    function setTriviaSourcesInUI(sourcesList) {
      const container = document.getElementById('trivia-sources-container');
      if (!container) return;
      container.innerHTML = '';
      const list = (Array.isArray(sourcesList) && sourcesList.length > 0)
        ? sourcesList
        : [{ type: 'url', value: '' }];

      list.forEach(src => {
        const row = createTriviaSourceRowElement(src.type || 'url', src.value || '');
        container.appendChild(row);
      });
      updateTriviaSourceRemoveButtons();
    }

    function getTriviaSourcesFromUI() {
      const container = document.getElementById('trivia-sources-container');
      const rows = container ? container.querySelectorAll('.source-row') : [];
      const result = [];
      rows.forEach(r => {
        const type = r.querySelector('.source-type-select').value;
        const value = r.querySelector('.source-value-input').value.trim();
        if (value) {
          result.push({ type, value });
        }
      });
      return result;
    }

    /* --- Trivia Draft Autosave & Restore --- */
    function markTriviaFormDirty() {
      isTriviaDirty = true;
      saveTriviaDraftDebounced();
    }

    function saveTriviaDraftDebounced() {
      clearTimeout(triviaDraftSaveTimer);
      triviaDraftSaveTimer = setTimeout(() => {
        if (!selectedTriviaId) {
          const draft = {
            id: document.getElementById('trivia-entry-id')?.value || '',
            title: document.getElementById('trivia-title').value,
            text: document.getElementById('trivia-text').value,
            arc: document.getElementById('trivia-arc').value,
            verified: document.getElementById('trivia-verified').checked,
            characters: document.getElementById('trivia-characters').value,
            topics: document.getElementById('trivia-topics').value,
            sources: getTriviaSourcesFromUI(),
            day: document.getElementById('trivia-date-day').value,
            month: document.getElementById('trivia-date-month').value,
            year: document.getElementById('trivia-date-year').value,
            time: document.getElementById('trivia-date-time-val').value,
            savedAt: new Date().toISOString()
          };
          if (draft.text.trim() || draft.title.trim()) {
            localStorage.setItem(TRIVIA_DRAFT_KEY, JSON.stringify(draft));
          }
        }
      }, 1000);
    }

    function hasStoredTriviaDraft() {
      return !!localStorage.getItem(TRIVIA_DRAFT_KEY);
    }

    function showTriviaDraftBanner() {
      try {
        const draft = JSON.parse(localStorage.getItem(TRIVIA_DRAFT_KEY) || '{}');
        if (draft.text || draft.title) {
          isExactTriviaDuplicate = false;
          const banner = document.getElementById('trivia-draft-banner');
          if (banner) banner.classList.add('visible');
          if (draft.id) {
            selectedTriviaId = draft.id;
            document.getElementById('trivia-entry-id').value = draft.id;
            document.getElementById('trivia-badge-id').textContent = 'ID: #' + draft.id;
          }
          if (draft.title) document.getElementById('trivia-title').value = draft.title;
          if (draft.text) document.getElementById('trivia-text').value = draft.text;
          if (draft.arc) document.getElementById('trivia-arc').value = draft.arc;
          if (draft.verified !== undefined) document.getElementById('trivia-verified').checked = !!draft.verified;
          if (draft.characters) document.getElementById('trivia-characters').value = draft.characters;
          if (draft.topics) document.getElementById('trivia-topics').value = draft.topics;
          if (draft.sources) {
            setTriviaSourcesInUI(draft.sources);
          }
          if (draft.year) {
            ensureTriviaYearInSelect(draft.year);
            document.getElementById('trivia-date-year').value = draft.year;
            document.getElementById('trivia-date-month').value = draft.month || '';
            document.getElementById('trivia-date-day').value = draft.day || '';
            document.getElementById('trivia-date-time-val').value = draft.time || '';
            updateTriviaDatePreview();
          }
          handleTriviaTitleInput();
          handleTriviaTextInput();
          renderTriviaTagClouds();
        }
      } catch (e) {
        clearStoredTriviaDraft();
      }
    }

    function discardTriviaDraft() {
      clearStoredTriviaDraft();
      isExactTriviaDuplicate = false;
      createNewTrivia();
    }

    function clearStoredTriviaDraft() {
      localStorage.removeItem(TRIVIA_DRAFT_KEY);
      const banner = document.getElementById('trivia-draft-banner');
      if (banner) banner.classList.remove('visible');
    }

    /* --- Trivia Quick Paste Modal --- */
    function openTriviaQuickPasteModal() {
      const modal = document.getElementById('trivia-quick-paste-modal');
      if (modal) modal.classList.add('open');
      const input = document.getElementById('trivia-quick-paste-text');
      if (input) input.focus();
    }

    function closeTriviaQuickPasteModal() {
      const modal = document.getElementById('trivia-quick-paste-modal');
      if (modal) modal.classList.remove('open');
    }

    function handleTriviaModalBackdrop(e) {
      if (e.target.id === 'trivia-quick-paste-modal') {
        closeTriviaQuickPasteModal();
      }
    }

    function insertTriviaQuickPasteSample() {
      const input = document.getElementById('trivia-quick-paste-text');
      if (!input) return;
      input.value =
        "Title: Emilia's raw physical strength\n" +
        "Statement: Emilia's physical strength is very high among the royal candidates, second only to Felt in raw agility and Priscilla in balanced battle power. She can easily punch through ice boulders without magic.\n" +
        "Date: 2019-09-23\n" +
        "Arc: general\n" +
        "Source: https://twitter.com/nezumiironyanko/status/1176145678901234567\n" +
        "Verified: yes";
    }

    async function applyTriviaQuickPaste() {
      const raw = document.getElementById('trivia-quick-paste-text').value;
      if (!raw.trim()) {
        alert('Please paste some text first.');
        return;
      }

      try {
        const res = await fetch('/api/parse-trivia-quick-paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: raw })
        });
        const { parsed } = await res.json();

        await createNewTrivia();
        if (parsed.title) document.getElementById('trivia-title').value = parsed.title;
        if (parsed.text) document.getElementById('trivia-text').value = parsed.text;
        if (parsed.arc) document.getElementById('trivia-arc').value = parsed.arc;
        if (parsed.dateTime) setTriviaDateFromValue(parsed.dateTime);
        if (parsed.verified !== undefined) document.getElementById('trivia-verified').checked = !!parsed.verified;
        if (parsed.source) {
          setTriviaSourcesInUI([parsed.source]);
        }
        if (parsed.characters && parsed.characters.length > 0) {
          document.getElementById('trivia-characters').value = parsed.characters.join(', ') + ', ';
        }
        if (parsed.topics && parsed.topics.length > 0) {
          document.getElementById('trivia-topics').value = parsed.topics.join(', ') + ', ';
        }

        closeTriviaQuickPasteModal();
        handleTriviaTitleInput();
        handleTriviaTextInput();
        renderTriviaTagClouds();
        markTriviaFormDirty();
        showTriviaStatus('Quick paste parsed and trivia fields populated successfully!', 'success');
      } catch (err) {
        alert('Quick paste failed: ' + err.message);
      }
    }

    /* --- Trivia Clone as Template --- */
    async function cloneTriviaAsTemplate() {
      selectedTriviaId = null;
      isExactTriviaDuplicate = false;
      document.getElementById('trivia-form-title').textContent = 'Create New Trivia (From Template)';
      document.getElementById('btn-trivia-delete').style.display = 'none';
      document.getElementById('btn-trivia-clone').style.display = 'none';
      document.getElementById('trivia-entry-id').value = '';
      document.getElementById('trivia-title').value = '';
      document.getElementById('trivia-text').value = '';
      document.getElementById('trivia-title-len').textContent = '0 chars';
      document.getElementById('trivia-text-len').textContent = '0 chars';
      hideTriviaStatus();
      hideTriviaTagSuggestions();

      const warnBox = document.getElementById('trivia-duplicate-warning');
      if (warnBox) {
        warnBox.className = 'dup-alert';
        warnBox.innerHTML = '';
      }
      const saveBtn = document.getElementById('btn-trivia-save');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('disabled');
      }

      try {
        const res = await fetch('/api/trivia/next-id');
        const data = await res.json();
        document.getElementById('trivia-badge-id').textContent = 'ID: #' + (data.nextId || 'TR-0001');
      } catch {
        document.getElementById('trivia-badge-id').textContent = 'ID: Auto-assigned';
      }

      showTriviaStatus('Template copied: Date, Arc, Verified, Sources, and Tags retained for rapid authoring!', 'success');
      markTriviaFormDirty();
      renderTriviaList();
      document.getElementById('trivia-text').focus();
    }

    /* --- Status Helpers --- */
    function showTriviaStatus(msg, type) {
      const box = document.getElementById('trivia-status-msg');
      if (!box) return;
      box.textContent = msg;
      box.className = 'status-msg ' + (type === 'error' ? 'error' : 'success');
      box.style.display = 'block';
      setTimeout(() => {
        box.style.display = 'none';
      }, 4000);
    }

    function hideTriviaStatus() {
      const box = document.getElementById('trivia-status-msg');
      if (box) box.style.display = 'none';
    }

    /* --- Trivia Selection & CRUD Operations --- */
    async function selectTrivia(id) {
      selectedTriviaId = id;
      isExactTriviaDuplicate = false;
      hideTriviaStatus();
      hideTriviaTagSuggestions();
      const draftBanner = document.getElementById('trivia-draft-banner');
      if (draftBanner) draftBanner.classList.remove('visible');
      renderTriviaList();

      try {
        const res = await fetch('/api/trivia/' + encodeURIComponent(id));
        if (!res.ok) {
          showTriviaStatus('Failed to load trivia #' + id, 'error');
          return;
        }
        const data = await res.json();

        document.getElementById('trivia-form-title').textContent = 'Edit Trivia Entry #' + data.id;
        document.getElementById('trivia-badge-id').textContent = 'ID: #' + data.id;
        document.getElementById('btn-trivia-delete').style.display = 'block';
        document.getElementById('btn-trivia-clone').style.display = 'inline-flex';

        document.getElementById('trivia-entry-id').value = data.id;
        document.getElementById('trivia-title').value = data.title || '';
        document.getElementById('trivia-text').value = data.text || '';
        document.getElementById('trivia-arc').value = data.arc || 'general';
        document.getElementById('trivia-verified').checked = !!data.verified;

        setTriviaDateFromValue(data.dateTime || data.date || '');

        document.getElementById('trivia-characters').value = (data.characters || []).join(', ');
        document.getElementById('trivia-topics').value = (data.topics || []).join(', ');

        const rawSources = Array.isArray(data.sources) && data.sources.length > 0
          ? data.sources
          : Array.isArray(data.source)
          ? data.source
          : data.source ? [data.source] : [];
        setTriviaSourcesInUI(rawSources);

        document.getElementById('trivia-title-len').textContent = (data.title || '').length + ' chars';
        document.getElementById('trivia-text-len').textContent = (data.text || '').length + ' chars';

        const warnBox = document.getElementById('trivia-duplicate-warning');
        if (warnBox) {
          warnBox.className = 'dup-alert';
          warnBox.innerHTML = '';
        }
        const saveBtn = document.getElementById('btn-trivia-save');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.classList.remove('disabled');
        }

        renderTriviaTagClouds();
        isTriviaDirty = false;
      } catch (err) {
        showTriviaStatus('Error loading trivia: ' + err.message, 'error');
      }
    }

    async function createNewTrivia() {
      selectedTriviaId = null;
      isExactTriviaDuplicate = false;
      document.getElementById('trivia-form-title').textContent = 'Create New Trivia';
      document.getElementById('btn-trivia-delete').style.display = 'none';
      document.getElementById('btn-trivia-clone').style.display = 'none';
      document.getElementById('trivia-entry-id').value = '';
      document.getElementById('trivia-form').reset();
      document.getElementById('trivia-title-len').textContent = '0 chars';
      document.getElementById('trivia-text-len').textContent = '0 chars';
      clearTriviaDateFields();
      setTriviaSourcesInUI([]);
      hideTriviaStatus();
      hideTriviaTagSuggestions();

      const warnBox = document.getElementById('trivia-duplicate-warning');
      if (warnBox) {
        warnBox.className = 'dup-alert';
        warnBox.innerHTML = '';
      }
      const saveBtn = document.getElementById('btn-trivia-save');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('disabled');
      }

      try {
        const res = await fetch('/api/trivia/next-id');
        const data = await res.json();
        document.getElementById('trivia-badge-id').textContent = 'ID: #' + (data.nextId || 'TR-0001');
      } catch {
        document.getElementById('trivia-badge-id').textContent = 'ID: Auto-assigned';
      }

      renderTriviaList();
      renderTriviaTagClouds();
      isTriviaDirty = false;
    }

    function confirmTriviaReset() {
      if (confirm('Clear trivia form fields and start fresh?')) {
        clearStoredTriviaDraft();
        createNewTrivia();
      }
    }

    async function handleTriviaSave(e) {
      e.preventDefault();
      hideTriviaStatus();

      if (isExactTriviaDuplicate) {
        showTriviaStatus('Cannot save: statement is identical to an existing trivia entry!', 'error');
        return;
      }

      const chars = document.getElementById('trivia-characters').value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const topics = document.getElementById('trivia-topics').value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const dayVal = document.getElementById('trivia-date-day').value;
      const monthVal = document.getElementById('trivia-date-month').value;
      const yearVal = document.getElementById('trivia-date-year').value;

      if ((dayVal || monthVal) && !yearVal) {
        showTriviaStatus('Please select a Year to complete the date.', 'error');
        return;
      }

      const dateTimeVal = getTriviaCombinedDateTime();
      const sources = getTriviaSourcesFromUI();
      const sourcePayload = sources.length > 1
        ? { sources: sources }
        : { source: sources[0] || { type: 'text', value: 'Author Statement' } };

      const titleVal = document.getElementById('trivia-title').value.trim();
      const textVal = document.getElementById('trivia-text').value.trim();

      if (!textVal) {
        showTriviaStatus('Author statement / trivia text is required.', 'error');
        return;
      }

      const entryIdVal = document.getElementById('trivia-entry-id')?.value?.trim();
      const effectiveId = selectedTriviaId || entryIdVal || null;

      const payload = {
        ...(effectiveId ? { id: effectiveId } : {}),
        title: titleVal || undefined,
        text: textVal,
        arc: document.getElementById('trivia-arc').value,
        verified: document.getElementById('trivia-verified').checked,
        ...(dateTimeVal ? { dateTime: dateTimeVal } : {}),
        characters: chars,
        topics: topics,
        ...sourcePayload
      };

      const isEdit = !!effectiveId;
      const url = isEdit ? '/api/trivia/' + encodeURIComponent(effectiveId) : '/api/trivia';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          showTriviaStatus(data.error || 'Validation or write failed', 'error');
          return;
        }

        clearStoredTriviaDraft();
        isTriviaDirty = false;
        showTriviaStatus('Trivia entry #' + data.entry.id + ' saved successfully!', 'success');

        await loadTrivia();
        await reloadConfigAndEntries();
        await selectTrivia(data.entry.id);
      } catch (err) {
        showTriviaStatus(err.message, 'error');
      }
    }

    async function handleTriviaDelete() {
      if (!selectedTriviaId) return;
      const confirmed = confirm('Are you sure you want to permanently delete Trivia entry #' + selectedTriviaId + '?');
      if (!confirmed) return;

      try {
        const res = await fetch('/api/trivia/' + encodeURIComponent(selectedTriviaId), { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          showTriviaStatus(data.error || 'Failed to delete trivia entry', 'error');
          return;
        }

        showTriviaStatus('Trivia entry #' + selectedTriviaId + ' deleted successfully.', 'success');
        clearStoredTriviaDraft();
        isTriviaDirty = false;
        selectedTriviaId = null;
        await loadTrivia();
        await reloadConfigAndEntries();
        createNewTrivia();
      } catch (err) {
        showTriviaStatus(err.message, 'error');
      }
    }

    init();
