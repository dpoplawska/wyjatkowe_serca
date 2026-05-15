import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.red,
    secondary: colors.blue,
    background: colors.greyBg,
    surface: colors.cardBg,
    error: colors.red,
  },
  roundness: 8,
};

export type AppPaperTheme = typeof paperTheme;
