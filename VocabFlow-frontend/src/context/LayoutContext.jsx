import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LayoutContext = createContext(null);

export const LayoutProvider = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => !prev);
    }, []);

    const setSidebarCollapsed = useCallback((value) => {
        setCollapsed(value);
    }, []);

    // Effect to update isMobile on resize
    const handleResize = useCallback(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <LayoutContext.Provider value={{ 
            collapsed, 
            toggleSidebar, 
            setSidebarCollapsed,
            isMobile 
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error('useLayout must be used within a LayoutProvider');
    return ctx;
};

export default LayoutContext;
