// Ultra Premium Tower Defense - Interactive Tutorial System
// Hand-holding onboarding for new players

class TutorialSystem {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.completed = localStorage.getItem('tutorialCompleted') === 'true';
        this.skipped = false;

        // Tutorial steps with actions and validations
        this.steps = [
            {
                id: 'welcome',
                title: 'Welcome Commander!',
                message: 'Enemies are approaching! Let\'s learn how to defend your base.',
                action: 'none',
                highlight: null,
                arrow: null,
                validation: () => true,
                reward: { gems: 10 }
            },
            {
                id: 'show_path',
                title: 'Enemy Path',
                message: 'Enemies follow the glowing path to reach your base. Stop them!',
                action: 'highlight_path',
                highlight: 'path',
                arrow: { x: 400, y: 300, rotation: 45 },
                validation: () => true,
                waitTime: 3000
            },
            {
                id: 'show_money',
                title: 'Your Resources',
                message: 'This is your money. You need it to build towers.',
                action: 'highlight_ui',
                highlight: 'money',
                arrow: { x: 100, y: 50, rotation: -45 },
                validation: () => true,
                waitTime: 2000
            },
            {
                id: 'open_tower_menu',
                title: 'Build a Tower',
                message: 'Click on the tower button to see available towers.',
                action: 'highlight_button',
                highlight: 'tower-btn',
                arrow: { x: 150, y: 100, rotation: 90 },
                validation: () => document.getElementById('selectedTower')?.value !== '',
                forceAction: true
            },
            {
                id: 'select_tower',
                title: 'Choose Pulse Cannon',
                message: 'Select the Pulse Cannon - it\'s perfect for beginners!',
                action: 'highlight_tower_option',
                highlight: 'tower-pulse',
                arrow: { x: 200, y: 150, rotation: 0 },
                validation: () => document.getElementById('selectedTower')?.value === 'pulse',
                giveFreeTower: 'pulse'
            },
            {
                id: 'place_tower',
                title: 'Place Your Tower',
                message: 'Click here to place your first tower. Choose a spot near the path!',
                action: 'highlight_placement',
                highlight: { x: 400, y: 300, radius: 50 },
                arrow: { x: 400, y: 250, rotation: 90 },
                validation: () => window.towers?.length > 0,
                showPlacementGuide: true,
                placementSpots: [
                    { x: 400, y: 300 },
                    { x: 500, y: 300 },
                    { x: 350, y: 350 }
                ]
            },
            {
                id: 'start_wave',
                title: 'Start the Battle!',
                message: 'Great! Now click "Start Wave" to send the enemies.',
                action: 'highlight_start_button',
                highlight: 'start-wave-btn',
                arrow: { x: 300, y: 50, rotation: -90 },
                validation: () => window.currentWave > 0,
                forceWaveStart: true
            },
            {
                id: 'watch_combat',
                title: 'Watch Your Tower Fight!',
                message: 'Your tower will automatically attack enemies in range.',
                action: 'observe',
                highlight: null,
                arrow: null,
                validation: () => window.enemies?.some(e => e.health < e.maxHealth),
                waitTime: 5000
            },
            {
                id: 'earn_money',
                title: 'Earn Money',
                message: 'You earn money for each enemy defeated. Use it to build more towers!',
                action: 'highlight_money_gain',
                highlight: 'money',
                arrow: { x: 100, y: 50, rotation: -45 },
                validation: () => window.money > 400,
                waitTime: 3000
            },
            {
                id: 'upgrade_tower',
                title: 'Upgrade Your Tower',
                message: 'Click on your tower and then click "Upgrade" to make it stronger!',
                action: 'highlight_upgrade',
                highlight: 'upgrade-btn',
                arrow: { x: 450, y: 350, rotation: 45 },
                validation: () => window.towers?.some(t => t.level > 1),
                giveFreeMoney: 200
            },
            {
                id: 'complete',
                title: 'Tutorial Complete!',
                message: 'Excellent work Commander! Here\'s a reward for completing the tutorial.',
                action: 'complete',
                highlight: null,
                arrow: null,
                validation: () => true,
                reward: { gems: 50, money: 1000 },
                showConfetti: true
            }
        ];

