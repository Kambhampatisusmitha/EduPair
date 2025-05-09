/**
 * Knowledge Exchange Theme
 * A premium theme for EduPeerConnect featuring a sophisticated color palette
 * that embodies intellectual growth, connection, and the value of shared knowledge.
 */

export const themeColors = {
  // Primary Color Palette
  deepIndigo: '#2D3047', // Primary background, headers, footers
  royalPurple: '#6D72C3', // Primary actions, "Teach" elements
  teal: '#5BC0BE', // Secondary actions, "Learn" elements
  amber: '#FFC857', // Accents, highlights, CTAs
  richCream: '#F5F5F5', // Light backgrounds, cards, text areas

  // Extended Color System
  nightshade: '#1D1E33', // Dark mode background, deep shadows
  lavender: '#AEB8FE', // Lighter accents, hover states for purple
  aquaBreeze: '#8CDCD9', // Lighter accents for teal elements
  sunlight: '#FFDD99', // Lighter variant of amber for subtle highlights
  charcoal: '#494A61', // Text on light backgrounds, secondary text
  snow: '#FFFFFF', // Primary text on dark backgrounds, card backgrounds
  success: '#46B37E', // Positive states, accepted requests
  alert: '#FF9770', // Warnings, pending requests
  error: '#F25F5C', // Error states, declined requests
};

export const semanticColors = {
  light: {
    background: themeColors.richCream,
    cardBackground: themeColors.snow,
    primaryText: themeColors.deepIndigo,
    secondaryText: themeColors.charcoal,
    border: `${themeColors.charcoal}26`, // 15% opacity
    divider: `${themeColors.charcoal}26`, // 15% opacity
    shadow: '0px 8px 24px rgba(45, 48, 71, 0.08)',
  },
  dark: {
    background: themeColors.nightshade,
    cardBackground: themeColors.deepIndigo,
    primaryText: themeColors.snow,
    secondaryText: `${themeColors.lavender}CC`, // 80% opacity
    border: `${themeColors.snow}26`, // 15% opacity
    divider: `${themeColors.snow}26`, // 15% opacity
    shadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
  },
  shared: {
    primaryButton: themeColors.royalPurple,
    primaryButtonText: themeColors.snow,
    secondaryButton: themeColors.teal,
    secondaryButtonText: themeColors.snow,
    teachTag: themeColors.royalPurple,
    learnTag: themeColors.teal,
    tagText: themeColors.snow,
    accent: themeColors.amber,
    navActive: themeColors.royalPurple,
    navInactive: {
      light: themeColors.charcoal,
      dark: `${themeColors.lavender}99`, // 60% opacity
    },
    statusAccepted: themeColors.success,
    statusPending: themeColors.alert,
    statusDeclined: themeColors.error,
    calendarTeaching: themeColors.royalPurple,
    calendarLearning: themeColors.teal,
  },
};

export const typography = {
  fontFamily: {
    primary: '"Montserrat", sans-serif',
    secondary: '"Playfair Display", serif',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    h1: { desktop: '48px', mobile: '38px' },
    h2: { desktop: '36px', mobile: '30px' },
    h3: { desktop: '28px', mobile: '24px' },
    h4: { desktop: '22px', mobile: '20px' },
    body: { desktop: '16px', mobile: '16px' },
    small: { desktop: '14px', mobile: '14px' },
    button: { desktop: '16px', mobile: '16px' },
    navigation: { desktop: '16px', mobile: '14px' },
  },
  lineHeight: {
    h1: 1.2,
    h2: 1.2,
    h3: 1.3,
    h4: 1.3,
    body: 1.5,
    small: 1.4,
    button: 1,
    navigation: 1,
  },
};

export const uiElements = {
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    pill: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  transition: {
    fast: '200ms',
    medium: '300ms',
    slow: '400ms',
  },
};

export const animations = {
  buttonHover: {
    scale: 1.02,
    colorLightening: 0.1, // 10%
  },
  buttonActive: {
    colorDarkening: 0.1, // 10%
  },
  buttonDisabled: {
    opacity: 0.5, // 50%
  },
  pageTransition: {
    duration: '300ms',
    type: 'fade with directional movement',
  },
  cardExpansion: {
    duration: '250ms',
    type: 'scale from center with fade-in content',
  },
  menuTransition: {
    duration: '200ms',
    type: 'slide with fade',
  },
  modalDialog: {
    duration: '350ms',
    type: 'scale and fade',
  },
  themeSwitching: {
    duration: '400ms',
    type: 'crossfade',
  },
};
