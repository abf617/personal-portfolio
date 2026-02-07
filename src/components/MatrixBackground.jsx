import React from 'react';
import MatrixAnimation from 'react-matrix-animation';

/**
 * Matrix-style falling code background effect
 * Canvas-based for optimal performance (60fps)
 * Respects prefers-reduced-motion accessibility setting
 */
export default function MatrixBackground({ prefersReducedMotion = false }) {
	// Don't render if user prefers reduced motion
	if (prefersReducedMotion) {
		return null;
	}

	// Detect if we're on a low-end device
	const isLowEndDevice = typeof navigator !== 'undefined' &&
		navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

	return (
		<div
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
		>
			<MatrixAnimation
				tileSize={isLowEndDevice ? 25 : 18}
				fadeFactor={0.05}
				color="#00F0FF"
			/>
		</div>
	);
}
