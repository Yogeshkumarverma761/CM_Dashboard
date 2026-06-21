import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const CustomThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => {},
});

export const useCustomTheme = () => useContext(CustomThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('delhi_dashboard_theme');
    return saved ? saved === 'dark' : false;
  });

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('delhi_dashboard_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    // Add/remove dark class to body for custom CSS transitions
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const theme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#0A2540', // Deep Navy
          light: '#1A365D',
          dark: '#030E1C',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#FF9933', // Saffron
          light: '#FFAE58',
          dark: '#E07D14',
          contrastText: '#FFFFFF',
        },
        success: {
          main: '#138808', // Emerald Green
          light: '#239A18',
          dark: '#0B6602',
        },
        background: {
          default: darkMode ? '#081225' : '#F8FAFC',
          paper: darkMode ? '#0F1E36' : '#FFFFFF',
        },
        text: {
          primary: darkMode ? '#F1F5F9' : '#1E293B',
          secondary: darkMode ? '#94A3B8' : '#64748B',
        },
        divider: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      },
      typography: {
        fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
        h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '8px 16px',
              transition: 'all 0.2s ease-in-out',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-1px)',
              },
            },
            containedPrimary: {
              background: 'linear-gradient(135deg, #0A2540 0%, #1A365D 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1A365D 0%, #0A2540 100%)',
              },
            },
            containedSecondary: {
              background: 'linear-gradient(135deg, #FF9933 0%, #FFAE58 100%)',
              color: '#FFFFFF',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFAE58 0%, #FF9933 100%)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              backgroundImage: 'none',
              boxShadow: darkMode 
                ? '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 4px 20px rgba(10, 37, 64, 0.05), border: 1px solid rgba(10, 37, 64, 0.05)',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 700,
              backgroundColor: darkMode ? '#14253F' : '#F1F5F9',
              color: darkMode ? '#F1F5F9' : '#1E293B',
            },
          },
        },
      },
    });
  }, [darkMode]);

  return (
    <CustomThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CustomThemeContext.Provider>
  );
};
