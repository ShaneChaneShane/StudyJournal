import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui, createTokens } from "tamagui";

// Create custom orange color tokens
const customTokens = createTokens({
  color: {
    orange1: "#fffcf5",
    orange2: "#fff7e8",
    orange3: "#fdffd5",
    orange4: "#fef9b4",
    orange5: "#ffeb91",
    orange6: "#ffee52",
    orange7: "#f5be29",
    orange8: "#ed8516",
    orange9: "#e8632b",
    orange10: "#a84e21",
    orange11: "#a43d17",
    orange12: "#7c2b00",
  },
  radius: defaultConfig.tokens.radius,
  zIndex: defaultConfig.tokens.zIndex,
  space: defaultConfig.tokens.space,
  size: defaultConfig.tokens.size,
});

// Get a base theme to copy structure from
const baseTheme = defaultConfig.themes.light_blue;

const config = {
  ...defaultConfig,
  tokens: customTokens,
  themes: {
    ...defaultConfig.themes,
    // Create orange theme with same structure as blue
    orange: {
      ...baseTheme,
      background: "#ffab4b",
      backgroundHover: "#ce5822",
      backgroundPress: "#a84921",
      backgroundFocus: "#ffbd4b",
      color: "#ffffff",
      colorHover: "#ffffff",
      colorPress: "#ffffff",
      colorFocus: "#ffffff",
      borderColor: "#ff934b",
      borderColorHover: "#ce6422",
      borderColorPress: "#a84521",
      borderColorFocus: "#ff8a4b",
    },
  },
};

export const tamaguiConfig = createTamagui(config);

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf { }
}
