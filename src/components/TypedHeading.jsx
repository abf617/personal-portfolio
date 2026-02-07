import React, { useEffect, useRef } from 'react';
import Typed from 'typed.js';

/**
 * Terminal-style typing animation component
 * Uses typed.js for smooth typing effects
 * Respects prefers-reduced-motion - shows final text immediately if motion is reduced
 */
export default function TypedHeading({
	strings,
	typeSpeed = 50,
	backSpeed = 30,
	loop = true,
	showCursor = true,
	className = '',
	prefersReducedMotion = false,
}) {
	const el = useRef(null);
	const typed = useRef(null);

	useEffect(() => {
		// If user prefers reduced motion, show the first string immediately
		if (prefersReducedMotion) {
			if (el.current) {
				el.current.textContent = strings[0];
			}
			return;
		}

		// Initialize typed.js
		if (el.current) {
			typed.current = new Typed(el.current, {
				strings,
				typeSpeed,
				backSpeed,
				loop,
				showCursor,
				cursorChar: '▮',
				contentType: 'text',
			});
		}

		// Cleanup
		return () => {
			if (typed.current) {
				typed.current.destroy();
			}
		};
	}, [strings, typeSpeed, backSpeed, loop, showCursor, prefersReducedMotion]);

	return (
		<span
			ref={el}
			className={`phosphor-glow text-neon-cyan ${className}`}
		/>
	);
}
