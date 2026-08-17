import { useEffect } from 'react';
import { Alert, Button } from 'antd';
import { AudioOutlined, AudioMutedOutlined, SoundOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useSpeechToText from '../hooks/useSpeechToText';
import styles from '../styles/PracticeTranslatePage.module.scss';

/**
 * Voice mode: uses the browser's free Web Speech API to transcribe speech to text.
 * The recognized text is pushed up via onTranscript. Audio is recorded locally only
 * for replay and is discarded when the exercise changes (resetSignal).
 *
 * @param {(text:string)=>void} onTranscript
 * @param {any} resetSignal - changes when the exercise switches (clears transcript+audio)
 * @param {(toggleFn:()=>void)=>void} [registerToggle] - exposes a start/stop toggle to the parent for shortcuts
 */
export default function VoiceInput({ onTranscript, resetSignal, registerToggle }) {
  const { t } = useTranslation();
  const {
    isSupported,
    listening,
    transcript,
    interimTranscript,
    audioUrl,
    error,
    start,
    stop,
    reset,
  } = useSpeechToText({ lang: 'en-US' });

  // Push recognized final transcript up to the parent input
  useEffect(() => {
    if (transcript) onTranscript(transcript);
  }, [transcript, onTranscript]);

  // Reset when parent moves to a new exercise
  useEffect(() => {
    reset();
  }, [resetSignal, reset]);

  // Expose a toggle to the parent (for Ctrl+` shortcut)
  useEffect(() => {
    if (registerToggle) {
      registerToggle(() => {
        if (listening) stop();
        else start();
      });
    }
    return () => {
      if (registerToggle) registerToggle(null);
    };
  }, [registerToggle, listening, start, stop]);

  if (!isSupported) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('practiceTranslate.voiceUnsupported')}
        description={t('practiceTranslate.voiceUnsupportedDesc')}
        style={{ borderRadius: 12 }}
      />
    );
  }

  return (
    <div className={styles['voice-box']}>
      <button
        type="button"
        className={`${styles['mic-button']} ${listening ? styles.listening : ''}`}
        onClick={listening ? stop : start}
        aria-label={listening ? t('practiceTranslate.stopRecording') : t('practiceTranslate.startRecording')}
      >
        {listening ? <AudioMutedOutlined /> : <AudioOutlined />}
      </button>

      <div className={styles.interim}>{interimTranscript}</div>

      <p className={styles['voice-hint']}>
        {listening ? t('practiceTranslate.listening') : t('practiceTranslate.tapToSpeak')}
      </p>

      {audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className={styles['voice-hint']}>
            <SoundOutlined /> {t('practiceTranslate.replayYourVoice')}
          </span>
          {/* Temporary local playback only — never uploaded, lost on next sentence */}
          <audio src={audioUrl} controls style={{ height: 36 }} />
        </div>
      )}

      {error && error !== 'unsupported' && (
        <Button type="link" danger size="small" onClick={reset}>
          {t('practiceTranslate.voiceErrorRetry')}
        </Button>
      )}
    </div>
  );
}
