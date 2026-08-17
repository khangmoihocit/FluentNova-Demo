import { Typography, Card } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

const Listening = () => {
  const { t } = useTranslation();
  
  return (
    <Card bordered={false} style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>{t('practice.listeningTitle')}</Title>
      <Paragraph>{t('practice.listeningSubtitle')}</Paragraph>
    </Card>
  );
};

export default Listening;
