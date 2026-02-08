import { useState, useEffect } from "react";
import TypedHeading from "./TypedHeading";
import { useGlitch } from "react-powerglitch";
import { getPrefersReducedMotion } from "../utils/detectMotionPreference";

export default function BootAnimation({ uiStrings = {} }) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const prefersReducedMotion = getPrefersReducedMotion();

  const glitch = useGlitch({
    playMode: "always",
    createContainers: true,
    hideOverflow: false,
    timing: {
      duration: 1500,
      iterations: 1,
    },
    glitchTimeSpan: {
      start: 0,
      end: 1,
    },
    shake: {
      velocity: 20,
      amplitudeX: 0.3,
      amplitudeY: 0.3,
    },
    slice: {
      count: 10,
      velocity: 20,
      minHeight: 0.02,
      maxHeight: 0.15,
      hueRotate: true,
    },
  });

  useEffect(() => {
    // Clear sessionStorage on mount to ensure boot plays every time
    sessionStorage.removeItem("bootAnimationComplete");

    const skipBoot =
      new URLSearchParams(window.location.search).has("skipBoot") ||
      localStorage.getItem("bootAnimationSeen") === "skip" ||
      prefersReducedMotion;

    if (skipBoot) {
      setShowContent(true);
      sessionStorage.setItem("bootAnimationComplete", "true");
      window.dispatchEvent(new CustomEvent("bootComplete"));
    }
  }, [prefersReducedMotion]);

  const handleTypingComplete = () => {
    setAnimationPhase(1);

    setTimeout(() => {
      setAnimationPhase(2);

      setTimeout(() => {
        sessionStorage.setItem("bootAnimationComplete", "true");
        window.dispatchEvent(new CustomEvent("bootComplete"));

        // Wait for fade out animation, then hide completely
        setTimeout(() => {
          setShowContent(true);
        }, 500);
      }, 500);
    }, 1500);
  };

  return (
    <div
      className={`
				fixed inset-0 z-[10000]
				bg-terminal-black
				flex items-center justify-center
				transition-opacity duration-500
				${animationPhase === 2 || showContent ? "opacity-0 pointer-events-none" : "opacity-100"}
			`}
      style={{ display: showContent ? "none" : "flex" }}
      aria-live="polite"
      role="status"
    >
      <div className="text-center">
        {animationPhase === 0 && (
          <TypedHeading
            strings={[uiStrings.bootInitiation || "Welcome... Initiating."]}
            typeSpeed={80}
            showCursor={false}
            loop={false}
            className="text-neon-green phosphor-glow text-2xl sm:text-3xl md:text-5xl font-mono whitespace-nowrap"
            onComplete={handleTypingComplete}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}

        {animationPhase >= 1 && (
          <div
            ref={glitch.ref}
            className="text-neon-green phosphor-glow text-2xl sm:text-3xl md:text-5xl font-mono whitespace-nowrap"
          >
            {uiStrings.bootInitiation || "Welcome... Initiating"}
          </div>
        )}
      </div>
    </div>
  );
}
