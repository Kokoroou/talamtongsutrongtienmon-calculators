const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');

const mk = (id, total, levels) => ({ id, name: id, total, levels, role: '' });
// Thứ tự: Bồi Thực, Thương Đạo, Luyện Khí, Nuôi Dưỡng, Đan Đạo, Phù Lục, Trận pháp, Tụ Linh
const base = () => ({
  disciples: [
    mk('te', 182, [2, 0, 0, 0, 6, 1, 1, 0]),         // Tề Nhận Lộ
    mk('truong', 150, [2, 2, 5, 1, 0, 1, 0, 1]),     // Trương Lương Tài (ảnh trong game)
    mk('a', 200, [0, 0, 0, 0, 0, 0, 0, 0]),
  ],
  expelled: [],
  history: [],
});

test('gain khớp ảnh game: Tề Nhận Lộ → Trương Lương Tài là +7', () => {
  const d = base();
  assert.equal(L.gain(d.disciples[0], d.disciples[1]), 7);
});

test('rank: nhiều cấp tăng trước, hòa thì tổng giá trị lớn hơn trước', () => {
  const src = mk('s', 1, [0, 0, 0, 0, 6, 0, 0, 0]);
  const list = [mk('x', 100, [0, 0, 0, 0, 0, 0, 0, 0]), mk('y', 300, [0, 0, 0, 0, 0, 0, 0, 0]), mk('z', 500, [0, 0, 0, 0, 5, 0, 0, 0])];
  const r = L.rank(src, list);
  assert.deepEqual(r.map((x) => x.d.id), ['y', 'x', 'z']);
  assert.deepEqual(r.map((x) => x.gain), [6, 6, 1]);
});

test('rank bỏ qua chính người truyền', () => {
  const d = base();
  assert.ok(!L.rank(d.disciples[0], d.disciples).some((x) => x.d.id === 'te'));
});

test('transfer: người truyền sang danh sách chờ, người nhận lấy cấp cao hơn', () => {
  const r = L.transfer(base(), 'te', 'truong');
  assert.equal(r.gain, 7);
  assert.deepEqual(r.data.disciples.find((x) => x.id === 'truong').levels, [2, 2, 5, 1, 6, 1, 1, 1]);
  assert.ok(!r.data.disciples.some((x) => x.id === 'te'));
  assert.equal(r.data.expelled.length, 1);
  assert.equal(r.data.expelled[0].id, 'te');
  assert.equal(r.data.history.length, 1);
});

test('undo khôi phục cả hai bên', () => {
  const before = base();
  const after = L.undo(L.transfer(before, 'te', 'truong').data);
  assert.deepEqual(after.disciples, before.disciples);
  assert.deepEqual(after.expelled, []);
  assert.equal(after.history.length, 0);
});

test('undo nhiều bước', () => {
  let d = base();
  d = L.transfer(d, 'te', 'truong').data;
  d = L.clearExpelled(d);
  d = L.undo(d);
  assert.equal(d.expelled.length, 1);
  d = L.undo(d);
  assert.equal(d.disciples.length, 3);
});

test('upsert thêm mới, sửa và giới hạn cấp 0..100', () => {
  let d = L.upsert(L.emptyData(), { name: ' Mới ', total: '77', levels: [5, -3, 250, 'x', 1, 0, 0, 0] });
  const n = d.disciples[0];
  assert.equal(n.name, 'Mới');
  assert.equal(n.total, 77);
  assert.deepEqual(n.levels, [5, 0, 100, 0, 1, 0, 0, 0]);
  d = L.upsert(d, { id: n.id, name: 'Mới', total: 80, levels: n.levels });
  assert.equal(d.disciples.length, 1);
  assert.equal(d.disciples[0].total, 80);
});

test('toggleDone, retire và clearExpelled', () => {
  let d = L.retire(base(), 'a');
  assert.equal(d.expelled[0].id, 'a');
  d = L.toggleDone(d, 'a');
  assert.equal(d.expelled[0].done, true);
  d = L.clearExpelled(d);
  assert.equal(d.expelled.length, 0);
});

