import { Features } from "@/components/site/features";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { Mission } from "@/components/site/mission";
import { Roadmap } from "@/components/site/roadmap";
import { Roles } from "@/components/site/roles";
import { SourceAndHosting } from "@/components/site/source-hosting";
import { Stage } from "@/components/site/stage";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Stage />
        <Features />
        <SourceAndHosting />
        <Roadmap />
        <Mission />
        <Roles />
      </main>
      <Footer />
    </>
  );
}
