/* Logic thuần (không đụng DOM, không đụng bộ nhớ) để dùng chung cho trình duyệt và test. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Logic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const SKILLS = ['Bồi Thực', 'Thương Đạo', 'Luyện Khí', 'Nuôi Dưỡng', 'Đan Đạo', 'Phù Lục', 'Trận pháp', 'Tụ Linh'];
  const MAX_LEVEL = 100; // game chưa rõ trần cấp, tạm đặt 100
  const HISTORY_LIMIT = 50;
  // Chức vụ cộng thêm vào tổng giá trị (tổng giá trị hiển thị trong game đã gồm phần này).
  const ROLES = {
    '': { name: 'Đệ tử', bonus: 0 },
    leader: { name: 'Chưởng môn', bonus: 30 },
    elder: { name: 'Chưởng lão', bonus: 10 },
  };
  const MAX_ELDERS = 4;
  const cleanRole = (r) => (Object.prototype.hasOwnProperty.call(ROLES, r) ? r : '');
  const roleBonus = (r) => ROLES[cleanRole(r)].bonus;
  /** Tổng giá trị sau khi đổi chức vụ từ `from` sang `to`. */
  function totalAfterRole(total, from, to) {
    return Math.max(0, (Math.floor(Number(total)) || 0) - roleBonus(from) + roleBonus(to));
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const emptyData = () => ({ disciples: [], expelled: [], history: [] });

  function clampLevel(v) {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.min(MAX_LEVEL, Math.max(0, n));
  }

  /** Số cấp người nhận tăng thêm: mỗi chuyên môn lấy cấp cao hơn, không cộng dồn. */
  function gain(src, rec) {
    return src.levels.reduce((sum, v, i) => sum + Math.max(0, v - rec.levels[i]), 0);
  }

  /** Xếp người nhận: nhiều cấp tăng nhất trước, hòa thì tổng giá trị lớn hơn trước. */
  function rank(src, candidates) {
    return candidates
      .filter((c) => c.id !== src.id)
      .map((d) => ({ d, gain: gain(src, d) }))
      .sort((a, b) => b.gain - a.gain || b.d.total - a.d.total || a.d.name.localeCompare(b.d.name, 'vi'));
  }

  function sortedByTotal(list) {
    return [...list].sort((a, b) => a.total - b.total || a.name.localeCompare(b.name, 'vi'));
  }

  function withHistory(data, fn) {
    const snapshot = { disciples: clone(data.disciples), expelled: clone(data.expelled) };
    const next = fn(clone(data));
    next.history = [...data.history, snapshot].slice(-HISTORY_LIMIT);
    return next;
  }

  function undo(data) {
    if (!data.history.length) return data;
    const prev = data.history[data.history.length - 1];
    return { disciples: clone(prev.disciples), expelled: clone(prev.expelled), history: data.history.slice(0, -1) };
  }

  /** Truyền công: người truyền về 0 và chuyển sang danh sách chờ trục xuất; người nhận nâng cấp. */
  function transfer(data, srcId, recId) {
    const src = data.disciples.find((d) => d.id === srcId);
    const rec = data.disciples.find((d) => d.id === recId);
    if (!src || !rec || src.id === rec.id) return { data, gain: 0, ok: false };
    const g = gain(src, rec);
    const next = withHistory(data, (d) => {
      const s = d.disciples.find((x) => x.id === srcId);
      const r = d.disciples.find((x) => x.id === recId);
      r.levels = r.levels.map((v, i) => Math.max(v, s.levels[i]));
      d.disciples = d.disciples.filter((x) => x.id !== srcId);
      d.expelled.push({ id: s.id, name: s.name, total: s.total, done: false });
      return d;
    });
    return { data: next, gain: g, ok: true };
  }

  /** Đệ tử cuối cùng (không còn người nhận) vẫn được đưa vào danh sách chờ với cấp về 0. */
  function retire(data, srcId) {
    const src = data.disciples.find((d) => d.id === srcId);
    if (!src) return data;
    return withHistory(data, (d) => {
      d.disciples = d.disciples.filter((x) => x.id !== srcId);
      d.expelled.push({ id: src.id, name: src.name, total: src.total, done: false });
      return d;
    });
  }

  function upsert(data, disciple) {
    return withHistory(data, (d) => {
      const clean = {
        id: disciple.id || newId(),
        name: String(disciple.name).trim(),
        total: Math.max(0, Math.floor(Number(disciple.total)) || 0),
        levels: SKILLS.map((_, i) => clampLevel(disciple.levels[i])),
        role: '',
      };
      const idx = d.disciples.findIndex((x) => x.id === clean.id);
      if (idx >= 0) { clean.role = d.disciples[idx].role || ''; d.disciples[idx] = clean; }
      else d.disciples.push(clean);
      return d;
    });
  }

  /** Đổi chức vụ một đệ tử và tự điều chỉnh tổng giá trị. `role` rỗng = bãi nhiệm. */
  function setRole(d, id, role) {
    const x = d.disciples.find((y) => y.id === id);
    if (!x) return;
    const to = cleanRole(role);
    x.total = totalAfterRole(x.total, x.role, to);
    x.role = to;
  }

  /**
   * Bổ nhiệm `id` vào chức vụ `role`. Nếu ô đang có người (`replaceId`) thì người đó bị bãi nhiệm.
   * Chưởng môn luôn chỉ có một người; Chưởng lão tối đa MAX_ELDERS.
   */
  function assignRole(data, id, role, replaceId) {
    const target = cleanRole(role);
    if (!target || !data.disciples.some((x) => x.id === id)) return data;
    const holders = (r) => data.disciples.filter((x) => x.role === r && x.id !== id && x.id !== replaceId);
    if (target === 'elder' && holders('elder').length >= MAX_ELDERS) return data;
    return withHistory(data, (d) => {
      if (replaceId && replaceId !== id) setRole(d, replaceId, '');
      if (target === 'leader') d.disciples.filter((x) => x.role === 'leader' && x.id !== id).forEach((x) => setRole(d, x.id, ''));
      setRole(d, id, target);
      return d;
    });
  }

  /** Bãi nhiệm: về đệ tử thường, trừ phần cộng của chức vụ. */
  function unassignRole(data, id) {
    const x = data.disciples.find((y) => y.id === id);
    if (!x || !x.role) return data;
    return withHistory(data, (d) => { setRole(d, id, ''); return d; });
  }

  function remove(data, id) {
    return withHistory(data, (d) => {
      d.disciples = d.disciples.filter((x) => x.id !== id);
      return d;
    });
  }

  function toggleDone(data, id) {
    const d = clone(data);
    const e = d.expelled.find((x) => x.id === id);
    if (e) e.done = !e.done;
    return d;
  }

  function clearExpelled(data) {
    return withHistory(data, (d) => {
      d.expelled = [];
      return d;
    });
  }

  /** Kiểm tra dữ liệu đọc từ bộ nhớ; trả về dữ liệu rỗng nếu hỏng. */
  function sanitize(raw) {
    try {
      if (!raw || !Array.isArray(raw.disciples) || !Array.isArray(raw.expelled)) return emptyData();
      const ok = (d) => d && typeof d.id === 'string' && typeof d.name === 'string';
      return {
        disciples: raw.disciples.filter(ok).map((d) => ({
          id: d.id, name: d.name, total: Math.max(0, Math.floor(Number(d.total)) || 0),
          levels: SKILLS.map((_, i) => clampLevel(d.levels && d.levels[i])),
          role: cleanRole(d.role),
        })),
        expelled: raw.expelled.filter(ok).map((d) => ({
          id: d.id, name: d.name, total: Math.max(0, Math.floor(Number(d.total)) || 0), done: !!d.done,
        })),
        history: Array.isArray(raw.history) ? raw.history.slice(-HISTORY_LIMIT) : [],
      };
    } catch (e) {
      return emptyData();
    }
  }

  const EXPORT_APP = 'tlts-truyen-cong';

  /** Chuỗi JSON để xuất (không kèm lịch sử hoàn tác). */
  function exportJson(data, now) {
    return JSON.stringify({
      app: EXPORT_APP, version: 1, exportedAt: (now || new Date()).toISOString(),
      disciples: data.disciples, expelled: data.expelled,
    }, null, 2);
  }

  /** Đọc file nhập; thay toàn bộ dữ liệu hiện tại (có thể hoàn tác). */
  function importJson(data, text) {
    let raw;
    try { raw = JSON.parse(text); } catch (e) { return { ok: false, error: 'File không phải JSON hợp lệ.' }; }
    if (!raw || !Array.isArray(raw.disciples) || !Array.isArray(raw.expelled)) {
      return { ok: false, error: 'File không đúng định dạng của Sổ Truyền Công.' };
    }
    const clean = sanitize({ disciples: raw.disciples, expelled: raw.expelled });
    const next = withHistory(data, (d) => { d.disciples = clean.disciples; d.expelled = clean.expelled; return d; });
    return { ok: true, data: next, disciples: clean.disciples.length, expelled: clean.expelled.length };
  }

  return { exportJson, importJson, SKILLS, MAX_LEVEL, ROLES, MAX_ELDERS, roleBonus, totalAfterRole, assignRole, unassignRole, emptyData, newId, clampLevel, gain, rank, sortedByTotal, transfer, retire, undo, upsert, remove, toggleDone, clearExpelled, sanitize };
});
