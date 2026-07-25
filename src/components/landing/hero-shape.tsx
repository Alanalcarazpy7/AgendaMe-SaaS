import Image from "next/image";

export function HeroShape() {
  return (
    <div
      className="
        pointer-events-none
        absolute
        inset-0
        z-0
        hidden
        overflow-hidden
        lg:block
      "
      aria-hidden="true"
    >
      <Image
        src="/landing/hero-wave-bg1.svg"
        alt=""
        fill
        unoptimized
        draggable={false}
        className="
          h-full
          w-full
          select-none
          object-cover
          object-center
        "
      />
    </div>
  );
}
