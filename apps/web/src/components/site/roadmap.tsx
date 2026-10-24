import { Icon, type IconName } from "@/components/site/icon";

const items: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "kids",
    title: "Kids ministry",
    text: "Check-in, lesson flow and parent notes, once the Sunday service tools are in use.",
  },
  {
    icon: "calendar",
    title: "Events",
    text: "Gatherings beyond Sunday, on the same calendar the service team already trusts.",
  },
  {
    icon: "chat",
    title: "Communications",
    text: "Announcements that match what happened in the room, not a separate newsletter tool.",
  },
  {
    icon: "shield",
    title: "Privacy and permissions",
    text: "Roles for leaders, teams and guests, so the right people see the right plan.",
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="oc-section relative overflow-hidden" aria-labelledby="roadmap-heading">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/landing/organic-contours-light.svg')] bg-cover bg-center opacity-60"
      />
      <div className="oc-wrap relative">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-action uppercase">
          One platform. Room to grow.
        </p>
        <h2
          id="roadmap-heading"
          className="mt-3 max-w-[14ch] text-[clamp(2rem,4vw,3.15rem)] leading-[1.05] font-bold tracking-[-0.03em]"
        >
          One platform. Room to grow.
        </h2>
        <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-body">
          These areas are not in the first release. They are the direction, not a promise of a date.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.title} className="rounded-[22px] border border-line bg-white/90 p-6">
              <span className="grid size-11 place-items-center rounded-2xl bg-accent text-action">
                <Icon name={item.icon} className="size-5" />
              </span>
              <p className="mt-4 text-[11px] font-semibold tracking-wide text-action uppercase">
                Coming soon
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
