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
        50: '#F0FFF4',  // Lightest green
        100: '#C6F6D5', // Light green
        200: '#9AE6B4', // Medium-light green
        300: '#68D391', // Medium green
        400: '#48BB78', // Green
        500: '#38A169', // Darker green (base for many elements)
        600: '#2F855A', // Dark green
        700: '#276749', // Very dark green
        800: '#22543D', // Deep forest green
        900: '#1C4532', // Darkest green
    },
    secondary: {
        50: '#FFF5EB',  // Lightest orange/amber
        100: '#FEEBC8', // Light orange/amber
        200: '#FBD38D', // Medium-light orange/amber
        300: '#F6AD55', // Medium orange/amber
        400: '#ED8936', // Orange/amber
        500: '#DD6B20', // Darker orange/amber (base for accents)
        600: '#C05621', // Dark orange/amber
        700: '#9C4221', // Very dark orange/amber
        800: '#7B341E', // Deep brown-orange
        900: '#652B19', // Darkest brown-orange
    },
    accent: {
        50: '#E6FFFA',  // Lightest teal/cyan
        100: '#B2F5EA', // Light teal/cyan
        200: '#81E6D9', // Medium-light teal/cyan
        300: '#4FD1C5', // Medium teal/cyan
        400: '#38B2AC', // Teal/cyan
        500: '#319795', // Darker teal/cyan (base for highlights)
        600: '#2C7A7B', // Dark teal/cyan
        700: '#285E61', // Very dark teal/cyan
        800: '#234E52', // Deep sea green
        900: '#1D4044', // Darkest sea green
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