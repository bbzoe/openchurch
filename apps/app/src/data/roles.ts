export const starterRoles = ["Pastor", "Deacon", "Worship leader", "Host", "Preacher", "Prayer"] as const;

export const serviceTemplate = [
  { title: "Welcome", kind: "welcome", minutes: 5 },
  { title: "Worship", kind: "worship", minutes: 25 },
  { title: "Message", kind: "message", minutes: 30 },
  { title: "Prayer", kind: "prayer", minutes: 10 },
] as const;
