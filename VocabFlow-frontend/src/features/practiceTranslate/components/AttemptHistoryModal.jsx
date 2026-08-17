import { useEffect, useState } from 'react';
import { Modal, Spin, Empty, Tag, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { translationApi } from '../api/translationApi';
import SimpleMarkdown from './SimpleMarkdown';
import styles from '../styles/PracticeTranslatePage.module.scss';

const { Text } = Typography;

/**
 * Shows the current user's full attempt history for one exercise.
 * Fetched on open; not cached so it always reflects the latest submissions.
 */
export default function AttemptHistoryModal({ open, onClose, exerciseId, vietnameseText }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    if (!open || !exerciseId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await translationApi.getExerciseAttempts(exerciseId);
        if (mounted) setAttempts(res.data || []);
      } catch {
        if (mounted) setAttempts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, exerciseId]);

  const fmt = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      title={t('practiceTranslate.history.title')}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      {vietnameseText && (
        <p className={styles['history-prompt']}>{vietnameseText}</p>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : attempts.length === 0 ? (
        <Empty description={t('practiceTranslate.history.empty')} />
      ) : (
        <div className={styles['history-list']}>
          {attempts.map((a) => (
            <div
              key={a.id}
              className={`${styles['history-item']} ${a.isCorrect ? styles['history-correct'] : styles['history-incorrect']}`}
            >
              <div className={styles['history-item-head']}>
                <Tag
                  icon={a.isCorrect ? <CheckCircleFilled /> : <CloseCircleFilled />}
                  color={a.isCorrect ? 'success' : 'error'}
                  style={{ margin: 0 }}
                >
                  {a.isCorrect ? t('practiceTranslate.correct') : t('practiceTranslate.needsWork')}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{fmt(a.submittedAt)}</Text>
              </div>

              <div className={styles['history-block']}>
                <span className={styles['history-label']}>{t('practiceTranslate.history.yourAnswer')}</span>
                <p className={styles['history-answer']}>{a.userInput}</p>
              </div>

              {a.aiFeedback && (
                <div className={styles['history-block']}>
                  <span className={styles['history-label']}>{t('practiceTranslate.aiNote')}</span>
                  <div className={styles['history-feedback']}>
                    <SimpleMarkdown text={a.aiFeedback} />
                  </div>
                </div>
              )}

              {a.aiBetterVersion && (
                <div className={styles['history-block']}>
                  <span className={styles['history-label']}>{t('practiceTranslate.betterVersion')}</span>
                  <p className={styles['history-better']}>{a.aiBetterVersion}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
