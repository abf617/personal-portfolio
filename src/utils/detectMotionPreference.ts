/**
 * Detects if the user prefers reduced motion based on OS/browser settings
 * Server-side: defaults to safe (reduced motion)
 * Client-side: reads from window.matchMedia
 */
export function getPrefersReducedMotion(): boolean {
	// Server-side rendering: default to safe (reduced motion)
	if (typeof window === 'undefined') {
		return true;
	}

	// Client-side: check media query
	const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	return mediaQuery.matches;
}

/**
 * React hook for detecting reduced motion preference
 * Updates when system preference changes
 */
export function usePrefersReducedMotion(): boolean {
	if (typeof window === 'undefined') {
		return true;
	}

	const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
		getPrefersReducedMotion()
	);

	React.useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const handleChange = () => {
			setPrefersReducedMotion(mediaQuery.matches);
		};

		// Listen for changes
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	}, []);

	return prefersReducedMotion;
}

// For environments where React isn't available, export standalone version
declare const React: any;
