import novaLogo from '../../../assets/images/nova_reading_no_bg.png';

const FluentNovaLogo = ({ collapsed = false, size = 32 }) => {
    // Icon-only mode when sidebar is collapsed
    if (collapsed) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                    src={novaLogo} 
                    alt="FluentNova Logo" 
                    style={{ 
                        height: `${size}px`, 
                        width: 'auto', 
                        objectFit: 'contain' 
                    }} 
                />
            </div>
        );
    }

    // Full logo with wordmark
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px' }}>
            <img 
                src={novaLogo} 
                alt="FluentNova Logo" 
                style={{ 
                    height: `${size}px`, 
                    width: 'auto', 
                    objectFit: 'contain' 
                }} 
            />
            <span
                style={{
                    fontFamily: 'var(--font-headline)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--color-primary)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    textTransform: 'none'
                }}
            >
                Fluent<span style={{ color: 'var(--color-secondary)' }}>Nova</span>
            </span>
        </div>
    );
};

export default FluentNovaLogo;
