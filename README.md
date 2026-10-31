# talamtongsutrongtienmon-calculators
Công cụ hỗ trợ tính toán khi chơi game "Ta làm tông sư trong tiên môn".

## Sổ Truyền Công
Chọn đệ tử cần trục xuất, xem nên truyền công cho ai để tăng được nhiều cấp nhất, bấm truyền, rồi trục xuất cả loạt trong game.

- Nhập tay tên, tổng giá trị và cấp 8 chuyên môn của từng đệ tử.
- Danh sách xếp tăng dần theo tổng giá trị.
- Truyền công: người truyền về cấp 0; người nhận nâng mỗi chuyên môn lên bằng cấp người truyền nếu cao hơn (không cộng dồn).
- Gợi ý xếp theo số cấp tăng, hòa thì người có tổng giá trị lớn hơn đứng trước.
- Hoàn tác nhiều bước, sửa tay đệ tử, danh sách "Đã truyền hết" để trục xuất xong rồi mới xóa.
- Dữ liệu lưu trong trình duyệt (localStorage). Cấp tối đa tạm đặt 100 (`MAX_LEVEL` trong `js/logic.js`).

### Chạy
Mở `index.html` trong trình duyệt, hoặc `npx serve .`. Không cần build.

```bash
npm test
```

### Chưa làm
- Lưu dữ liệu đa nền tảng (đồng bộ đám mây). Chỉ cần thay `js/store.js`.
- Giao diện nhập liệu cho máy tính.
