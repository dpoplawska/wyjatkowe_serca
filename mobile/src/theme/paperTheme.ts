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
    // Resting label colour for TextInput when empty/unfocused. The MD3
    // default is too saturated and reads as actual content. Light grey makes
    // empty inputs feel like prompts. Trailing icons + dividers also pick
    // this up — light grey is fine there too.
    onSurfaceVariant: colors.grey3,
  },
  roundness: 8,
};

export type AppPaperTheme = typeof paperTheme;