test('sanitize chịu được dữ liệu hỏng', () => {
  assert.deepEqual(L.sanitize(null), L.emptyData());
  assert.deepEqual(L.sanitize({ disciples: 5 }), L.emptyData());
  const s = L.sanitize({ disciples: [{ id: 'a', name: 'A', total: '9', levels: [1] }, { bad: 1 }], expelled: [] });
  assert.equal(s.disciples.length, 1);
  assert.equal(s.disciples[0].levels.length, 8);
});

test('exportJson/importJson: xuất rồi nhập lại giữ nguyên dữ liệu và hoàn tác được', () => {
  const src = L.retire(base(), 'a');
  const text = L.exportJson(src, new Date('2026-01-01T00:00:00Z'));
  assert.equal(JSON.parse(text).exportedAt, '2026-01-01T00:00:00.000Z');
  assert.equal('history' in JSON.parse(text), false);
  const r = L.importJson(L.emptyData(), text);
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.disciples, src.disciples);
  assert.deepEqual(r.data.expelled, src.expelled);
  assert.deepEqual(L.undo(r.data).disciples, []);
});

test('importJson từ chối file sai', () => {
  assert.equal(L.importJson(base(), 'không phải json').ok, false);
  assert.equal(L.importJson(base(), '{"disciples":1}').ok, false);
  assert.equal(L.importJson(base(), 'null').ok, false);
});

test('chức vụ: totalAfterRole cộng/trừ đúng phần thưởng', () => {
  assert.equal(L.totalAfterRole(100, '', 'leader'), 130);
  assert.equal(L.totalAfterRole(130, 'leader', 'elder1'), 110);
  assert.equal(L.totalAfterRole(110, 'elder1', ''), 100);
  assert.equal(L.totalAfterRole(5, 'leader', ''), 0);
});

test('assignRole: chỉ một Chưởng môn, người cũ bị hạ và trừ 30', () => {
  let d = { ...L.emptyData(), disciples: [mk('a', 100, []), mk('b', 100, [])] };
  d = L.assignRole(d, 'a', 'leader');
  assert.equal(d.disciples[0].total, 130);
  d = L.assignRole(d, 'b', 'leader', 'a');
  assert.deepEqual(d.disciples.map((x) => [x.role, x.total]), [['', 100], ['leader', 130]]);
});

test('assignRole: Trưởng lão giữ nguyên ô, ô mới không đẩy ô cũ', () => {
  let d = { ...L.emptyData(), disciples: ['a', 'b', 'c'].map((i) => mk(i, 50, [])) };
  d = L.assignRole(d, 'a', 'elder1');
  d = L.assignRole(d, 'b', 'elder2');
  assert.deepEqual(d.disciples.map((x) => x.role), ['elder1', 'elder2', '']);
  d = L.assignRole(d, 'c', 'elder1'); // thay người ở ô 1, a bị bãi nhiệm
  assert.deepEqual(d.disciples.map((x) => [x.role, x.total]), [['', 50], ['elder2', 60], ['elder1', 60]]);
});

test('assignRole: Trưởng lão lên Chưởng môn, bãi nhiệm và hoàn tác', () => {
  let d = { ...L.emptyData(), disciples: [mk('a', 50, []), mk('b', 50, [])] };
  d = L.assignRole(d, 'a', 'elder3');
  d = L.assignRole(d, 'a', 'leader');
  assert.equal(d.disciples[0].total, 80); // 50 + 10 - 10 + 30
  d = L.assignRole(d, 'b', 'leader');
  assert.deepEqual(d.disciples.map((x) => [x.role, x.total]), [['', 50], ['leader', 80]]);
  d = L.unassignRole(d, 'b');
  assert.equal(d.disciples[1].total, 50);
  assert.equal(L.undo(d).disciples[1].role, 'leader');
});

test('upsert giữ nguyên chức vụ khi sửa đệ tử', () => {
  let d = { ...L.emptyData(), disciples: [mk('a', 100, [])] };
  d = L.assignRole(d, 'a', 'elder2');
  d = L.upsert(d, { id: 'a', name: 'A', total: 110, levels: [] });
  assert.equal(d.disciples[0].role, 'elder2');
});

