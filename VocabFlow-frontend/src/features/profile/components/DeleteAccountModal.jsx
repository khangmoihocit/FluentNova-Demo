import { useState } from 'react';
import { Modal, Typography, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/user.api';
import { extractErrorMessage } from '../../../utils/apiError';
import { clearClientSession } from '../../../utils/authSession';

const { Text } = Typography;

const DeleteAccountModal = ({ open, onCancel }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await userApi.deleteAccount();
      message.success(t('profile.deleteAccountSuccess'));
      clearClientSession();
      navigate('/login', { replace: true });
    } catch (err) {
      message.error(extractErrorMessage(err, 'Lỗi xóa tài khoản'));
    } finally {
      setLoading(false);
      onCancel();
    }
  };

  return (
    <Modal
      title={<span style={{ color: '#ff4d4f' }}>{t('profile.deleteAccountConfirmTitle')}</span>}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>{t('common.cancel')}</Button>,
        <Button key="delete" danger type="primary" loading={loading} onClick={handleDelete}>{t('common.delete')}</Button>
      ]}
    >
      <Text>{t('profile.deleteAccountConfirmDesc')}</Text>
    </Modal>
  );

};
export default DeleteAccountModal;
