import React, { useState, useEffect } from 'react';
import TypedHeading from './TypedHeading';
import GlitchTransition from './GlitchTransition';
import { navigation } from '../data/navigation.js';

const menuOptions = navigation;

export default function TerminalMenu({ prefersReducedMotion = false, uiStrings = {} }) {
	// Detect if device is touch-based (mobile/tablet)
	const isTouchDevice = typeof window !== 'undefined' &&
		(('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

	// On touch devices, start with no selection (-1), on desktop start with first option (0)
	const [selectedIndex, setSelectedIndex] = useState(isTouchDevice ? -1 : 0);
	const [typingComplete, setTypingComplete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [userInput, setUserInput] = useState('');
	const [bootComplete, setBootComplete] = useState(true);
	const [glitchTrigger, setGlitchTrigger] = useState(false);
	const [pendingPath, setPendingPath] = useState(null);

	const renderProgressBar = (progress) => {
		const filled = Math.floor(progress / 10);
		const empty = 10 - filled;
		return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progress}%`;
	};

	const triggerGlitchEffect = () => {
		setGlitchTrigger(true);
		// Reset after glitch completes to allow re-triggering
		setTimeout(() => setGlitchTrigger(false), 600);
	};

	const startLoadingAnimation = (targetPath) => {
		if (prefersReducedMotion) {
			window.location.href = targetPath;
			return;
		}

		setIsLoading(true);
		let progress = 0;

		const interval = setInterval(() => {
			progress += 10;
			setLoadingProgress(progress);

			if (progress >= 100) {
				clearInterval(interval);
				setTimeout(() => {
					window.location.href = targetPath;
				}, 200);
			}
		}, 100);
	};

	const handleSelection = (index) => {
		if (isLoading || !typingComplete) return;

		// Start loading animation directly (glitch re-triggering is not reliable)
		startLoadingAnimation(menuOptions[index].path);
	};

	const handleTextInput = (char) => {
		const newInput = (userInput + char).toLowerCase();
		setUserInput(newInput);

		const match = menuOptions.find(opt =>
			opt.keywords.some(kw => kw.startsWith(newInput))
		);

		if (match && match.label.toLowerCase() === newInput) {
			const matchIndex = menuOptions.findIndex(opt => opt.id === match.id);
			handleSelection(matchIndex);
		}
	};

	useEffect(() => {
		if (!typingComplete || isLoading) return;

		const handleKeyDown = (e) => {
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
				setUserInput('');
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % menuOptions.length);
				setUserInput('');
			} else if (e.key === 'Enter') {
				e.preventDefault();
				handleSelection(selectedIndex);
			} else if (/^[1-3]$/.test(e.key)) {
				e.preventDefault();
				handleSelection(parseInt(e.key) - 1);
			} else if (/^[a-zA-Z]$/.test(e.key)) {
				handleTextInput(e.key);
			} else if (e.key === 'Escape') {
				setUserInput('');
			} else if (e.key === 'Backspace') {
				e.preventDefault();
				setUserInput(prev => prev.slice(0, -1));
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedIndex, typingComplete, isLoading, userInput]);

	useEffect(() => {
		const handleBootComplete = () => {
			setBootComplete(true);
		};

		window.addEventListener('bootComplete', handleBootComplete);

		if (sessionStorage.getItem('bootAnimationComplete') === 'true') {
			setBootComplete(true);
		}

		return () => {
			window.removeEventListener('bootComplete', handleBootComplete);
		};
	}, []);

	useEffect(() => {
		if (prefersReducedMotion) {
			setTypingComplete(true);
			setBootComplete(true);
		}
	}, [prefersReducedMotion]);

	if (!bootComplete) return null;

	return (
		<div className="terminal-window max-w-3xl mx-auto p-6" role="navigation" aria-label="Main navigation menu">
			{!typingComplete ? (
				<TypedHeading
					strings={[uiStrings.bootMessage || 'SYSTEM BOOT COMPLETE // WELCOME // SELECT OPERATION:']}
					typeSpeed={40}
					showCursor={true}
					loop={false}
					onComplete={() => {
						setTypingComplete(true);
						triggerGlitchEffect();
					}}
					prefersReducedMotion={prefersReducedMotion}
				/>
			) : (
				<GlitchTransition
					trigger={glitchTrigger}
					prefersReducedMotion={prefersReducedMotion}
					onComplete={() => {
						if (pendingPath) {
							// Selection glitch complete, now start loading animation
							startLoadingAnimation(pendingPath);
							setPendingPath(null);
						} else {
							// Initial glitch complete
							window.dispatchEvent(new CustomEvent('terminalMenuComplete'));
						}
					}}
				>
					<>
						<div className="text-neon-cyan mb-6 font-mono">
							{uiStrings.bootMessage || 'SYSTEM BOOT COMPLETE // WELCOME // SELECT AN OPERATION:'}
						</div>

						{!isLoading ? (
							<div className="space-y-2 font-mono" aria-live="polite">
								{menuOptions.map((option, index) => (
								<div
									key={option.id}
									className={`
										transition-all duration-200 cursor-pointer
										${selectedIndex === index ? 'text-neon-green phosphor-glow menu-item-selected' : 'text-neon-cyan'}
									`}
									role="menuitem"
									aria-selected={selectedIndex === index}
									onClick={() => handleSelection(index)}
									onMouseEnter={() => !isTouchDevice && setSelectedIndex(index)}
								>
									{selectedIndex === index && '> '}
									{option.id}. {option.label}
								</div>
							))}

							<div className="mt-4 text-neon-magenta">
								&gt; {userInput}<span className="terminal-cursor">_</span>
							</div>

							{/* <div className="mt-6 pt-8 text-neon-cyan/50 text-sm">
								Select an option
							</div> */}
							</div>
						) : (
							<div className="space-y-2 font-mono text-neon-green loading-bar" aria-live="assertive">
								<div>&gt; Executing: {menuOptions[selectedIndex]?.path}</div>
								<div className="phosphor-glow">
									{renderProgressBar(loadingProgress)}
								</div>
							</div>
						)}
					</>
				</GlitchTransition>
			)}
		</div>
	);
}
