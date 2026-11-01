/*
 * Lớp lưu trữ. Hiện lưu trong trình duyệt (localStorage).
 * TODO (chưa làm): đồng bộ đa nền tảng. Chỉ cần thay load/save bằng bản gọi máy chủ,
 * phần tính toán trong logic.js không phải sửa.
 */
(function (root) {
  const KEY = 'tlts-truyen-cong-v1';

  function load() {
    try {
      const raw = root.localStorage.getItem(KEY);
      return root.Logic.sanitize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return root.Logic.emptyData();
    }
  }

  function save(data) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  const PREFS_KEY = 'tlts-truyen-cong-plan-v1';
  const PREFS_DEFAULT = { threshold: 250, keepRoles: true };

  /** Thiết lập màn Kế hoạch (ngưỡng, giữ chức vụ). Hỏng thì dùng mặc định. */
  function loadPrefs() {
    try {
      const p = JSON.parse(root.localStorage.getItem(PREFS_KEY));
      const t = p && p.threshold !== null && p.threshold !== '' ? Math.floor(Number(p.threshold)) : NaN;
      return { threshold: Number.isFinite(t) && t >= 0 ? t : PREFS_DEFAULT.threshold, keepRoles: p && typeof p.keepRoles === 'boolean' ? p.keepRoles : PREFS_DEFAULT.keepRoles };
    } catch (e) {
      return { ...PREFS_DEFAULT };
    }
  }

  function savePrefs(p) {
    try { root.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) { /* bỏ qua */ }
  }

  root.Store = { load, save, loadPrefs, savePrefs };
})(window);
