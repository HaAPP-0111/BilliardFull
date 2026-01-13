# Hướng dẫn Deploy Backend lên Render

## Bước 1: Chuẩn bị Database
Bạn cần có MySQL database. Có 2 lựa chọn:

### Option A: Dùng Railway (Miễn phí $5 credit)
1. Tạo tài khoản tại [Railway.app](https://railway.app)
2. Tạo MySQL database mới
3. Lấy thông tin kết nối:
   - `MYSQL_URL` (jdbc:mysql://...)
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`

### Option B: Dùng PlanetScale (Free tier)
1. Tạo tài khoản tại [PlanetScale.com](https://planetscale.com)
2. Tạo database mới
3. Lấy connection string

## Bước 2: Push code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Bước 3: Deploy trên Render
1. Đăng nhập [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Kết nối GitHub repository của bạn
4. Cấu hình:
   - **Name**: billiard-backend (hoặc tên bạn muốn)
   - **Environment**: Docker
   - **Branch**: main
   - **Region**: Chọn gần bạn nhất

## Bước 4: Cấu hình Environment Variables trên Render
Vào phần "Environment" và thêm các biến sau:

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:mysql://[HOST]:[PORT]/[DATABASE]?useSSL=true&requireSSL=true
SPRING_DATASOURCE_USERNAME=[YOUR_DB_USERNAME]
SPRING_DATASOURCE_PASSWORD=[YOUR_DB_PASSWORD]
JWT_SECRET=[RANDOM_STRING_AT_LEAST_256_BITS]
JWT_VALIDITY_MS=3600000
UPLOAD_DIR=/app/uploads
DDL_AUTO=update
SHOW_SQL=false
```

### Tạo JWT_SECRET ngẫu nhiên:
```bash
# Dùng PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Hoặc dùng online tool: https://www.grc.com/passwords.htm
```

## Bước 5: Deploy
1. Click "Create Web Service"
2. Render sẽ tự động build và deploy
3. Đợi khoảng 5-10 phút
4. Truy cập URL: `https://[your-service-name].onrender.com`

## Bước 6: Kiểm tra
- API docs: `https://[your-service-name].onrender.com/swagger-ui.html`
- Health check: `https://[your-service-name].onrender.com/actuator/health` (nếu có actuator)

## Lưu ý
- **Free plan của Render**: Service sẽ sleep sau 15 phút không hoạt động
- Lần đầu tiên truy cập sau khi sleep sẽ mất ~30-60s để wake up
- Cần upgrade plan nếu muốn 24/7 uptime
- Database free tier có giới hạn dung lượng

## Troubleshooting
### Lỗi kết nối database
- Kiểm tra `SPRING_DATASOURCE_URL` có đúng format không
- Đảm bảo database đang chạy
- Kiểm tra firewall/whitelist IP

### Lỗi build
- Kiểm tra Dockerfile
- Xem logs trong Render dashboard

### Lỗi 502 Bad Gateway
- Đợi thêm vài phút để service khởi động hoàn toàn
- Kiểm tra logs xem có lỗi gì

## Các lệnh hữu ích
```bash
# Build local để test
mvn clean package -DskipTests

# Build với Docker
docker build -t backend .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=... \
  -e JWT_SECRET=... \
  backend

# Xem logs
docker logs [container-id]
```
