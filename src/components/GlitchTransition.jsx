import { useEffect, useRef } from 'react';
import { useGlitch } from 'react-powerglitch';

export default function GlitchTransition({
	children,
	trigger = false,
	prefersReducedMotion = false,
	className = '',
	onComplete = () => {},
}) {
	// Use ref to store latest callback without causing effect re-runs
	const onCompleteRef = useRef(onComplete);

	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	const glitch = useGlitch({
		playMode: trigger ? 'always' : 'manual',
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

	const hoverFired = useRef(false);

	useEffect(() => {
		if (trigger || prefersReducedMotion) return;
		const el = glitch.ref.current;
		if (!el) return;

		function onMouseEnter() {
			if (hoverFired.current) return;
			hoverFired.current = true;
			glitch.startGlitch();
		}

		el.addEventListener('mouseenter', onMouseEnter);
		return () => el.removeEventListener('mouseenter', onMouseEnter);
	}, [trigger, prefersReducedMotion, glitch]);

	useEffect(() => {
		if (trigger && !prefersReducedMotion) {
			const timer = setTimeout(() => {
				onCompleteRef.current();
			}, 500);
			return () => clearTimeout(timer);
		} else if (prefersReducedMotion && trigger) {
			onCompleteRef.current();
		}
	}, [trigger, prefersReducedMotion]);

	if (prefersReducedMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<div ref={glitch.ref} className={className}>
			{children}
		</div>
	);
}
