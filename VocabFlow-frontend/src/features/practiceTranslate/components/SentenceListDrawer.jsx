import { Drawer, Tag } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from '../styles/PracticeTranslatePage.module.scss';

const DIFFICULTY_COLOR = { EASY: 'success', MEDIUM: 'warning', HARD: 'error' };

/**
 * Side drawer listing all sentences in the current topic.
 * Lets the user jump directly to any sentence; marks ones already answered.
 */
export default function SentenceListDrawer({
  open,
  onClose,
  exercises,
  currentIndex,
  answeredMap,
  onSelect,
  topicTitle,
}) {
  const { t } = useTranslation();

  const doneCount = exercises.filter((ex) => answeredMap[ex.id]).length;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>{topicTitle || t('practiceTranslate.sentenceListTitle')}</span>
          <Tag color="blue" style={{ margin: 0 }}>
            {t('practiceTranslate.doneProgress', { done: doneCount, total: exercises.length })}
          </Tag>
        </div>
      }
      placement="right"
      open={open}
      onClose={onClose}
      width={380}
    >
      <div className={styles['sentence-list']}>
        {exercises.map((ex, idx) => {
          const state = answeredMap[ex.id]; // { isCorrect } | undefined
          const isActive = idx === currentIndex;
          return (
            <div
              key={ex.id}
              className={`${styles['sentence-item']} ${isActive ? styles['sentence-item-active'] : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(idx)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(idx)}
            >
              <div className={styles['sentence-item-top']}>
                <span className={styles['sentence-index']}>#{idx + 1}</span>
                {ex.difficultyLevel && (
                  <Tag color={DIFFICULTY_COLOR[ex.difficultyLevel] || 'default'} style={{ margin: 0 }}>
                    {t(`practiceTranslate.difficulty${ex.difficultyLevel.charAt(0) + ex.difficultyLevel.slice(1).toLowerCase()}`)}
                  </Tag>
                )}
                {state && (
                  <span className={styles['sentence-done-badge']} data-correct={state.isCorrect ? 'true' : 'false'}>
                    <CheckCircleFilled />
                    {state.isCorrect ? t('practiceTranslate.doneCorrect') : t('practiceTranslate.doneReviewed')}
                  </span>
                )}
              </div>
              <p className={styles['sentence-text']}>{ex.vietnameseText}</p>
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
