(function () {
  const L = window.Logic;
  const T = window.Theme;
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
      return `<span class="cell up" aria-label="${name} ${level} lên ${to}">${icon}<span class="sk">${name}</span><span class="lv">${level}${I('arrow', 10)}<b>${to}</b></span></span>`;
    }
    return `<span class="cell${to !== undefined ? ' same' : ''}" aria-label="${name} ${level}">${icon}<span class="sk">${name}</span><span class="lv"><b>${level}</b></span></span>`;
  }
  /** Chỉ liệt kê chuyên môn đang có cấp (của người truyền nếu so sánh). */
  function cells(levels, target) {
    const ref = target || levels;
    const out = levels.map((v, i) => (ref[i] > 0 ? cell(i, v, target && target[i]) : '')).join('');
    return `<span class="cells">${out || '<span class="none">Chưa có chuyên môn</span>'}</span>`;
  }
  const gem = (n) => `<span class="total" title="Tổng giá trị" aria-label="Tổng giá trị ${n}">${I('gem', 16)}${n}</span>`;

  const roleTag = (role) => (role ? `<span class="role ${role}">${L.ROLES[role].name}</span>` : '');
  const ident = (name, total, role) => `<span class="ident"><span class="name">${esc(name)}</span>${roleTag(role)}${gem(total)}</span>`;
  const iconBtn = (act, icon, label, extra) =>
    `<button class="ibtn" data-act="${act}" aria-label="${label}" title="${label}" ${extra || ''}>${I(icon, 26)}</button>`;
  const undoBtn = () => iconBtn('undo', 'undo', 'Hoàn tác', data.history.length ? '' : 'disabled');

  const ROOT_VIEWS = ['roster', 'roles', 'expelled', 'theme'];
  /** Thanh điều hướng: dưới cùng trên điện thoại, cột bên trên màn rộng. Thẻ đang mở sáng lên cả khi ở màn con. */
  function tabs(active) {
    const parent = { transfer: 'roster', edit: 'roster', data: 'roster', 'role-pick': 'roles' }[active] || active;
    const t = (key, icon, label, n) =>
      `<button data-act="tab-${key}" class="${parent === key ? 'on' : ''}" ${parent === key ? 'aria-current="page"' : ''} aria-label="${label}">${I(icon, 26)}<span>${label}</span><em>${n === undefined ? '' : n}</em></button>`;
    return `<nav class="tabs" aria-label="Điều hướng"><div class="brand" aria-hidden="true">${I('scroll', 26)}<span>Sổ Truyền Công</span></div>
      ${t('roster', 'people', 'Đệ tử', data.disciples.length)}${t('roles', 'crown', 'Chức vụ', data.disciples.filter((d) => d.role).length)}${t('expelled', 'door', 'Chờ trục xuất', data.expelled.length)}${t('theme', 'palette', 'Giao diện')}</nav>`;
  }

  function rosterView() {
    const list = L.sortedByTotal(data.disciples);
    const body = list.length
      ? '<div class="grid">' + list.map((d) => `<article class="card" data-act="pick" data-id="${d.id}">
          <div class="head"><button class="pick" data-act="pick" data-id="${d.id}" aria-label="Chọn ${esc(d.name)} để trục xuất">${ident(d.name, d.total, d.role)}</button>
            ${iconBtn('edit', 'edit', 'Sửa ' + esc(d.name), `data-id="${d.id}"`)}</div>
          ${cells(d.levels)}</article>`).join('') + '</div>'
      : `<div class="empty">${I('scroll', 42)}<p>Thêm đệ tử đầu tiên</p><button class="btn primary" data-act="add">${I('plus', 16)}Thêm</button></div>`;
    return `<header class="top"><h1>Đệ tử</h1><div class="grow"></div>${list.length ? `<button class="btn primary add-wide" data-act="add">${I('plus', 16)}Thêm đệ tử</button>` : ''}${iconBtn('data', 'data', 'Sao lưu / khôi phục')}${undoBtn()}</header>
      <main class="main">${body}</main>
      ${list.length ? `<button class="fab" data-act="add" aria-label="Thêm đệ tử">${I('plus', 26)}</button>` : ''}`;
  }

  function transferView() {
    const src = data.disciples.find((d) => d.id === view.id);
    if (!src) return rosterView();
    const ranking = L.rank(src, data.disciples);
    const cards = ranking.map((r, i) => `<article class="card cand${i === 0 ? ' best' : ''}">
        ${i === 0 ? `<span class="crown" title="Nhiều cấp nhất" aria-label="Lựa chọn tốt nhất">${I('crown', 16)}</span>` : ''}
        <div class="head">${ident(r.d.name, r.d.total, r.d.role)}
          <span class="gain${r.gain ? '' : ' zero'}" aria-label="Tăng ${r.gain} cấp">${I('up', 16)}${r.gain}</span>
          <button class="go" data-act="transfer" data-rec="${r.d.id}" aria-label="Truyền công cho ${esc(r.d.name)}" title="Truyền công">${I('arrow', 26)}</button></div>
        ${cells(r.d.levels, src.levels)}
      </article>`).join('');
    return `<header class="top">${iconBtn('back', 'back', 'Quay lại')}<h2>Truyền công</h2><div class="grow"></div></header>
      <main class="main"><div class="split">
        <div class="split-side">
          <article class="card src"><div class="head">${ident(src.name, src.total, src.role)}
            <span class="outbadge" title="Sẽ trục xuất" aria-label="Sẽ trục xuất">${I('door', 26)}</span></div>
            ${cells(src.levels)}</article>
          <button class="btn ghost-danger split-retire" data-act="retire" data-id="${src.id}">${I('door', 16)}Trục xuất, không truyền</button>
        </div>
        <div class="flow" aria-hidden="true">${I('up', 18)}</div>
        <div class="split-list">${cards ? `<div class="grid">${cards}</div>` : `<div class="empty">${I('people', 42)}<p>Chưa có đệ tử khác để nhận công</p></div>`}</div>
      </div></main>`;
  }

  /** Năm vị trí: Chưởng môn và các Chưởng lão, xếp theo thứ tự bổ nhiệm trong danh sách. */
  function roleSlots() {
    const leader = data.disciples.find((d) => d.role === 'leader') || null;
    const elders = data.disciples.filter((d) => d.role === 'elder');
    return [{ role: 'leader', who: leader }]
      .concat(Array.from({ length: L.MAX_ELDERS }, (_, i) => ({ role: 'elder', who: elders[i] || null })));
  }

  function rolesView() {
    const slots = roleSlots();
    const sum = slots.reduce((n, s) => n + (s.who ? L.roleBonus(s.role) : 0), 0);
    const cards = slots.map((s, i) => {
      const bonus = `<span class="bonus">+${L.roleBonus(s.role)}</span>`;
      const title = `<span class="slot-name">${L.ROLES[s.role].name}${s.role === 'elder' ? ' ' + i : ''}${bonus}</span>`;
      if (!s.who) {
        return `<article class="card slot empty-slot"><div class="head">${title}
          <button class="btn small" data-act="slot" data-slot="${i}">${I('plus', 16)}Bổ nhiệm</button></div></article>`;
      }
      return `<article class="card slot"><div class="head">${title}</div>
        <div class="head"><button class="pick" data-act="slot" data-slot="${i}" aria-label="Đổi người giữ chức ${L.ROLES[s.role].name}">${ident(s.who.name, s.who.total)}</button>
          ${iconBtn('unrole', 'minus', 'Bãi nhiệm ' + esc(s.who.name), `data-id="${s.who.id}"`)}</div></article>`;
    }).join('');
    return `<header class="top"><h1>Chức vụ</h1><span class="count">+${sum}</span><div class="grow"></div>${undoBtn()}</header>
      <main class="main narrow"><p class="note">Chưởng môn +30, mỗi Chưởng lão +10 tổng giá trị. Bổ nhiệm hoặc bãi nhiệm sẽ tự cộng/trừ vào tổng giá trị đệ tử.</p>
        <div class="grid">${cards}</div></main>`;
  }

  function rolePickView() {
    const slot = roleSlots()[view.slot];
    if (!slot) return rolesView();
    const cands = L.sortedByTotal(data.disciples.filter((d) => !slot.who || d.id !== slot.who.id));
    const label = L.ROLES[slot.role].name + (slot.role === 'elder' ? ' ' + view.slot : '');
    const cards = cands.map((d) => {
      const after = L.totalAfterRole(d.total, d.role, slot.role);
      return `<article class="card" data-act="assign" data-id="${d.id}"><div class="head">
        <button class="pick" data-act="assign" data-id="${d.id}" aria-label="Bổ nhiệm ${esc(d.name)} làm ${label}">${ident(d.name, d.total, d.role)}</button>
        <span class="gain${after === d.total ? ' zero' : ''}" aria-label="Tổng giá trị sau bổ nhiệm ${after}">${I('arrow', 16)}${after}</span></div></article>`;
    }).join('');
    return `<header class="top">${iconBtn('tab-roles', 'back', 'Quay lại')}<h2>Bổ nhiệm ${label}</h2><div class="grow"></div></header>
      <main class="main narrow">${cards ? `<div class="grid">${cards}</div>` : `<div class="empty">${I('people', 42)}<p>Chưa có đệ tử để bổ nhiệm</p></div>`}</main>`;
  }

  function expelledView() {
    const list = data.expelled;
    const doneCount = list.filter((e) => e.done).length;
    const body = list.length
      ? '<div class="grid">' + list.map((e) => `<article class="card${e.done ? ' done' : ''}"><div class="head">${ident(e.name, e.total)}
          <button class="check${e.done ? ' on' : ''}" data-act="done" data-id="${e.id}" aria-pressed="${e.done}" aria-label="Đã trục xuất ${esc(e.name)} trong game">${e.done ? I('check', 20) : ''}</button></div>
        </article>`).join('') + '</div>'
      : `<div class="empty">${I('door', 42)}<p>Chưa có ai chờ trục xuất</p></div>`;
    return `<header class="top"><h1>Chờ trục xuất</h1><span class="count">${doneCount}/${list.length}</span><div class="grow"></div>${undoBtn()}</header>
      <main class="main">${body}
        ${list.length ? `<button class="btn danger" data-act="clear">${I('trash', 16)}<span>Xóa danh sách</span></button>` : ''}
      </main>`;
  }

  function editView() {
    const d = view.id ? data.disciples.find((x) => x.id === view.id) : null;
    const cur = d || { name: '', total: '', levels: L.SKILLS.map(() => 0) };
    const lv = L.SKILLS.map((s, i) => `<div class="fld skill"><label for="lv${i}">${I(window.Icons.SKILL_ICONS[i], 16)}<span>${s}</span></label>
      <div class="step"><button type="button" data-act="step" data-i="${i}" data-d="-1" aria-label="Giảm ${s}">${I('minus', 16)}</button>
      <input id="lv${i}" type="number" inputmode="numeric" min="0" max="${L.MAX_LEVEL}" value="${cur.levels[i]}">
      <button type="button" data-act="step" data-i="${i}" data-d="1" aria-label="Tăng ${s}">${I('plus', 16)}</button></div></div>`).join('');
    return `<header class="top">${iconBtn('back', 'back', 'Hủy')}<h2>${d ? 'Sửa đệ tử' : 'Thêm đệ tử'}</h2><div class="grow"></div>
        <button class="btn primary small" data-act="save">${I('check', 16)}Lưu</button></header>
      <main class="main narrow"><div class="form">
        <div class="grid2">
          <div class="fld"><label for="f-name">Tên</label><input id="f-name" type="text" autocomplete="off" value="${esc(cur.name)}" placeholder="Tề Nhận Lộ"></div>
          <div class="fld"><label for="f-total">${I('gem', 16)}<span>Tổng giá trị</span></label><input id="f-total" type="number" inputmode="numeric" min="0" value="${cur.total}" placeholder="182"></div>
        </div>
        <div class="grid2 skills">${lv}</div>
        <div class="err" id="err" role="alert"></div>
        ${d ? `<button class="btn ghost-danger" id="del" data-act="delete" data-id="${d.id}">${I('trash', 16)}<span>Xóa đệ tử</span></button>` : ''}
      </div></main>`;
  }

  function dataView() {
    return `<header class="top">${iconBtn('back', 'back', 'Quay lại')}<h2>Sao lưu dữ liệu</h2><div class="grow"></div></header>
      <main class="main narrow">
        <p class="note">Dữ liệu lưu trong trình duyệt của thiết bị này. Xuất file JSON để sao lưu hoặc chuyển sang thiết bị khác.</p>
        <button class="btn primary" data-act="export">${I('download', 16)}<span>Xuất file JSON</span></button>
        <button class="btn" data-act="import">${I('upload', 16)}<span>Nhập từ file JSON (thay dữ liệu hiện tại)</span></button>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
        <div class="msg" id="data-msg" role="status">${esc(view.msg || '')}</div>
      </main>`;
  }

  function themeView() {
    const cur = T.get();
    const sch = T.scheme();
    const radio = (k, v, inner, plain) =>
      `<button type="button" role="radio" ${plain ? '' : 'class="opt"'} aria-checked="${cur[k] === v}" data-act="theme" data-k="${k}" data-v="${v}">${inner}</button>`;
    const tick = `<span class="tick" aria-hidden="true">${I('check', 16)}</span>`;
    const seg = (k, list, icons) => list.map((m) => radio(k, m.id, `${icons ? I(icons[m.id], 16) : ''}${m.name}`, true)).join('');
    const pals = T.PALETTES.map((p) => {
      const c = T.colors(p.id, sch);
      const sw = [c.wood, c.seal, c.gold, c.jade, c.parch].map((x) => `<i style="background:${x}"></i>`).join('');
      return radio('palette', p.id, `<span class="sw" aria-hidden="true">${sw}</span><b>${p.name}</b><small>${p.note}</small>${tick}`);
    }).join('');
    const fonts = T.FONTS.map((f) => radio('font', f.id,
      `<span class="fsmp" style="font-family:${f.display}">Tề Nhận Lộ</span><span class="fsmp2" style="font-family:${f.body}">Tổng giá trị 182</span><b>${f.name}</b><small>${f.note}</small>${tick}`)).join('');
    const styles = T.STYLES.map((s) => radio('style', s.id,
      `<span class="pv" data-pv="${s.id}" aria-hidden="true"><span class="pv-top"></span><span class="pv-card"></span></span><b>${s.name}</b><small>${s.note}</small>${tick}`)).join('');
    return `<header class="top"><h1>Giao diện</h1><div class="grow"></div></header>
      <main class="main narrow">
        <section class="set" aria-labelledby="h-mode"><h3 id="h-mode">Chế độ màu</h3>
          <div class="seg" role="radiogroup" aria-labelledby="h-mode">${seg('mode', T.MODES, { auto: 'auto', light: 'sun', dark: 'moon' })}</div></section>
        <section class="set" aria-labelledby="h-pal"><h3 id="h-pal">Bảng màu</h3>
          <div class="opts" role="radiogroup" aria-labelledby="h-pal">${pals}</div></section>
        <section class="set" aria-labelledby="h-font"><h3 id="h-font">Font chữ</h3>
          <div class="opts" role="radiogroup" aria-labelledby="h-font">${fonts}</div></section>
        <section class="set" aria-labelledby="h-style"><h3 id="h-style">Phong cách</h3>
          <div class="opts" role="radiogroup" aria-labelledby="h-style">${styles}</div></section>
        <button class="btn" data-act="theme-reset" ${T.isDefault() ? 'disabled' : ''}>${I('undo', 16)}<span>Đặt lại mặc định</span></button>
        <button class="btn" data-act="data">${I('data', 16)}<span>Sao lưu / khôi phục dữ liệu</span></button>
      </main>`;
  }

  function doExport() {
    const blob = new Blob([L.exportJson(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'so-truyen-cong-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const r = L.importJson(data, String(reader.result));
      if (!r.ok) { go({ name: 'data', msg: r.error }); return; }
      setData(r.data);
      go({ name: 'data', msg: `Đã nhập ${r.disciples} đệ tử, ${r.expelled} người chờ trục xuất. Có thể hoàn tác ở màn hình Đệ tử.` });
    };
    reader.onerror = () => go({ name: 'data', msg: 'Không đọc được file.' });
    reader.readAsText(file);
  }

  function render() {
    const html = { roster: rosterView, transfer: transferView, roles: rolesView, 'role-pick': rolePickView, expelled: expelledView, edit: editView, data: dataView, theme: themeView }[view.name]();
    app.classList.toggle('lift', !!toast);
    app.classList.toggle('sub', !ROOT_VIEWS.includes(view.name)); // màn con: ẩn thanh dưới trên điện thoại
    if (view.name === 'theme') T.preloadFonts();
    app.innerHTML = html + tabs(view.name) +
      (toast ? `<div class="toast" role="status">${I('check', 20)}<span>${toast}</span><button data-act="undo">${I('undo', 16)}Hoàn tác</button></div>` : '');
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
      case 'data': go({ name: 'data' }); break;
      case 'export': doExport(); break;
      case 'import': {
        if (data.disciples.length + data.expelled.length && !armed(t, 'Bấm lần nữa để thay dữ liệu hiện tại')) break;
        document.getElementById('import-file').click();
        break;
      }
      case 'tab-roles': go({ name: 'roles' }); break;
      case 'slot': go({ name: 'role-pick', slot: Number(t.dataset.slot) }); break;
      case 'assign': {
        const slot = roleSlots()[view.slot];
        if (!slot) break;
        const next = L.assignRole(data, t.dataset.id, slot.role, slot.who && slot.who.id);
        if (next === data) break;
        setData(next);
        go({ name: 'roles' });
        break;
      }
      case 'unrole': setData(L.unassignRole(data, t.dataset.id)); render(); break;
      case 'tab-expelled': go({ name: 'expelled' }); break;
      case 'tab-theme': go({ name: 'theme' }); break;
      case 'theme': {
        T.set({ [t.dataset.k]: t.dataset.v }); // onChange sẽ vẽ lại màn Giao diện
        const again = app.querySelector(`[data-act="theme"][data-k="${t.dataset.k}"][data-v="${t.dataset.v}"]`);
        if (again) again.focus({ preventScroll: true });
        break;
      }
      case 'theme-reset': T.reset(); break;
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
        if (['transfer', 'edit', 'role-pick'].includes(view.name)) view = { name: 'roster' };
        render();
        break;
    }
  });

  app.addEventListener('change', (e) => {
    if (e.target.id === 'import-file' && e.target.files[0]) doImport(e.target.files[0]);
  });

  T.onChange(() => { if (view.name === 'theme') render(); });
  render();
})();
