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
  const DEFAULTS = { mode: 'auto', palette: 'suong-nui', font: 'co-dien', style: 'giay-da', layout: 'auto' };

  // Thứ tự biến cho mỗi bộ màu (20 giá trị).
  const VARS = ['sky-a', 'sky-b', 'parch', 'parch-2', 'edge', 'edge-soft', 'ink', 'mute', 'wood', 'wood-2', 'wood-ink',
    'gold', 'jade', 'jade-soft', 'jade-ink', 'cinnabar', 'cinnabar-soft', 'seal', 'seal-2', 'on-seal'];

  const PALETTES = [
    { id: 'suong-nui', name: 'Sương núi', note: 'Giấy da, gỗ nâu (như trong game)',
      light: ['#b7c9bf', '#e3e4d3', '#f5ecd5', '#eadcba', '#c9b07c', '#dccaa0', '#3b2a1d', '#5d4b36', '#6a4424', '#4d3019', '#f6e3b0', '#e5a93d', '#3a7020', '#dcebb4', '#ffffff', '#aa301d', '#f3d0bb', '#c2501c', '#b53c12', '#ffffff'],
      dark: ['#16201c', '#1d1a15', '#2b231b', '#372d22', '#5f4c33', '#483a29', '#f2e6c9', '#b39e7c', '#3d2815', '#2a1b0e', '#f3d99a', '#f0b94d', '#93c957', '#2f3b1c', '#14200a', '#f0805f', '#47261b', '#ee7a3c', '#cf5a22', '#1d0c07'] },
    { id: 'muc-da', name: 'Mực đá', note: 'Xám xanh, tối giản',
      light: ['#cdd3d9', '#eceef0', '#f8f8f7', '#ebecec', '#b3b9c0', '#d3d7db', '#1a1f26', '#4e5763', '#2e3641', '#1a1f27', '#e9edf2', '#d9a93f', '#23703f', '#d3ecdc', '#ffffff', '#ae302a', '#f4d5d2', '#2f66d0', '#2250a8', '#ffffff'],
      dark: ['#0f1216', '#14181d', '#1c2128', '#252b34', '#444d5a', '#323a45', '#e8ecf1', '#a0aab6', '#222831', '#14181e', '#e9edf2', '#e6b94c', '#7fd09a', '#1e3a2a', '#07190e', '#ff8f86', '#40231f', '#6b9bff', '#4a78e0', '#050e22'] },
  ];

  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const SERIF = "Georgia,'Times New Roman',serif";
  const FONTS = [
    { id: 'co-dien', name: 'Cổ điển', note: 'Tiêu đề có chân, hợp không khí tu tiên', display: `'Noto Serif',${SERIF}`, body: `'Be Vietnam Pro',${SANS}`, gf: ['Noto+Serif:wght@600;700', 'Be+Vietnam+Pro:wght@400;500;600;700;800'] },
    { id: 'hien-dai', name: 'Hiện đại', note: 'Một họ chữ, số đều nét, dễ đọc', display: `'Inter',${SANS}`, body: `'Inter',${SANS}`, gf: ['Inter:wght@400;500;600;700;800'] },
  ];

  const STYLES = [
    { id: 'giay-da', name: 'Giấy da', note: 'Thẻ giấy viền kép, thanh gỗ' },
    { id: 'toi-gian', name: 'Tối giản', note: 'Phẳng, nhẹ, gọn mắt' },
  ];

  const MODES = [
    { id: 'auto', name: 'Tự động' },
    { id: 'light', name: 'Sáng' },
    { id: 'dark', name: 'Tối' },
  ];

  const LAYOUTS = [
    { id: 'auto', name: 'Tự động' },
    { id: 'phone', name: 'Điện thoại' },
    { id: 'desktop', name: 'Máy tính' },
  ];

  const ids = (list) => list.map((x) => x.id);
  const LISTS = { mode: MODES, palette: PALETTES, font: FONTS, style: STYLES, layout: LAYOUTS };

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

  /** Các mốc bố cục theo bề rộng "hiệu dụng" (px CSS sau khi phóng). Mốc cách nhau xấp xỉ tỉ lệ vàng: 720 · 1100 ≈ 720×1.53. */
  function breakpoints(w) {
    const out = [];
    if (w >= 720) out.push('t'); // máy tính bảng: cột icon bên trái
    if (w >= 900) out.push('d'); // màn truyền công chia hai cột
    if (w >= 1100) out.push('w'); // thanh bên có chữ
    return out.join(' ');
  }
  const PHONE_W = 412; // bề rộng điện thoại chuẩn khi ép chế độ "Điện thoại"
  /**
   * Hệ số phóng để bố cục điện thoại không bị co nhỏ khi trình duyệt bật "Trang web cho máy tính"
   * (viewport 980px nhưng màn hình thật chỉ ~400px). Trả 1 nếu không cần phóng.
   */
  function zoomFor({ layout, vw, screenW, coarse }) {
    if (layout === 'desktop') return 1;
    if (layout === 'phone') return vw > PHONE_W * 1.2 ? vw / PHONE_W : 1;
    return coarse && screenW > 0 && screenW < 600 && vw > screenW * 1.2 ? vw / screenW : 1;
  }

  const api = { DEFAULTS, VARS, PALETTES, FONTS, STYLES, MODES, LAYOUTS, normalize, palette, font, colors, fontUrl, breakpoints, zoomFor };
  if (!win) return api; // chạy trong test (Node): chỉ cần phần dữ liệu

  // ---- Phần gắn vào trình duyệt ----
  const doc = win.document;
  const html = doc.documentElement;
  const listeners = [];
  const loaded = new Set();
  let state = load();
  let scheme = 'light';
  let zoom = 1;
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
  function applyLayout() {
    const vw = win.innerWidth; // không đổi khi phóng body
    const coarse = !!(win.matchMedia && win.matchMedia('(pointer: coarse)').matches);
    zoom = zoomFor({ layout: state.layout, vw, screenW: win.screen ? win.screen.width : 0, coarse });
    if (doc.body) doc.body.style.zoom = zoom > 1 ? String(zoom) : '';
    html.style.setProperty('--z', String(zoom));
    html.dataset.bp = breakpoints(vw / zoom);
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
    applyLayout();
    listeners.forEach((fn) => fn());
  }

  if (mq) {
    const onChange = () => { if (state.mode === 'auto') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
  apply();
  win.addEventListener('resize', applyLayout);
  win.addEventListener('orientationchange', () => setTimeout(applyLayout, 150));
  doc.addEventListener('DOMContentLoaded', applyLayout);

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
