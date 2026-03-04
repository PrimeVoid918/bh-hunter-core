// import { pdfjs } from 'react-pdf';
// import 'pdfjs-dist/legacy/web/pdf_viewer.css';
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url,
// ).toString();

// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import { ChakraProvider } from '@chakra-ui/react';
// import { RouterProvider } from 'react-router-dom';
// import RootNavigator from './navigation/RootNavigator';
// import { store } from './store/stores';

// import './css/index.css';
// import { Provider } from 'react-redux';
// import { ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import muiTheme from './config/muiTheme';

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <Provider store={store}>
//       <ThemeProvider theme={muiTheme}>
//         {/* <ChakraProvider> */}
//         <CssBaseline />
//         <RouterProvider router={RootNavigator()} />
//         {/* </ChakraProvider> */}
//       </ThemeProvider>
//     </Provider>
//   </StrictMode>,
// );

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/stores';
// import ThemeAppWrapper from './ThemeAppWrapper';
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
