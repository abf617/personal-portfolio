import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSnakeEngine from './useSnakeEngine.js';
import { usePrefersReducedMotion } from '../../../utils/detectMotionPreference.ts';

export default function SnakeGame() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { canvasRef, gamePhase } = useSnakeEngine(prefersReducedMotion);
  const wrapperRef = useRef(null);

  const [showTouch, setShowTouch] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouch(isTouch);
  }, []);

  // Page-level CRT interference synced to game events
  useEffect(() => {
    if (prefersReducedMotion) return;

    const glitchTimeouts = [];

    function onSnakeGlitch(e) {
      const { intensity, type } = e.detail;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      wrapper.classList.add('crt-hit-glitch');

      const duration = type === 'death' ? 400 : type === 'virus' ? 300 : Math.max(100, intensity * 300);
      const id = setTimeout(() => {
        wrapper.classList.remove('crt-hit-glitch');
      }, duration);
      glitchTimeouts.push(id);

      if (type === 'virus' || type === 'death') {
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

    window.addEventListener('snakeGlitch', onSnakeGlitch);
    return () => {
      window.removeEventListener('snakeGlitch', onSnakeGlitch);
      glitchTimeouts.forEach(clearTimeout);
    };
  }, [prefersReducedMotion]);

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

      {/* Mobile touch controls - D-pad layout */}
      {showTouch && gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="grid grid-cols-3 grid-rows-3 gap-1 pointer-events-auto" style={{ width: '168px', height: '168px' }}>
            {/* Top center: Up */}
            <div />
            <button
              className="w-14 h-14 rounded-md border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowUp')}
              onTouchEnd={handleTouchEnd('ArrowUp')}
              aria-label="Move up"
            >
              &#x25B2;
            </button>
            <div />

            {/* Middle: Left, empty, Right */}
            <button
              className="w-14 h-14 rounded-md border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowLeft')}
              onTouchEnd={handleTouchEnd('ArrowLeft')}
              aria-label="Move left"
            >
              &#x25C0;
            </button>
            <div />
            <button
              className="w-14 h-14 rounded-md border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowRight')}
              onTouchEnd={handleTouchEnd('ArrowRight')}
              aria-label="Move right"
            >
              &#x25B6;
            </button>

            {/* Bottom center: Down */}
            <div />
            <button
              className="w-14 h-14 rounded-md border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowDown')}
              onTouchEnd={handleTouchEnd('ArrowDown')}
              aria-label="Move down"
            >
              &#x25BC;
            </button>
            <div />
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
