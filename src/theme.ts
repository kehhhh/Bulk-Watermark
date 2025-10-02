import { createTheme, MantineColorsTuple } from '@mantine/core';

// Custom color palette
const primaryBlue: MantineColorsTuple = [
  '#e7f5ff',
  '#d0ebff',
  '#a5d8ff',
  '#74c0fc',
  '#4dabf7',
  '#339af0',
  '#228be6',
  '#1c7ed6',
  '#1971c2',
  '#1864ab',
];

export const theme = createTheme({
  // Color palette
  colors: {
    blue: primaryBlue,
  },
  primaryColor: 'blue',

  // Enhanced spacing scale
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '32px', lineHeight: '1.2' },
      h2: { fontSize: '24px', lineHeight: '1.3' },
      h3: { fontSize: '20px', lineHeight: '1.4' },
      h4: { fontSize: '18px', lineHeight: '1.5' },
      h5: { fontSize: '16px', lineHeight: '1.5' },
      h6: { fontSize: '14px', lineHeight: '1.5' },
    },
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '14px',
    lg: '16px',
    xl: '18px',
  },

  // Border radius
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  defaultRadius: 'md',

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },

  // Component-specific overrides
  components: {
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          height: '40px',
          fontWeight: 500,
          transition: 'transform 0.1s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          height: '40px',
        },
      },
    },
    NumberInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          height: '40px',
        },
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          height: '40px',
        },
      },
    },
    Card: {
      defaultProps: {
        shadow: 'md',
        radius: 'lg',
        withBorder: true,
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
      styles: {
        root: {
          padding: '4px 10px',
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
      },
    },
  },

  // Other settings
  cursorType: 'pointer',
});