test('chức vụ: sanitize giữ chức vụ hợp lệ, bỏ giá trị lạ', () => {
  const r = L.sanitize({ disciples: [{ id: 'a', name: 'A', total: 1, levels: [], role: 'elder' }, { id: 'b', name: 'B', total: 1, levels: [], role: 'x' }], expelled: [] });
  assert.deepEqual(r.disciples.map((d) => d.role), ['elder1', '']);
});

// ---------- Gợi ý kế hoạch truyền công ----------
const planData = (list) => ({ disciples: list, expelled: [], history: [] });
const lv = (...a) => a.concat([0, 0, 0, 0, 0, 0, 0, 0]).slice(0, 8);

test('buildPlans: chia theo ngưỡng, giữ người có chức vụ khi được yêu cầu', () => {
  const d = planData([mk('lo', 100, lv(5)), { ...mk('boss', 100, lv(9)), role: 'elder1' }, mk('hi', 300, lv(1))]);
  assert.deepEqual(L.splitByThreshold(d, 200, false).donors.map((x) => x.id), ['boss', 'lo']);
  assert.deepEqual(L.splitByThreshold(d, 200, true).donors.map((x) => x.id), ['lo']);
  assert.deepEqual(L.splitByThreshold(d, 200, true).survivors.map((x) => x.id), ['boss', 'hi']);
  assert.deepEqual(L.splitByThreshold(d, 'x', true).donors, []);
});

test('buildPlans: không có người bị loại hoặc không ai ở lại thì không có kế hoạch', () => {
  const d = planData([mk('a', 100, lv(5)), mk('b', 120, lv(1))]);
  assert.deepEqual(L.buildPlans(d, 50, true).plans, []);
  assert.deepEqual(L.buildPlans(d, 999, true).plans, []);
});

test('buildPlans: chọn cách gán tăng nhiều hơn tham lam theo người nhận tốt nhất từng bước', () => {
  // x có Bồi Thực 9, y có Thương Đạo 9. s1 có sẵn Bồi Thực 8, s2 trống.
  // Tham lam cặp: x→s2 (+9) rồi y→s1 (+9) = 18; cách khác: x→s1 chỉ +1 nên không tốt hơn.
  const d = planData([mk('x', 10, lv(9, 0)), mk('y', 11, lv(0, 9)), mk('s1', 300, lv(8, 0)), mk('s2', 301, lv(0, 0))]);
  const r = L.buildPlans(d, 100, false);
  const p = r.plans[0];
  assert.equal(p.kind, 'max');
  assert.equal(p.gain, 18);
  assert.equal(p.stepCount, 2);
  assert.deepEqual(p.retire, []);
});

test('buildPlans: người không đem lại cấp nào chỉ trục xuất, không tính là một bước', () => {
  const d = planData([mk('x', 10, lv(9)), mk('z', 12, lv(2)), mk('s', 300, lv(0))]);
  const p = L.buildPlans(d, 100, false).plans[0];
  assert.equal(p.gain, 9);
  assert.deepEqual(p.steps.map((s) => s.src), ['x']);
  assert.deepEqual(p.retire, ['z']);
  assert.deepEqual(p.bySkill, [9, 0, 0, 0, 0, 0, 0, 0]);
});

test('buildPlans: ngang cấp thì chọn ít bước (hai người cùng cấp cao nhất chỉ cần một)', () => {
  const d = planData([mk('x', 10, lv(5, 0)), mk('y', 11, lv(5, 0)), mk('s', 300, lv(0))]);
  const p = L.buildPlans(d, 100, false).plans[0];
  assert.equal(p.gain, 5);
  assert.equal(p.stepCount, 1);
});

