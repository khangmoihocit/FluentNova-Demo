import React from 'react';
import { Typography, Divider, Layout } from 'antd';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const PrivacyPolicy = () => {
  return (
    <Content style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', background: '#fff', borderRadius: '8px', marginTop: '20px', marginBottom: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Typography>
        <Title level={1}>Privacy Policy</Title>
        <Paragraph>
          <Text type="secondary">Last updated: May 19, 2026</Text>
        </Paragraph>
        
        <Divider />

        <Title level={2}>1. Introduction</Title>
        <Paragraph>
          Welcome to FluentNova ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
        </Paragraph>
        <Paragraph>
          When you visit our website <strong>fluentnova.site</strong>, and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy notice, we describe our privacy policy. We seek to explain to you in the clearest way possible what information we collect, how we use it and what rights you have in relation to it.
        </Paragraph>

        <Title level={2}>2. Information We Collect</Title>
        <Paragraph>
          We only collect information that you voluntarily provide to us when registering at the website expressing an interest in obtaining information about us or our products and services, when participating in activities on the website or otherwise contacting us.
        </Paragraph>
        <Paragraph>
          The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect can include the following:
        </Paragraph>
        <ul>
          <li>Email Addresses</li>
          <li>First Name and Last Name</li>
          <li>Passwords (Encrypted)</li>
        </ul>

        <Title level={2}>3. FluentNova Anki Sync Extension</Title>
        <Paragraph>
          Our Chrome Extension, <strong>FluentNova - Anki Sync Bridge</strong>, acts purely as a secure local proxy. Its sole purpose is to allow our web application to send vocabulary data to your locally installed Anki application via the AnkiConnect add-on.
        </Paragraph>
        <ul>
          <li><strong>No Data Collection:</strong> The extension does not collect, store, or transmit any personal data to our servers or any third-party servers.</li>
          <li><strong>Local Operation:</strong> All communication happens entirely locally on your machine between your browser and your local Anki application (http://127.0.0.1:8765).</li>
          <li><strong>No Tracking:</strong> The extension does not track your browsing history, monitor your web usage, or inject code into other websites.</li>
        </ul>

        <Title level={2}>4. How We Use Your Information</Title>
        <Paragraph>
          We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
        </Paragraph>
        <ul>
          <li>To facilitate account creation and logon process.</li>
          <li>To send administrative information to you.</li>
          <li>To fulfill and manage your vocabulary study features.</li>
        </ul>

        <Title level={2}>5. Will Your Information Be Shared With Anyone?</Title>
        <Paragraph>
          We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell or rent your personal information to third parties for their marketing purposes.
        </Paragraph>

        <Title level={2}>6. How Long Do We Keep Your Information?</Title>
        <Paragraph>
          We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
        </Paragraph>

        <Title level={2}>7. How Do We Keep Your Information Safe?</Title>
        <Paragraph>
          We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
        </Paragraph>

        <Title level={2}>8. Contact Us</Title>
        <Paragraph>
          If you have questions or comments about this policy, you may contact us through the provided support channels on our website.
        </Paragraph>
      </Typography>
    </Content>
  );
};

export default PrivacyPolicy;
