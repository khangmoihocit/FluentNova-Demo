import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginOutlined, PlayCircleFilled } from '@ant-design/icons';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// GuestWelcomeBanner
// A wide, inviting banner for non-authenticated users
// Encourages registration and content exploration
// ═══════════════════════════════════════════

const GuestWelcomeBanner = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className={styles['welcome-banner']}>
            <div className={styles['welcome-content']}>
                <span className={styles['welcome-emoji']}>👋</span>
                <h1 className={styles['welcome-title']}>
                    {t('home.guest.welcomeTo')}{' '}
                    <span className={styles.highlight}>FluentNova</span>
                </h1>
                <p className={styles['welcome-description']}>
                    {t('home.guest.description')}
                </p>
                <div className={styles['welcome-actions']}>
                    <button
                        className={styles['btn-primary']}
                        onClick={() => navigate('/register')}
                    >
                        <LoginOutlined />
                        {t('home.guest.registerFree')}
                    </button>
                    <button
                        className={styles['btn-ghost']}
                        onClick={() => navigate('/login')}
                    >
                        <PlayCircleFilled />
                        {t('common.login')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuestWelcomeBanner;
