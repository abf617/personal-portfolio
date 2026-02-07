import { useEffect } from 'react';
import { useGlitch } from 'react-powerglitch';

export default function GlitchTransition({
	children,
	trigger = false,
	prefersReducedMotion = false,
	className = '',
	onComplete = () => {},
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

	useEffect(() => {
		if (trigger && !prefersReducedMotion) {
			const timer = setTimeout(() => {
				onComplete();
			}, 500);
			return () => clearTimeout(timer);
		} else if (prefersReducedMotion && trigger) {
			onComplete();
		}
	}, [trigger, prefersReducedMotion, onComplete]);

	if (prefersReducedMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<div ref={glitch.ref} className={className}>
			{children}
		</div>
	);
}
