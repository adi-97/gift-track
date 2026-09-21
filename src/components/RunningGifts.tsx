import "./RunningGifts.css";

interface GiftLane {
  top: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
}

// Staggered top offsets, speeds, and delays so the icons don't move in lockstep.
const LANES: GiftLane[] = [
  { top: "10%", size: 40, duration: "22s", delay: "-4s", opacity: 0.85 },
  { top: "32%", size: 28, duration: "17s", delay: "-11s", opacity: 0.6 },
  { top: "56%", size: 36, duration: "26s", delay: "-2s", opacity: 0.75 },
  { top: "74%", size: 24, duration: "19s", delay: "-15s", opacity: 0.55 },
  { top: "88%", size: 32, duration: "24s", delay: "-8s", opacity: 0.7 },
];

// Same palette as the app icon (scripts/icon-svg.mjs) — keep in sync if that changes.
const TEAL = "#1c6b66";
const TEAL_STRONG = "#0f4f4b";
const CREAM = "#f6f1e2";

/** Full-color gift-box icon (matches the app icon) for the drifting background. */
function GiftGlyph() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <ellipse cx="210" cy="172" rx="48" ry="34" fill={CREAM} transform="rotate(-26 210 172)" />
      <ellipse cx="302" cy="172" rx="48" ry="34" fill={CREAM} transform="rotate(26 302 172)" />
      <circle cx="256" cy="182" r="22" fill={TEAL_STRONG} />
      <rect x="94" y="198" width="324" height="58" rx="14" fill={TEAL_STRONG} />
      <rect x="118" y="256" width="276" height="196" rx="18" fill={TEAL} />
      <rect x="236" y="198" width="40" height="254" fill={CREAM} />
      <rect x="94" y="218" width="324" height="20" fill={CREAM} />
    </svg>
  );
}

/** Small gift icons drifting/bobbing across the background, behind all content. */
export default function RunningGifts() {
  return (
    <div className="running-gifts" aria-hidden="true">
      {LANES.map((lane, i) => (
        <span
          key={i}
          className="running-gifts__lane"
          style={{
            top: lane.top,
            width: lane.size,
            height: lane.size,
            opacity: lane.opacity,
            animationDuration: lane.duration,
            animationDelay: lane.delay,
          }}
        >
          <GiftGlyph />
        </span>
      ))}
    </div>
  );
}
