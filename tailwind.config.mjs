/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'neon-cyan': '#00F0FF',
				'neon-magenta': '#FF006E',
				'neon-green': '#39FF14',
				'terminal-black': '#0a0a0a',
				'terminal-gray': '#1a1a1a',
			},
			fontFamily: {
				mono: ['"Space Mono"', 'monospace'],
				display: ['Orbitron', 'sans-serif'],
			},
			boxShadow: {
				'neon-cyan': '0 0 10px #00F0FF, 0 0 20px #00F0FF, 0 0 30px #00F0FF',
				'neon-magenta': '0 0 10px #FF006E, 0 0 20px #FF006E, 0 0 30px #FF006E',
				'neon-green': '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
			},
			textShadow: {
				'neon-cyan': '0 0 10px #00F0FF, 0 0 20px #00F0FF, 0 0 30px #00F0FF',
				'neon-magenta': '0 0 10px #FF006E, 0 0 20px #FF006E, 0 0 30px #FF006E',
				'neon-green': '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
			},
		},
	},
	plugins: [
		function ({ matchUtilities, theme }) {
			matchUtilities(
				{
					'text-shadow': (value) => ({
						textShadow: value,
					}),
				},
				{ values: theme('textShadow') }
			);
		},
	],
};
