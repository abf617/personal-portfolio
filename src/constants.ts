/**
 * Application-wide constants
 * Centralizes magic numbers for consistency and maintainability
 */

// Animation durations and timing
export const ANIMATION = {
	GLITCH_DURATION_MS: 600,
	LOADING_INTERVAL_MS: 100,
	LOADING_INCREMENT: 10,
	BOOT_DURATION_MS: 1500,
	TIMEOUT_SHORT_MS: 500,
	TIMEOUT_MEDIUM_MS: 1000,
	TIMEOUT_LONG_MS: 5000,
	NAVIGATION_DELAY_MS: 200,
} as const;

// Matrix background settings
export const MATRIX = {
	FONT_SIZE: 14,
	FADE_OPACITY: 0.05,
	DROP_PROBABILITY: 0.975,
	INTERVAL_MS: 50,
} as const;

// Progress bar configuration
export const PROGRESS = {
	SEGMENTS: 10,
	MAX: 100,
	MIN: 0,
} as const;

// Session storage keys
export const STORAGE_KEYS = {
	BOOT_ANIMATION_COMPLETE: 'bootAnimationComplete',
	BOOT_ANIMATION_SEEN: 'bootAnimationSeen',
} as const;

// URL query parameters
export const QUERY_PARAMS = {
	SKIP_BOOT: 'skipBoot',
} as const;

// Time update intervals
export const TIME = {
	CLOCK_UPDATE_MS: 1000,
	IP_FETCH_TIMEOUT_MS: 5000,
} as const;
