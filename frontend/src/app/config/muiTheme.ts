import { Spacing } from '@/pages/constants';
import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#357FC1',
      light: '#D6ECFA',
      dark: '#123969',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FDD85D',
      contrastText: '#3A3A3A',
    },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
    error: {
      main: '#D64545',
    },
    // Adding your custom colors to the theme object
    // @ts-ignore (Optional: if you want to extend the Theme type)
    status: {
      available: '#81C784',
      notAvailable: '#E57373',
    },
  },
  shape: {
    borderRadius: 8, // M3 uses larger rounding, 8-12px is standard for cards
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 }, // M3 style buttons aren't all-caps
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: Spacing.md, // Very rounded "Pill" buttons are iconic to M3
          padding: '10px 24px',
        },
      },
    },
  },
});

export default muiTheme;
