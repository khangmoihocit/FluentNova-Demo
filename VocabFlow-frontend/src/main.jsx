import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './features/theme/context/ThemeContext';
import { DictionaryProvider } from './features/dictionary/context/DictionaryContext';
import DictionaryDrawer from './features/dictionary/components/DictionaryDrawer';
import DictionaryFAB from './features/dictionary/components/DictionaryFAB';
import { queryClient } from './lib/queryClient';
import { installAuthSessionSync } from './utils/authSession';
import './styles/main.scss';
import './i18n';

installAuthSessionSync();

window.addEventListener('vite:preloadError', () => {
  console.warn('Detected a new FluentNova version. Reloading the app shell...');
  window.location.reload();
});

const cleanupLegacyServiceWorkers = () => {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then(async (registrations) => {
        if (!registrations.length) return;

        await Promise.all(registrations.map((registration) => registration.unregister()));

        const reloadKey = 'fluentnova_sw_cleanup_reloaded';
        if (navigator.serviceWorker.controller && !sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1');
          window.location.reload();
        }
      })
      .catch((error) => {
        console.warn('Failed to clean up legacy service workers:', error);
      });
  });
};

cleanupLegacyServiceWorkers();

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider>
        <DictionaryProvider>
          <App />
          <DictionaryDrawer />
          <DictionaryFAB />
        </DictionaryProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>,
);
