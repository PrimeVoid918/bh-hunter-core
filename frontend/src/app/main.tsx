import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/stores';
import MUIThemeAppWrapper from './config/MUIThemeAppWrapper';
import './css/index.css';

// PDF Worker Config...
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <MUIThemeAppWrapper />
    </Provider>
  </StrictMode>,
);