        // Visual elements
        this.overlay = null;
        this.messageBox = null;
        this.arrow = null;
        this.highlight = null;

        // Tutorial state
        this.isWaitingForAction = false;
        this.stepStartTime = 0;
    }

    // Start tutorial for new players
    start(forceRestart = false) {
        if (this.completed && !forceRestart) {
            return false;
        }

        this.isActive = true;
        this.currentStep = 0;
        this.skipped = false;

        // Track tutorial start
        if (window.analytics) {
            window.analytics.track('tutorial_started', {});
        }

        // Create tutorial overlay
        this.createOverlay();

        // Start first step
        this.showStep(0);

        // Pause normal game
        if (window.gameRunning) {
            window.gamePaused = true;
        }

        return true;
    }

    // Create tutorial UI overlay
    createOverlay() {
        // Main overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9000;
        `;

        // Message box
        this.messageBox = document.createElement('div');
        this.messageBox.id = 'tutorial-message';
        this.messageBox.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            pointer-events: auto;
            animation: slideDown 0.5s ease-out;
        `;

        // Skip button
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip Tutorial';
        skipButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 5px 15px;
            border-radius: 15px;
            cursor: pointer;
            font-size: 12px;
        `;
        skipButton.onclick = () => this.skip();

        // Arrow pointer
        this.arrow = document.createElement('div');
        this.arrow.id = 'tutorial-arrow';
        this.arrow.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            border-left: 30px solid transparent;
            border-right: 30px solid transparent;
            border-top: 40px solid #FFD700;
            filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
            animation: bounce 1s ease-in-out infinite;
            pointer-events: none;
            display: none;
        `;

        // Highlight circle
        this.highlight = document.createElement('div');
        this.highlight.id = 'tutorial-highlight';
        this.highlight.style.cssText = `
            position: absolute;
            border: 3px solid #FFD700;
            border-radius: 50%;
            box-shadow: 0 0 20px #FFD700, inset 0 0 20px #FFD700;
            animation: pulse 2s ease-in-out infinite;
            pointer-events: none;
            display: none;
        `;

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
            }
            .tutorial-glow {
                box-shadow: 0 0 30px #FFD700, 0 0 60px #FFD700 !important;
                animation: pulse 2s ease-in-out infinite !important;
            }
            .tutorial-dim {
                opacity: 0.3 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        // Assemble overlay
        this.overlay.appendChild(this.messageBox);
        this.overlay.appendChild(skipButton);
        this.overlay.appendChild(this.arrow);
        this.overlay.appendChild(this.highlight);
        document.body.appendChild(this.overlay);
    }

    // Show specific tutorial step
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;
        this.stepStartTime = Date.now();
        this.isWaitingForAction = true;

        // Track step
        if (window.analytics) {
            window.analytics.trackTutorialStep(step.id, false);
        }

        // Update message
        this.messageBox.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 20px;">${step.title}</h3>
            <p style="margin: 0; font-size: 16px;">${step.message}</p>
            <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; opacity: 0.8;">Step ${stepIndex + 1} of ${this.steps.length}</span>
                ${step.forceAction ? '' : '<button id="tutorial-next" style="background: white; color: #667eea; border: none; padding: 8px 20px; border-radius: 10px; font-weight: bold; cursor: pointer;">Continue</button>'}
            </div>
        `;

        // Add continue button handler
        const nextBtn = document.getElementById('tutorial-next');
        if (nextBtn) {
            nextBtn.onclick = () => this.validateAndProceed();
        }

        // Apply step-specific actions
        this.applyStepAction(step);

        // Auto-advance for observation steps
        if (step.waitTime) {
            setTimeout(() => {
                if (this.isActive && this.currentStep === stepIndex) {
                    this.validateAndProceed();
                }
            }, step.waitTime);
        }

        // Check for completion periodically
        if (step.validation !== (() => true)) {
            this.validationInterval = setInterval(() => {
                if (step.validation()) {
                    this.validateAndProceed();
                }
            }, 500);
        }
    }

    // Apply visual actions for current step
    applyStepAction(step) {
        // Clear previous highlights
        document.querySelectorAll('.tutorial-glow').forEach(el => {
            el.classList.remove('tutorial-glow');
        });
        document.querySelectorAll('.tutorial-dim').forEach(el => {
            el.classList.remove('tutorial-dim');
        });

        // Hide arrow and highlight by default
        this.arrow.style.display = 'none';
        this.highlight.style.display = 'none';

        // Apply new action
        switch(step.action) {
            case 'highlight_path':
                // Highlight the enemy path on canvas
                if (window.canvas) {
                    this.highlightPath();
                }
                break;

            case 'highlight_ui':
            case 'highlight_button':
                // Highlight UI element
                if (step.highlight) {
                    const element = document.getElementById(step.highlight);
                    if (element) {
                        element.classList.add('tutorial-glow');
                        this.dimOtherElements(element);
                    }
                }
                break;

            case 'highlight_placement':
                // Show placement spots
                if (step.showPlacementGuide) {
                    this.showPlacementGuides(step.placementSpots);
                }
                break;

            case 'highlight_tower_option':
                // Give free tower if specified
                if (step.giveFreeTower) {
                    window.freeTowerType = step.giveFreeTower;
                    window.money += 1000; // Temporary money
                }
                break;

            case 'highlight_upgrade':
                // Give free money for upgrade
                if (step.giveFreeMoney) {
                    window.money += step.giveFreeMoney;
                    if (window.updateUI) window.updateUI();
                }
                break;

            case 'complete':
                // Show completion effects
                if (step.showConfetti) {
                    this.showConfetti();
                }
                break;
        }

        // Show arrow if specified
        if (step.arrow) {
            this.arrow.style.display = 'block';
            this.arrow.style.left = step.arrow.x + 'px';
            this.arrow.style.top = step.arrow.y + 'px';
            this.arrow.style.transform = `rotate(${step.arrow.rotation}deg)`;
        }

        // Show highlight circle if specified
        if (step.highlight && typeof step.highlight === 'object') {
            this.highlight.style.display = 'block';
            this.highlight.style.left = (step.highlight.x - step.highlight.radius) + 'px';
            this.highlight.style.top = (step.highlight.y - step.highlight.radius) + 'px';
            this.highlight.style.width = (step.highlight.radius * 2) + 'px';
            this.highlight.style.height = (step.highlight.radius * 2) + 'px';
        }
    }

    // Dim other UI elements
    dimOtherElements(exceptElement) {
        const allElements = document.querySelectorAll('button, select, .tower-option');
        allElements.forEach(el => {
            if (el !== exceptElement && !el.contains(exceptElement)) {
                el.classList.add('tutorial-dim');
            }
        });
    }

    // Show placement guide circles
    showPlacementGuides(spots) {
        spots.forEach(spot => {
            const guide = document.createElement('div');
            guide.className = 'placement-guide';
            guide.style.cssText = `
                position: absolute;
                left: ${spot.x - 30}px;
                top: ${spot.y - 30}px;
                width: 60px;
                height: 60px;
                border: 3px dashed #00FF00;
                border-radius: 50%;
                animation: pulse 2s ease-in-out infinite;
                pointer-events: none;
                z-index: 8999;
            `;
            this.overlay.appendChild(guide);
        });
    }

    // Validate current step and proceed
    validateAndProceed() {
        const step = this.steps[this.currentStep];

        // Clear validation interval
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }

        // Check validation
        if (!step.validation()) {
            // Show hint
            this.showHint('Complete the action to continue!');
            return false;
        }

        // Track completion
        if (window.analytics) {
            window.analytics.trackTutorialStep(step.id, true);
        }

        // Give rewards if any
        if (step.reward) {
            this.giveReward(step.reward);
        }

        // Clear placement guides
        document.querySelectorAll('.placement-guide').forEach(el => el.remove());

        // Move to next step
        this.showStep(this.currentStep + 1);
        return true;
    }

    // Show hint message
    showHint(message) {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff6b6b;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            z-index: 10000;
            animation: shake 0.5s;
        `;
        hint.textContent = message;
        document.body.appendChild(hint);

        setTimeout(() => hint.remove(), 3000);
    }

    // Give reward to player
    giveReward(reward) {
        if (reward.gems && window.monetization) {
            window.monetization.addGems(reward.gems, 'tutorial_reward');
        }
        if (reward.money) {
            window.money = (window.money || 0) + reward.money;
            if (window.updateUI) window.updateUI();
        }

        // Show reward popup
        this.showRewardPopup(reward);
    }

    // Show reward popup
    showRewardPopup(reward) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #333;
            padding: 30px;
            border-radius: 20px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10001;
            animation: bounceIn 0.5s;
        `;
        popup.innerHTML = `
            <div>🎁 Reward Earned!</div>
            ${reward.gems ? `<div>💎 ${reward.gems} Gems</div>` : ''}
            ${reward.money ? `<div>💰 $${reward.money}</div>` : ''}
        `;
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 3000);
    }

    // Show confetti animation
    showConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                top: -20px;
                width: 10px;
                height: 10px;
                background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][Math.floor(Math.random() * 5)]};
                animation: fall ${3 + Math.random() * 2}s linear;
                z-index: 10000;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }

        // Add falling animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fall {
                to { transform: translateY(100vh) rotate(360deg); }
            }
            @keyframes bounceIn {
                0% { transform: translate(-50%, -50%) scale(0); }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(-50%) translateX(0); }
                25% { transform: translateX(-50%) translateX(-10px); }
                75% { transform: translateX(-50%) translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Skip tutorial
    skip() {
        if (!confirm('Are you sure you want to skip the tutorial? You\'ll miss out on free gems!')) {
            return;
        }

        this.skipped = true;
        this.isActive = false;

        // Track skip
        if (window.analytics) {
            window.analytics.track('tutorial_skipped', {
                step: this.steps[this.currentStep].id
            });
        }

        this.cleanup();
    }

    // Complete tutorial
    complete() {
        this.completed = true;
        this.isActive = false;
        localStorage.setItem('tutorialCompleted', 'true');

        // Track completion
        if (window.analytics) {
            window.analytics.track('tutorial_completed', {});
            window.analytics.metrics.tutorialCompleted = true;
        }

        // Give completion bonus
        if (window.monetization) {
            window.monetization.addGems(100, 'tutorial_complete_bonus');
        }

        // Show completion message
        const completion = document.createElement('div');
        completion.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            z-index: 10001;
            animation: bounceIn 0.5s;
        `;
        completion.innerHTML = `
            <h2 style="margin: 0 0 20px 0;">🎉 Tutorial Complete!</h2>
            <p style="font-size: 18px; margin-bottom: 20px;">You\'re ready to defend the realm!</p>
            <div style="font-size: 24px; margin-bottom: 20px;">
                <div>💎 100 Bonus Gems</div>
                <div>🏆 Achievement Unlocked</div>
            </div>
            <button onclick="this.parentElement.remove(); window.tutorial.cleanup();" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
            ">Start Playing!</button>
        `;
        document.body.appendChild(completion);
    }

    // Clean up tutorial elements
    cleanup() {
        // Remove overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        // Clear intervals
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
        }

        // Remove tutorial classes
        document.querySelectorAll('.tutorial-glow').forEach(el => {
            el.classList.remove('tutorial-glow');
        });
        document.querySelectorAll('.tutorial-dim').forEach(el => {
            el.classList.remove('tutorial-dim');
        });

        // Resume game
        if (window.gamePaused) {
            window.gamePaused = false;
        }

        // Reset tutorial state
        this.isActive = false;
        this.currentStep = 0;
    }

    // Check if tutorial should auto-start
    shouldAutoStart() {
        return !this.completed && !this.skipped && window.analytics?.metrics.sessionCount <= 1;
    }
}

// Initialize tutorial system
window.tutorial = new TutorialSystem();

// Auto-start for new players
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.tutorial && window.tutorial.shouldAutoStart()) {
            window.tutorial.start();
        }
    }, 2000); // Wait for game to initialize
});

// Export for use in game
window.TutorialSystem = TutorialSystem;