import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    AudioOutlined,
    EditOutlined,
    SoundOutlined,
    QuestionCircleOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import styles from '../styles/ModeTabs.module.scss';
import { STUDY_MODES } from '../constants/studyModes';

const MODES = [
    { key: STUDY_MODES.WATCH, icon: <PlayCircleOutlined />, labelKey: 'learning.watch', fallback: 'Watch' },
    { key: STUDY_MODES.FILL_BLANK, icon: <SoundOutlined />, labelKey: 'practice.listening', fallback: 'Listening' },
    { key: STUDY_MODES.DICTATION, icon: <EditOutlined />, labelKey: 'learning.dictation.title', fallback: 'Dictation' },
    { key: STUDY_MODES.SHADOWING, icon: <AudioOutlined />, labelKey: 'learning.shadowing.title', fallback: 'Shadowing' },
    { key: STUDY_MODES.QUIZ, icon: <QuestionCircleOutlined />, labelKey: 'learning.quiz', fallback: 'Quiz' },
];

const ModeTabs = ({ activeMode, onModeChange, isMobile = false }) => {
    const { t } = useTranslation();

    return (
        <div className={styles['mode-tabs']}>
            {MODES.map((mode) => (
                <button
                    key={mode.key}
                    className={`
                        ${styles['tab-pill']} 
                        ${activeMode === mode.key ? styles.active : ''} 
                        ${isMobile ? styles.mobile : ''}
                        ${mode.disabled ? styles.disabled : ''}
                    `}
                    onClick={() => { if (!mode.disabled) onModeChange(mode.key); }}
                    type="button"
                    title={t(mode.labelKey, mode.fallback)}
                    disabled={mode.disabled}
                >
                    <span className={styles['tab-icon']}>{mode.icon}</span>
                    <span className={styles['tab-label']}>{t(mode.labelKey, mode.fallback)}</span>
                    {mode.disabled && (
                        <span className={styles['dev-badge']}>
                            {t('common.inDevelopment')}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default ModeTabs;
