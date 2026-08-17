import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './GuidePage.module.scss';
import ankiConfigImage from '../../assets/images/ankiconfig.png';
import minh_hoa_phu_de from '../../assets/images/minh_hoa_video_co_phu_de.png';

const toc = [
  { id: 'anki-sync', label: 'Hướng dẫn đồng bộ với Anki' },
  { id: 'learning-guide', label: 'Hướng dẫn học trên web' },
  { id: 'subtitle-guide', label: 'Hướng dẫn lấy phụ đề (.srt, .json)' },
];

const GuidePage = () => {
  const [activeId, setActiveId] = useState('');
  const [searchParams] = useSearchParams();

  // Scroll to section based on URL parameter or hash
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    const targetId = sectionParam || window.location.hash.replace('#', '');
    if (targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveId(targetId);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      {/* Sidebar TOC — fixed */}
      <aside className={styles.sidebar}>
        <nav className={styles.toc}>
          <p className={styles.tocLabel}>Mục lục</p>
          <ul>
            {toc.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={activeId === id ? styles.active : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.replaceState(null, '', `?section=${id}`);
                    setActiveId(id);
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.breadcrumb}>Trang chủ / Hướng dẫn</span>
          <h1>Trung tâm hướng dẫn</h1>
          <p className={styles.subtitle}>
            Tất cả những gì bạn cần biết để sử dụng FluentNova hiệu quả
          </p>
        </header>

        {/* ═══ ARTICLE 1: Anki Sync ═══ */}
        <article>
          <section id="anki-sync" className={styles.section}>
            <h2>Hướng dẫn đồng bộ với Anki</h2>
            <p>
              FluentNova dùng <strong>AnkiConnect</strong> kết hợp với extension để gửi từ vựng và video yêu thích từ trình duyệt sang app Anki trên máy tính.
              Bạn cần cài add-on này một lần duy nhất, sau đó mỗi lần đồng bộ chỉ cần mở sẵn Anki.
            </p>
          </section>

          <section id="anki-steps" className={styles.section}>
            <h3>Các bước cài đặt và đồng bộ</h3>
            <p>Chỉ áp dụng cho app anki trên window, mac mình chưa test</p>

            <ol>
              <li>
                Cài đặt  {' '}
                <a
                  href="https://chromewebstore.google.com/detail/fluentnova-anki-sync-brid/foioemhfhdejepfeikpgibjlglbghnpf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.driveLink}
                >
                  🧩extension FluentNova tại đây
                </a>{' '}
                (do web không thể kết nối trực tiếp với Anki trên máy nên cần phải qua extension).
              </li>
              <li>
                Cài Add-on AnkiConnect trong Anki
                <ul>
                  <li>
                    Mở Anki, vào <code>Tools &gt; Add-ons &gt; Get Add-ons</code>.
                  </li>
                  <li>
                    Nhập mã add-on AnkiConnect: <code>2055492159</code>.
                  </li>
                  <li>
                    Click double vào tên add-on vừa cài và <b>thêm dòng</b> "https://fluentnova.site" <b>vào</b> webCorsOriginList như ảnh:
                    <img
                      src={ankiConfigImage}
                      height={500}
                      alt="Cấu hình AnkiConnect thêm https://fluentnova.site vào webCorsOriginList"
                      className={styles.ankiConfigImage}
                    />
                  </li>
                  <li>Bấm OK để cài đặt, sau đó tắt và <strong>MỞ LẠI Anki</strong>.</li>
                </ul>
              </li>

              <li>
                Tải 2 template sau và import vào Anki:{' '}
                <a
                  href="https://drive.google.com/drive/folders/1-j-iZfIk84mjgossz4jIadxzhmdHhjtj?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.driveLink}
                >
                  📁 Tải template tại đây
                </a>
              </li>
              <li>Bắt đầu đồng bộ</li>
            </ol>

            <blockquote className={styles.warning}>
              <strong>Lưu ý quan trọng:</strong> Sau khi cài AnkiConnect, bạn phải <strong>tắt và mở lại Anki</strong>.
              Khi bấm đồng bộ trên web, Anki cũng phải đang mở, nếu không trình duyệt sẽ không kết nối được.
              <br />
              <br />
              Nếu đồng bộ lỗi, hãy kiểm tra Anki đã mở chưa, add-on AnkiConnect đã cài chưa, và thử reload lại trang
              FluentNova.
            </blockquote>
          </section>

          <section id="anki-faq" className={styles.section}>
            <h3>Xử lý lỗi Anki</h3>

            <div className={styles.faqList}>
              <details open>
                <summary>Không đồng bộ được Anki</summary>
                <p>Mở app Anki trước, kiểm tra add-on AnkiConnect, sau đó bấm đồng bộ lại.</p>
              </details>

              {/* <details>
                <summary>Không thấy từ mới trong Anki</summary>
                <p>Kiểm tra deck trong Anki và đảm bảo unit trong FluentNova có từ đã lưu.</p>
              </details> */}
            </div>
          </section>
        </article>

        <hr className={styles.divider} />

        {/* ═══ ARTICLE 2: Learning Guide ═══ */}
        <article>
          <section id="learning-guide" className={styles.section}>
            <h2>Hướng dẫn học trên FluentNova</h2>
            <p>
              FluentNova giúp việc học tiếng Anh qua video YouTube trở nên dễ dàng hơn. Mỗi video được chia thành nhiều chế độ học khác
              nhau, giúp bạn vừa nghe hiểu, vừa luyện phát âm và ghi nhớ từ vựng.
            </p>
            <p>
              Bài viết này hướng dẫn quy trình học đề xuất và cách dùng từng chế độ. Bạn không cần làm hết tất cả
              trong một lần — hãy chia nhỏ theo ngày.
            </p>
          </section>

          <section id="study-flow" className={styles.section}>
            <h3>Quy trình học đề xuất</h3>
            <p>Đi theo thứ tự 5 bước dưới đây để vừa hiểu nội dung, vừa luyện nghe và nói một cách có hệ thống.</p>

            <ol className={styles.orderedSteps}>
              <li>
                <strong>Watch</strong> — Xem toàn video để hiểu chủ đề, người nói và ngữ cảnh.
              </li>
              <li>
                <strong>Listening</strong> — Làm bài fill-in-the-blank để kiểm tra khả năng nghe từ khóa.
              </li>
              <li>
                <strong>Dictation</strong> — Gõ lại từng câu để luyện nghe chi tiết và chính tả.
              </li>
              <li>
                <strong>Shadowing</strong> — Nhại lại câu nói để luyện phát âm và phản xạ nói.
              </li>
              <li>
                <strong>Quiz</strong> — Nghe không sub và trả lời câu hỏi để kiểm tra nghe hiểu nội dung toàn video.
              </li>
            </ol>

            <blockquote className={styles.note}>
              Không cần hoàn thành tất cả 5 bước trong một phiên. Nếu video dài, bạn có thể chia thành nhiều ngày.
            </blockquote>
          </section>

          <section id="study-modes" className={styles.section}>
            <h3>Chi tiết từng chế độ học</h3>

            <div className={styles.modeBlock}>
              <h4>Watch</h4>
              <p>Xem video kèm transcript để nắm nội dung tổng quan trước khi luyện sâu.</p>
              <ul>
                <li>Xem toàn video để hiểu chủ đề và ngữ cảnh.</li>
                <li>Theo dõi transcript để nhận diện từ mới.</li>
                <li>Nên xem ít nhất một lượt trước khi làm bài.</li>
              </ul>
            </div>

            <div className={styles.modeBlock}>
              <h4>Listening</h4>
              <p>Luyện nghe điền từ còn thiếu dựa trên transcript của video.</p>
              <ul>
                <li>Nghe trước, đừng nhìn dịch ngay.</li>
                <li>Điền đủ tất cả ô trống rồi mới submit.</li>
                <li>Sau khi nộp bài, xem lại đáp án sai và nghe lại đoạn đó.</li>
              </ul>
            </div>

            <div className={styles.modeBlock}>
              <h4>Dictation</h4>
              <p>Nghe từng câu và gõ lại chính xác để luyện nghe chi tiết.</p>
              <ul>
                <li>Replay khi chưa nghe rõ.</li>
                <li>Dùng hint vừa phải để điểm phản ánh đúng năng lực.</li>
                <li>Tập trung cụm âm nối và ending sounds.</li>
              </ul>
            </div>

            <div className={styles.modeBlock}>
              <h4>Shadowing</h4>
              <p>Nghe và nhại lại câu nói để luyện phát âm, nhịp điệu và phản xạ nói.</p>
              <ul>
                <li>Nghe mẫu trước khi ghi âm.</li>
                <li>Nói theo tốc độ thật của video.</li>
                <li>So sánh điểm và ghi âm để sửa phát âm.</li>
              </ul>
            </div>

            <div className={styles.modeBlock}>
              <h4>Quiz</h4>
              <p>Kiểm tra mức độ hiểu nội dung toàn video bằng câu hỏi nghe hiểu.</p>
              <ul>
                <li>Có thể nghe video hoặc đọc transcript trước khi trả lời.</li>
                <li>Chọn đủ đáp án rồi submit.</li>
                <li>Đọc giải thích sau khi nộp để hiểu ngữ cảnh.</li>
              </ul>
            </div>
          </section>

          <section id="notebook" className={styles.section}>
            <h3>Sổ tay từ vựng</h3>
            <p>Lưu từ mới theo nhóm và unit để ôn lại có hệ thống.</p>

            <ol>
              <li>
                Tạo <strong>nhóm từ vựng</strong> trong Sổ tay, ví dụ: <em>Business English</em>,{' '}
                <em>Daily Conversation</em>.
              </li>
              <li>
                Tạo <strong>unit nhỏ</strong> bên trong nhóm, ví dụ: <em>Video 01</em>, <em>Travel</em>,{' '}
                <em>Interview</em>.
              </li>
              <li>Khi tra từ bằng drawer từ điển, chọn unit rồi lưu từ vào sổ tay.</li>
              <li>Kiểm tra lại nghĩa, ví dụ và phát âm trước khi đồng bộ sang Anki.</li>
            </ol>
          </section>

          <section id="tips" className={styles.section}>
            <h3>Mẹo học hiệu quả</h3>
            <p>Giữ nhịp học ngắn nhưng đều sẽ hiệu quả hơn học dồn một lần.</p>

            <ul>
              <li>
                <strong>Video dài:</strong> chia thành nhiều phiên học, mỗi phiên 10–20 phút.
              </li>
              <li>
                <strong>Listening sai nhiều:</strong> quay lại Watch và nghe đoạn transcript đó thêm một lượt.
              </li>
              <li>
                <strong>Dictation chậm:</strong> tập từng câu ngắn, chưa cần làm hết video trong một lần.
              </li>
              <li>
                <strong>Shadowing:</strong> ưu tiên nói đúng nhịp trước, sau đó mới tăng tốc.
              </li>
            </ul>
          </section>
        </article>

        <hr className={styles.divider} />

        {/* ═══ ARTICLE 3: Subtitle Guide ═══ */}
        <article>
          <section id="subtitle-guide" className={styles.section}>
            <h2>Hướng dẫn lấy file phụ đề (.srt hoặc .json)</h2>
            <p>
              1 video trên youtube sẽ có 2 kiểu: <b>có phụ đề do người đăng video tạo</b> và <b>có phụ đề do youtube tạo tự động</b>
              <p>Như hình dưới là video có phụ đề do người đăng video tạo &rarr; hãy dùng cách 2, ngược lại dùng cách 1 để lấy file phụ đề</p>
              <img
                src={minh_hoa_phu_de}
                height={400}
                className={styles.ankiConfigImage}
              />
            </p>
          </section>
          <section id="capcut-guide" className={styles.section}>
            <h3>Cách 1: Tạo phụ đề tiếng Anh (.json) bằng CapCut</h3>
            <p>
              Sử dụng cách này khi video YouTube không có sẵn phụ đề tiếng Anh gốc. Bạn có thể sử dụng công cụ Auto Captions của CapCut để nhận diện giọng nói tự động.
            </p>
            <ol>
              <li>Tải file âm thanh (.mp3 hoặc .mp4) của video từ YouTube qua các trang web hỗ trợ tải .mp3, .mp4 YouTube như <a href="https://v4.www-y2mate.blog/vi2/" target="_blank" rel="noopener noreferrer" className={styles.driveLink}>y2mate</a>.</li>
              <li>Mở phần mềm CapCut trên máy tính, tạo dự án mới và nhập (import) file âm thanh vừa tải vào timeline.</li>
              <li>Di chuyển chuột vào phần vừa import, ấn dấu + (Add to track)</li>
              <li>Vào tab <strong>captions</strong>, chọn ngôn ngữ gốc là <strong>English</strong> rồi bấm <strong>Create</strong> để tạo phụ đề tự động.</li>
              <li>Sau khi phụ đề được tạo, vào thư mục lưu dự án của CapCut trên máy tính của bạn:
                <ul>
                  <li>Đường dẫn mặc định trên Windows: <code>C:\Users\Tên_User\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\</code></li>
                  <li>Mở thư mục của dự án gần nhất và tìm file <code>draft_content.json</code>.</li>
                </ul>
              </li>
              <li>Quay lại FluentNova và tải file <code>draft_content.json</code> này lên hệ thống để hoàn tất tạo bài học.</li>
            </ol>
          </section>
          <section id="downsub-guide" className={styles.section}>
            <h3>Cách 2: Lấy file phụ đề tiếng Anh (.srt) từ DownSub</h3>
            <p>
              Đây là cách nhanh nhất và đơn giản nhất nếu video gốc trên YouTube đã có sẵn phụ đề tiếng Anh (do người dùng tạo), nếu video chỉ có phụ đề do youtube tạo tự động thì hãy dùng cách 2, vì phụ đề do youtube tạo tự động đôi khi sẽ không chính xác.
            </p>
            <div style={{ marginTop: '16px', marginBottom: '20px', maxWidth: '560px', width: '100%' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <iframe
                  src="https://www.youtube.com/embed/fybUg48lDQk"
                  title="Hướng dẫn lấy phụ đề tiếng Anh từ DownSub"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            </div>
            <ol>
              <li>Truy cập trang web <a href="https://downsub.com" target="_blank" rel="noopener noreferrer" className={styles.driveLink}>DownSub.com</a>.</li>
              <li>Dán đường link YouTube của video bạn muốn học vào ô tìm kiếm và bấm nút <strong>Download</strong>.</li>
              <li>Cuộn xuống danh sách các ngôn ngữ, tìm dòng <strong>English</strong> và bấm tải về định dạng <strong>.SRT</strong>.</li>
              <li>Quay lại trang "Video của tôi" trên FluentNova, kéo thả hoặc chọn file `.srt` vừa tải vào khung upload để nhập phụ đề.</li>
            </ol>
          </section>


        </article>

        <footer className={styles.footer}>
          <p>Cập nhật lần cuối: 27/05/2026.</p>
        </footer>
      </div>
    </main>
  );
};

export default GuidePage;
