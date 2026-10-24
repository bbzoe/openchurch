import type { Meta, StoryObj } from "@storybook/react";
import { Overview } from "./Overview";

const meta = {
  component: Overview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Overview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sheet: Story = {};
