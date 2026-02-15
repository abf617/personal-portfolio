import React, { useState, useEffect, useRef, useCallback } from 'react';
import useTempestEngine from './useTempestEngine.js';
import { usePrefersReducedMotion } from '../../../utils/detectMotionPreference.ts';

export default function TempestGame() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { canvasRef, gamePhase } = useTempestEngine(prefersReducedMotion);
  const wrapperRef = useRef(null);

  const [showTouch, setShowTouch] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouch(isTouch);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const glitchTimeouts = [];

    function onTempestGlitch(e) {
      const { intensity, type } = e.detail;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      wrapper.classList.add('crt-hit-glitch');
      const duration = type === 'DEATH' || type === 'WARP' || type === 'SUPERZAPPER'
        ? 400 : Math.max(100, intensity * 300);
      const id = setTimeout(() => {
        wrapper.classList.remove('crt-hit-glitch');
      }, duration);
      glitchTimeouts.push(id);

      if (type === 'DEATH' || type === 'WARP' || type === 'SUPERZAPPER') {
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

    window.addEventListener('tempestGlitch', onTempestGlitch);
    return () => {
      window.removeEventListener('tempestGlitch', onTempestGlitch);
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

      {showTouch && gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 pointer-events-none">
          {/* Left side: lane movement */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowLeft')}
              onTouchEnd={handleTouchEnd('ArrowLeft')}
              aria-label="Move left"
            >
              &#x25C0;
            </button>
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-xl flex items-center justify-center active:bg-neon-cyan/20"
              onTouchStart={handleTouchStart('ArrowRight')}
              onTouchEnd={handleTouchEnd('ArrowRight')}
              aria-label="Move right"
            >
              &#x25B6;
            </button>
          </div>

          {/* Right side: fire + superzapper */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              className="w-14 h-14 rounded-full border-2 border-neon-magenta/60 bg-black/50 text-neon-magenta text-xl flex items-center justify-center active:bg-neon-magenta/20"
              onTouchStart={handleTouchStart('Space')}
              onTouchEnd={handleTouchEnd('Space')}
              aria-label="Fire"
            >
              &#x25CF;
            </button>
            <button
              className="w-14 h-14 rounded-full border-2 border-yellow-400/60 bg-black/50 text-yellow-400 text-xl flex items-center justify-center active:bg-yellow-400/20"
              onTouchStart={handleTouchStart('KeyZ')}
              onTouchEnd={handleTouchEnd('KeyZ')}
              aria-label="Superzapper"
            >
              &#x26A1;
            </button>
          </div>
        </div>
      )}

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
