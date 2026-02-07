/**
 * Custom hook to generate consistent glitch effect configuration
 * Centralizes glitch settings used across GlitchTransition and BootAnimation
 *
 * @param {Object} options - Configuration options
 * @param {number} options.duration - Animation duration in ms (default: 500)
 * @param {number} options.velocity - Shake and slice velocity (default: 15)
 * @param {number} options.amplitude - Shake amplitude (default: 0.1)
 * @param {number} options.sliceCount - Number of glitch slices (default: 6)
 * @returns {Object} Glitch configuration object for react-powerglitch
 */
export function useGlitchConfig(options = {}) {
	const {
		duration = 500,
		velocity = 15,
		amplitude = 0.1,
		sliceCount = 6,
	} = options;

	return {
		playMode: 'always',
		createContainers: true,
		hideOverflow: false,
		timing: {
			duration,
			iterations: 1,
		},
		glitchTimeSpan: {
			start: 0,
			end: 1,
		},
		shake: {
			velocity,
			amplitudeX: amplitude,
			amplitudeY: amplitude,
		},
		slice: {
			count: sliceCount,
			velocity,
			minHeight: 0.02,
			maxHeight: 0.15,
			hueRotate: true,
		},
	};
}
