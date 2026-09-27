import { GiftLogo } from "./icons";
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

/** Small gift icons drifting/bobbing across the background, behind all content. */
export default function RunningGifts() {
  return (
    <div className="running-gifts" aria-hidden="true">
      {LANES.map((lane, i) => (
        <span
          key={i}
          className={`running-gifts__lane running-gifts__lane--${i % 2 === 0 ? "red" : "blue"}`}
          style={{
            top: lane.top,
            width: lane.size,
            height: lane.size,
            opacity: lane.opacity,
            animationDuration: lane.duration,
            animationDelay: lane.delay,
          }}
        >
          <GiftLogo />
        </span>
      ))}
    </div>
  );
}
