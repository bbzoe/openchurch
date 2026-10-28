import { Icon, type IconName } from "@/components/site/icon";

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "monitor", title: "On the big screen", text: "In the church" },
  { icon: "microphone", title: "Tech team", text: "Controls content" },
  { icon: "users", title: "In the app", text: "For the congregation" },
  { icon: "stream", title: "Online", text: "Live stream" },
];

export function Stage() {
  return (
    <section className="px-[clamp(1.5rem,4vw,4rem)] pt-6 pb-[clamp(4.5rem,8vw,8rem)] lg:pt-8" aria-labelledby="stage-heading">
      <div className="relative isolate min-h-[640px] overflow-hidden rounded-[28px] bg-forest-950 sm:min-h-[520px]">
        <picture>
          <source media="(max-width: 640px)" srcSet="/landing/live-stage-mobile-portrait.webp" />
          <img
            src="/landing/live-stage-1600.webp"
            alt="Illustrative view from a congregation toward a lit stage. Not an OpenChurch event."
            width={1024}
            height={682}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
          />
        </picture>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,24,18,0.94)_0%,rgba(4,24,18,0.82)_32%,rgba(4,24,18,0.28)_58%,rgba(4,24,18,0.08)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(4,24,18,0.72),transparent)]"
        />

        <div className="relative z-10 flex min-h-[640px] flex-col justify-between px-6 py-8 sm:min-h-[520px] sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div className="max-w-[34rem]">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-leaf uppercase">
              Real-time connection
            </p>
            <h2
              id="stage-heading"
              className="mt-3 text-[clamp(2.5rem,4.4vw,3.6rem)] leading-[1.02] font-bold tracking-[-0.035em] text-white"
            >
              From the stage
              <br />
              to every seat.
            </h2>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-white/90 sm:text-base">
              Everyone sees the same thing, at the same time. Worship team, tech crew,
              speakers and the whole church, in sync, wherever they are.
            </p>
            <a href="#features" className="mt-6 inline-flex items-center gap-3 text-white">
              <span className="grid size-12 place-items-center rounded-full bg-white text-forest">
                <svg viewBox="0 0 24 24" className="size-4 translate-x-px" aria-hidden="true">
                  <path d="M9 7.2v9.6l8.2-4.8z" fill="currentColor" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold">Watch how it works</span>
                <span className="block text-xs text-white/70">2 min</span>
              </span>
            </a>
          </div>

          <ol className="relative mt-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-8 sm:ml-auto sm:w-full sm:max-w-[34rem] sm:grid-cols-4">
            <span
              aria-hidden="true"
              className="absolute top-4 right-[12%] left-[12%] hidden h-px bg-white/45 sm:block"
            />
            {steps.map((step, index) => (
              <li key={step.title} className="relative text-center">
                <span
                  className={`relative z-10 mx-auto grid size-8 place-items-center rounded-full ${
                    index === 0
                      ? "bg-[#128A4A] text-white"
                      : "border border-white/70 bg-[#062A21] text-white"
                  }`}
                >
                  <Icon name={step.icon} className="size-3.5" />
                </span>
                <p className="mt-2 text-[13px] font-semibold text-white">{step.title}</p>
                <p className="text-[12px] text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
