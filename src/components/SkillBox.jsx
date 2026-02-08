import { useState } from "react";
import TypedHeading from "./TypedHeading";

export default function SkillBox({
  heading,
  skills,
  prefersReducedMotion = false,
  showCursor = false,
  typeSpeed = 50,
  compact = false,
}) {
  const [typingComplete, setTypingComplete] = useState(false);

  return (
    <div className={`terminal-window ${compact ? "compact" : ""}`}>
      <div className={compact ? "mb-2" : "mb-2"}>
        <TypedHeading
          strings={[heading]}
          typeSpeed={typeSpeed}
          showCursor={showCursor}
          loop={false}
          onComplete={() => setTypingComplete(true)}
          className={`font-mono text-neon-green ${compact ? "text-xl" : "text-2xl"}`}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {typingComplete && (
        <ul
          className={`font-mono text-neon-cyan ${compact ? "text-sm space-y-2" : "text-base space-y-4"}`}
        >
          {skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
