# Lexilo

Lexilo là ứng dụng học tiếng Anh bằng flashcard, được xây dựng với Expo SDK 57 và React Native. Ứng dụng hoạt động theo hướng offline-first, hỗ trợ quản lý bộ thẻ, nhiều chế độ luyện tập, lặp lại ngắt quãng, thống kê tiến độ, nhắc lịch học, đọc văn bản tiếng Anh, sao lưu dữ liệu và hàng đợi đồng bộ.

## Yêu cầu

- Node.js 22.13.x trở lên
- Yarn
- Android Studio để build Android
- macOS và Xcode để build iOS
- Tài khoản Expo nếu build bằng EAS

## Cài đặt và chạy

```bash
yarn install
yarn start
```

Từ Expo CLI, nhấn `a` để mở Android hoặc `i` để mở iOS. Bạn cũng có thể chạy trực tiếp:

```bash
yarn android
yarn ios
yarn web
```

Một số tính năng sử dụng native module, vì vậy nên dùng development build thay cho Expo Go.

## Build

### Development build trên máy

```bash
npx expo run:android
npx expo run:ios
```

Lệnh iOS chỉ chạy trên macOS. Hai lệnh trên tạo native project khi cần và build ứng dụng bằng toolchain cục bộ.

### Build bằng EAS

Đăng nhập Expo trước lần build đầu tiên:

```bash
npx eas-cli login
```

Các profile đã được cấu hình trong `eas.json`:

```bash
# Development client để phát triển và debug
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios

# Bản preview để kiểm thử nội bộ
npx eas-cli build --profile preview --platform all

# Bản production để phát hành
npx eas-cli build --profile production --platform all
```

Mỗi profile dùng tên ứng dụng và application ID riêng thông qua biến `APP_VARIANT`, nhờ đó có thể cài song song các bản development, preview và production.

## Kiểm tra và test

Chạy unit test:

```bash
yarn test
```

Chạy toàn bộ kiểm tra chất lượng trước khi tạo pull request hoặc build production:

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test
```

Sửa định dạng tự động bằng:

```bash
yarn format
```

## Công nghệ chính

- Expo SDK 57, React Native 0.86 và Expo Router
- SQLite cho dữ liệu offline
- TanStack Query và Zustand cho quản lý trạng thái
- Jest cho unit test

Tài liệu kỹ thuật chi tiết nằm trong thư mục [`docs`](./docs).
