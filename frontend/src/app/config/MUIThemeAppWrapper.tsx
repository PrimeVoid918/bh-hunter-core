import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { RouterProvider } from 'react-router-dom';
import RootNavigator from '../navigation/RootNavigator';
// import { ColorModeContext, getDesignTokens } from './config/muiTheme';
// import { ColorModeContext, getDesignTokens } from '@chakra-ui/react';
import { ColorModeContext, getDesignTokens } from './muiTheme';

export default function MUIThemeAppWrapper() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={RootNavigator()} />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
