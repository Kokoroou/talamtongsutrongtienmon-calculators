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

  root.Store = { load, save };
})(window);
