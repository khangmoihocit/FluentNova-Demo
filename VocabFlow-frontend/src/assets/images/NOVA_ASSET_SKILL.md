# Nova Asset Skill

Tài liệu này hướng dẫn AI agent và developer sử dụng bộ ảnh Nova trong giao diện FluentNova.

## Bối Cảnh Thương Hiệu

Nova là linh vật chính của FluentNova: bé cáo nhỏ đến từ hành tinh Solar, đồng hành với người học tiếng Anh qua video, từ vựng, quiz, dictation, shadowing và đồng bộ Anki.

Tính cách cần thể hiện:

- Tỏa sáng: tích cực, truyền cảm hứng, tạo cảm giác học tập nhẹ nhàng.
- Ham học hỏi: tò mò, thông minh, phù hợp với các màn hình học tiếng Anh.
- Thân thiện: gần gũi, không gây áp lực, phù hợp với empty state, onboarding, feedback.

Thông điệp thương hiệu:

- Nova English
- English - Shine Together
- Học tiếng Anh đều đặn, vui hơn, có định hướng hơn.

## Bảng Màu Tham Chiếu

Dùng bộ màu này khi phối UI quanh Nova:

| Token | Hex | Gợi ý sử dụng |
|---|---:|---|
| Solar Yellow | `#FFB347` | Accent, highlight nhẹ, icon, badge |
| Nova Orange | `#FF8A00` | CTA phụ, trạng thái tích cực, hover |
| Warm Cream | `#FFE29A` | Nền mềm, empty state, card nhẹ |
| Deep Navy | `#1E2A44` | Text chính, heading, logo contrast |
| White | `#FFFFFF` | Nền sạch, vùng thở quanh linh vật |

Tránh dùng quá nhiều cam/vàng trên cùng một màn hình. Ưu tiên nền trắng, navy cho chữ, cam/vàng làm điểm nhấn.

## Asset Hiện Có

Tất cả ảnh trong thư mục này đã được xóa nền, có thể đặt trực tiếp lên card, empty state, hero, modal, toast hoặc panel.

| File | Vai trò | Khi nào dùng |
|---|---|---|
| `nova_logo.png` | Logo/brand chính | Header, sidebar, landing hero, màn hình chào, auth page |
| `nova_symbolism.png` | Ảnh mô tả thương hiệu/tính cách Nova | Trang hướng dẫn, onboarding, about/help, phần giới thiệu hệ sinh thái |
| `nova_happy.png` | Nova vui vẻ | Thành công nhẹ, chào mừng, dashboard, lời nhắc tích cực |
| `nova_cheer.png` | Nova cổ vũ | Hoàn thành bài học, streak, submit đúng, CTA bắt đầu học |
| `nova_excited.png` | Nova phấn khích | Thành tích lớn, unlock tính năng, quiz đạt điểm cao |
| `nova_thinking.png` | Nova suy nghĩ | Loading AI, gợi ý học, trạng thái đang phân tích, câu hỏi cần chú ý |
| `nova_reading.png` | Nova đọc sách | Hướng dẫn học, notebook, vocabulary, Anki sync, đọc transcript |
| `nova_wow.png` | Nova ngạc nhiên | Cảnh báo nhẹ, phát hiện lỗi form, trạng thái cần user chú ý |

## Quy Tắc Chọn Ảnh Theo Ngữ Cảnh

Chọn ảnh theo cảm xúc của user ở thời điểm đó:

| Ngữ cảnh UI | Asset ưu tiên | Lý do |
|---|---|---|
| Empty state chưa có dữ liệu | `nova_thinking.png` hoặc `nova_reading.png` | Nhẹ nhàng, không gây cảm giác lỗi |
| Hoàn thành bài học | `nova_cheer.png` | Tạo cảm giác được cổ vũ |
| Điểm quiz/fill blank cao | `nova_excited.png` | Phù hợp khoảnh khắc thành tích |
| Thành công thông thường | `nova_happy.png` | Tích cực nhưng không quá mạnh |
| Đang tạo sub/AI/quiz/fill blank | `nova_thinking.png` | Thể hiện trạng thái đang xử lý |
| Trang hướng dẫn học | `nova_reading.png` | Phù hợp nội dung học tập |
| Lỗi nhẹ/cần chú ý | `nova_wow.png` | Cảnh báo thân thiện, không căng thẳng |
| Trang thương hiệu/about | `nova_symbolism.png` | Có đủ mô tả tính cách và bảng màu |

Không dùng Nova cho lỗi nghiêm trọng kiểu server down, thanh toán, bảo mật hoặc dữ liệu nhạy cảm. Các lỗi đó cần UI rõ ràng, ưu tiên text và hành động khắc phục.

## Quy Tắc Kích Thước

Khuyến nghị:

- Icon/mascot nhỏ trong card: `48px - 72px`
- Empty state: `120px - 180px`
- Modal/onboarding: `160px - 240px`
- Hero/auth page: `260px - 420px`
- Không để ảnh vượt quá `40vw` trên desktop hoặc `65vw` trên mobile.

