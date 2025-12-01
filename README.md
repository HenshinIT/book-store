# Hệ thống Quản lý Cửa hàng Sách

Hệ thống CMS quản lý cửa hàng sách với đầy đủ tính năng đăng nhập, đăng ký, phân quyền sử dụng Next.js, Prisma và PostgreSQL.

## Tính năng

- ✅ Đăng nhập / Đăng ký tài khoản
- ✅ Phân quyền người dùng (ADMIN, MANAGER, STAFF, CUSTOMER)
- ✅ Dashboard quản lý tổng quan
- ✅ Quản lý sách (CRUD)
- ✅ Quản lý người dùng (chỉ ADMIN và MANAGER)
- ✅ Soft delete cho các bản ghi
- ✅ Bảo mật với JWT (JSON Web Token)

## Yêu cầu hệ thống

- **Node.js**: >= 18.x (khuyến nghị >= 20.x)
- **npm**: >= 9.x hoặc yarn/pnpm
- **PostgreSQL**: >= 12.x
- **Git**: để clone repository

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd store-book
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Chuẩn bị Database

Đảm bảo bạn đã cài đặt và chạy PostgreSQL. Tạo database mới:

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE storebook;

# Tạo user (tùy chọn)
CREATE USER storebook WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE storebook TO storebook;
\q
```

### 4. Thiết lập môi trường

Tạo file `.env` trong thư mục gốc của project với nội dung:

```env
# Database Connection
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://username:password@localhost:5432/storebook?schema=public"

# JWT Secret Key (bắt buộc - tối thiểu 32 ký tự)
# Để tạo JWT_SECRET an toàn, chạy lệnh:
# openssl rand -base64 32
JWT_SECRET=your-secret-key-change-this-in-production-min-32-chars

# JWT Expiration Time
# Examples: 7d (7 days), 24h (24 hours), 30d (30 days)
JWT_EXPIRES_IN=7d
```

**Lưu ý quan trọng:**
- Thay `username`, `password`, `localhost`, `5432`, `storebook` bằng thông tin PostgreSQL của bạn
- Nếu mật khẩu có ký tự đặc biệt, cần URL encode (ví dụ: `@` thành `%40`)
- **KHÔNG** commit file `.env` lên GitHub (đã được thêm vào `.gitignore`)

Để tạo JWT_SECRET an toàn:
```bash
openssl rand -base64 32
```

### 5. Chạy Prisma migrations

```bash
# Generate Prisma client (tạo Prisma Client dựa trên schema)
npm run db:generate

# Chạy migrations (tạo các bảng trong database)
npm run db:migrate
```

Nếu gặp lỗi, có thể cần chạy:
```bash
npx prisma migrate dev --name init
```

### 6. (Tùy chọn) Seed dữ liệu mẫu

```bash
npm run db:seed
```

### 7. (Tùy chọn) Tạo tài khoản Admin

```bash
npm run create-admin
```

Sau đó nhập email và password cho tài khoản admin khi được yêu cầu.

### 8. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Truy cập http://localhost:3000

### 9. (Tùy chọn) Xem Database với Prisma Studio

```bash
npm run db:studio
```

Truy cập http://localhost:5555 để xem và quản lý dữ liệu trực tiếp.

## Troubleshooting

### Lỗi kết nối Database

- Kiểm tra PostgreSQL đang chạy: `pg_isready` hoặc `psql -U postgres -c "SELECT 1"`
- Kiểm tra `DATABASE_URL` trong file `.env` có đúng định dạng không
- Kiểm tra firewall và port PostgreSQL (mặc định 5432)
- Đảm bảo database đã được tạo: `psql -U postgres -l | grep storebook`

### Lỗi Prisma

- Nếu gặp lỗi "Prisma Client has not been generated", chạy: `npm run db:generate`
- Nếu migrations bị lỗi, có thể reset database (cẩn thận - sẽ mất dữ liệu):
  ```bash
  npx prisma migrate reset
  npm run db:migrate
  ```

### Lỗi JWT

- Đảm bảo `JWT_SECRET` có ít nhất 32 ký tự
- Kiểm tra format của `JWT_EXPIRES_IN` (ví dụ: `7d`, `24h`, `30d`)

### Lỗi port đã sử dụng

- Nếu port 3000 đã được sử dụng, có thể chạy trên port khác:
  ```bash
  PORT=3001 npm run dev
  ```

## Cấu trúc dự án

```
├── app/
│   ├── api/           # API routes
│   ├── cms/           # CMS pages
│   ├── login/         # Trang đăng nhập
│   └── register/      # Trang đăng ký
├── components/        # React components
├── lib/               # Utilities và helpers
├── prisma/            # Prisma schema
└── types/             # TypeScript types
```

## Phân quyền

- **ADMIN**: Toàn quyền quản lý
- **MANAGER**: Quản lý người dùng và sách
- **STAFF**: Quản lý sách
- **CUSTOMER**: Chỉ xem (chưa triển khai)

## Database Schema

Hệ thống sử dụng các bảng chính:
- `users`: Người dùng
- `books`: Sách
- `categories`: Danh mục sách
- `orders`: Đơn hàng
- `order_items`: Chi tiết đơn hàng

Tất cả đều hỗ trợ soft delete với trường `deletedAt`.
# bookstore
