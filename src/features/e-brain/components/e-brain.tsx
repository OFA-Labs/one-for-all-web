import Image from "next/image";
import { PageTitle } from "@/components/common";

export function EBrain() {
  return (
    <>
      <PageTitle
        title="e-brain"
        description="A home for the knowledge and context your assistant can use."
      />
      <section className="panel ebrain-panel" aria-label="About e-brain">
        <Image
          src="/media/e-brain-mark.webp"
          alt="e-brain: a brain inside the letter e"
          width={320}
          height={340}
          className="ebrain-artwork"
          unoptimized
          loading="eager"
        />
        <h2>Knowledge that stays with you.</h2>
        <p>Keep useful context close, so you can pick up where you left off.</p>
      </section>
    </>
  );
}
