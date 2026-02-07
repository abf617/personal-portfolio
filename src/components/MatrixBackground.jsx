import React, { useEffect, useRef } from 'react';

/**
 * Matrix-style falling code background effect
 * Canvas-based for optimal performance (60fps)
 * Respects prefers-reduced-motion accessibility setting
 */
export default function MatrixBackground({ prefersReducedMotion = false }) {
	const canvasRef = useRef(null);

	useEffect(() => {
		// Don't render if user prefers reduced motion
		if (prefersReducedMotion) {
			return;
		}

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');

		// Set canvas size
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Matrix characters - using numbers and symbols
		const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
		const fontSize = 14;
		const columns = canvas.width / fontSize;

		// Array of drops - one per column
		const drops = Array(Math.floor(columns)).fill(1);

		// Drawing function
		function draw() {
			// Black background with fade effect
			ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Cyan text color
			ctx.fillStyle = '#00F0FF';
			ctx.font = fontSize + 'px monospace';

			// Loop over drops
			for (let i = 0; i < drops.length; i++) {
				// Random character
				const text = chars[Math.floor(Math.random() * chars.length)];

				// Draw character
				ctx.fillText(text, i * fontSize, drops[i] * fontSize);

				// Reset drop to top randomly
				if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
					drops[i] = 0;
				}

				// Increment Y coordinate
				drops[i]++;
			}
		}

		// Animation loop
		const interval = setInterval(draw, 50);

		// Handle resize
		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', handleResize);
		};
	}, [prefersReducedMotion]);

	// Don't render canvas if user prefers reduced motion
	if (prefersReducedMotion) {
		return null;
	}

	return (
		<canvas
			ref={canvasRef}
			className="matrix-background"
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				zIndex: -1,
				opacity: 0.3,
				pointerEvents: 'none',
			}}
		/>
	);
}
