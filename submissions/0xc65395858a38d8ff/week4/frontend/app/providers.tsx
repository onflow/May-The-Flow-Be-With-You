'use client';

import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

// 1. Define your color mode config
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// 2. Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  config,
  styles: {
    global: (props: any) => ({
      body: {
        color: mode('gray.800', 'whiteAlpha.900')(props),
        bg: mode('gray.50', 'gray.800')(props),
        lineHeight: 'base',
      },
      '*::placeholder': {
        color: mode('gray.400', 'whiteAlpha.400')(props),
      },
      '*, *::before, &::after': {
        borderColor: mode('gray.200', 'whiteAlpha.300')(props),
        wordWrap: 'break-word',
      },
    }),
  },
  colors: {
    brand: {
      50: '#e6f6ff',
      100: '#b8e3ff',
      200: '#8acfFF',
      300: '#5cbaFF',
      400: '#2ea7FF',
      500: '#0090FF', // Main brand color - a vibrant blue
      600: '#0073cc',
      700: '#005699',
      800: '#003a66',
      900: '#001d33',
    },
    primary: {
      50: '#E3F2FD',   // Very light blue
      100: '#BBDEFB',  // Light blue  
      200: '#90CAF9',  // Medium light blue
      300: '#64B5F6',  // Medium blue
      400: '#42A5F5',  // Medium dark blue
      500: '#2196F3',  // Base blue (main brand color)
      600: '#1976D2',  // Dark blue
      700: '#1565C0',  // Very dark blue
      800: '#0D47A1',  // Navy blue
      900: '#0A1A3A',  // Darkest blue
    },
    secondary: {
      50: '#FFF3E0',
      100: '#FFE0B2',
      200: '#FFCC80',
      300: '#FFB74D',
      400: '#FFA726',
      500: '#FF9800',  // Orange
      600: '#FB8C00',
      700: '#F57C00',
      800: '#EF6C00',
      900: '#E65100',
    },
    accent: {
      50: '#F3E5F5',
      100: '#E1BEE7',
      200: '#CE93D8',
      300: '#BA68C8',
      400: '#AB47BC',
      500: '#9C27B0',  // Purple
      600: '#8E24AA',
      700: '#7B1FA2',
      800: '#6A1B9A',
      900: '#4A148C',
    },
    success: {
      50: '#E8F5E8',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: '#4CAF50',  // Green
      600: '#43A047',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
    },
    warning: {
      50: '#FFF8E1',
      100: '#FFECB3',
      200: '#FFE082',
      300: '#FFD54F',
      400: '#FFCA28',
      500: '#FFC107',  // Amber
      600: '#FFB300',
      700: '#FFA000',
      800: '#FF8F00',
      900: '#FF6F00',
    },
    error: {
      50: '#FFEBEE',
      100: '#FFCDD2',
      200: '#EF9A9A',
      300: '#E57373',
      400: '#EF5350',
      500: '#F44336',  // Red
      600: '#E53935',
      700: '#D32F2F',
      800: '#C62828',
      900: '#B71C1C',
    },
    neutral: {
        50: '#F7FAFC',  // Almost white
        100: '#EDF2F7', // Very light gray
        200: '#E2E8F0', // Light gray
        300: '#CBD5E0', // Gray
        400: '#A0AEC0', // Medium gray
        500: '#718096', // Dark gray
        600: '#4A5568', // Very dark gray
        700: '#2D3748', // Charcoal
        800: '#1A202C', // Almost black (default dark bg)
        900: '#171923', // Blackest black
    }
  },
  fonts: {
    heading: `var(--font-exo2), sans-serif`,
    body: `var(--font-roboto), sans-serif`,
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md', // medium rounded corners
      },
      variants: {
        solid: (props:any) => ({
          bg: mode('primary.500', 'primary.400')(props),
          color: mode('white', 'gray.800')(props),
          _hover: {
            bg: mode('primary.600', 'primary.500')(props),
          },
        }),
        outline: (props:any) => ({
          borderColor: mode('primary.500', 'primary.400')(props),
          color: mode('primary.500', 'primary.400')(props),
          _hover: {
            bg: mode('primary.50', 'primary.900')(props),
          },
        }),
        ghost: (props:any) => ({
          color: mode('primary.500', 'primary.300')(props),
          _hover: {
            bg: mode('primary.100', 'primary.800')(props),
            color: mode('primary.600', 'primary.200')(props),
          },
        }),
      }
    }
    // You can add more component style overrides here
  },
  // Configure z-index for toasts to ensure they appear above everything
  zIndices: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 9999999,  // Very high z-index for toasts
    tooltip: 1800,
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </>
  );
} 