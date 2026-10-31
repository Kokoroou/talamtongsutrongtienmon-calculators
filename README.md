# tongsu-calc
Công cụ hỗ trợ tính toán khi chơi game "Ta làm tông sư trong tiên môn".

Dùng thử: https://kokoroou.github.io/tongsu-calc/

## Sổ Truyền Công
Chọn đệ tử cần trục xuất, xem nên truyền công cho ai để tăng được nhiều cấp nhất, bấm truyền, rồi trục xuất cả loạt trong game.

- Nhập tay tên, tổng giá trị và cấp 8 chuyên môn của từng đệ tử.
- Danh sách xếp tăng dần theo tổng giá trị.
- Truyền công: người truyền về cấp 0; người nhận nâng mỗi chuyên môn lên bằng cấp người truyền nếu cao hơn (không cộng dồn).
- Gợi ý xếp theo số cấp tăng, hòa thì người có tổng giá trị lớn hơn đứng trước.
- Hoàn tác nhiều bước, sửa tay đệ tử, danh sách "Đã truyền hết" để trục xuất xong rồi mới xóa.
- Dữ liệu lưu trong trình duyệt (localStorage). Nút "Sao lưu" ở màn hình Đệ tử để xuất/nhập file JSON (chuyển thiết bị, sao lưu). Cấp tối đa tạm đặt 100 (`MAX_LEVEL` trong `js/logic.js`).

### Giao diện đa nền tảng
- Responsive: điện thoại (thanh điều hướng dưới), máy tính bảng (cột icon bên trái, lưới 2 cột), máy tính (thanh bên có chữ, lưới nhiều cột, màn truyền công chia hai cột).
- Tab **Giao diện** cho chọn lại: chế độ sáng/tối/tự động, 6 bảng màu, 6 font (đều hỗ trợ tiếng Việt), 4 phong cách (Giấy da, Tối giản, Kính mờ, Khối đậm). Lựa chọn lưu trong trình duyệt (`js/theme.js`), áp dụng ngay.
- Thêm bảng màu/font/phong cách: sửa `PALETTES`/`FONTS`/`STYLES` trong `js/theme.js` (phong cách thêm khối token tương ứng trong `styles.css`). `npm test` kiểm tra độ tương phản WCAG AA của mọi bảng màu.

### Triển khai
GitHub Pages tự động deploy khi push lên `main` (`.github/workflows/pages.yml`). Cần bật Settings → Pages → Source: **GitHub Actions**.

### Chạy
Mở `index.html` trong trình duyệt, hoặc `npx serve .`. Không cần build.

```bash
npm test
```

### Chưa làm
- Lưu dữ liệu đa nền tảng (đồng bộ đám mây). Chỉ cần thay `js/store.js`.
- Giao diện nhập liệu cho máy tính.
