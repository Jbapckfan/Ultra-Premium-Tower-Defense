// Ultra Premium Tower Defense - Analytics & Tracking System
// Comprehensive player behavior tracking for optimization

class AnalyticsSystem {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.events = [];
        this.userId = this.getUserId();

        // Key metrics to track
        this.metrics = {
            sessionCount: this.getStoredMetric('sessionCount', 0) + 1,
            totalPlayTime: this.getStoredMetric('totalPlayTime', 0),
            totalSpent: this.getStoredMetric('totalSpent', 0),
            highestWave: this.getStoredMetric('highestWave', 1),
            towersPlaced: this.getStoredMetric('towersPlaced', 0),
            enemiesKilled: this.getStoredMetric('enemiesKilled', 0),
            gemsEarned: this.getStoredMetric('gemsEarned', 0),
            gemsSpent: this.getStoredMetric('gemsSpent', 0),
            adsWatched: this.getStoredMetric('adsWatched', 0),
            tutorialCompleted: this.getStoredMetric('tutorialCompleted', false),
            firstPurchaseDate: this.getStoredMetric('firstPurchaseDate', null),
            lastActiveDate: Date.now()
        };

        // Funnel tracking
        this.funnelStages = {
            gameStarted: false,
            tutorialStarted: false,
            tutorialCompleted: false,
            firstTowerPlaced: false,
            firstWaveCompleted: false,
            firstUpgrade: false,
            shopOpened: false,
            firstPurchase: false,
            day1Retention: false,
            day7Retention: false,
            day30Retention: false
        };

        // A/B Testing
        this.experiments = {
            startingGems: this.getABTestGroup('startingGems', ['50', '100', '25']),
            tutorialStyle: this.getABTestGroup('tutorialStyle', ['interactive', 'passive', 'video']),
            firstPurchaseDiscount: this.getABTestGroup('firstPurchaseDiscount', ['none', '50%', '75%']),
            energyRegenTime: this.getABTestGroup('energyRegenTime', ['30min', '20min', '45min']),
            lootBoxOdds: this.getABTestGroup('lootBoxOdds', ['standard', 'generous', 'strict'])
        };

        // Performance tracking
        this.performance = {
            fps: [],
            loadTime: 0,
            crashCount: 0,
            errorCount: 0,
            memoryWarnings: 0
        };

        // Initialize tracking
        this.initializeTracking();
        this.startHeartbeat();

        // Save metrics periodically
        setInterval(() => this.saveMetrics(), 30000); // Every 30 seconds
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    getStoredMetric(key, defaultValue) {
        const stored = localStorage.getItem('metric_' + key);
        if (stored === null) return defaultValue;
        if (defaultValue === false || defaultValue === true) {
            return stored === 'true';
        }
        if (typeof defaultValue === 'number') {
            return parseInt(stored) || 0;
        }
        return stored;
    }

    saveMetrics() {
        Object.keys(this.metrics).forEach(key => {
            localStorage.setItem('metric_' + key, this.metrics[key]);
        });
    }

    getABTestGroup(experiment, options) {
        let group = localStorage.getItem('abtest_' + experiment);
        if (!group) {
            // Assign random group
            group = options[Math.floor(Math.random() * options.length)];
            localStorage.setItem('abtest_' + experiment, group);

            // Track assignment
            this.track('ab_test_assigned', {
                experiment: experiment,
                group: group
            });
        }
        return group;
    }

