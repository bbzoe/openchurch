import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "OpenChurch",
    brandUrl: "https://openchurch.dev",
    brandImage: "/brand/lockup-sidebar.svg",
    brandTarget: "_self",
    colorPrimary: "#0F3D2E",
    colorSecondary: "#22C55E",
    appBg: "#F6FBF7",
    appContentBg: "#FFFFFF",
    appPreviewBg: "#F6FBF7",
    appBorderColor: "rgba(15, 61, 46, 0.12)",
    appBorderRadius: 12,
    fontBase: '"Manrope", system-ui, sans-serif',
    fontCode: "ui-monospace, SFMono-Regular, Menlo, monospace",
    textColor: "#0F3D2E",
    textInverseColor: "#F6FBF7",
    barTextColor: "#0F3D2E",
    barSelectedColor: "#0F3D2E",
    barHoverColor: "#166534",
    barBg: "#F6FBF7",
    inputBg: "#FFFFFF",
    inputBorder: "rgba(15, 61, 46, 0.18)",
    inputTextColor: "#0F3D2E",
    inputBorderRadius: 8,
  }),
});
