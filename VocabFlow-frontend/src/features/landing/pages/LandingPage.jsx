import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme/context/ThemeContext';
import FluentNovaLogo from '../../../components/common/Logo/FluentNovaLogo';
import styles from '../styles/landing.module.scss';

const THEME_ICONS = {
    basic: '☀️',
    dark: '🌙',
    solar: '🔥',
};

const LandingPage = () => {
    const navigate = useNavigate();
    const { theme, setTheme, themes } = useTheme();

    return (
        <div className={styles.landing}>
            {/* ── Navbar ── */}
            <nav className={styles.navbar}>
                <div className={styles.navInner}>
                    <div className={styles.logo}>
                        <FluentNovaLogo size={40} />
                    </div>

                    <div className={styles.navLinks}>
                        <a className={styles.navLinkActive} href="#features">Tính năng</a>
                        <a className={styles.navLink} href="#methodology">Phương pháp</a>
                        <a className={styles.navLink} href="#pricing">Bảng giá</a>
                        <a className={styles.navLink} href="#about">Giới thiệu</a>
                    </div>

                    <div className={styles.navActions}>
                        {/* Theme switcher */}
                        <div className={styles.themeSwitcher}>
                            {themes.map((t) => (
                                <button
                                    key={t}
                                    className={`${styles.themeBtn} ${theme === t ? styles.themeBtnActive : ''}`}
                                    onClick={() => setTheme(t)}
                                    title={t.charAt(0).toUpperCase() + t.slice(1)}
                                >
                                    {THEME_ICONS[t]}
                                </button>
                            ))}
                        </div>

                        <button className={styles.btnLogin} onClick={() => navigate('/login')}>
                            Đăng nhập
                        </button>
                        <button className={styles.btnGetStarted} onClick={() => navigate('/register')}>
                            Bắt đầu ngay
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                {/* ── Hero Section ── */}
                <section className={styles.hero}>
                    <div className={styles.heroInner}>
                        <div className={styles.heroText}>
                            <h1 className={styles.heroTitle}>
                                Học tiếng Anh từ{' '}
                                <span className={styles.heroHighlight}>bất kỳ</span>{' '}
                                video YouTube nào.
                            </h1>
                            <p className={styles.heroDesc}>
                                Tận dụng sức mạnh AI để biến nội dung yêu thích thành bài học ngôn ngữ sống động. Xem, nghe, và làm chủ tiếng Anh cùng FluentNova.
                            </p>
                            <div className={styles.heroCta}>
                                <button className={styles.btnHeroPrimary} onClick={() => navigate('/register')}>
                                    Bắt đầu miễn phí
                                </button>
                                <button className={styles.btnHeroSecondary}>
                                    <span className="material-symbols-outlined">play_circle</span>
                                    Xem cách hoạt động
                                </button>
                            </div>
                        </div>

                        {/* Video Mockup */}
                        <div className={styles.heroVisual}>
                            <div className={styles.visualBlob1} />
                            <div className={styles.visualBlob2} />

                            <div className={styles.videoCard}>
                                <div className={styles.videoFrame}>
                                    <img
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU1IKdvoyv399-rTYhvoYXsRboD5GcY460koHKsVrfN_CM_zsORC2tdnx8vmzFdMjEDHUF6-GOZeJBsY71mVXDpwiKwaWUeBY8YuIy9A9aGPh0cBPSZ5x_QafCb5FxdwfoFDw92XTbwEC90UmazTaL9B574186rc-ZY4abTLs5x-5JbRPBq0If-5FEjHGeUffPH4tJk3-fGHBZe1tliNpNuYrfQVukQnnLhOoFNAWEOx96x0OVcJ4QvUSTGVw8jU2746EIqdnrFn6n"
                                        alt="Giao diện FluentNova với lớp phủ AI hiển thị từ vựng"
                                    />
                                    <div className={styles.playOverlay}>
                                        <button className={styles.playBtn}>
                                            <span className="material-symbols-outlined">play_arrow</span>
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.videoMeta}>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} />
                                    </div>
                                    <div className={styles.tagRow}>
                                        <span className={styles.tagPrimary}>TỪ VỰNG</span>
                                        <span className={styles.tagSecondary}>PHÁT ÂM</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features Bento Grid ── */}
                <section id="features" className={styles.features}>
                    <div className={styles.featuresHeader}>
                        <h2 className={styles.featuresTitle}>Công cụ chính xác cho sự thành thạo</h2>
                        <p className={styles.featuresDesc}>
                            Được thiết kế cho người học hiện đại, đòi hỏi chiều sâu và hiệu quả.
                        </p>
                    </div>

                    <div className={styles.bentoGrid}>
                        {/* Card 1: Dictation */}
                        <div className={styles.cardDictation}>
                            <div>
                                <span className={`material-symbols-outlined ${styles.cardIcon}`}>keyboard</span>
                                <h3 className={styles.cardTitle}>Luyện chính tả</h3>
                                <p className={styles.cardDesc}>
                                    Nắm vững khả năng nghe hiểu với phản hồi AI thời gian thực, chỉ ra từng âm tiết bạn bỏ lỡ.
                                </p>
                            </div>
                            <div className={styles.dictationDemo}>
                                <div className={styles.dictationText}>
                                    <span className={styles.wordCorrect}>The</span>{' '}
                                    <span className={styles.wordCorrect}>atmosphere</span>{' '}
                                    <span className={styles.wordWrong}>was</span>{' '}
                                    <span className={styles.wordCorrect}>electric</span>{' '}
                                    <span style={{ opacity: 0.3 }}>...</span>
                                </div>
                                <div className={styles.aiHint}>
                                    <span className={styles.aiLabel}>VOCAB AI:</span>
                                    <span className={styles.aiMessage}>
                                        Kiểm tra phát âm "was"; tập trung vào âm 'z' nhẹ.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: AI Shadowing */}
                        <div className={styles.cardShadowing}>
                            <div>
                                <span
                                    className={`material-symbols-outlined ${styles.cardIcon}`}
                                    style={{ fontVariationSettings: "'FILL' 1", color: 'var(--color-secondary)' }}
                                >
                                    graphic_eq
                                </span>
                                <h3 className={styles.cardTitle}>Shadowing với AI</h3>
                                <p className={styles.shadowingDesc}>
                                    So sánh giọng nói của bạn với người bản xứ bằng công nghệ khớp tần số độc quyền.
                                </p>
                            </div>
                            <div className={styles.orbContainer}>
                                <div className={styles.orbOuter}>
                                    <div className={styles.orbMiddle}>
                                        <div className={styles.orbInner}>
                                            <span className={styles.orbScore}>94%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Vocabulary Notebook */}
                        <div className={styles.cardNotebook}>
                            <div className={styles.notebookText}>
                                <span className={`material-symbols-outlined ${styles.cardIcon}`}>sync_alt</span>
                                <h3 className={styles.cardTitle}>Sổ tay từ vựng</h3>
                                <p className={styles.cardDesc}>
                                    Lưu từ mới trong khi xem trên laptop, và ôn tập trên điện thoại với ứng dụng flashcard. Đồng bộ hoàn hảo, luôn bên bạn.
                                </p>
                                <div className={styles.deviceBadges}>
                                    <div className={styles.badgeDesktop}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>laptop</span>
                                        <span>MÁY TÍNH</span>
                                    </div>
                                    <div className={styles.badgeMobile}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>smartphone</span>
                                        <span>DI ĐỘNG</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.notebookVisual}>
                                <img
                                    className={styles.notebookImg}
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGcTEowUzQP4zweLOCmPgiZ55V0GL1Yl-t4u5XvaJaRtAgx6zXmIILZ36M-XWAHjlBlDjtABY0GoSbCxVr4NGgtDaFyUb4djX8O3z1kkNBVESRPf8ULT8gsipxCOrtn4kkiPiqhuPztbToypr0rL51PXpBdmoXSVWlNUPmi8zQwKjuIfmvrPvhd8LxDHuJq-6Xj7DHwhcY-I1pIWzTC5TVIcT-9EjqwAKGOsJ-xwn4GAvXfGj_IGz3ss7zdt4F-lX_363Si2zRsPeG"
                                    alt="Laptop và điện thoại hiển thị flashcard từ vựng giống nhau"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA Section ── */}
                <section className={styles.cta}>
                    <div className={styles.ctaCard}>
                        <div className={styles.ctaDecor}>
                            <span className="material-symbols-outlined" style={{ fontSize: '6rem' }}>auto_awesome</span>
                        </div>
                        <h2 className={styles.ctaTitle}>Sẵn sàng thay đổi cách học của bạn?</h2>
                        <p className={styles.ctaDesc}>
                            Cùng hơn 50.000 học viên đang học tiếng Anh tự nhiên qua nội dung họ yêu thích.
                        </p>
                        <div className={styles.ctaButtons}>
                            <button className={styles.btnCtaPrimary} onClick={() => navigate('/register')}>
                                Dùng thử miễn phí
                            </button>
                            <button className={styles.btnCtaSecondary}>Xem bảng giá</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerLogo}>
                        <FluentNovaLogo size={28} />
                    </div>
                    <div className={styles.footerLinks}>
                        <a className={styles.footerLink} href="#">Chính sách bảo mật</a>
                        <a className={styles.footerLink} href="#">Điều khoản dịch vụ</a>
                        <a className={styles.footerLink} href="#">Đạo đức AI</a>
                    </div>
                    <div className={styles.footerCopy}>
                        <p className={styles.copyright}>© 2026 FluentNova — khangmoihocit. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
