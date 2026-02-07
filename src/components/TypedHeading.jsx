import { useEffect, useRef } from 'react';
import Typed from 'typed.js';

export default function TypedHeading({
	strings,
	typeSpeed = 50,
	backSpeed = 30,
	loop = true,
	showCursor = true,
	cursorChar = '▮',
	className = '',
	prefersReducedMotion = false,
	onComplete,
}) {
	const el = useRef(null);
	const typed = useRef(null);

	useEffect(() => {
		if (prefersReducedMotion) {
			if (el.current) {
				el.current.textContent = strings[0];
				onComplete?.();
			}
			return;
		}

		if (el.current) {
			typed.current = new Typed(el.current, {
				strings,
				typeSpeed,
				backSpeed,
				loop,
				showCursor,
				cursorChar,
				contentType: 'text',
				onComplete: () => {
					onComplete?.();
				},
			});
		}

		return () => {
			if (typed.current) {
				typed.current.destroy();
			}
		};
	}, [strings, typeSpeed, backSpeed, loop, showCursor, cursorChar, prefersReducedMotion, onComplete]);

	return (
		<span
			ref={el}
			className={`phosphor-glow text-neon-cyan ${className}`}
		/>
	);
}
