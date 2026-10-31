(function () {
  const L = window.Logic;
  const I = (n, s) => window.Icons.svg(n, s);
  const app = document.getElementById('app');
  let data = window.Store.load();
  let view = { name: 'roster' };
  let toast = null;
  let toastTimer = null;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setData(next) { data = next; window.Store.save(data); }
  function go(v) { view = v; render(); window.scrollTo(0, 0); }
  function showToast(html) {
    toast = html;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast = null; render(); }, 9000);
  }
  function hideToast() { toast = null; clearTimeout(toastTimer); }

  /** Một ô chuyên môn: biểu tượng + tên + cấp. Nếu có `to`, hiện cấp cũ ▸ cấp mới (chuyên môn sẽ tăng). */
  function cell(i, level, to) {
    const name = L.SKILLS[i];
    const icon = I(window.Icons.SKILL_ICONS[i], 16);
    if (to !== undefined && to > level) {
      return `<span class="cell up" aria-label="${name} ${level} lên ${to}">${icon}<span class="sk">${name}</span><span class="lv">${level}${I('arrow', 12)}<b>${to}</b></span></span>`;
    }
    return `<span class="cell${to !== undefined ? ' same' : ''}" aria-label="${name} ${level}">${icon}<span class="sk">${name}</span><span class="lv"><b>${level}</b></span></span>`;
  }
  /** Chỉ liệt kê chuyên môn đang có cấp (của người truyền nếu so sánh). */
  function cells(levels, target) {
    const ref = target || levels;
    const out = levels.map((v, i) => (ref[i] > 0 ? cell(i, v, target && target[i]) : '')).join('');
    return `<span class="cells">${out || '<span class="none">Chưa có chuyên môn</span>'}</span>`;
  }
  const gem = (n) => `<span class="total" title="Tổng giá trị" aria-label="Tổng giá trị ${n}">${I('gem', 14)}${n}</span>`;

  const iconBtn = (act, icon, label, extra) =>
    `<button class="ibtn" data-act="${act}" aria-label="${label}" title="${label}" ${extra || ''}>${I(icon, 20)}</button>`;
  const undoBtn = () => iconBtn('undo', 'undo', 'Hoàn tác', data.history.length ? '' : 'disabled');

  function tabs(active) {
    const t = (key, icon, label, n) =>
      `<button data-act="tab-${key}" class="${active === key ? 'on' : ''}" aria-label="${label}">${I(icon, 22)}<span>${label}</span><em>${n}</em></button>`;
    return `<nav class="tabs">${t('roster', 'people', 'Đệ tử', data.disciples.length)}${t('expelled', 'door', 'Chờ trục xuất', data.expelled.length)}</nav>`;
  }

  function rosterView() {
    const list = L.sortedByTotal(data.disciples);
    const body = list.length
      ? list.map((d) => `<article class="card"><button class="pick" data-act="pick" data-id="${d.id}" aria-label="Chọn ${esc(d.name)} để trục xuất">
            <span class="row"><span class="name">${esc(d.name)}</span>${gem(d.total)}</span>
            ${cells(d.levels)}
          </button>${iconBtn('edit', 'edit', 'Sửa ' + esc(d.name), `data-id="${d.id}"`)}</article>`).join('')
      : `<div class="empty">${I('scroll', 44)}<p>Thêm đệ tử đầu tiên</p><button class="btn primary" data-act="add">${I('plus', 18)}Thêm</button></div>`;
    return `<header class="top"><h1>Đệ tử</h1><div class="grow"></div>${undoBtn()}</header>
      <main class="main">${body}</main>
      ${list.length ? `<button class="fab" data-act="add" aria-label="Thêm đệ tử">${I('plus', 26)}</button>` : ''}`;
  }

  function transferView() {
    const src = data.disciples.find((d) => d.id === view.id);
    if (!src) return rosterView();
    const ranking = L.rank(src, data.disciples);
    const cards = ranking.map((r, i) => `<article class="card cand${i === 0 ? ' best' : ''}">
        ${i === 0 ? `<span class="crown" title="Nhiều cấp nhất" aria-label="Lựa chọn tốt nhất">${I('crown', 16)}</span>` : ''}
        <div class="cand-body">
          <span class="row"><span class="name">${esc(r.d.name)}</span>${gem(r.d.total)}</span>
          ${cells(r.d.levels, src.levels)}
        </div>
        <div class="cand-act">
          <span class="gain${r.gain ? '' : ' zero'}" aria-label="Tăng ${r.gain} cấp">${I('up', 14)}${r.gain}</span>
          <button class="go" data-act="transfer" data-rec="${r.d.id}" aria-label="Truyền công cho ${esc(r.d.name)}" title="Truyền công">${I('arrow', 22)}</button>
        </div>
      </article>`).join('');
    return `<header class="top">${iconBtn('back', 'back', 'Quay lại')}<h2>Truyền công</h2><div class="grow"></div></header>
      <main class="main">
        <article class="card src"><div class="cand-body">
          <span class="row"><span class="name">${esc(src.name)}</span>${gem(src.total)}</span>
          ${cells(src.levels)}</div>
          <span class="outbadge" title="Sẽ trục xuất" aria-label="Sẽ trục xuất">${I('door', 22)}</span></article>
        <div class="flow" aria-hidden="true">${I('up', 18)}</div>
        ${cards || `<div class="empty">${I('people', 44)}<p>Chưa có đệ tử khác để nhận công</p></div>`}
        <button class="btn ghost-danger" data-act="retire" data-id="${src.id}">${I('door', 18)}Trục xuất, không truyền</button>
      </main>`;
  }

  function expelledView() {
    const list = data.expelled;
    const doneCount = list.filter((e) => e.done).length;
    const body = list.length
      ? list.map((e) => `<article class="card${e.done ? ' done' : ''}"><div class="cand-body">
          <span class="name">${esc(e.name)}</span>${gem(e.total)}</div>
          <button class="check${e.done ? ' on' : ''}" data-act="done" data-id="${e.id}" aria-pressed="${e.done}" aria-label="Đã trục xuất ${esc(e.name)} trong game">${e.done ? I('check', 20) : ''}</button>
        </article>`).join('')
      : `<div class="empty">${I('door', 44)}<p>Chưa có ai chờ trục xuất</p></div>`;
    return `<header class="top"><h1>Chờ trục xuất</h1><span class="count">${doneCount}/${list.length}</span><div class="grow"></div>${undoBtn()}</header>
      <main class="main">${body}
        ${list.length ? `<button class="btn danger" data-act="clear">${I('trash', 18)}<span>Xóa danh sách</span></button>` : ''}
      </main>`;
  }

  function editView() {
    const d = view.id ? data.disciples.find((x) => x.id === view.id) : null;
    const cur = d || { name: '', total: '', levels: L.SKILLS.map(() => 0) };
    const lv = L.SKILLS.map((s, i) => `<div class="fld skill"><label for="lv${i}">${I(window.Icons.SKILL_ICONS[i], 18)}<span>${s}</span></label>
      <div class="step"><button type="button" data-act="step" data-i="${i}" data-d="-1" aria-label="Giảm ${s}">${I('minus', 16)}</button>
      <input id="lv${i}" type="number" inputmode="numeric" min="0" max="${L.MAX_LEVEL}" value="${cur.levels[i]}">
      <button type="button" data-act="step" data-i="${i}" data-d="1" aria-label="Tăng ${s}">${I('plus', 16)}</button></div></div>`).join('');
    return `<header class="top">${iconBtn('back', 'back', 'Hủy')}<h2>${d ? 'Sửa đệ tử' : 'Thêm đệ tử'}</h2><div class="grow"></div>
        <button class="btn primary small" data-act="save">${I('check', 18)}Lưu</button></header>
      <main class="main">
        <div class="grid2">
          <div class="fld"><label for="f-name">Tên</label><input id="f-name" type="text" autocomplete="off" value="${esc(cur.name)}" placeholder="Tề Nhận Lộ"></div>
          <div class="fld"><label for="f-total">${I('gem', 14)}<span>Tổng giá trị</span></label><input id="f-total" type="number" inputmode="numeric" min="0" value="${cur.total}" placeholder="182"></div>
        </div>
        <div class="grid2">${lv}</div>
        <div class="err" id="err" role="alert"></div>
        ${d ? `<button class="btn ghost-danger" id="del" data-act="delete" data-id="${d.id}">${I('trash', 18)}<span>Xóa đệ tử</span></button>` : ''}
      </main>`;
  }

  function render() {
    const html = { roster: rosterView, transfer: transferView, expelled: expelledView, edit: editView }[view.name]();
    const showTabs = view.name === 'roster' || view.name === 'expelled';
    app.classList.toggle('lift', !!toast);
    app.innerHTML = html + (showTabs ? tabs(view.name) : '') +
      (toast ? `<div class="toast" role="status">${I('check', 20)}<span>${toast}</span><button data-act="undo">${I('undo', 18)}Hoàn tác</button></div>` : '');
  }

  function saveEdit() {
    const name = document.getElementById('f-name').value.trim();
    const totalRaw = document.getElementById('f-total').value;
    const err = document.getElementById('err');
    if (!name) { err.textContent = 'Nhập tên đệ tử.'; return; }
    if (totalRaw === '' || Number(totalRaw) < 0) { err.textContent = 'Nhập tổng giá trị (số từ 0 trở lên).'; return; }
    const levels = L.SKILLS.map((_, i) => document.getElementById('lv' + i).value);
    setData(L.upsert(data, { id: view.id, name, total: totalRaw, levels }));
    hideToast();
    go({ name: 'roster' });
  }

  function armed(t, text) {
    if (t.dataset.armed) return true;
    t.dataset.armed = '1';
    t.classList.add('armed');
    const label = t.querySelector('span');
    if (label) label.textContent = text;
    return false;
  }

  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    switch (t.dataset.act) {
      case 'tab-roster': case 'back': go({ name: 'roster' }); break;
      case 'tab-expelled': go({ name: 'expelled' }); break;
      case 'add': go({ name: 'edit', id: null }); break;
      case 'edit': go({ name: 'edit', id: t.dataset.id }); break;
      case 'pick': hideToast(); go({ name: 'transfer', id: t.dataset.id }); break;
      case 'step': {
        const input = document.getElementById('lv' + t.dataset.i);
        input.value = L.clampLevel(Number(input.value) + Number(t.dataset.d));
        break;
      }
      case 'save': saveEdit(); break;
      case 'delete':
        if (!armed(t, 'Bấm lần nữa để xóa')) break;
        setData(L.remove(data, t.dataset.id));
        go({ name: 'roster' });
        break;
      case 'transfer': {
        const src = data.disciples.find((d) => d.id === view.id);
        const rec = data.disciples.find((d) => d.id === t.dataset.rec);
        const r = L.transfer(data, view.id, t.dataset.rec);
        if (!r.ok) break;
        setData(r.data);
        showToast(`<b>${esc(src.name)}</b> → ${esc(rec.name)} · +${r.gain}`);
        go({ name: 'roster' });
        break;
      }
      case 'retire': {
        const src = data.disciples.find((d) => d.id === t.dataset.id);
        setData(L.retire(data, t.dataset.id));
        showToast(`<b>${esc(src.name)}</b> chờ trục xuất`);
        go({ name: 'roster' });
        break;
      }
      case 'done': setData(L.toggleDone(data, t.dataset.id)); render(); break;
      case 'clear':
        if (!armed(t, 'Bấm lần nữa để xóa hết')) break;
        setData(L.clearExpelled(data));
        showToast('Đã xóa danh sách');
        render();
        break;
      case 'undo':
        if (!data.history.length) break;
        setData(L.undo(data));
        hideToast();
        if (view.name === 'transfer' || view.name === 'edit') view = { name: 'roster' };
        render();
        break;
    }
  });

  render();
})();
