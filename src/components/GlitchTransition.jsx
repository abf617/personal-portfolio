import React from 'react';
import { useGlitch } from 'react-powerglitch';

/**
 * Glitch effect wrapper component
 * Uses react-powerglitch for RGB channel glitch effects
 * Can be triggered on hover or programmatically
 * Respects prefers-reduced-motion
 */
export default function GlitchTransition({
	children,
	trigger = false,
	glitchOnHover = false,
	prefersReducedMotion = false,
	className = '',
}) {
	const glitch = useGlitch({
		playMode: trigger ? 'always' : 'hover',
		createContainers: true,
		hideOverflow: false,
		timing: {
			duration: 500,
			iterations: 1,
		},
		glitchTimeSpan: {
			start: 0,
			end: 1,
		},
		shake: {
			velocity: 10,
			amplitudeX: 0.1,
			amplitudeY: 0.1,
		},
		slice: {
			count: 6,
			velocity: 15,
			minHeight: 0.02,
			maxHeight: 0.15,
			hueRotate: true,
		},
	});

	// If user prefers reduced motion, render without glitch effect
	if (prefersReducedMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<div ref={glitch.ref} className={className}>
			{children}
		</div>
	);
}
