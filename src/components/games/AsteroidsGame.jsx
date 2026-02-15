import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGameEngine from './useGameEngine.js';
import { usePrefersReducedMotion } from '../../utils/detectMotionPreference.ts';

export default function AsteroidsGame() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { canvasRef, gamePhase } = useGameEngine(prefersReducedMotion);
  const wrapperRef = useRef(null);

  // Touch controls state
  const [showTouch, setShowTouch] = useState(false);
  const touchState = useRef({ left: false, right: false, thrust: false, fire: false });

  useEffect(() => {
    // Detect touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouch(isTouch);
  }, []);

  // Page-level CRT interference synced to game events
  useEffect(() => {
    if (prefersReducedMotion) return;

    const glitchTimeouts = [];

    function onAsteroidGlitch(e) {
      const { intensity, size } = e.detail;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // Add interference class
      wrapper.classList.add('crt-hit-glitch');

      // Scale duration with intensity (100-400ms)
      const duration = size === 'DEATH' ? 400 : Math.max(100, intensity * 300);
      const id = setTimeout(() => {
        wrapper.classList.remove('crt-hit-glitch');
      }, duration);
      glitchTimeouts.push(id);

      // Also pulse the page's CRT wrapper for big hits
      if (size === 'LARGE' || size === 'DEATH') {
        const crt = document.querySelector('.crt-wrapper');
        if (crt) {
          crt.classList.add('crt-hit-glitch');
          const crtId = setTimeout(() => {
            crt.classList.remove('crt-hit-glitch');
          }, duration);
          glitchTimeouts.push(crtId);
        }
      }
    }

    window.addEventListener('asteroidGlitch', onAsteroidGlitch);
    return () => {
      window.removeEventListener('asteroidGlitch', onAsteroidGlitch);
      glitchTimeouts.forEach(clearTimeout);
    };
  }, [prefersReducedMotion]);

  // Simulate keyboard events from touch controls
  const simulateKey = useCallback((code, down) => {
    const event = new KeyboardEvent(down ? 'keydown' : 'keyup', {
      code,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }, []);

  const handleTouchStart = useCallback((code) => (e) => {
    e.preventDefault();
    simulateKey(code, true);
  }, [simulateKey]);

  const handleTouchEnd = useCallback((code) => (e) => {
    e.preventDefault();
    simulateKey(code, false);
  }, [simulateKey]);

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
      <div className="w-full h-full neon-border-cyan rounded-md overflow-hidden bg-black/40">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Mobile touch controls */}
      {showTouch && gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 pointer-events-none">
          {/* Left side: rotation */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowLeft')}
              onTouchEnd={handleTouchEnd('ArrowLeft')}
              aria-label="Rotate left"
            >
              &#x25C0;
            </button>
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowRight')}
              onTouchEnd={handleTouchEnd('ArrowRight')}
              aria-label="Rotate right"
            >
              &#x25B6;
            </button>
          </div>

          {/* Right side: thrust + fire */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-green/60 bg-black/50 text-neon-green text-xl flex items-center justify-center active:bg-neon-green/20"
              onTouchStart={handleTouchStart('ArrowUp')}
              onTouchEnd={handleTouchEnd('ArrowUp')}
              aria-label="Thrust"
            >
              &#x25B2;
            </button>
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-magenta/60 bg-black/50 text-neon-magenta text-xl flex items-center justify-center active:bg-neon-magenta/20"
              onTouchStart={handleTouchStart('Space')}
              onTouchEnd={handleTouchEnd('Space')}
              aria-label="Fire"
            >
              &#x25CF;
            </button>
          </div>
        </div>
      )}

      {/* Mobile start/restart tap area */}
      {showTouch && gamePhase !== 'playing' && (
        <button
          className="absolute inset-0 w-full h-full bg-transparent"
          onClick={() => simulateKey('Enter', true)}
          aria-label={gamePhase === 'start' ? 'Start game' : 'Restart game'}
        />
      )}
    </div>
  );
}
