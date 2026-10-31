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
  assert.equal(L.totalAfterRole(130, 'leader', 'elder'), 110);
  assert.equal(L.totalAfterRole(110, 'elder', ''), 100);
  assert.equal(L.totalAfterRole(5, 'leader', ''), 0);
});

test('assignRole: chỉ một Chưởng môn, người cũ bị hạ và trừ 30', () => {
  let d = { ...L.emptyData(), disciples: [mk('a', 100, []), mk('b', 100, [])] };
  d = L.assignRole(d, 'a', 'leader');
  assert.equal(d.disciples[0].total, 130);
  d = L.assignRole(d, 'b', 'leader', 'a');
  assert.deepEqual(d.disciples.map((x) => [x.role, x.total]), [['', 100], ['leader', 130]]);
});

test('assignRole: đổi Chưởng lão sang Chưởng môn, tối đa 4 Chưởng lão, bãi nhiệm và hoàn tác', () => {
  let d = { ...L.emptyData(), disciples: ['a', 'b', 'c', 'd', 'e'].map((i) => mk(i, 50, [])) };
  for (const i of ['a', 'b', 'c', 'd']) d = L.assignRole(d, i, 'elder');
  assert.equal(L.assignRole(d, 'e', 'elder'), d); // đã đủ 4
  d = L.assignRole(d, 'a', 'leader');
  assert.equal(d.disciples[0].total, 80); // 50 + 10 - 10 + 30
  d = L.unassignRole(d, 'a');
  assert.equal(d.disciples[0].total, 50);
  assert.equal(L.undo(d).disciples[0].role, 'leader');
});

test('upsert giữ nguyên chức vụ khi sửa đệ tử', () => {
  let d = { ...L.emptyData(), disciples: [mk('a', 100, [])] };
  d = L.assignRole(d, 'a', 'elder');
  d = L.upsert(d, { id: 'a', name: 'A', total: 110, levels: [] });
  assert.equal(d.disciples[0].role, 'elder');
});

test('chức vụ: sanitize giữ chức vụ hợp lệ, bỏ giá trị lạ', () => {
  const r = L.sanitize({ disciples: [{ id: 'a', name: 'A', total: 1, levels: [], role: 'elder' }, { id: 'b', name: 'B', total: 1, levels: [], role: 'x' }], expelled: [] });
  assert.deepEqual(r.disciples.map((d) => d.role), ['elder', '']);
});
