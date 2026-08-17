import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Divider, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api/auth.api';
import { passwordPolicyRules, popularEmailRule } from '../../utils/authValidation';
import { GoogleLogin } from '@react-oauth/google';
import { setAuthenticatedSession } from '../../utils/authSession';
import { extractErrorMessage } from '../../utils/apiError';

const { Title, Text } = Typography;

const Register = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [renewing, setRenewing] = useState(false);

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
      const response = await authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        message.success(t('auth.registerSuccess'));
        navigate('/verify-otp', { state: { email: values.email } });
      } else {
        message.error(response.message || t('auth.registerFailed'));
      }
    } catch (error) {
      message.error(error.message || t('auth.registerFailed'));
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
      <Title level={2} style={{ textAlign: 'center', marginBottom: '8px', color: '#07070A' }}>
        {t('auth.registerTitle')}
      </Title>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text type="secondary">{t('auth.registerSubtitle')}</Text>
      </div>
      
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="fullName"
          rules={[{ required: true, message: t('validation.requiredFullName') }]}
        >
          <Input prefix={<UserOutlined />} placeholder={t('common.fullName')} />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('validation.requiredEmail') },
            { type: 'email', message: t('validation.invalidEmail') },
            popularEmailRule,
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder={t('common.email')} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('validation.requiredPassword') },
            ...passwordPolicyRules,
          ]}
          hasFeedback
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('common.password')} />
        </Form.Item>

        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: t('validation.requiredConfirmPassword') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('validation.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('common.confirmPassword')} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} disabled={loading} style={{ background: '#07070A', borderColor: '#07070A', marginTop: '16px' }}>
            {t('common.register')}
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
          text="signup_with"
          logo_alignment="center"
          width="336"
        />
      </div>

      <div style={{ textAlign: 'center', color: '#5F5F66' }}>
        {t('auth.haveAccount')} <Link to="/login" style={{ color: '#07070A', fontWeight: 600 }}>{t('common.login')}</Link>
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

export default Register;
