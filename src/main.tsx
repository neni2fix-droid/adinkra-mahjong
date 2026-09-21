import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './styles/index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('[adinkra] Fatal: #root element was not found in the document.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
