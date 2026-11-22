import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Progressive Web Application capabilities
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('TuStudyHub SW registration error:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
