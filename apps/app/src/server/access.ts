import type { capability, membershipRole } from "@openchurch/db";

export type Role = (typeof membershipRole.enumValues)[number];
export type Capability = (typeof capability.enumValues)[number];

export const capabilities: Capability[] = ["plan", "live", "songs", "people"];

export function hasCapability(role: Role, granted: Capability[], needed: Capability) {
  if (role === "admin") return true;
  if (role !== "ministry") return false;
  return granted.includes(needed);
}

export function canReadPlan(role: Role) {
  return role === "member" || role === "ministry" || role === "admin";
}
