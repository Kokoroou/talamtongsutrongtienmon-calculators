const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../js/theme.js');

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test('mỗi bảng màu đủ biến, đúng định dạng hex', () => {
  for (const p of T.PALETTES) for (const s of ['light', 'dark']) {
    assert.equal(p[s].length, T.VARS.length, `${p.id}/${s}`);
    for (const v of p[s]) assert.match(v, /^#[0-9a-f]{6}$/i, `${p.id}/${s}`);
  }
});

test('id của bảng màu, font, phong cách không trùng', () => {
  for (const list of [T.PALETTES, T.FONTS, T.STYLES, T.MODES]) {
    assert.equal(new Set(list.map((x) => x.id)).size, list.length);
  }
});

test('mỗi mục chỉ giữ 2 lựa chọn tốt nhất', () => {
  assert.equal(T.PALETTES.length, 2);
  assert.equal(T.FONTS.length, 2);
  assert.equal(T.STYLES.length, 2);
});

test('breakpoints và zoomFor', () => {
  assert.equal(T.breakpoints(412), '');
  assert.equal(T.breakpoints(820), 't');
  assert.equal(T.breakpoints(1000), 't d');
  assert.equal(T.breakpoints(1440), 't d w');
  // điện thoại 412px bật "Trang web cho máy tính" (viewport 980) -> phóng ~2.38 để bố cục như điện thoại
  const z = T.zoomFor({ vw: 980, screenW: 412, coarse: true });
  assert.ok(Math.abs(z - 980 / 412) < 1e-9);
  assert.equal(T.zoomFor({ vw: 412, screenW: 412, coarse: true }), 1); // điện thoại bình thường
  assert.equal(T.zoomFor({ vw: 915, screenW: 915, coarse: true }), 1); // xoay ngang
  assert.equal(T.zoomFor({ vw: 1440, screenW: 1440, coarse: false }), 1); // máy tính
});

test('normalize bỏ giá trị lạ, về mặc định', () => {
  assert.deepEqual(T.normalize(null), T.DEFAULTS);
  assert.deepEqual(T.normalize({ palette: 'không-có', font: 5, mode: 'dark', style: 'kinh-mo' }),
    { ...T.DEFAULTS, mode: 'dark' });
});

test('font có URL Google Fonts, trừ font hệ thống', () => {
  for (const f of T.FONTS) {
    const url = T.fontUrl(f);
    if (f.id === 'he-thong') assert.equal(url, '');
    else assert.match(url, /^https:\/\/fonts\.googleapis\.com\/css2\?family=.+&display=swap$/);
  }
});

// Độ tương phản (WCAG AA 4.5:1) cho các cặp chữ/nền thực sự được dùng trong styles.css.
test('độ tương phản chữ/nền đạt AA ở mọi bảng màu, sáng và tối', () => {
  const bad = [];
  for (const p of T.PALETTES) for (const s of ['light', 'dark']) {
    const c = T.colors(p.id, s);
    const icon = s === 'dark' ? c['wood-ink'] : c.wood; // biến --icon trong styles.css
    const onDanger = s === 'dark' ? '#1d0c07' : '#ffffff';
    const pairs = [
      ['ink/parch', c.ink, c.parch], ['ink/parch-2', c.ink, c['parch-2']],
      ['mute/parch', c.mute, c.parch], ['mute/parch-2', c.mute, c['parch-2']],
      ['mute/sky-a', c.mute, c['sky-a']], ['mute/sky-b', c.mute, c['sky-b']],
      ['ink/sky-a', c.ink, c['sky-a']],
      ['icon/parch-2', icon, c['parch-2']], ['icon/parch', icon, c.parch],
      ['wood-ink/wood', c['wood-ink'], c.wood], ['wood-ink/wood-2', c['wood-ink'], c['wood-2']],
      ['on-seal/seal', c['on-seal'], c.seal], ['on-seal/seal-2', c['on-seal'], c['seal-2']],
      ['jade/jade-soft', c.jade, c['jade-soft']], ['jade-ink/jade', c['jade-ink'], c.jade],
      ['cinnabar/parch', c.cinnabar, c.parch], ['cinnabar/cinnabar-soft', c.cinnabar, c['cinnabar-soft']],
      ['on-danger/cinnabar', onDanger, c.cinnabar],
    ];
    for (const [name, fg, bg] of pairs) {
      const r = ratio(fg, bg);
      if (r < 4.5) bad.push(`${p.id}/${s} ${name} = ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(bad, []);
});
