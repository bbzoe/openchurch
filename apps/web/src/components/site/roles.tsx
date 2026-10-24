import { Icon, type IconName } from "@/components/site/icon";

const roles: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "music",
    title: "Worship team",
    text: "Plan songs, set keys and arrangements.",
  },
  {
    icon: "monitor",
    title: "Tech team",
    text: "Control slides, media and the live stream.",
  },
  {
    icon: "microphone",
    title: "Speakers",
    text: "Open notes, slides and the service flow.",
  },
  {
    icon: "users",
    title: "Congregation",
    text: "Follow in your language, and stay with the moment.",
  },
];

export function Roles() {
  return (
    <section id="roles" className="oc-section" aria-labelledby="roles-heading">
      <div className="oc-wrap">
        <div className="grid items-end gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-action uppercase">
              Built for everyone in the church
            </p>
            <h2
              id="roles-heading"
              className="mt-3 text-[clamp(2rem,4vw,3.15rem)] leading-[1.05] font-bold tracking-[-0.03em]"
            >
              Different roles. One platform.
            </h2>
          </div>
          <p className="max-w-[36ch] text-base leading-relaxed text-body lg:justify-self-end lg:pb-1">
            From worship teams to tech crew, speakers and the congregation, everyone has the right tools in one place.
          </p>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <li key={role.title}>
              <span className="grid size-11 place-items-center rounded-2xl bg-accent text-action">
                <Icon name={role.icon} className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{role.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{role.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
