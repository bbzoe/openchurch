import type { Meta, StoryObj } from "@storybook/react";
import { Color } from "./Color";

const meta = {
  component: Color,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Color>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};
