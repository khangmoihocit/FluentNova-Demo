import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api/auth.api';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(values.email);

      if (response.success) {
        message.success(t('auth.forgotPasswordSuccess'));
        navigate('/reset-password', { state: { email: values.email } });
      } else {
        message.error(response.message || t('auth.forgotPasswordFailed'));
      }
    } catch (error) {
      message.error(error.message || t('auth.forgotPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', padding: '32px', borderRadius: '12px', boxSizing: 'border-box' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '8px', color: '#07070A' }}>
        {t('auth.forgotPasswordTitle')}
      </Title>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text type="secondary">{t('auth.forgotPasswordSubtitle')}</Text>
      </div>
      
      <Form name="forgot-password" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('validation.requiredEmail') },
            { type: 'email', message: t('validation.invalidEmail') }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder={t('auth.registeredEmail')} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#07070A', borderColor: '#07070A' }}>
            {t('auth.sendOtp')}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Link to="/login" style={{ color: '#07070A' }}>{t('auth.backToLogin')}</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
