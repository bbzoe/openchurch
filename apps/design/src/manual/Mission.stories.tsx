import type { Meta, StoryObj } from "@storybook/react";
import { Mission } from "./Mission";

const meta = {
  component: Mission,
  tags: ["autodocs"],
} satisfies Meta<typeof Mission>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ambassadors: Story = {};