test('buildPlans: kiểm chứng với vét cạn trên dữ liệu ngẫu nhiên nhỏ (tối đa cấp, rồi ít bước nhất)', () => {
  let seed = 7;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  for (let trial = 0; trial < 40; trial++) {
    const nd = 2 + rnd(4);
    const ns = 1 + rnd(3);
    const mkLv = () => Array.from({ length: 8 }, () => (rnd(3) === 0 ? 0 : rnd(8)));
    const donors = Array.from({ length: nd }, (_, i) => mk('d' + i, 10 + i, mkLv()));
    const surv = Array.from({ length: ns }, (_, i) => mk('s' + i, 500 + i, mkLv()));
    const data = planData(donors.concat(surv));
    const plan = L.buildPlans(data, 100, false).plans[0];
    // vét cạn: mỗi người truyền chọn một người nhận hoặc bỏ (-1)
    let bestV = -1;
    let bestS = Infinity;
    const total = (ns + 1) ** nd;
    for (let code = 0; code < total; code++) {
      const g = surv.map((s) => s.levels.slice());
      let c = code;
      let steps = 0;
      for (let i = 0; i < nd; i++) {
        const t = (c % (ns + 1)) - 1;
        c = Math.floor(c / (ns + 1));
        if (t >= 0) { g[t] = g[t].map((v, k) => Math.max(v, donors[i].levels[k])); steps++; }
      }
      const v = g.reduce((n, l, k) => n + l.reduce((a, b, i) => a + b - surv[k].levels[i], 0), 0);
      if (v > bestV || (v === bestV && steps < bestS)) { bestV = v; bestS = steps; }
    }
    assert.equal(plan.gain, bestV, `trial ${trial}: gain`);
    // số bước tối thiểu thật sự = bước có đóng góp; vét cạn có thể đếm bước thừa nên so sánh <=
    assert.ok(plan.stepCount <= bestS, `trial ${trial}: steps ${plan.stepCount} > ${bestS}`);
  }
});

test('buildPlans: các phương án ít bước giữ đúng tỉ lệ, ít bước hơn và không bị vượt', () => {
  const d = planData([
    mk('a', 10, lv(10)), mk('b', 11, lv(0, 10)), mk('c', 12, lv(0, 0, 10)), mk('e', 13, lv(0, 0, 0, 1)),
    mk('s', 500, lv(0)), mk('t', 501, lv(0)),
  ]);
  const { plans } = L.buildPlans(d, 100, false);
  assert.equal(plans[0].kind, 'max');
  assert.equal(plans[0].gain, 31);
  for (let i = 1; i < plans.length; i++) {
    assert.ok(plans[i].gain < plans[i - 1].gain && plans[i].stepCount < plans[i - 1].stepCount);
  }
  assert.ok(plans.length >= 2);
  assert.ok(plans[1].kind === 'lean' && plans[1].ratio >= 80);
});

test('buildPlans: cùng dữ liệu cho cùng kết quả', () => {
  const d = planData(['a', 'b', 'c', 'd'].map((i, k) => mk(i, 10 + k, lv(k, 3 - k, k % 2, 1))).concat([mk('s', 500, lv(1)), mk('t', 501, lv(0, 1))]));
  assert.deepEqual(L.buildPlans(d, 100, false), L.buildPlans(d, 100, false));
});

test('applyPlan: kết quả giống truyền công từng bước rồi trục xuất số còn lại, hoàn tác một lần', () => {
  const d = planData([mk('x', 10, lv(9, 0)), mk('y', 11, lv(0, 9)), mk('z', 12, lv(1)), mk('s1', 300, lv(8, 0)), mk('s2', 301, lv(0, 0))]);
  const plan = L.buildPlans(d, 100, false).plans[0];
  const r = L.applyPlan(d, plan);
  assert.equal(r.ok, true);
  let seq = d;
  plan.steps.forEach((s) => { seq = L.transfer(seq, s.src, s.rec).data; });
  plan.retire.forEach((id) => { seq = L.retire(seq, id); });
  assert.deepEqual(r.data.disciples, seq.disciples);
  assert.deepEqual(r.data.expelled, seq.expelled);
  assert.equal(r.data.history.length, 1);
  assert.deepEqual(L.undo(r.data).disciples, d.disciples);
  assert.equal(L.undo(r.data).expelled.length, 0);
});

test('applyPlan: từ chối khi dữ liệu đã đổi', () => {
  const d = planData([mk('x', 10, lv(9)), mk('s', 300, lv(0))]);
  const plan = L.buildPlans(d, 100, false).plans[0];
  const r = L.applyPlan(L.remove(d, 'x'), plan);
  assert.equal(r.ok, false);
});