CSS mẫu:

```scss
.novaMascot {
  width: clamp(120px, 18vw, 220px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 12px 24px rgba(30, 42, 68, 0.12));
}
```

## Quy Tắc Layout

Nên làm:

- Đặt Nova trong vùng có nhiều khoảng thở.
- Dùng nền trắng, cream rất nhạt hoặc card sáng.
- Dùng `drop-shadow` nhẹ thay vì box shadow nặng.
- Canh Nova gần nội dung hành động: nút bắt đầu học, nút đồng bộ, kết quả bài làm.
- Với panel học tập, dùng Nova tiết chế để không làm mất tập trung khỏi video/transcript.

Không nên làm:

- Không kéo giãn ảnh sai tỉ lệ.
- Không đặt Nova trên nền cam/vàng quá mạnh khiến nhân vật bị chìm.
- Không dùng quá nhiều trạng thái Nova trên cùng một màn hình.
- Không dùng ảnh như decoration nền lặp lại.
- Không thêm viền dày quanh ảnh vì ảnh đã có silhouette sạch.

## Import Trong React/Vite

Ưu tiên import trực tiếp để Vite tối ưu asset:

```jsx
import novaHappy from '@/assets/images/nova_happy.png';

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <img src={novaHappy} alt="Nova" className={styles.novaMascot} />
      <h3>Bắt đầu bài học đầu tiên</h3>
      <p>Nova sẽ đồng hành cùng bạn trong từng video.</p>
    </div>
  );
}
```

Nếu project không cấu hình alias `@`, dùng relative import:

```jsx
import novaHappy from '../../assets/images/nova_happy.png';
```

## Alt Text

Alt text cần ngắn, mô tả đúng vai trò:

| Asset | Alt text đề xuất |
|---|---|
| `nova_logo.png` | `Nova English logo` |
| `nova_happy.png` | `Nova vui vẻ` |
| `nova_cheer.png` | `Nova cổ vũ` |
| `nova_excited.png` | `Nova phấn khích` |
| `nova_thinking.png` | `Nova đang suy nghĩ` |
| `nova_reading.png` | `Nova đang đọc sách` |
| `nova_wow.png` | `Nova ngạc nhiên` |
| `nova_symbolism.png` | `Bộ nhận diện Nova` |

Nếu ảnh chỉ là trang trí và text cạnh đó đã đủ nghĩa, dùng `alt=""` để tránh screen reader đọc lặp.

## Gợi Ý Dùng Theo Màn Hình FluentNova

| Màn hình | Asset đề xuất |
|---|---|
| Home hero | `nova_logo.png` hoặc `nova_happy.png` |
| Login/Register | `nova_happy.png`, hạn chế dùng ảnh quá lớn |
| Verify OTP | `nova_wow.png` hoặc `nova_thinking.png` |
| Learning Watch/Listening | Chỉ dùng khi empty state hoặc kết quả, không đặt cạnh transcript đang học |
| Fill Blank result | `nova_cheer.png` nếu hoàn thành, `nova_thinking.png` nếu cần luyện lại |
| Quiz result | `nova_excited.png` điểm cao, `nova_happy.png` điểm trung bình |
| Notebook empty state | `nova_reading.png` |
| Anki sync guide | `nova_reading.png` |
| Anki sync success | `nova_cheer.png` |
| Admin AI processing | `nova_thinking.png` nếu cần minh họa |
| Error/warning nhẹ | `nova_wow.png` |

## Khi Tạo UI Mới

Checklist trước khi dùng ảnh:

1. Chọn đúng cảm xúc với trạng thái UI.
2. Giữ ảnh đúng tỉ lệ bằng `width` + `height: auto`.
3. Không để ảnh lấn vào nội dung học chính.
4. Dùng màu `#1E2A44` cho text chính nếu cần phối với Nova.
5. Chỉ dùng cam/vàng làm accent, không phủ toàn bộ màn hình.
6. Kiểm tra mobile để ảnh không chiếm quá nhiều chiều cao.
7. Không dùng asset admin/đáp án/ẩn nếu có rủi ro leak dữ liệu học tập.

## Ví Dụ Empty State

```jsx
import novaReading from '@/assets/images/nova_reading.png';

function NotebookEmptyState() {
  return (
    <section className={styles.emptyState}>
      <img src={novaReading} alt="Nova đang đọc sách" className={styles.novaMascot} />
      <h2>Chưa có từ vựng nào</h2>
      <p>Lưu từ mới khi học video để Nova giúp bạn ôn lại dễ hơn.</p>
    </section>
  );
}
```

```scss
.emptyState {
  display: grid;
  place-items: center;
  text-align: center;
  gap: 12px;
  padding: 48px 24px;
  color: #1e2a44;
  background: linear-gradient(180deg, #ffffff 0%, #fff8e8 100%);
}

.novaMascot {
  width: clamp(128px, 24vw, 220px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 14px 28px rgba(30, 42, 68, 0.14));
}
```

