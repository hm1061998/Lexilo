# Lexilo

Lexilo là ứng dụng học tiếng Anh bằng flashcard theo kiến trúc offline-first. Phase 3 bổ sung phiên học có thể khôi phục, Flashcard, Multiple Choice, Typing, spaced repetition, review logs, XP và daily statistics.

## Yêu cầu môi trường

- Node.js 20 LTS trở lên
- pnpm 9+ (hoặc npm)
- Android Studio cho Android; Xcode trên macOS cho iOS
- Expo Development Build cho các phase dùng native modules

## Cài đặt và chạy

```bash
pnpm install
pnpm start
pnpm android
pnpm ios
```

`pnpm ios` chỉ chạy trên macOS. Để kiểm tra chất lượng:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

## Cấu trúc chính

```text
src/
├── app/                    # Route và layout, không chứa business logic
├── database/               # Khởi tạo, transaction và migration SQLite
├── features/               # Module nghiệp vụ và repository contracts
├── services/               # Dịch vụ dùng chung (Query/API/sync sau này)
└── shared/                 # UI, errors, logging và theme tokens
```

SQLite là nguồn dữ liệu chính. UI chỉ truy cập dữ liệu qua repository; Zustand dành cho UI state ngắn hạn; TanStack Query điều phối loading/error/cache và invalidation.

Các module `features/decks`, `features/cards` và `features/tags` tách domain types, schemas, mappers, repository contracts/implementations, hooks và components. Chi tiết quyết định Phase 2 nằm trong `docs/phase-2-decks-and-cards.md`.

## Database và migration

Database `lexilo.db` bật foreign keys và WAL. `SQLiteProvider` chạy migration theo `PRAGMA user_version` trước khi render app; migration 2 thêm index phục vụ search/filter. Mọi mutation nhiều bảng chạy trong exclusive transaction và tạo/cập nhật `sync_queue`.

Deck và card dùng soft delete. Xóa deck đồng thời soft-delete card nhưng chỉ queue deck delete. Card chưa từng sync có thể được xóa vật lý; card đã sync giữ progress để khôi phục/đồng bộ.

## Seed, import và export

Ở development, seed tự chạy đúng một lần khi database chưa có deck, tạo ba deck và 30 flashcard. Production không chạy seed.

CSV import yêu cầu header:

```text
front_text,back_text,phonetic,part_of_speech,example_text,example_translation,note,synonyms,antonyms,difficulty,tags
```

Synonyms, antonyms và tags phân cách bằng `|`. Giới hạn 10 MB/10.000 dòng. Export JSON chỉ chứa nội dung học, không chứa ID, sync state hay tiến độ.

## Study session

Người học chọn deck, mode, scope và giới hạn tại `/study/setup`. Mỗi câu hỏi được lưu sẵn trong SQLite để thứ tự và đáp án trắc nghiệm không đổi khi app khởi động lại. Sau từng answer, progress, review log, session counters, daily statistics và sync queue được commit trong một transaction.

Session đi qua `active ↔ paused → completed | abandoned`. Home hiển thị phiên chưa hoàn tất. Thuật toán ôn tập hỗ trợ Again/Hard/Good/Easy, ease factor 1.3–3.5 và trạng thái mastered từ interval 60 ngày. Đây là thuật toán đơn giản, chưa phải FSRS. Chi tiết tại `docs/phase-3-study-session.md`.

Để thêm migration:

1. Tạo file `src/database/migrations/NNN-description.ts` triển khai `DatabaseMigration`.
2. Thêm migration theo thứ tự version vào `src/database/migrations/index.ts`.
3. Tăng `DATABASE_VERSION` trong `src/database/database.ts`.
4. Không sửa migration đã phát hành.

Reset database trong development bằng **Clear storage** hoặc gỡ rồi cài lại ứng dụng trên simulator/device. Script `reset-project` của Expo chỉ dành cho mã nguồn template, không xóa SQLite trên thiết bị.

## Build development

```bash
npx expo install expo-dev-client
npx expo run:android
npx expo run:ios
```

EAS build có thể cấu hình ở phase triển khai:

```bash
npx eas build:configure
npx eas build --profile development --platform android
```

## Kiểm thử thủ công Phase 1

- App hiển thị loading trong lúc khởi tạo database rồi chuyển đến tab Hôm nay.
- Bốn tab Hôm nay, Bộ thẻ, Tiến độ, Cài đặt điều hướng đúng.
- Giao diện đổi theo light/dark mode hệ thống, nội dung không bị cắt khi tăng font.
- Khởi động lại app không chạy lại migration version 1.
- SQLite inspector hiển thị đủ bảng và index; `PRAGMA foreign_keys` trả về `1`.

## Chưa triển khai

Notification, backend sync worker, listening/speaking, pronunciation scoring, AI, cloud backup và analytics nâng cao thuộc các phase tiếp theo. Phase 3 chưa dùng FSRS đầy đủ và chưa cho phép chỉnh sửa review log.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
