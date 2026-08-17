import { CheckCircleFilled, CloseCircleFilled, BulbOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SimpleMarkdown from './SimpleMarkdown';
import useTypewriter from '../hooks/useTypewriter';
import styles from '../styles/PracticeTranslatePage.module.scss';

/**
 * Renders AI grading feedback: correctness, focused note (typewriter streamed),
 * and a better English version. No numeric score per product requirement.
 *
 * @param {object} feedback
 * @param {boolean} animate - stream the note like a chat AI (only for a fresh response)
 */
export default function FeedbackPanel({ feedback, animate = false }) {
  const { t } = useTranslation();

  // Hook must run unconditionally (Rules of Hooks)
  const { displayed, done } = useTypewriter(feedback?.feedback || '', { enabled: animate });

  if (!feedback) return null;

  const correct = !!feedback.isCorrect;
  const noteText = animate ? displayed : (feedback.feedback || '');
  const showRest = animate ? done : true;

  return (
    <div className={`${styles.feedback} ${correct ? styles.correct : styles.incorrect}`}>
      <div className={styles['feedback-header']}>
        {correct ? <CheckCircleFilled /> : <CloseCircleFilled />}
        {correct ? t('practiceTranslate.correct') : t('practiceTranslate.needsWork')}
      </div>

      {feedback.feedback && (
        <div className={styles['feedback-block']}>
          <span className={styles['block-label']}>
            <BulbOutlined /> {t('practiceTranslate.aiNote')}
          </span>
          <div className={styles['block-text']}>
            <SimpleMarkdown text={noteText} />
            {animate && !done && <span className={styles.caret} />}
          </div>
        </div>
      )}

      {showRest && feedback.betterVersion && (
        <div className={styles['feedback-block']}>
          <span className={styles['block-label']}>{t('practiceTranslate.betterVersion')}</span>
          <p className={`${styles['block-text']} ${styles['better-version']}`}>
            {feedback.betterVersion}
          </p>
        </div>
      )}

      {showRest && feedback.standardAnswer && (
        <div className={styles['feedback-block']}>
          <span className={styles['block-label']}>{t('practiceTranslate.standardAnswer')}</span>
          <p className={styles['block-text']}>{feedback.standardAnswer}</p>
        </div>
      )}
    </div>
  );
}
