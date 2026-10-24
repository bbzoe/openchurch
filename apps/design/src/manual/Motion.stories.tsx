import type { Meta, StoryObj } from "@storybook/react";
import { Motion } from "./Motion";

const meta = {
  component: Motion,
  tags: ["autodocs"],
} satisfies Meta<typeof Motion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlusCirclePlus: Story = {};
