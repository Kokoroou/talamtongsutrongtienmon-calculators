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
    elder1: { name: 'Trưởng lão 1', bonus: 10 },
    elder2: { name: 'Trưởng lão 2', bonus: 10 },
    elder3: { name: 'Trưởng lão 3', bonus: 10 },
    elder4: { name: 'Trưởng lão 4', bonus: 10 },
  };
  const ELDER_ROLES = ['elder1', 'elder2', 'elder3', 'elder4']; // mỗi Trưởng lão có ô cố định
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

  const gainLv = (a, b) => a.reduce((sum, v, i) => sum + Math.max(0, v - b[i]), 0);
  /** Số cấp người nhận tăng thêm: mỗi chuyên môn lấy cấp cao hơn, không cộng dồn. */
  function gain(src, rec) {
    return gainLv(src.levels, rec.levels);
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
   * Bổ nhiệm `id` vào ô `role` (leader, elder1..elder4). Người đang giữ ô đó bị bãi nhiệm;
   * nếu `id` đang giữ ô khác thì ô cũ để trống, các ô còn lại giữ nguyên vị trí.
   */
  function assignRole(data, id, role) {
    const target = cleanRole(role);
    if (!target || !data.disciples.some((x) => x.id === id)) return data;
    return withHistory(data, (d) => {
      d.disciples.filter((x) => x.role === target && x.id !== id).forEach((x) => setRole(d, x.id, ''));
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
      const free = ELDER_ROLES.filter((r) => !raw.disciples.some((x) => x && x.role === r));
      const legacy = (r) => (r === 'elder' ? free.shift() || '' : r); // bản cũ chỉ có 'elder'
      return {
        disciples: raw.disciples.filter(ok).map((d) => ({
          id: d.id, name: d.name, total: Math.max(0, Math.floor(Number(d.total)) || 0),
          levels: SKILLS.map((_, i) => clampLevel(d.levels && d.levels[i])),
          role: cleanRole(legacy(d.role)),
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

  /* ===================== Gợi ý kế hoạch truyền công =====================
   * Bài toán: những người dưới ngưỡng bị trục xuất, mỗi người truyền thẳng cho MỘT người ở lại
   * (chỉ số truyền vào người sắp bị trục xuất sẽ mất, nên không đi vòng). Người nhận lấy cấp cao
   * hơn từng chuyên môn, nên mức tăng của một nhóm là tổng cấp cao nhất mỗi chuyên môn trong nhóm.
   * Mục tiêu: tăng nhiều cấp nhất, rồi mới đến ít bước (ít người phải truyền) nhất.
   * Người truyền không đem lại cấp nào thì không cần truyền, chỉ trục xuất. */
  const PLAN_LEAN_RATIOS = [0.95, 0.8]; // các phương án "ít bước": giữ lại ít nhất ngần này mức tăng tối đa

  /** Bộ sinh số ngẫu nhiên có hạt giống để kết quả luôn giống nhau với cùng dữ liệu. */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Chia theo ngưỡng: dưới ngưỡng là người truyền (trừ người có chức vụ nếu `keepRoles`), còn lại ở lại. */
  function splitByThreshold(data, threshold, keepRoles) {
    const t = Number(threshold);
    const donors = [];
    const survivors = [];
    data.disciples.forEach((d) => {
      const out = Number.isFinite(t) && d.total < t && !(keepRoles && d.role);
      (out ? donors : survivors).push(d);
    });
    return { donors: sortedByTotal(donors), survivors: sortedByTotal(survivors) };
  }

  /** Tham lam theo cặp: mỗi bước chọn cặp (người truyền → người ở lại) tăng nhiều nhất, dừng khi hết lợi. */
  function greedyPairs(S, D) {
    const cur = S.map((l) => l.slice());
    const left = D.map((_, i) => i);
    const pairs = [];
    while (left.length) {
      let best = null;
      left.forEach((d, k) => cur.forEach((lv, g) => {
        const v = gainLv(D[d], lv);
        if (!best || v > best.v) best = { v, k, d, g };
      }));
      if (!best || best.v <= 0) break;
      cur[best.g] = cur[best.g].map((v, i) => Math.max(v, D[best.d][i]));
      left.splice(best.k, 1);
      pairs.push([best.d, best.g]);
    }
    return pairs;
  }

  /** Leo đồi: dời từng người truyền sang người ở lại khác (hoặc bỏ truyền = -1) khi tăng thêm cấp, hoặc bằng cấp mà bớt được một bước. */
  function descend(S, D, assign, rand) {
    const ns = S.length;
    const members = S.map(() => []);
    assign.forEach((g, d) => { if (g >= 0) members[g].push(d); });
    const score = (g, list) => S[g].reduce((sum, base, i) => sum + list.reduce((m, d) => Math.max(m, D[d][i]), base), 0);
    const sc = members.map((m, g) => score(g, m));
    let moved = true;
    while (moved) {
      moved = false;
      const order = D.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      for (const d of order) {
        const from = assign[d];
        const rm = from >= 0 ? score(from, members[from].filter((x) => x !== d)) - sc[from] : 0;
        let best = { dv: 0, ds: 0, to: from };
        for (let to = -1; to < ns; to++) {
          if (to === from) continue;
          const dv = rm + (to >= 0 ? score(to, members[to].concat(d)) - sc[to] : 0);
          const ds = (to >= 0 ? 1 : 0) - (from >= 0 ? 1 : 0);
          if (dv > best.dv || (dv === best.dv && ds < best.ds)) best = { dv, ds, to };
        }
        if (best.to === from) continue;
        if (from >= 0) { members[from] = members[from].filter((x) => x !== d); sc[from] = score(from, members[from]); }
        if (best.to >= 0) { members[best.to].push(d); sc[best.to] = score(best.to, members[best.to]); }
        assign[d] = best.to;
        moved = true;
      }
    }
    return { assign, value: sc.reduce((a, b) => a + b, 0), steps: assign.filter((g) => g >= 0).length };
  }

  /** Tìm phân công tăng nhiều cấp nhất, trong đó ít bước nhất (tìm kiếm cục bộ có khởi động lại, hạt giống cố định). */
  function optimize(S, D) {
    const rand = rng(20260101);
    const ns = S.length;
    const start = D.map(() => -1);
    greedyPairs(S, D).forEach(([d, g]) => { start[d] = g; });
    let best = descend(S, D, start, rand);
    const rounds = D.length * ns > 3000 ? 8 : 30;
    const better = (a, b) => a.value > b.value || (a.value === b.value && a.steps < b.steps);
    for (let r = 0; r < rounds; r++) {
      const init = r % 2 === 0
        ? best.assign.map((g) => (rand() < 0.25 ? Math.floor(rand() * (ns + 1)) - 1 : g)) // xáo trộn nhẹ bản tốt nhất
        : D.map(() => Math.floor(rand() * ns));                                          // khởi tạo ngẫu nhiên
      const res = descend(S, D, init, rand);
      if (better(res, best)) best = res;
    }
    return best;
  }

  /** Dựng kế hoạch từ danh sách cặp [chỉ số người truyền, chỉ số người nhận]; các bước xếp theo mức tăng giảm dần. */
  function makePlan(kind, donors, survivors, pairs) {
    const cur = survivors.map((s) => s.levels.slice());
    const left = pairs.slice();
    const steps = [];
    const bySkill = SKILLS.map(() => 0);
    while (left.length) {
      let bi = 0;
      let bg = -1;
      left.forEach(([d, g], k) => { const v = gainLv(donors[d].levels, cur[g]); if (v > bg) { bg = v; bi = k; } });
      const [d, g] = left.splice(bi, 1)[0];
      if (bg <= 0) continue;
      const by = SKILLS.map((_, i) => Math.max(0, donors[d].levels[i] - cur[g][i]));
      cur[g] = cur[g].map((v, i) => Math.max(v, donors[d].levels[i]));
      steps.push({ src: donors[d].id, rec: survivors[g].id, gain: bg, by });
      by.forEach((v, i) => { bySkill[i] += v; });
    }
    const used = new Set(steps.map((s) => s.src));
    return {
      kind, steps, retire: donors.filter((d) => !used.has(d.id)).map((d) => d.id),
      gain: steps.reduce((n, s) => n + s.gain, 0), bySkill, stepCount: steps.length,
    };
  }

  /**
   * Các kế hoạch gợi ý cho một ngưỡng. Trả về { donors, survivors, plans }, `plans` xếp theo
   * mức tăng giảm dần rồi số bước tăng dần; kế hoạch nào bị kế hoạch khác vượt cả hai mặt thì bỏ.
   * kind 'max' = tăng tối đa (ít bước nhất trong các cách đạt mức đó); 'lean' = ít bước hơn, giữ `ratio`% mức tăng.
   */
  function buildPlans(data, threshold, keepRoles) {
    const { donors, survivors } = splitByThreshold(data, threshold, keepRoles);
    const out = { donors: donors.length, survivors: survivors.length, plans: [] };
    if (!donors.length || !survivors.length) return out;
    const S = survivors.map((s) => s.levels);
    const D = donors.map((d) => d.levels);
    const opt = optimize(S, D);
    const maxPairs = [];
    opt.assign.forEach((g, d) => { if (g >= 0) maxPairs.push([d, g]); });
    const max = makePlan('max', donors, survivors, maxPairs);
    max.ratio = 100;
    const cands = [max];
    const greedy = greedyPairs(S, D);
    for (const ratio of PLAN_LEAN_RATIOS) {
      const need = Math.ceil(ratio * max.gain);
      for (let k = 1; k <= greedy.length && max.gain > 0; k++) {
        const p = makePlan('lean', donors, survivors, greedy.slice(0, k));
        if (p.gain >= need) { p.ratio = Math.round((p.gain / max.gain) * 100); cands.push(p); break; }
      }
    }
    cands.sort((a, b) => b.gain - a.gain || a.stepCount - b.stepCount);
    let minSteps = Infinity;
    out.plans = cands.filter((p) => (p.stepCount < minSteps ? ((minSteps = p.stepCount), true) : false));
    return out;
  }

  /** Áp dụng cả kế hoạch vào sổ trong một lần (hoàn tác một lần). Từ chối nếu dữ liệu đã đổi so với lúc lập kế hoạch. */
  function applyPlan(data, plan) {
    const ids = new Set(data.disciples.map((d) => d.id));
    const order = plan.steps.map((s) => s.src).concat(plan.retire);
    if (!plan.steps.every((s) => ids.has(s.src) && ids.has(s.rec)) || !plan.retire.every((id) => ids.has(id))) return { ok: false, data };
    const next = withHistory(data, (d) => {
      plan.steps.forEach((s) => {
        const src = d.disciples.find((x) => x.id === s.src);
        const rec = d.disciples.find((x) => x.id === s.rec);
        rec.levels = rec.levels.map((v, i) => Math.max(v, src.levels[i]));
      });
      order.forEach((id) => {
        const x = d.disciples.find((y) => y.id === id);
        d.expelled.push({ id: x.id, name: x.name, total: x.total, done: false });
      });
      const gone = new Set(order);
      d.disciples = d.disciples.filter((x) => !gone.has(x.id));
      d.expelled = sortedByTotal(d.expelled); // danh sách chờ trục xuất theo giá trị tăng dần
      return d;
    });
    return { ok: true, data: next, gain: plan.gain, steps: plan.stepCount };
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

  return { exportJson, importJson, SKILLS, MAX_LEVEL, ROLES, ELDER_ROLES, roleBonus, totalAfterRole, assignRole, unassignRole, emptyData, newId, clampLevel, gain, rank, sortedByTotal, transfer, retire, buildPlans, applyPlan, splitByThreshold, undo, upsert, remove, toggleDone, clearExpelled, sanitize };
});
