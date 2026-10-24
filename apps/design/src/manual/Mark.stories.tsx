import type { Meta, StoryObj } from "@storybook/react";
import { Mark } from "./Mark";

const meta = {
  component: Mark,
  tags: ["autodocs"],
  args: {
    variant: "color",
    size: 180,
  },
} satisfies Meta<typeof Mark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Color: Story = {};

export const OnDark: Story = {
  args: { variant: "dark" },
  globals: {
    backgrounds: { value: "forest" },
  },
};

export const Forest: Story = {
  args: { variant: "forest" },
};

export const Growth: Story = {
  args: { variant: "growth" },
};

export const Leaf: Story = {
  args: { variant: "leaf" },
};

export const White: Story = {
  args: { variant: "white" },
  globals: {
    backgrounds: { value: "forest" },
  },
};

export const Lockup: Story = {
  render: () => (
    <img src="/brand/lockup.svg" alt="OpenChurch" style={{ width: 520, height: "auto" }} />
  ),
};

export const ClearSpace: Story = {
  render: () => (
    <div className="oc-clear">
      <Mark size={140} />
    </div>
  ),
};

export const DoNotStretch: Story = {
  render: () => (
    <div className="oc-bad">
      <Mark size={140} />
    </div>
  ),
};

export const Assets: Story = {
  render: () => (
    <ul className="oc-links">
      {[
        ["Mark, primary", "/brand/mark.svg"],
        ["On dark background", "/brand/mark-dark.svg"],
        ["Forest", "/brand/mark-forest.svg"],
        ["Growth", "/brand/mark-growth.svg"],
        ["Leaf", "/brand/mark-leaf.svg"],
        ["White", "/brand/mark-white.svg"],
        ["Lockup", "/brand/lockup.svg"],
        ["Lockup forest", "/brand/lockup-forest.svg"],
        ["Lockup white", "/brand/lockup-white.svg"],
        ["App icon", "/brand/app-icon.svg"],
      ].map(([label, href]) => (
        <li key={href}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
  ),
};
