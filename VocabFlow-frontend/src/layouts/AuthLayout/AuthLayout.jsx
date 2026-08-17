import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const AuthLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
          <p style={{ 
            textAlign: 'center', 
            marginTop: '32px', 
            color: 'var(--color-on-surface-variant)', 
            fontSize: '0.8rem',
            opacity: 0.6 
          }}>
            © 2026 FluentNova — khangmoihocit. All rights reserved.
          </p>
        </div>
      </Content>
    </Layout>
  );
};

export default AuthLayout;
