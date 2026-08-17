import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api/auth.api';

const { Title, Text } = Typography;

const VerifyOtp = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [email]);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await authApi.verifyRegister({
        email,
        otpCode: values.otpCode,
      });

      if (response.success) {
        message.success(t('auth.verifySuccess'));
        navigate('/login');
      } else {
        message.error(response.message || t('auth.verifyFailed'));
      }
    } catch (error) {
      message.error(error.message || t('auth.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    try {
      await authApi.resendRegisterOtp(email);
      message.success('Mã OTP mới đã được gửi đến email của bạn.');
      setCountdown(300);
    } catch (error) {
      message.error(error.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', padding: '32px', borderRadius: '12px', boxSizing: 'border-box' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '8px', color: '#07070A' }}>
        {t('auth.verifyEmail')}
      </Title>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text type="secondary">{t('auth.otpSentTo')}</Text>
        <br />
        <Text strong>{email}</Text>
      </div>

      <Form name="verify-otp" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="otpCode"
          rules={[
            { required: true, message: t('validation.requiredOtp') },
            { len: 6, message: t('validation.otpLength') }
          ]}
        >
          <Input placeholder={t('auth.enterOtp')} style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px' }} maxLength={6} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} disabled={loading} style={{ background: '#07070A', borderColor: '#07070A' }}>
            {t('auth.verify')}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', color: '#5F5F66', marginTop: '16px' }}>
        {countdown > 0 ? (
          <Text type="secondary">{t('auth.codeExpiresIn').replace('{{time}}', formatTime(countdown))}</Text>
        ) : (
          <Button type="link" size="small" loading={resending} disabled={resending} style={{ color: '#07070A', padding: 0 }} onClick={handleResendOtp}>
            {t('auth.resendOtp')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
