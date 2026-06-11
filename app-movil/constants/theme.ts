/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const bgPositiva = '#DBE1ED';
const bgNegativo = '#192847';
const bg = '#ffffff';
const goldDark = '#c7984e';
const gold = '#f5c271';
const goldLight = '#f0db7f';
const oldGold = 'rgb(145, 105, 52)';
const fntLight = '#ffffff';
const fntBlack = '#000000';

const tintColorLight = goldDark;
const tintColorDark = gold;

export const Colors = {
  light: {
    text: fntBlack,
    background: bg,
    tint: tintColorLight,
    icon: bgNegativo,
    tabIconDefault: bgNegativo,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: fntLight,
    background: bgNegativo,
    tint: tintColorDark,
    icon: goldLight,
    tabIconDefault: goldLight,
    tabIconSelected: tintColorDark,
  },
};

export const AppPalette = {
  bgPositiva,
  bgNegativo,
  bg,
  oldGold,
  goldDark,
  gold,
  goldLight,
  fntLight,
  fntBlack,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
