import { TrackedLink } from "@/components/analytics/tracked-link";
import { Button } from "@/components/ui/button";
import { GithubMark } from "@/components/site/icon";
import { BotanicalScatter } from "@/components/brand/leaves";
import { site } from "@/lib/site";

export function Mission() {
  return (
    <section className="relative isolate overflow-hidden bg-forest-950" aria-labelledby="mission-heading">
      <BotanicalScatter />
      <div className="oc-wrap relative px-6 py-20 text-center text-canvas sm:py-24">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-leaf uppercase">
          Built for a greater purpose
        </p>
        <h2
          id="mission-heading"
          className="mx-auto mt-4 max-w-[16ch] text-[clamp(2rem,4.4vw,3.35rem)] leading-[1.08] font-bold tracking-[-0.03em]"
        >
          Technology should serve the Church. Not the other way around.
        </h2>
        <p className="mx-auto mt-4 max-w-[42ch] text-base text-white/80 sm:text-lg">
          Open tools. Real people. A stronger church community.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="h-11 rounded-full px-5 text-sm font-semibold hover:bg-forest">
            <TrackedLink href={site.earlyAccess} leadType="early_access" location="mission">
              Join early access
            </TrackedLink>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-white/35 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            <a href={site.github}>
              <GithubMark className="size-4" />
              Explore on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
