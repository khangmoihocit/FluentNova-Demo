import { useTranslation } from 'react-i18next';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useDictionary } from '../context/DictionaryContext';
import './DictionaryDrawer.scss';

/**
 * Floating Action Button to toggle the global Dictionary Widget.
 * Hidden on mobile viewports via SCSS.
 */
const DictionaryFAB = () => {
  const { t } = useTranslation();
  const { openDrawer, closeDrawer, open } = useDictionary();

  return (
    <button
      className="dict-fab"
      onClick={() => (open ? closeDrawer() : openDrawer())}
      aria-label={open ? t('profile.dictionary.fabOpen') : t('profile.dictionary.fabClose')}
      title={open ? t('profile.dictionary.fabOpen') : t('profile.dictionary.fabClose')}
    >
      {open ? <CloseOutlined /> : <SearchOutlined />}
    </button>
  );
};

export default DictionaryFAB;
