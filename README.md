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
- Responsive: điện thoại (thanh điều hướng dưới), máy tính bảng (cột icon bên trái, lưới 2 cột), máy tính (thanh bên có chữ, lưới nhiều cột, màn truyền công chia hai cột 1 : φ). Tràn hết chiều ngang, không có lề thừa.
- Điện thoại bật "Trang web cho máy tính" vẫn ra bố cục điện thoại (tự phóng lại, xem `zoomFor` trong `js/theme.js`). Nếu không nhận đúng, vào tab Giao diện → Bố cục → "Điện thoại".
- Tab **Giao diện**: chế độ sáng/tối/tự động, 2 bảng màu (Sương núi, Mực đá), 2 font (Cổ điển, Hiện đại), 2 phong cách (Giấy da, Tối giản). Lưu trong trình duyệt.
- Kích thước theo tỉ lệ vàng, ghi ở đầu `styles.css`: khoảng cách 6·10·16·26·42·68, cỡ chữ 13·16·20·26, bo góc 6·10·16.
- `npm test` kiểm tra độ tương phản WCAG AA của mọi bảng màu.

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
