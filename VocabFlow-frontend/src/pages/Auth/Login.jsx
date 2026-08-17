import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Checkbox, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api/auth.api';
import { setAuthenticatedSession } from '../../utils/authSession';
import { extractErrorMessage } from '../../utils/apiError';
import { Modal } from 'antd';
import { GoogleLogin } from '@react-oauth/google';
import { popularEmailRule } from '../../utils/authValidation';

const { Title } = Typography;

const Login = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const handleUnverifiedAccount = async (email) => {
    if (!email) {
      message.error('Tài khoản của bạn chưa được xác thực.');
      return;
    }

    const key = `account-not-verify-${email}`;
    message.warning({
      key,
      duration: 8,
      content: (
        <span>
          Tài khoản của bạn chưa được xác thực.{' '}
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', color: '#07070A', fontWeight: 700 }}
            onClick={async () => {
              try {
                message.loading({ key, content: 'Đang gửi mã OTP...', duration: 0 });
                await authApi.resendRegisterOtp(email);
                message.success({ key, content: 'Mã OTP đã được gửi đến email của bạn.' });
                navigate('/verify-otp', { state: { email } });
              } catch (err) {
                message.error({ key, content: extractErrorMessage(err, 'Không thể gửi mã OTP. Vui lòng thử lại.') });
              }
            }}
          >
            Ấn vào đây để xác thực
          </Button>
        </span>
      ),
    });
  };

  // Check URL params for deleted account error from Google Login redirect
  useEffect(() => {
    const error = searchParams.get('error');
    const email = searchParams.get('email');

    if (error === 'account_deleted' && email) {
      setRecoveryEmail(email);
      setRecoveryModalVisible(true);
    }
  }, [searchParams]);

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await authApi.login({
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        const { accessToken, refreshToken, user } = response.data;
        setAuthenticatedSession({ accessToken, refreshToken, user });

        message.success(t('auth.loginSuccess'));
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        message.error(response.message || t('auth.loginFailed'));
      }
    } catch (error) {
      if (error.code === 'ACCOUNT_NOT_VERIFY') {
        await handleUnverifiedAccount(values.email);
      } else {
        message.error(error.message || t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverAccount = async () => {
    if (!recoveryEmail) return message.error(t('auth.recovery.invalidEmail'));
    setRecovering(true);
    try {
      const res = await authApi.recoverAccount(recoveryEmail);
      if (res.success) {
        message.success(t('auth.recovery.recoverSuccess'));
        setRecoveryModalVisible(false);
        setSearchParams({}); // Xoá query param
      }
    } catch (err) {
      message.error(extractErrorMessage(err, t('auth.recovery.recoverError')));
    } finally {
      setRecovering(false);
    }
  };

  const handleRenewAccount = async () => {
    if (!recoveryEmail) return message.error(t('auth.recovery.invalidEmail'));
    setRenewing(true);
    try {
      const res = await authApi.renewAccount(recoveryEmail);
      if (res.success) {
        message.success(res.message || t('auth.recovery.renewSuccess'));
        setRecoveryModalVisible(false);
        setSearchParams({}); // Xoá query param
      }
    } catch (err) {
      message.error(extractErrorMessage(err, t('auth.recovery.renewError')));
    } finally {
      setRenewing(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    const { credential } = credentialResponse; // this is the ID_TOKEN
    try {
      const response = await authApi.googleLogin(credential);
      if (response.success) {
        const { accessToken, refreshToken, user } = response.data;
        setAuthenticatedSession({ accessToken, refreshToken, user });

        message.success(t('auth.loginSuccess'));
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        message.error(response.message || t('auth.loginFailed'));
      }
    } catch (error) {
      if (error.code === 'ACCOUNT_DELETED_BUT_CAN_RECOVER') {
        try {
          const base64Url = credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          if (payload.email) setRecoveryEmail(payload.email);
        } catch (e) {
          console.error("Could not parse JWT", e);
        }
        setRecoveryModalVisible(true);
      } else {
        message.error(extractErrorMessage(error, t('auth.loginFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    message.error(t('auth.loginFailed'));
  };

  return (
    <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', padding: '32px', borderRadius: '12px', boxSizing: 'border-box' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px', color: '#07070A' }}>
        {t('auth.loginTitle')}
      </Title>

      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('validation.requiredEmail') },
            { type: 'email', message: t('validation.invalidEmail') },
            popularEmailRule,
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder={t('common.email')} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: t('validation.requiredPassword') }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('common.password')} />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t('auth.rememberMe')}</Checkbox>
            </Form.Item>
            <Link to="/forgot-password" style={{ color: '#07070A' }}>
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} disabled={loading} style={{ background: '#07070A', borderColor: '#07070A' }}>
            {t('common.login')}
          </Button>
        </Form.Item>
      </Form>

      <Divider plain style={{ margin: '12px 0' }}>{t('common.or')}</Divider>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          shape="rectangular"
          size="large"
          text="signin_with"
          logo_alignment="center"
          width="336"
        />
      </div>

      <div style={{ textAlign: 'center', color: '#5F5F66' }}>
        {t('auth.noAccount')} <Link to="/register" style={{ color: '#07070A', fontWeight: 600 }}>{t('auth.registerNow')}</Link>
      </div>

      <Modal
        title={t('auth.recovery.title')}
        open={recoveryModalVisible}
        onCancel={() => { setRecoveryModalVisible(false); setSearchParams({}); }}
        footer={[
          <Button key="renew" loading={renewing} disabled={recovering} onClick={handleRenewAccount}>
            {t('auth.recovery.ignore')}
          </Button>,
          <Button key="recover" type="primary" loading={recovering} disabled={renewing} onClick={handleRecoverAccount} style={{ background: '#07070A', borderColor: '#07070A' }}>
            {t('auth.recovery.recover')}
          </Button>
        ]}
      >
        <p dangerouslySetInnerHTML={{ __html: t('auth.recovery.description', { email: recoveryEmail }) }} />
      </Modal>
    </div>
  );
};

export default Login;
