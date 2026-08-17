import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/user.api';
import { handleFormError, extractErrorMessage } from '../../../utils/apiError';

const { Text } = Typography;

const ChangePasswordModal = ({ open, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      await userApi.requestChangePasswordOtp();
      message.success(t('profile.otpSent'));
      setCountdown(60);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Lỗi gửi OTP'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await userApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        otpCode: values.otpCode
      });
      if (res.success) {
        message.success(t('profile.changePasswordSuccess'));
        form.resetFields();
        setCountdown(0);
        onCancel();
      }
    } catch (error) {
      const errMsg = handleFormError(error, form, 'Cập nhật thất bại');
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('profile.settings.changePassword')}
      open={open}
      onCancel={() => { form.resetFields(); setCountdown(0); onCancel(); }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="oldPassword"
          label={t('profile.oldPassword')}
          rules={[{ required: true, message: t('validation.requiredPassword') }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={t('profile.newPassword')}
          rules={[{ required: true, message: t('validation.requiredNewPassword') }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item label="OTP Code">
          <Space>
            <Form.Item
              name="otpCode"
              noStyle
              rules={[{ required: true, message: t('validation.requiredOtp') }]}
            >
              <Input placeholder="123456" />
            </Form.Item>
            <Button onClick={handleSendOtp} loading={sendingOtp} disabled={countdown > 0}>
              {countdown > 0 ? `${countdown}s` : t('profile.getOtp')}
            </Button>
          </Space>
          {countdown > 0 && <div style={{ marginTop: 8 }}><Text type="success">{t('profile.otpSentDesc')}</Text></div>}
        </Form.Item>

        <Form.Item style={{ marginTop: '24px', marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#07070A', borderColor: '#07070A' }}>
              {t('common.save')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>

  );
};
export default ChangePasswordModal;
