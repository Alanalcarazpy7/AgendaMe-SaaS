export function HeroShape() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[54%] overflow-hidden lg:block">
      <svg viewBox="0 0 500 1000" preserveAspectRatio="none" aria-hidden="true" className="h-full w-[135%]">
        <defs>
          <linearGradient id="ag-hero-wave" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0B1120" />
            <stop offset="55%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--ring)" />
          </linearGradient>
        </defs>

        <path
          d="M270,0 C210,90 330,180 270,270 C210,360 330,450 270,540 C210,630 330,720 270,810 C240,855 255,900 270,1000"
          fill="none"
          stroke="var(--ring)"
          strokeOpacity="0.16"
          strokeWidth="2"
        />
        <path
          d="M310,0 C250,90 370,180 310,270 C250,360 370,450 310,540 C250,630 370,720 310,810 C280,855 295,900 310,1000"
          fill="none"
          stroke="var(--ring)"
          strokeOpacity="0.1"
          strokeWidth="2"
        />

        <path
          d="M240,0 C170,95 300,190 235,285 C170,380 300,475 235,570 C170,665 300,760 235,855 C205,905 220,955 240,1000 L500,1000 L500,0 Z"
          fill="url(#ag-hero-wave)"
        />
      </svg>
    </div>
  );
}