    // Core tracking function
    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties: {
                ...properties,
                userId: this.userId,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                sessionTime: Date.now() - this.sessionStartTime,
                platform: this.getPlatform(),
                version: '2.0.0'
            }
        };

        // Add to event queue
        this.events.push(event);

        // Log to console in development
        if (window.DEBUG_ANALYTICS) {
            console.log('📊 Analytics:', eventName, properties);
        }

        // Update funnel if applicable
        this.updateFunnel(eventName);

        // Send to backend (batched)
        this.queueEventForSending(event);

        // Update metrics
        this.updateMetrics(eventName, properties);

        return event;
    }

    updateFunnel(eventName) {
        const funnelMap = {
            'game_started': 'gameStarted',
            'tutorial_started': 'tutorialStarted',
            'tutorial_completed': 'tutorialCompleted',
            'tower_placed': 'firstTowerPlaced',
            'wave_completed': 'firstWaveCompleted',
            'tower_upgraded': 'firstUpgrade',
            'shop_opened': 'shopOpened',
            'iap_purchase': 'firstPurchase'
        };

        if (funnelMap[eventName] && !this.funnelStages[funnelMap[eventName]]) {
            this.funnelStages[funnelMap[eventName]] = true;
            this.track('funnel_stage_completed', {
                stage: funnelMap[eventName],
                time: Date.now() - this.sessionStartTime
            });
        }
    }

    updateMetrics(eventName, properties) {
        switch(eventName) {
            case 'tower_placed':
                this.metrics.towersPlaced++;
                break;
            case 'enemy_killed':
                this.metrics.enemiesKilled++;
                break;
            case 'gems_earned':
                this.metrics.gemsEarned += properties.amount || 0;
                break;
            case 'gems_spent':
                this.metrics.gemsSpent += properties.amount || 0;
                break;
            case 'ad_watched':
                this.metrics.adsWatched++;
                break;
            case 'wave_completed':
                if (properties.wave > this.metrics.highestWave) {
                    this.metrics.highestWave = properties.wave;
                }
                break;
            case 'iap_purchase':
                this.metrics.totalSpent += properties.price || 0;
                if (!this.metrics.firstPurchaseDate) {
                    this.metrics.firstPurchaseDate = Date.now();
                }
                break;
        }
    }

    // Player segmentation
    getPlayerSegment() {
        const daysSinceInstall = (Date.now() - this.metrics.firstSessionTime) / (1000 * 60 * 60 * 24);
        const spent = this.metrics.totalSpent;
        const sessions = this.metrics.sessionCount;

        if (spent > 100) return 'whale';
        if (spent > 20) return 'dolphin';
        if (spent > 0) return 'minnow';
        if (sessions > 20 && daysSinceInstall > 7) return 'engaged_non_payer';
        if (daysSinceInstall <= 1) return 'new_player';
        if (sessions < 5) return 'at_risk';
        return 'regular';
    }

    // Retention tracking
    checkRetention() {
        const installDate = this.metrics.firstSessionTime;
        const now = Date.now();
        const daysSince = (now - installDate) / (1000 * 60 * 60 * 24);

        if (daysSince >= 1 && !this.funnelStages.day1Retention) {
            this.funnelStages.day1Retention = true;
            this.track('retention_day1', {});
        }
        if (daysSince >= 7 && !this.funnelStages.day7Retention) {
            this.funnelStages.day7Retention = true;
            this.track('retention_day7', {});
        }
        if (daysSince >= 30 && !this.funnelStages.day30Retention) {
            this.funnelStages.day30Retention = true;
            this.track('retention_day30', {});
        }
    }

    // Performance monitoring
    trackFPS(fps) {
        this.performance.fps.push(fps);
        if (this.performance.fps.length > 100) {
            this.performance.fps.shift();
        }

        // Alert on poor performance
        const avgFPS = this.performance.fps.reduce((a, b) => a + b, 0) / this.performance.fps.length;
        if (avgFPS < 30 && this.performance.fps.length > 50) {
            this.track('performance_issue', {
                type: 'low_fps',
                average_fps: avgFPS
            });
        }
    }

    trackError(error, context) {
        this.performance.errorCount++;
        this.track('error_occurred', {
            error: error.toString(),
            stack: error.stack,
            context: context
        });
    }

    // Heatmap tracking for tower placement
    trackTowerPlacement(x, y, towerType) {
        this.track('tower_placed', {
            x: x,
            y: y,
            type: towerType,
            wave: window.currentWave || 1,
            money: window.money || 0
        });
    }

    trackEnemyDeath(x, y, enemyType, killedBy) {
        this.track('enemy_killed', {
            x: x,
            y: y,
            type: enemyType,
            killed_by: killedBy,
            wave: window.currentWave || 1
        });
    }

    // Session tracking
    startHeartbeat() {
        // Send heartbeat every minute
        setInterval(() => {
            this.track('heartbeat', {
                session_duration: Date.now() - this.sessionStartTime,
                current_wave: window.currentWave || 1,
                current_money: window.money || 0,
                current_gems: window.monetization?.gems || 0
            });

            // Update total play time
            this.metrics.totalPlayTime += 60000; // Add 1 minute
        }, 60000);
    }

    // Batch send events
    queueEventForSending(event) {
        // In production, this would send to your analytics backend
        // For now, we'll store in localStorage and simulate sending

        const queue = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
        queue.push(event);
        localStorage.setItem('analytics_queue', JSON.stringify(queue));

        // Send batch if queue is large enough
        if (queue.length >= 20) {
            this.sendEventBatch(queue);
            localStorage.setItem('analytics_queue', '[]');
        }
    }

    sendEventBatch(events) {
        // Simulate sending to backend
        if (window.ANALYTICS_ENDPOINT) {
            fetch(window.ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: events })
            }).catch(err => {
                console.error('Analytics send failed:', err);
            });
        }
    }

    // Utility functions
    getPlatform() {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
        if (/Android/.test(ua)) return 'android';
        if (/Mac/.test(ua)) return 'macos';
        if (/Windows/.test(ua)) return 'windows';
        return 'web';
    }

    // Initialize tracking hooks
    initializeTracking() {
        // Track session start
        this.track('session_started', {
            segment: this.getPlayerSegment(),
            experiments: this.experiments
        });

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('app_backgrounded', {});
            } else {
                this.track('app_foregrounded', {});
            }
        });

        // Track window close
        window.addEventListener('beforeunload', () => {
            this.track('session_ended', {
                duration: Date.now() - this.sessionStartTime
            });
            this.saveMetrics();
        });

        // Check retention
        this.checkRetention();
    }

    // Get analytics summary for dashboard
    getSummary() {
        return {
            userId: this.userId,
            sessionId: this.sessionId,
            segment: this.getPlayerSegment(),
            metrics: this.metrics,
            funnel: this.funnelStages,
            experiments: this.experiments,
            performance: {
                avgFPS: this.performance.fps.length > 0 ?
                    this.performance.fps.reduce((a, b) => a + b, 0) / this.performance.fps.length : 60,
                errorCount: this.performance.errorCount
            }
        };
    }

    // Special tracking functions for game events
    trackTutorialStep(step, completed) {
        this.track('tutorial_step', {
            step: step,
            completed: completed,
            time_spent: Date.now() - this.sessionStartTime
        });
    }

    trackPurchaseFlow(step, item, price) {
        this.track('purchase_flow', {
            step: step, // 'viewed', 'initiated', 'completed', 'failed'
            item: item,
            price: price,
            segment: this.getPlayerSegment()
        });
    }

    trackDifficulty(wave, towers, enemies, health) {
        // Track difficulty spikes
        this.track('difficulty_checkpoint', {
            wave: wave,
            tower_count: towers,
            enemy_count: enemies,
            health_remaining: health,
            money_remaining: window.money || 0
        });
    }
}

// Initialize analytics when game loads
window.analytics = new AnalyticsSystem();

// Export for use in game
window.AnalyticsSystem = AnalyticsSystem;