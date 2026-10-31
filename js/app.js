(function () {
  const L = window.Logic;
  const app = document.getElementById('app');
  let data = window.Store.load();
  let view = { name: 'roster' };
  let toast = null;
  let toastTimer = null;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setData(next) {
    data = next;
    window.Store.save(data);
  }
  function go(v) { view = v; render(); window.scrollTo(0, 0); }
  function showToast(html) {
    toast = html;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast = null; render(); }, 9000);
  }
  function hideToast() { toast = null; clearTimeout(toastTimer); }

  const chips = (levels, ref) =>
    levels.map((v, i) => (v ? `<span class="chip${ref && v > ref[i] ? ' up' : ''}">${L.SKILLS[i]} ${v}</span>` : '')).join('');

  const undoBtn = () =>
    `<button class="btn small" data-act="undo"${data.history.length ? '' : ' disabled'}>Hoàn tác</button>`;

  function tabs(active) {
    const waiting = data.expelled.length;
    return `<nav class="tabs">
      <button data-act="tab-roster" class="${active === 'roster' ? 'on' : ''}">Đệ tử (${data.disciples.length})</button>
      <button data-act="tab-expelled" class="${active === 'expelled' ? 'on' : ''}">Đã truyền hết (${waiting})</button>
    </nav>`;
  }

  function rosterView() {
    const list = L.sortedByTotal(data.disciples);
    const body = list.length
      ? list.map((d) => `<div class="card"><div class="row">
          <button class="pick" data-act="pick" data-id="${d.id}" aria-label="Chọn ${esc(d.name)} để trục xuất">
            <span class="row"><span class="name">${esc(d.name)}</span><span class="total">Tổng ${d.total}</span></span>
            <span class="chips">${chips(d.levels) || '<span class="total">Chưa có chuyên môn</span>'}</span>
          </button>
          <button class="btn small" data-act="edit" data-id="${d.id}" aria-label="Sửa ${esc(d.name)}">Sửa</button>
        </div></div>`).join('')
      : `<div class="empty"><div>Chưa có đệ tử nào. Nhập tên, tổng giá trị và cấp chuyên môn theo màn hình đệ tử trong game.</div>
         <button class="btn primary" data-act="add">Thêm đệ tử</button></div>`;
    return `<header class="top"><div><h1>Đệ tử</h1><div class="sub">Tăng dần theo tổng giá trị. Chạm một người để truyền công.</div></div>${undoBtn()}</header>
      <main class="main">${body}</main>
      ${list.length ? '<button class="fab" data-act="add" aria-label="Thêm đệ tử">+</button>' : ''}`;
  }

  function transferView() {
    const src = data.disciples.find((d) => d.id === view.id);
    if (!src) return rosterView();
    const ranking = L.rank(src, data.disciples);
    const cards = ranking.map((r, i) => `<div class="card${i === 0 ? ' best' : ''}">
        <div class="row"><span class="name">${esc(r.d.name)}${i === 0 ? '<span class="pill">Tốt nhất</span>' : ''}</span>
          <span class="gain${r.gain ? '' : ' zero'}">+${r.gain} cấp</span></div>
        <div class="row"><span class="total">Tổng ${r.d.total}</span>
          <button class="btn small${i === 0 ? ' primary' : ''}" data-act="transfer" data-rec="${r.d.id}">Truyền công</button></div>
        <div class="chips">${chips(src.levels, r.d.levels) || '<span class="total">Người truyền không có cấp nào</span>'}</div>
      </div>`).join('');
    const total = src.levels.reduce((a, b) => a + b, 0);
    return `<header class="top"><button class="btn small" data-act="back">← Quay lại</button><h2>Truyền công</h2><span></span></header>
      <main class="main">
        <div class="card src"><div class="row"><span class="name">${esc(src.name)}</span><span class="total">Tổng ${src.total} · sẽ trục xuất</span></div>
          <div class="chips">${chips(src.levels) || '<span class="total">Chưa có chuyên môn</span>'}</div>
          <div class="total">Tổng cấp chuyên môn: ${total}</div></div>
        <div class="cap">Chọn người nhận, nhiều cấp tăng nhất trước</div>
        ${cards || '<div class="empty">Chưa có đệ tử khác để nhận công.</div>'}
        <div class="note">Chip vàng là chuyên môn sẽ được nâng lên. Hòa số cấp thì người có tổng giá trị lớn hơn đứng trước.</div>
        <button class="btn ghost-danger" data-act="retire" data-id="${src.id}">Trục xuất luôn, không truyền công</button>
      </main>`;
  }

  function expelledView() {
    const list = data.expelled;
    const body = list.length
      ? list.map((e) => `<div class="card${e.done ? ' done' : ''}"><div class="row">
          <span><span class="name">${esc(e.name)}</span><div class="total">Tổng ${e.total}</div></span>
          <button class="check${e.done ? ' on' : ''}" data-act="done" data-id="${e.id}" aria-pressed="${e.done}" aria-label="Đã trục xuất ${esc(e.name)} trong game">${e.done ? '✓' : ''}</button>
        </div></div>`).join('')
      : '<div class="empty">Chưa có ai chờ trục xuất. Đệ tử đã truyền hết công sẽ hiện ở đây.</div>';
    const doneCount = list.filter((e) => e.done).length;
    return `<header class="top"><div><h1>Chờ trục xuất</h1><div class="sub">Đã tick ${doneCount}/${list.length}</div></div>${undoBtn()}</header>
      <main class="main">${body}
        ${list.length ? `<div class="note">Chạm ô vuông để đánh dấu những người đã trục xuất xong trong game.</div>
        <button class="btn danger" data-act="clear">Xóa danh sách</button>` : ''}
      </main>`;
  }

  function editView() {
    const d = view.id ? data.disciples.find((x) => x.id === view.id) : null;
    const cur = d || { name: '', total: '', levels: L.SKILLS.map(() => 0) };
    const lv = L.SKILLS.map((s, i) => `<div class="fld"><label for="lv${i}">${s}</label>
      <div class="step"><button type="button" data-act="step" data-i="${i}" data-d="-1" aria-label="Giảm ${s}">−</button>
      <input id="lv${i}" type="number" inputmode="numeric" min="0" max="${L.MAX_LEVEL}" value="${cur.levels[i]}">
      <button type="button" data-act="step" data-i="${i}" data-d="1" aria-label="Tăng ${s}">+</button></div></div>`).join('');
    return `<header class="top"><button class="btn small" data-act="back">Hủy</button><h2>${d ? 'Sửa đệ tử' : 'Thêm đệ tử'}</h2>
        <button class="btn small primary" data-act="save">Lưu</button></header>
      <main class="main">
        <div class="fld"><label for="f-name">Tên</label><input id="f-name" type="text" autocomplete="off" value="${esc(cur.name)}" placeholder="Ví dụ: Tề Nhận Lộ"></div>
        <div class="fld"><label for="f-total">Tổng giá trị</label><input id="f-total" type="number" inputmode="numeric" min="0" value="${cur.total}" placeholder="Ví dụ: 182"></div>
        <div class="cap">Cấp chuyên môn (0 đến ${L.MAX_LEVEL})</div>
        <div class="grid2">${lv}</div>
        <div class="err" id="err" role="alert"></div>
        ${d ? '<button class="btn ghost-danger" id="del" data-act="delete" data-id="' + d.id + '">Xóa đệ tử này</button>' : ''}
      </main>`;
  }

  function render() {
    const html = { roster: rosterView, transfer: transferView, expelled: expelledView, edit: editView }[view.name]();
    app.classList.toggle('lift', !!toast);
    const showTabs = view.name === 'roster' || view.name === 'expelled';
    app.innerHTML = html + (showTabs ? tabs(view.name) : '') +
      (toast ? `<div class="toast" role="status"><span>${toast}</span><button data-act="undo">Hoàn tác</button></div>` : '');
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

  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    switch (act) {
      case 'tab-roster': go({ name: 'roster' }); break;
      case 'tab-expelled': go({ name: 'expelled' }); break;
      case 'back': go({ name: 'roster' }); break;
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
        if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = 'Bấm lần nữa để xóa'; break; }
        setData(L.remove(data, t.dataset.id));
        go({ name: 'roster' });
        break;
      case 'transfer': {
        const src = data.disciples.find((d) => d.id === view.id);
        const rec = data.disciples.find((d) => d.id === t.dataset.rec);
        const r = L.transfer(data, view.id, t.dataset.rec);
        if (!r.ok) break;
        setData(r.data);
        showToast(`Đã truyền <b>${esc(src.name)}</b> → ${esc(rec.name)}, +${r.gain} cấp`);
        go({ name: 'roster' });
        break;
      }
      case 'retire': {
        const src = data.disciples.find((d) => d.id === t.dataset.id);
        setData(L.retire(data, t.dataset.id));
        showToast(`Đã chuyển <b>${esc(src.name)}</b> sang danh sách chờ trục xuất`);
        go({ name: 'roster' });
        break;
      }
      case 'done': setData(L.toggleDone(data, t.dataset.id)); render(); break;
      case 'clear':
        if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = 'Bấm lần nữa để xóa cả danh sách'; break; }
        setData(L.clearExpelled(data));
        showToast('Đã xóa danh sách chờ trục xuất');
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
