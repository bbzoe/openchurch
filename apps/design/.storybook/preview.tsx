import type { Preview } from "@storybook/react";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "../src/manual/manual.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        canvas: { name: "Canvas", value: "#F6FBF7" },
        white: { name: "White", value: "#FFFFFF" },
        forest: { name: "Forest", value: "#0F3D2E" },
      },
    },
    options: {
      storySort: {
        order: [
          "manual",
          ["Overview", "Mark", "Color", "Typography", "App", "Motion", "Mission"],
        ],
      },
    },
    docs: {
      toc: false,
    },
  },
  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: '"Manrope", system-ui, sans-serif', color: "#0F3D2E" }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
