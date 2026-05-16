import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

// See DESIGN.md for colour roles.
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.blue,
    secondary: colors.red,
    background: colors.greyBg,
    surface: colors.cardBg,
    error: colors.dangerFg,
  },
  roundness: 8,
};

export type AppPaperTheme = typeof paperTheme;
