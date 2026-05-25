import type { GlobalThemeOverrides } from 'naive-ui'

export type ThemeMode = 'light' | 'dark'

// 「午后书阁」：羊皮纸 + 胡桃木 + 黄铜烫金
export const LIGHT_PALETTE = {
  bg: '#F5EDDC',
  bgElevated: '#FBF6E9',
  bgInput: '#FFFAF0',
  textBase: '#3B2E20',
  textSecondary: '#6B5B47',
  textTertiary: '#8B7B65',
  border: '#D9C9A8',
  divider: '#E8DCC4',
  primary: '#9B6A2F',
  primaryHover: '#B47E3D',
  primaryPressed: '#7E5524',
  success: '#5B7A4F',
  warning: '#B8884F',
  error: '#8B2E2E',
  info: '#4A6B5C',
  priorityHigh: '#8B2E2E',
  priorityMedium: '#B8884F',
  priorityLow: '#4A6B5C'
}

// 「夜读书房」：烟熏胡桃木 + 烛光纸黄 + 绿绒
export const DARK_PALETTE = {
  bg: '#1F1812',
  bgElevated: '#2A2018',
  bgInput: '#1A1410',
  textBase: '#E8DCC4',
  textSecondary: '#A89478',
  textTertiary: '#7C6A52',
  border: '#3D3026',
  divider: '#332820',
  primary: '#D4A65A',
  primaryHover: '#E5BB75',
  primaryPressed: '#B58A45',
  success: '#7FA690',
  warning: '#D4A65A',
  error: '#C97373',
  info: '#9DB4B0',
  priorityHigh: '#C97373',
  priorityMedium: '#D4A65A',
  priorityLow: '#7FA690'
}

export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: LIGHT_PALETTE.primary,
    primaryColorHover: LIGHT_PALETTE.primaryHover,
    primaryColorPressed: LIGHT_PALETTE.primaryPressed,
    primaryColorSuppl: LIGHT_PALETTE.primaryHover,
    infoColor: LIGHT_PALETTE.info,
    infoColorHover: LIGHT_PALETTE.info,
    infoColorPressed: LIGHT_PALETTE.info,
    successColor: LIGHT_PALETTE.success,
    successColorHover: LIGHT_PALETTE.success,
    warningColor: LIGHT_PALETTE.warning,
    warningColorHover: LIGHT_PALETTE.warning,
    errorColor: LIGHT_PALETTE.error,
    errorColorHover: LIGHT_PALETTE.error,
    bodyColor: LIGHT_PALETTE.bg,
    cardColor: LIGHT_PALETTE.bgElevated,
    modalColor: LIGHT_PALETTE.bgElevated,
    popoverColor: LIGHT_PALETTE.bgElevated,
    inputColor: LIGHT_PALETTE.bgInput,
    tableColor: LIGHT_PALETTE.bgElevated,
    tagColor: LIGHT_PALETTE.bg,
    textColorBase: LIGHT_PALETTE.textBase,
    textColor1: LIGHT_PALETTE.textBase,
    textColor2: LIGHT_PALETTE.textSecondary,
    textColor3: LIGHT_PALETTE.textTertiary,
    borderColor: LIGHT_PALETTE.border,
    dividerColor: LIGHT_PALETTE.divider,
    fontFamily:
      '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "Times New Roman", Georgia, serif'
  },
  Card: {
    borderColor: LIGHT_PALETTE.border,
    titleTextColor: LIGHT_PALETTE.textBase
  },
  Button: {
    textColorPrimary: '#FBF6E9',
    textColorHoverPrimary: '#FBF6E9',
    textColorPressedPrimary: '#FBF6E9'
  }
}

export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: DARK_PALETTE.primary,
    primaryColorHover: DARK_PALETTE.primaryHover,
    primaryColorPressed: DARK_PALETTE.primaryPressed,
    primaryColorSuppl: DARK_PALETTE.primaryHover,
    infoColor: DARK_PALETTE.info,
    infoColorHover: DARK_PALETTE.info,
    successColor: DARK_PALETTE.success,
    successColorHover: DARK_PALETTE.success,
    warningColor: DARK_PALETTE.warning,
    warningColorHover: DARK_PALETTE.warning,
    errorColor: DARK_PALETTE.error,
    errorColorHover: DARK_PALETTE.error,
    bodyColor: DARK_PALETTE.bg,
    cardColor: DARK_PALETTE.bgElevated,
    modalColor: DARK_PALETTE.bgElevated,
    popoverColor: DARK_PALETTE.bgElevated,
    inputColor: DARK_PALETTE.bgInput,
    tableColor: DARK_PALETTE.bgElevated,
    tagColor: DARK_PALETTE.bgInput,
    textColorBase: DARK_PALETTE.textBase,
    textColor1: DARK_PALETTE.textBase,
    textColor2: DARK_PALETTE.textSecondary,
    textColor3: DARK_PALETTE.textTertiary,
    borderColor: DARK_PALETTE.border,
    dividerColor: DARK_PALETTE.divider,
    fontFamily:
      '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "Times New Roman", Georgia, serif'
  },
  Card: {
    borderColor: DARK_PALETTE.border,
    titleTextColor: DARK_PALETTE.textBase
  },
  Button: {
    textColorPrimary: '#1F1812',
    textColorHoverPrimary: '#1F1812',
    textColorPressedPrimary: '#1F1812'
  }
}

export function getPalette(mode: ThemeMode) {
  return mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE
}
