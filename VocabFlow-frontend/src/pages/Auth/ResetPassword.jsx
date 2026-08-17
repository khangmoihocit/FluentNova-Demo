import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api/auth.api';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email,
        otpCode: values.otpCode,
        newPassword: values.newPassword,
      });

      if (response.success) {
        message.success(t('auth.resetPasswordSuccess'));
        navigate('/login');
      } else {
        message.error(response.message || t('auth.resetPasswordFailed'));
      }
    } catch (error) {
      message.error(error.message || t('auth.resetPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', padding: '32px', borderRadius: '12px', boxSizing: 'border-box' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '8px', color: '#07070A' }}>
        {t('auth.resetPasswordTitle')}
      </Title>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text type="secondary">{t('auth.resettingPasswordFor')}</Text>
        <br />
        <Text strong>{email}</Text>
      </div>
      
      <Form name="reset-password" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="otpCode"
          rules={[
            { required: true, message: t('validation.requiredOtp') },
            { len: 6, message: t('validation.otpLength') }
          ]}
        >
          <Input placeholder={t('auth.enterOtp')} style={{ textAlign: 'center', letterSpacing: '4px' }} maxLength={6} />
        </Form.Item>

        <Form.Item
          name="newPassword"
          rules={[
            { required: true, message: t('validation.requiredNewPassword') },
            { min: 8, message: t('validation.passwordMinLength') }
          ]}
          hasFeedback
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('common.newPassword')} />
        </Form.Item>

        <Form.Item
          name="confirm"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: t('validation.requiredConfirmNewPassword') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('validation.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('common.confirmNewPassword')} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#07070A', borderColor: '#07070A', marginTop: '16px' }}>
            {t('auth.submitReset')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ResetPassword;
