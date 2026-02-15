import React, { useState, useEffect, useCallback, useRef } from 'react';

const GAMES = [
  {
    id: 'asteroids',
    title: 'ASTEROIDS',
    path: '/games/asteroids',
    status: 'ready',
    description: 'Destroy asteroids. Survive the void.',
    controls: 'ARROWS / WASD + SPACE',
    ascii: [
      '        .  *',
      '   *  /\\    ',
      '     /  \\  .',
      '  * /    \\  ',
      '   / \\  / \\ ',
      '  *   \\/   *',
    ],
  },
  {
    id: 'snake',
    title: 'SNAKE',
    path: null,
    status: 'coming_soon',
    description: 'Navigate the grid. Consume data packets.',
    controls: 'ARROW KEYS',
    ascii: [
      '            ',
      '  ████▶     ',
      '  █         ',
      '  ████      ',
      '      █  ◆  ',
      '  ████▶     ',
    ],
  },
  {
    id: 'tetris',
    title: 'TETRIS',
    path: null,
    status: 'coming_soon',
    description: 'Stack blocks. Clear lines. Chase the score.',
    controls: 'ARROWS + UP TO ROTATE',
    ascii: [
      '  ┌──┐      ',
      '  │██│ ┌──┐ ',
      '  │██├─┤██│ ',
      '  └──┤██├──┘ ',
      '  ┌──┤██│    ',
      '  │████─┘    ',
    ],
  },
];

export default function ArcadeSelect({ prefersReducedMotion = false }) {
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [scanlineY, setScanlineY] = useState(0);
  const containerRef = useRef(null);

  // Animated scanline sweep across the preview
  useEffect(() => {
    if (prefersReducedMotion) return;
    let frame;
    const animate = () => {
      setScanlineY(prev => (prev + 1.5) % 100);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const launchGame = useCallback((index) => {
    const game = GAMES[index];
    if (!game || game.status !== 'ready') return;

    if (prefersReducedMotion) {
      window.location.href = game.path;
      return;
    }

    setLaunching(true);
    const start = Date.now();
    const duration = 800;

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setLoadProgress(progress);
      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          window.location.href = game.path;
        }, 150);
      }
    }
    requestAnimationFrame(tick);
  }, [prefersReducedMotion]);

  useEffect(() => {
    function onKeyDown(e) {
      if (launching) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + GAMES.length) % GAMES.length);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % GAMES.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        launchGame(selectedIndex);
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (idx < GAMES.length) {
          e.preventDefault();
          if (GAMES[idx].status === 'ready') {
            setSelectedIndex(idx);
            launchGame(idx);
          } else {
            setSelectedIndex(idx);
          }
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, launching, launchGame]);

  const selectedGame = GAMES[selectedIndex];

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto">
      {/* Game list */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6">

        {/* Left: game list */}
        <div className="space-y-3" role="listbox" aria-label="Game selection">
          {GAMES.map((game, index) => {
            const isSelected = index === selectedIndex;
            const isReady = game.status === 'ready';

            return (
              <button
                key={game.id}
                role="option"
                aria-selected={isSelected}
                className={`
                  w-full text-left font-mono p-4 rounded-md border transition-all duration-200
                  ${isSelected
                    ? 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'}
                  ${!isReady ? 'opacity-50' : 'cursor-pointer'}
                `}
                onClick={() => {
                  setSelectedIndex(index);
                  if (isReady) launchGame(index);
                }}
                onMouseEnter={() => !isTouchDevice && setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isSelected ? 'text-neon-green' : 'text-white/30'}`}>
                      {isSelected ? '>' : ' '} {index + 1}.
                    </span>
                    <span className={`text-lg font-display tracking-wider ${
                      isSelected
                        ? 'text-neon-cyan phosphor-glow'
                        : isReady ? 'text-neon-cyan/70' : 'text-white/30'
                    }`}>
                      {game.title}
                    </span>
                  </div>
                  {isReady ? (
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      isSelected
                        ? 'text-neon-green border-neon-green/50'
                        : 'text-neon-green/50 border-neon-green/20'
                    }`}>
                      READY
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded border text-neon-magenta/50 border-neon-magenta/20">
                      INCOMING
                    </span>
                  )}
                </div>
                <div className={`text-xs mt-1 ml-9 ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
                  {game.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: preview panel */}
        <div className="terminal-window relative overflow-hidden">
          {/* Scanline sweep */}
          {!prefersReducedMotion && (
            <div
              className="absolute left-0 right-0 h-[2px] bg-neon-cyan/10 pointer-events-none z-10"
              style={{ top: `${scanlineY}%` }}
            />
          )}

          {/* ASCII preview */}
          <div className="mb-4">
            <div className="text-xs text-neon-green/60 font-mono mb-2">
              PREVIEW://
            </div>
            <div className="bg-black/60 rounded p-4 font-mono text-sm leading-relaxed border border-white/5">
              {selectedGame.ascii.map((line, i) => (
                <div
                  key={i}
                  className={`whitespace-pre ${
                    selectedGame.status === 'ready' ? 'text-neon-cyan' : 'text-white/20'
                  }`}
                  style={!prefersReducedMotion ? {
                    textShadow: `0 0 ${4 + Math.sin((scanlineY / 10) + i) * 2}px currentColor`,
                  } : undefined}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Game info */}
          <div className="space-y-2 font-mono text-xs">
            <div>
              <span className="text-neon-green">TITLE:</span>{' '}
              <span className="text-neon-cyan">{selectedGame.title}</span>
            </div>
            <div>
              <span className="text-neon-green">STATUS:</span>{' '}
              <span className={selectedGame.status === 'ready' ? 'text-neon-green' : 'text-neon-magenta'}>
                {selectedGame.status === 'ready' ? 'OPERATIONAL' : 'UNDER DEVELOPMENT'}
              </span>
            </div>
            <div>
              <span className="text-neon-green">CONTROLS:</span>{' '}
              <span className="text-white/60">{selectedGame.controls}</span>
            </div>
            <div>
              <span className="text-neon-green">INFO:</span>{' '}
              <span className="text-white/50">{selectedGame.description}</span>
            </div>
          </div>

          {/* Launch section */}
          <div className="mt-6 pt-4 border-t border-white/10">
            {!launching ? (
              selectedGame.status === 'ready' ? (
                <button
                  className="w-full font-mono text-sm py-2 rounded border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-colors phosphor-glow"
                  onClick={() => launchGame(selectedIndex)}
                >
                  {'>'} LAUNCH [ ENTER ]
                </button>
              ) : (
                <div className="w-full font-mono text-sm py-2 text-center text-white/20">
                  {'>'} AWAITING DEPLOYMENT...
                </div>
              )
            ) : (
              <div className="font-mono text-sm text-neon-green">
                <div className="mb-1">&gt; Loading {selectedGame.title}...</div>
                <div className="phosphor-glow">
                  [{'\u2588'.repeat(Math.floor(loadProgress / 5))}{'\u2591'.repeat(20 - Math.floor(loadProgress / 5))}] {loadProgress}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 text-center font-mono text-xs text-white/30">
        [↑↓] SELECT{'  '}[ENTER] LAUNCH{'  '}[1-{GAMES.length}] QUICK SELECT
      </div>
    </div>
  );
}
