/*
 * Giao diện tùy chỉnh: chế độ sáng/tối, bảng màu, font, phong cách thiết kế.
 * - Bảng màu và font được gán thành biến CSS trên <html>.
 * - Phong cách (data-style) và chế độ (data-scheme) là thuộc tính trên <html>, phần CSS nằm trong styles.css.
 * Nạp ở <head> (đồng bộ) để không bị nháy màu khi mở trang.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(null);
  else root.Theme = factory(root);
})(typeof self !== 'undefined' ? self : this, function (win) {
  const KEY = 'tlts-theme-v1';
  const DEFAULTS = { mode: 'auto', palette: 'suong-nui', font: 'co-dien', style: 'giay-da' };

  // Thứ tự biến cho mỗi bộ màu (20 giá trị).
  const VARS = ['sky-a', 'sky-b', 'parch', 'parch-2', 'edge', 'edge-soft', 'ink', 'mute', 'wood', 'wood-2', 'wood-ink',
    'gold', 'jade', 'jade-soft', 'jade-ink', 'cinnabar', 'cinnabar-soft', 'seal', 'seal-2', 'on-seal'];

  const PALETTES = [
    { id: 'suong-nui', name: 'Sương núi', note: 'Giấy da, gỗ nâu (như trong game)',
      light: ['#b7c9bf', '#e3e4d3', '#f5ecd5', '#eadcba', '#c9b07c', '#dccaa0', '#3b2a1d', '#5d4b36', '#6a4424', '#4d3019', '#f6e3b0', '#e5a93d', '#3a7020', '#dcebb4', '#ffffff', '#aa301d', '#f3d0bb', '#c2501c', '#b53c12', '#ffffff'],
      dark: ['#16201c', '#1d1a15', '#2b231b', '#372d22', '#5f4c33', '#483a29', '#f2e6c9', '#b39e7c', '#3d2815', '#2a1b0e', '#f3d99a', '#f0b94d', '#93c957', '#2f3b1c', '#14200a', '#f0805f', '#47261b', '#ee7a3c', '#cf5a22', '#1d0c07'] },
    { id: 'ngoc-bich', name: 'Ngọc bích', note: 'Xanh ngọc, dịu mắt',
      light: ['#b5d3c6', '#e4eee3', '#f1f6ea', '#e0ebd2', '#9db98a', '#c5d8b2', '#17301f', '#435946', '#1f5a45', '#133b2d', '#e6f4c8', '#d9b04a', '#267330', '#d3ecc0', '#ffffff', '#aa301d', '#f3d3c6', '#1c7f58', '#136143', '#ffffff'],
      dark: ['#0f1c18', '#14211c', '#1d2b24', '#26372e', '#4a6a58', '#35503f', '#e3f0dc', '#9db8a4', '#15382c', '#0d241c', '#d6efb8', '#e2bd5a', '#8fd36a', '#26391d', '#0d1f0a', '#f2876c', '#40231c', '#3fbf8a', '#25936a', '#06150e'] },
    { id: 'hoang-hon', name: 'Hoàng hôn', note: 'Tím chiều, hồng đào',
      light: ['#cbbcd8', '#f0e2dc', '#fbf0ec', '#f1dcd8', '#c79aa8', '#e2c3c8', '#2e1d3a', '#584662', '#4b2d5e', '#2f1b3d', '#f8dcc4', '#f2b155', '#2b7043', '#d6ecd2', '#ffffff', '#ac2844', '#f6d0d4', '#c8335a', '#9f2142', '#ffffff'],
      dark: ['#1a1324', '#241822', '#2d2036', '#392a44', '#6a4d78', '#4c3859', '#f4e6f2', '#bba3c6', '#3a2149', '#251431', '#f8d9bf', '#f4b95f', '#8fd08a', '#263a2a', '#0d1d10', '#ff8aa0', '#4a2330', '#ff6f93', '#d94870', '#220510'] },
    { id: 'dai-duong', name: 'Đại dương', note: 'Xanh biển, điểm cam',
      light: ['#b3d0de', '#e6f0f0', '#f3f9fa', '#dcebf0', '#8fb4c6', '#bcd5e0', '#13293a', '#3f5768', '#1d4a68', '#10304a', '#d8efff', '#f0bf55', '#247047', '#d0eadb', '#ffffff', '#a93624', '#f4d4cb', '#c24a14', '#9c3608', '#ffffff'],
      dark: ['#0b1822', '#10202b', '#162b3a', '#1d3748', '#3d6580', '#2c4a5f', '#e2f1fa', '#97b6c8', '#12354d', '#0a2234', '#cfeaff', '#f2c35e', '#7fd3a0', '#1c3b2e', '#08201a', '#ff8f78', '#442720', '#ff8a4c', '#d9622a', '#1f0a02'] },
    { id: 'anh-dao', name: 'Anh đào', note: 'Hồng phấn, nhẹ nhàng',
      light: ['#efcfd8', '#faeeea', '#fff6f4', '#fbe3e1', '#d9a3ad', '#ecc8cb', '#3a1d27', '#75505c', '#7b3347', '#52202f', '#ffe3d6', '#eab35c', '#39733c', '#dbeed4', '#ffffff', '#ae2a27', '#f6d3d0', '#cc3566', '#a21f4b', '#ffffff'],
      dark: ['#241218', '#2a171a', '#35202a', '#432a35', '#7a4d5c', '#563643', '#fbe6ea', '#c9a2ae', '#4a1f2d', '#2f121c', '#ffd9c9', '#f2bb62', '#9bd78a', '#2b3b25', '#10200c', '#ff8f8a', '#4b2424', '#ff7aa2', '#d94b79', '#2a0612'] },
    { id: 'muc-da', name: 'Mực đá', note: 'Xám xanh, tối giản',
      light: ['#cdd3d9', '#eceef0', '#f8f8f7', '#ebecec', '#b3b9c0', '#d3d7db', '#1a1f26', '#4e5763', '#2e3641', '#1a1f27', '#e9edf2', '#d9a93f', '#23703f', '#d3ecdc', '#ffffff', '#ae302a', '#f4d5d2', '#2f66d0', '#2250a8', '#ffffff'],
      dark: ['#0f1216', '#14181d', '#1c2128', '#252b34', '#444d5a', '#323a45', '#e8ecf1', '#a0aab6', '#222831', '#14181e', '#e9edf2', '#e6b94c', '#7fd09a', '#1e3a2a', '#07190e', '#ff8f86', '#40231f', '#6b9bff', '#4a78e0', '#050e22'] },
  ];

  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const SERIF = "Georgia,'Times New Roman',serif";
  const FONTS = [
    { id: 'co-dien', name: 'Cổ điển', display: `'Noto Serif',${SERIF}`, body: `'Be Vietnam Pro',${SANS}`, gf: ['Noto+Serif:wght@600;700', 'Be+Vietnam+Pro:wght@400;500;600;700;800'] },
    { id: 'hien-dai', name: 'Hiện đại', display: `'Inter',${SANS}`, body: `'Inter',${SANS}`, gf: ['Inter:wght@400;500;600;700;800'] },
    { id: 'thanh-lich', name: 'Thanh lịch', display: `'Playfair Display',${SERIF}`, body: `'Source Sans 3',${SANS}`, gf: ['Playfair+Display:wght@600;700', 'Source+Sans+3:wght@400;500;600;700'] },
    { id: 'de-doc', name: 'Dễ đọc', display: `'Lexend',${SANS}`, body: `'Lexend',${SANS}`, gf: ['Lexend:wght@400;500;600;700'] },
    { id: 'cong-nghe', name: 'Công nghệ', display: `'Space Grotesk',${SANS}`, body: `'Space Grotesk',${SANS}`, gf: ['Space+Grotesk:wght@400;500;600;700'] },
    { id: 'he-thong', name: 'Hệ thống', display: SANS, body: SANS, gf: [] },
  ];

  const STYLES = [
    { id: 'giay-da', name: 'Giấy da', note: 'Viền kép, nền giấy, thanh gỗ' },
    { id: 'toi-gian', name: 'Tối giản', note: 'Phẳng, gọn, ít trang trí' },
    { id: 'kinh-mo', name: 'Kính mờ', note: 'Trong suốt, làm mờ nền' },
    { id: 'khoi-dam', name: 'Khối đậm', note: 'Viền đậm, bóng cứng' },
  ];

  const MODES = [
    { id: 'auto', name: 'Tự động' },
    { id: 'light', name: 'Sáng' },
    { id: 'dark', name: 'Tối' },
  ];

  const ids = (list) => list.map((x) => x.id);
  const LISTS = { mode: MODES, palette: PALETTES, font: FONTS, style: STYLES };

  /** Giữ lại giá trị hợp lệ, còn lại về mặc định. */
  function normalize(raw) {
    const out = { ...DEFAULTS };
    if (raw && typeof raw === 'object') {
      for (const k of Object.keys(DEFAULTS)) if (ids(LISTS[k]).includes(raw[k])) out[k] = raw[k];
    }
    return out;
  }
  const find = (list, id) => list.find((x) => x.id === id) || list[0];
  const palette = (id) => find(PALETTES, id);
  const font = (id) => find(FONTS, id);
  /** Bộ màu đã giải ra theo chế độ sáng/tối: { 'sky-a': '#...', ... } */
  function colors(paletteId, scheme) {
    const arr = palette(paletteId)[scheme === 'dark' ? 'dark' : 'light'];
    const out = {};
    VARS.forEach((v, i) => { out[v] = arr[i]; });
    return out;
  }
  function fontUrl(f) {
    return f.gf.length ? 'https://fonts.googleapis.com/css2?' + f.gf.map((x) => 'family=' + x).join('&') + '&display=swap' : '';
  }

  const api = { DEFAULTS, VARS, PALETTES, FONTS, STYLES, MODES, normalize, palette, font, colors, fontUrl };
  if (!win) return api; // chạy trong test (Node): chỉ cần phần dữ liệu

  // ---- Phần gắn vào trình duyệt ----
  const doc = win.document;
  const html = doc.documentElement;
  const listeners = [];
  const loaded = new Set();
  let state = load();
  let scheme = 'light';
  const mq = win.matchMedia ? win.matchMedia('(prefers-color-scheme: dark)') : null;

  function load() {
    try { return normalize(JSON.parse(win.localStorage.getItem(KEY))); } catch (e) { return { ...DEFAULTS }; }
  }
  function save() {
    try { win.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua: private mode */ }
  }
  function loadFont(f) {
    const url = fontUrl(f);
    if (!url || loaded.has(f.id)) return;
    loaded.add(f.id);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    doc.head.appendChild(link);
  }
  function meta() {
    let m = doc.querySelector('meta[name="theme-color"]');
    if (!m) { m = doc.createElement('meta'); m.name = 'theme-color'; doc.head.appendChild(m); }
    return m;
  }
  function apply() {
    scheme = state.mode === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : state.mode;
    const c = colors(state.palette, scheme);
    for (const v of VARS) html.style.setProperty('--' + v, c[v]);
    const f = font(state.font);
    html.style.setProperty('--font-body', f.body);
    html.style.setProperty('--font-display', f.display);
    html.style.colorScheme = scheme;
    html.dataset.scheme = scheme;
    html.dataset.style = state.style;
    html.dataset.palette = state.palette;
    html.dataset.font = state.font;
    loadFont(f);
    meta().content = c['wood-2'];
    listeners.forEach((fn) => fn());
  }

  if (mq) {
    const onChange = () => { if (state.mode === 'auto') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
  apply();

  return Object.assign(api, {
    get: () => ({ ...state }),
    scheme: () => scheme,
    set(patch) { state = normalize({ ...state, ...patch }); save(); apply(); },
    reset() { state = { ...DEFAULTS }; save(); apply(); },
    isDefault: () => Object.keys(DEFAULTS).every((k) => state[k] === DEFAULTS[k]),
    onChange(fn) { listeners.push(fn); },
    /** Tải sẵn mọi font để màn Giao diện xem trước được. */
    preloadFonts() { FONTS.forEach(loadFont); },
  });
});
