# Hydration Reminder Chrome Extension

A Chrome extension that helps you stay hydrated throughout the day by sending customizable reminders.

## Features

- **Customizable Reminders**: Set notification intervals from 15 minutes to 4 hours
- **Water Intake Tracking**: Track your daily water consumption with visual progress indicators
- **Notification Sounds**: Choose from various notification sounds with volume control
- **Statistics**: View your hydration habits with daily and weekly statistics
- **Light/Dark Mode**: Switch between light and dark themes
- **Fullscreen Detection**: Pause notifications during fullscreen activities like presentations or videos
- **Easy Access**: Small icon in the Chrome toolbar for quick access

## Installation Guide

### Prerequisites
- Google Chrome browser
- Basic understanding of loading unpacked extensions

### Step 1: Download the Extension
1. Clone this repository:
   ```
   git clone https://github.com/yourusername/hydration-reminder.git
   ```
   Or download as ZIP and extract it to a folder

### Step 2: Prepare Required Files
1. **Icons**: 
   - Add icon files to the `icons` directory:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can find suitable water-themed icons on sites like [Flaticon](https://www.flaticon.com/)

2. **Sounds**:
   - Add MP3 sound files to the `public/sounds` directory:
     - `water-drop.mp3`
     - `bell.mp3`
     - `chime.mp3`
     - `birds.mp3`
     - `stream.mp3`
   - You can find free sound effects on sites like [Freesound](https://freesound.org/)

### Step 3: Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the extension directory
4. The extension should now appear in your browser toolbar

## Usage Guide

### Setting Up Reminders
1. Click the extension icon in the Chrome toolbar
2. In the Settings section:
   - Choose your reminder interval (15min to 4hrs)
   - Set your daily water intake target (in ml)
   - Select your preferred notification sound
   - Adjust the notification volume
   - Toggle notifications on/off
   - Toggle the option to pause notifications during fullscreen mode
3. Click "Save Settings" to apply changes

### Tracking Water Intake
1. Click the extension icon
2. Use the quick buttons to add water:
   - +100ml, +250ml, +500ml
   - Or click "Custom" to enter a specific amount
3. The progress bar shows your daily progress
4. The Statistics section shows:
   - Today's intake
   - Yesterday's intake
   - 7-day average
   - A visual chart of the past week

### Responding to Notifications
When you receive a notification:
1. Click on it to log 250ml of water
2. The notification will be dismissed
3. Your progress will automatically update

### Customizing the Theme
- Click the moon/sun icon in the top right to switch between light and dark themes
- Your theme preference will be saved

## Troubleshooting

### Extension Not Working
1. Check that all required files are in the correct locations
2. Go to `chrome://extensions/` and click the "Reload" button on the extension
3. Make sure notifications are enabled in your system settings

### Sound Not Playing
1. Ensure sound files are correctly placed in the `public/sounds` directory
2. Check your system volume settings
3. Try adjusting the volume slider in the extension settings

### UI Not Displaying Correctly or Missing Styles
1. Delete the `dist` directory and rebuild with the `npm run build` command
2. Check if the `styles/styles.css` file exists in the `dist` directory
3. Open Chrome DevTools when the extension appears to see CSS issues
4. If the issue is "Failed to load resource", check the CSS path in `popup.html`
5. Sometimes, you need to clear Chrome cache:
   - Go to `chrome://settings/clearBrowserData`
   - Select "Cached images and files"
   - Press "Clear data"

### Tailwind Not Working
1. Check if the `tailwind.config.js` file is configured correctly with content paths
2. Run `npx tailwindcss init -p` to create config files
3. Verify PostCSS is configured correctly in `postcss.config.js`
4. Check CSS import in `popup.js` and `popup.html`

## Privacy

This extension stores all data locally using Chrome's storage API and does not transmit any data to external servers.

---

# Hướng Dẫn Sử Dụng Extension Nhắc Nhở Uống Nước

Extension Chrome giúp bạn duy trì thói quen uống nước đều đặn thông qua các thông báo tùy chỉnh.

## Tính Năng

- **Tùy Chỉnh Thời Gian Nhắc Nhở**: Đặt khoảng thời gian từ 15 phút đến 4 giờ
- **Theo Dõi Lượng Nước**: Ghi lại lượng nước uống hàng ngày với thanh tiến trình trực quan
- **Âm Thanh Thông Báo**: Lựa chọn nhiều âm thanh khác nhau với điều chỉnh âm lượng
- **Thống Kê**: Xem thói quen uống nước hàng ngày và hàng tuần
- **Chế Độ Sáng/Tối**: Chuyển đổi giữa giao diện sáng và tối
- **Phát Hiện Toàn Màn Hình**: Tạm dừng thông báo khi đang xem video hoặc thuyết trình toàn màn hình
- **Dễ Tiếp Cận**: Biểu tượng nhỏ trên thanh công cụ Chrome để truy cập nhanh

## Hướng Dẫn Cài Đặt

### Yêu Cầu
- Trình duyệt Google Chrome
- Hiểu biết cơ bản về cách tải extension

### Bước 1: Tải Extension
1. Clone repository này:
   ```
   git clone https://github.com/username/hydration-reminder.git
   ```
   Hoặc tải về dưới dạng ZIP và giải nén vào một thư mục

### Bước 2: Chuẩn Bị Các File Cần Thiết
1. **Biểu Tượng**: 
   - Thêm các file biểu tượng vào thư mục `icons`:
     - `icon16.png` (16x16 pixel)
     - `icon48.png` (48x48 pixel)
     - `icon128.png` (128x128 pixel)
   - Bạn có thể tìm biểu tượng phù hợp trên [Flaticon](https://www.flaticon.com/)

2. **Âm Thanh**:
   - Thêm các file âm thanh MP3 vào thư mục `public/sounds`:
     - `water-drop.mp3`
     - `bell.mp3`
     - `chime.mp3`
     - `birds.mp3`
     - `stream.mp3`
   - Bạn có thể tìm hiệu ứng âm thanh miễn phí trên [Freesound](https://freesound.org/)

### Bước 3: Tải Extension Vào Chrome
1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Chế độ nhà phát triển" bằng cách chuyển công tắc ở góc trên bên phải
3. Nhấp vào "Tải giải nén" và chọn thư mục extension
4. Extension sẽ xuất hiện trên thanh công cụ trình duyệt của bạn

## Hướng Dẫn Sử Dụng

### Thiết Lập Nhắc Nhở
1. Nhấp vào biểu tượng extension trên thanh công cụ Chrome
2. Trong phần Cài đặt:
   - Chọn khoảng thời gian nhắc nhở (15 phút đến 4 giờ)
   - Đặt mục tiêu uống nước hàng ngày (tính bằng ml)
   - Chọn âm thanh thông báo ưa thích
   - Điều chỉnh âm lượng thông báo
   - Bật/tắt thông báo
   - Bật/tắt tùy chọn tạm dừng thông báo khi ở chế độ toàn màn hình
3. Nhấp vào "Lưu Cài Đặt" để áp dụng thay đổi

### Theo Dõi Lượng Nước Uống
1. Nhấp vào biểu tượng extension
2. Sử dụng các nút nhanh để thêm lượng nước:
   - +100ml, +250ml, +500ml
   - Hoặc nhấp vào "Tùy chỉnh" để nhập một lượng cụ thể
3. Thanh tiến trình hiển thị tiến độ hàng ngày của bạn
4. Phần Thống kê hiển thị:
   - Lượng nước uống hôm nay
   - Lượng nước uống hôm qua
   - Trung bình 7 ngày
   - Biểu đồ trực quan của tuần trước

### Phản Hồi Thông Báo
Khi bạn nhận được thông báo:
1. Nhấp vào nó để ghi nhận 250ml nước
2. Thông báo sẽ biến mất
3. Tiến trình của bạn sẽ tự động cập nhật

### Tùy Chỉnh Giao Diện
- Nhấp vào biểu tượng mặt trăng/mặt trời ở góc trên bên phải để chuyển đổi giữa giao diện sáng và tối
- Tùy chọn giao diện của bạn sẽ được lưu lại

## Xử Lý Sự Cố

### Extension Không Hoạt Động
1. Kiểm tra xem tất cả các file cần thiết có đúng vị trí không
2. Truy cập `chrome://extensions/` và nhấp vào nút "Tải lại" trên extension
3. Đảm bảo thông báo được bật trong cài đặt hệ thống của bạn

### Âm Thanh Không Phát
1. Đảm bảo các file âm thanh được đặt đúng vị trí trong thư mục `public/sounds`
2. Kiểm tra cài đặt âm lượng hệ thống
3. Thử điều chỉnh thanh trượt âm lượng trong cài đặt extension

### UI Không Hiển Thị Đúng Hoặc Thiếu Styles
1. Xóa thư mục `dist` và build lại với lệnh `npm run build`
2. Kiểm tra file `styles/styles.css` đã được tạo trong thư mục `dist`
3. Mở Chrome DevTools khi extension hiện lên để xem lỗi CSS
4. Nếu lỗi "Failed to load resource", kiểm tra đường dẫn CSS trong `popup.html`
5. Đôi khi cần xóa cache của Chrome: 
   - Đi đến `chrome://settings/clearBrowserData`
   - Chọn "Cached images and files" 
   - Nhấn "Clear data"

### Tailwind Không Hoạt Động
1. Kiểm tra file `tailwind.config.js` đã cấu hình đúng content paths
2. Chạy `npx tailwindcss init -p` để tạo lại config files
3. Xác nhận PostCSS đã được cấu hình đúng trong `postcss.config.js`
4. Kiểm tra import CSS trong `popup.js` và `popup.html`

## Quyền Riêng Tư

Extension này lưu trữ tất cả dữ liệu cục bộ bằng API lưu trữ của Chrome và không truyền bất kỳ dữ liệu nào đến máy chủ bên ngoài.

## Hướng Dẫn Phát Triển

### Cài Đặt Dependencies

Để phát triển hoặc chỉnh sửa extension, cần cài đặt các dependencies:

```bash
# Cài đặt dependencies
npm install

# Khởi chạy chế độ phát triển
npm run dev
```

### Build Extension

```bash
# Build extension cho sản phẩm
npm run build

# Build và theo dõi thay đổi
npm run watch
```

### Công Nghệ Sử Dụng

- **Tailwind CSS v4:** Framework CSS tiện ích để tạo UI dựa trên class
- **Shadcn UI:** Pattern thiết kế UI hiện đại dựa trên Radix UI  
- **Radix UI:** Thư viện các primitive component không có styles
- **Vite:** Công cụ build hiện đại và nhanh chóng

### Cấu Trúc Thư Mục

- `src/`: Chứa mã nguồn JavaScript và CSS
- `public/`: Chứa tài nguyên tĩnh (âm thanh, hình ảnh)
- `icons/`: Chứa biểu tượng extension
- `dist/`: (được tạo sau khi build) Chứa tệp đã được biên dịch 