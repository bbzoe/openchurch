import type { Meta, StoryObj } from "@storybook/react";
import { App } from "./App";

const meta = {
  component: App,
  tags: ["autodocs"],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {};
