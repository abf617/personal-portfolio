import React, { useState, useEffect, useRef } from 'react';

/**
 * Terminal info display component
 * Shows system info inline on large screens, tooltip on smaller screens
 * Cyberpunk/hacker aesthetic with real-time data
 */
export default function TerminalInfo() {
	const [ipAddress, setIpAddress] = useState('...');
	const [isHovered, setIsHovered] = useState(false);
	const [os, setOs] = useState('...');
	const [browser, setBrowser] = useState('...');

	// Use refs to update time without re-renders
	const timeRef = useRef(null);
	const timeRefMobile = useRef(null);

	// Fetch user's public IP address with timeout and validation
	useEffect(() => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		fetch('https://api.ipify.org?format=json', {
			signal: controller.signal
		})
			.then(res => res.json())
			.then(data => {
				clearTimeout(timeoutId);
				// Validate IP format (simple IPv4 check)
				if (data.ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(data.ip)) {
					setIpAddress(data.ip);
				} else {
					setIpAddress('INVALID');
				}
			})
			.catch((error) => {
				clearTimeout(timeoutId);
				if (error.name === 'AbortError') {
					setIpAddress('TIMEOUT');
				} else {
					setIpAddress('UNAVAILABLE');
				}
			});

		return () => {
			clearTimeout(timeoutId);
			controller.abort();
		};
	}, []);

	// Update time every second using direct DOM manipulation to avoid re-renders
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			const seconds = String(now.getSeconds()).padStart(2, '0');
			const timeString = `${hours}:${minutes}:${seconds}`;

			// Update both refs directly without triggering re-render
			if (timeRef.current) {
				timeRef.current.textContent = timeString;
			}
			if (timeRefMobile.current) {
				timeRefMobile.current.textContent = timeString;
			}
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	// Detect OS and browser on client side only
	useEffect(() => {
		const ua = navigator.userAgent;

		// Detect OS
		if (ua.includes('Win')) setOs('Win');
		else if (ua.includes('Mac')) setOs('Mac');
		else if (ua.includes('Linux')) setOs('Linux');
		else if (ua.includes('Android')) setOs('Android');
		else if (ua.includes('iOS')) setOs('iOS');
		else setOs('Unknown');

		// Detect Browser
		if (ua.includes('Firefox')) setBrowser('Firefox');
		else if (ua.includes('Chrome')) setBrowser('Chrome');
		else if (ua.includes('Safari')) setBrowser('Safari');
		else if (ua.includes('Edge')) setBrowser('Edge');
		else setBrowser('Unknown');
	}, []);

	return (
		<div
			className="relative flex items-center gap-4 font-mono text-sm"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onFocus={() => setIsHovered(true)}
			onBlur={() => setIsHovered(false)}
			tabIndex={0}
			role="button"
			aria-label="System information"
			aria-expanded={isHovered}
		>
			{/* Terminal Prompt */}
			<div className="font-display text-2xl font-bold text-neon-cyan phosphor-glow cursor-pointer">
				<span className="text-neon-magenta">&gt;</span>
				<span className="terminal-cursor">_</span>
			</div>

			{/* System Info - Inline on xl+ screens, tooltip on smaller */}
			<div className="hidden xl:flex items-center gap-3 text-neon-green">
				{/* IP */}
				<span className="text-neon-cyan">[</span>
				<span className="text-neon-magenta">IP:</span>
				<span>{ipAddress}</span>
				<span className="text-neon-cyan">]</span>

				{/* Time */}
				<span className="text-neon-cyan">[</span>
				<span className="text-neon-magenta">TIME:</span>
				<span ref={timeRef} className="tabular-nums">--:--:--</span>
				<span className="text-neon-cyan">]</span>

				{/* OS */}
				<span className="text-neon-cyan">[</span>
				<span className="text-neon-magenta">OS:</span>
				<span>{os}</span>
				<span className="text-neon-cyan">]</span>

				{/* Browser */}
				<span className="text-neon-cyan">[</span>
				<span className="text-neon-magenta">BR:</span>
				<span>{browser}</span>
				<span className="text-neon-cyan">]</span>
			</div>

			{/* Tooltip for smaller screens */}
			{isHovered && (
				<div className="xl:hidden absolute top-full left-0 mt-2 z-50 terminal-window p-4 min-w-[300px] font-mono text-sm text-neon-green animate-fade-in">
					<div className="space-y-1">
						<div className="text-neon-cyan border-b border-neon-cyan/30 pb-1 mb-2">
							&gt; system.info
						</div>
						<div>
							<span className="text-neon-magenta">IP:</span> {ipAddress}
						</div>
						<div>
							<span className="text-neon-magenta">OS:</span> {os}
						</div>
						<div>
							<span className="text-neon-magenta">BR:</span> {browser}
						</div>
						<div>
							<span className="text-neon-magenta">TIME:</span> <span ref={timeRefMobile}>--:--:--</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
