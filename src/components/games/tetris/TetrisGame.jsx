import React, { useState, useEffect, useRef, useCallback } from 'react';
import useTetrisEngine from './useTetrisEngine.js';
import { usePrefersReducedMotion } from '../../../utils/detectMotionPreference.ts';

export default function TetrisGame() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { canvasRef, gamePhase } = useTetrisEngine(prefersReducedMotion);
  const wrapperRef = useRef(null);

  const [showTouch, setShowTouch] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouch(isTouch);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const glitchTimeouts = [];

    function onTetrisGlitch(e) {
      const { intensity, type } = e.detail;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      wrapper.classList.add('crt-hit-glitch');

      const duration = type === 'death' ? 500
        : type === 'tetris' ? 350
        : type === 'triple' ? 200
        : Math.max(100, intensity * 300);
      const id = setTimeout(() => {
        wrapper.classList.remove('crt-hit-glitch');
      }, duration);
      glitchTimeouts.push(id);

      if (type === 'triple' || type === 'tetris' || type === 'death') {
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

    window.addEventListener('tetrisGlitch', onTetrisGlitch);
    return () => {
      window.removeEventListener('tetrisGlitch', onTetrisGlitch);
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

  const touchBtnClass = 'w-12 h-12 rounded-md border-2 border-neon-cyan/60 bg-black/50 text-neon-cyan text-lg flex items-center justify-center active:bg-neon-cyan/20 select-none';

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      <div className="w-full h-full neon-border-cyan rounded-md overflow-hidden bg-black/40">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>

      {showTouch && gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 px-4 pointer-events-none">
          <div className="flex justify-between items-end pointer-events-auto max-w-lg mx-auto">
            {/* Left: movement */}
            <div className="flex gap-2 items-center">
              <button
                className={touchBtnClass}
                onTouchStart={handleTouchStart('ArrowLeft')}
                onTouchEnd={handleTouchEnd('ArrowLeft')}
                aria-label="Move left"
              >
                &#x25C0;
              </button>
              <button
                className={touchBtnClass}
                onTouchStart={handleTouchStart('ArrowDown')}
                onTouchEnd={handleTouchEnd('ArrowDown')}
                aria-label="Soft drop"
              >
                &#x25BC;
              </button>
              <button
                className={touchBtnClass}
                onTouchStart={handleTouchStart('ArrowRight')}
                onTouchEnd={handleTouchEnd('ArrowRight')}
                aria-label="Move right"
              >
                &#x25B6;
              </button>
            </div>

            {/* Right: actions */}
            <div className="flex gap-2 items-center">
              <button
                className={touchBtnClass}
                onTouchStart={handleTouchStart('ArrowUp')}
                onTouchEnd={handleTouchEnd('ArrowUp')}
                aria-label="Rotate"
              >
                &#x21BB;
              </button>
              <button
                className={touchBtnClass}
                onTouchStart={handleTouchStart('Space')}
                onTouchEnd={handleTouchEnd('Space')}
                aria-label="Hard drop"
              >
                &#x2B07;
              </button>
              <button
                className={touchBtnClass}
                onTouchStart={handleTouchStart('KeyC')}
                onTouchEnd={handleTouchEnd('KeyC')}
                aria-label="Hold piece"
              >
                H
              </button>
            </div>
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
