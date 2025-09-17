// Ultra Premium Tower Defense - AAA Visual Systems
// Inspired by Supercell, King, and other top iOS game studios

class PremiumVisualSystem {
    constructor() {
        // Dynamic Environment System
        this.environment = {
            timeOfDay: 12, // 0-24 hours
            weather: 'clear', // clear, rain, snow, fog, storm
            season: 'summer', // spring, summer, fall, winter
            windStrength: 0.5,
            windDirection: 0,
            ambientLight: { r: 255, g: 255, b: 255 },
            sunPosition: { x: 0, y: 1 },
            moonPhase: 0,
            temperature: 20,
            visibility: 1.0
        };

        // Advanced Particle Pool
        this.particlePool = {
            active: [],
            inactive: [],
            maxParticles: 10000,
            batchRenderer: null
        };

        // Cinematic Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetZoom: 1,
            shake: { x: 0, y: 0, intensity: 0 },
            cinematicMode: false,
            followTarget: null,
            transitions: []
        };

        // Premium UI State
        this.ui = {
            theme: 'premium', // premium, neon, minimal, glass
            animations: true,
            haptics: true,
            soundFeedback: true,
            transitions: 'smooth' // smooth, instant, bounce
        };

        // Living Battlefield
        this.battlefield = {
            scars: [],
            debris: [],
            vegetation: [],
            fortifications: [],
            crowdSprites: [],
            weatherEffects: []
        };

        // Performance metrics
        this.performance = {
            fps: 60,
            frameTime: 0,
            drawCalls: 0,
            particleCount: 0,
            qualityLevel: this.detectQualityLevel()
        };

        this.initialize();
    }

    initialize() {
        this.setupWebGL2();
        this.createShaders();
        this.initializeParticleSystem();
        this.startEnvironmentCycle();
        this.applyPremiumTheme();
    }

    // 1. DYNAMIC ENVIRONMENT SYSTEM
    startEnvironmentCycle() {
        // Day/night cycle (24 min = 24 hours game time)
        setInterval(() => {
            this.environment.timeOfDay = (this.environment.timeOfDay + 0.1) % 24;
            this.updateLighting();
            this.updateShadows();
        }, 60000 / 24); // 1 game hour per minute

        // Weather changes
        setInterval(() => {
            this.randomWeatherEvent();
        }, 120000); // Every 2 minutes

        // Seasonal progression
        setInterval(() => {
            this.progressSeason();
        }, 600000); // Every 10 minutes
    }

    updateLighting() {
        const hour = this.environment.timeOfDay;
        let r, g, b, intensity;

        // Supercell-style color grading
        if (hour >= 5 && hour < 7) {
            // Dawn - pink/orange
            r = 255;
            g = 150 + (hour - 5) * 50;
            b = 100 + (hour - 5) * 30;
            intensity = 0.6 + (hour - 5) * 0.2;
        } else if (hour >= 7 && hour < 17) {
            // Day - bright
            r = 255;
            g = 250;
            b = 230;
            intensity = 1.0;
        } else if (hour >= 17 && hour < 19) {
            // Dusk - golden hour
            r = 255;
            g = 180 - (hour - 17) * 30;
            b = 80 - (hour - 17) * 20;
            intensity = 0.8 - (hour - 17) * 0.1;
        } else if (hour >= 19 && hour < 21) {
            // Twilight - purple/blue
            r = 100 - (hour - 19) * 20;
            g = 100 - (hour - 19) * 30;
            b = 150 - (hour - 19) * 20;
            intensity = 0.5 - (hour - 19) * 0.1;
        } else {
            // Night - dark blue
            r = 30;
            g = 40;
            b = 80;
            intensity = 0.3;
        }

        this.environment.ambientLight = { r, g, b };
        this.applyLightingToCanvas(intensity);
    }

    applyLightingToCanvas(intensity) {
        if (!window.ctx) return;

        // Create overlay for lighting
        const overlay = document.createElement('canvas');
        overlay.width = window.canvas.width;
        overlay.height = window.canvas.height;
        const octx = overlay.getContext('2d');

        // Gradient lighting like Clash Royale
        const gradient = octx.createRadialGradient(
            overlay.width / 2, overlay.height * 0.3, 100,
            overlay.width / 2, overlay.height / 2, overlay.width * 0.8
        );

        const { r, g, b } = this.environment.ambientLight;
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.1 * intensity})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.3 * intensity})`);
        gradient.addColorStop(1, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, ${0.5 * intensity})`);

        octx.fillStyle = gradient;
        octx.fillRect(0, 0, overlay.width, overlay.height);

        // Store for later compositing
        this.lightingOverlay = overlay;
    }

    randomWeatherEvent() {
        const weathers = ['clear', 'rain', 'fog', 'storm'];
        const weights = [0.5, 0.25, 0.15, 0.1];

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < weathers.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                this.changeWeather(weathers[i]);
                break;
            }
        }
    }

    changeWeather(newWeather) {
        const oldWeather = this.environment.weather;
        this.environment.weather = newWeather;

        // Smooth transition
        this.animateWeatherTransition(oldWeather, newWeather);

        // Apply weather effects
        switch(newWeather) {
            case 'rain':
                this.startRainEffect();
                this.environment.visibility = 0.7;
                break;
            case 'snow':
                this.startSnowEffect();
                this.environment.visibility = 0.8;
                break;
            case 'fog':
                this.environment.visibility = 0.5;
                this.createFogLayer();
                break;
            case 'storm':
                this.startStormEffect();
                this.environment.visibility = 0.6;
                this.environment.windStrength = 2.0;
                break;
            default:
                this.environment.visibility = 1.0;
                this.environment.windStrength = 0.5;
        }
    }

    startRainEffect() {
        // Create rain particles
        for (let i = 0; i < 200; i++) {
            this.battlefield.weatherEffects.push({
                type: 'rain',
                x: Math.random() * window.canvas.width,
                y: -Math.random() * 100,
                speed: 15 + Math.random() * 10,
                opacity: 0.3 + Math.random() * 0.3,
                length: 15 + Math.random() * 10
            });
        }

        // Add rain sound
        this.playAmbientSound('rain');

        // Puddle formation
        this.createPuddles();
    }

    // 2. ADVANCED GPU PARTICLE SYSTEM
    setupWebGL2() {
        // Create WebGL2 context for particles
        const particleCanvas = document.createElement('canvas');
        particleCanvas.id = 'particle-canvas';
        particleCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5000;
        `;

        const gl = particleCanvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: true,
            preserveDrawingBuffer: true
        });

        if (!gl) {
            console.warn('WebGL2 not supported, falling back to canvas particles');
            return;
        }

        this.gl = gl;
        this.particleCanvas = particleCanvas;

        // Add to DOM
        if (window.canvas && window.canvas.parentElement) {
            window.canvas.parentElement.appendChild(particleCanvas);
        }
    }

    createShaders() {
        if (!this.gl) return;

        // Vertex shader for GPU particles
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            in vec2 a_velocity;
            in vec4 a_color;
            in float a_size;
            in float a_lifetime;

            uniform mat4 u_matrix;
            uniform float u_time;
            uniform vec2 u_gravity;
            uniform vec2 u_wind;

            out vec4 v_color;
            out float v_lifetime;

            void main() {
                // Physics simulation on GPU
                vec2 position = a_position + a_velocity * u_time;
                position += 0.5 * u_gravity * u_time * u_time;
                position += u_wind * u_time;

                // Fade based on lifetime
                v_lifetime = clamp(1.0 - (u_time / a_lifetime), 0.0, 1.0);
                v_color = vec4(a_color.rgb, a_color.a * v_lifetime);

                gl_Position = u_matrix * vec4(position, 0.0, 1.0);
                gl_PointSize = a_size * (1.0 + v_lifetime);
            }
        `;

        // Fragment shader with glow effect
        const fragmentShaderSource = `#version 300 es
            precision highp float;

            in vec4 v_color;
            in float v_lifetime;

            out vec4 fragColor;

            void main() {
                // Distance from center for circular particles
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);

                // Soft edge glow like Brawl Stars
                float alpha = smoothstep(0.5, 0.0, dist);
                alpha *= pow(v_lifetime, 0.5);

                // Bloom effect
                vec3 bloom = v_color.rgb * (1.0 + 0.5 * (1.0 - dist));

                fragColor = vec4(bloom, v_color.a * alpha);
            }
        `;

        this.particleShader = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        return program;
    }

    initializeParticleSystem() {
        // Pre-allocate particle buffer
        for (let i = 0; i < this.particlePool.maxParticles; i++) {
            this.particlePool.inactive.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                color: { r: 255, g: 255, b: 255, a: 1 },
                size: 1,
                lifetime: 1,
                age: 0,
                type: 'default',
                physics: true,
                glow: false,
                trail: []
            });
        }
    }

    emitParticleBurst(x, y, count, config = {}) {
        const defaults = {
            speed: 5,
            spread: Math.PI * 2,
            color: { r: 255, g: 200, b: 0, a: 1 },
            size: 3,
            lifetime: 1,
            gravity: true,
            glow: true,
            type: 'explosion'
        };

        const settings = { ...defaults, ...config };

        for (let i = 0; i < count && this.particlePool.inactive.length > 0; i++) {
            const particle = this.particlePool.inactive.pop();

            const angle = settings.spread * Math.random();
            const speed = settings.speed * (0.5 + Math.random() * 0.5);

            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.color = settings.color;
            particle.size = settings.size * (0.8 + Math.random() * 0.4);
            particle.lifetime = settings.lifetime;
            particle.age = 0;
            particle.type = settings.type;
            particle.physics = settings.gravity;
            particle.glow = settings.glow;
            particle.trail = [];

            this.particlePool.active.push(particle);
        }
    }

    updateParticles(deltaTime) {
        const gravity = this.environment.weather === 'storm' ? 200 : 100;
        const wind = this.environment.windStrength * 50;

        for (let i = this.particlePool.active.length - 1; i >= 0; i--) {
            const particle = this.particlePool.active[i];

            // Age particle
            particle.age += deltaTime;

            // Remove dead particles
            if (particle.age >= particle.lifetime) {
                this.particlePool.active.splice(i, 1);
                this.particlePool.inactive.push(particle);
                continue;
            }

            // Store trail
            if (particle.trail.length < 10) {
                particle.trail.push({ x: particle.x, y: particle.y, age: particle.age });
            }

            // Physics update
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            if (particle.physics) {
                particle.vy += gravity * deltaTime;
                particle.vx += wind * Math.sin(particle.age * 5) * deltaTime;
            }

            // Collision with ground
            if (particle.y > window.canvas.height - 50) {
                particle.vy *= -0.5;
                particle.vx *= 0.8;
                particle.y = window.canvas.height - 50;
            }
        }
    }

    renderParticles(ctx) {
        // Group particles by blend mode for batch rendering
        const additiveParticles = [];
        const normalParticles = [];

        this.particlePool.active.forEach(particle => {
            if (particle.glow) {
                additiveParticles.push(particle);
            } else {
                normalParticles.push(particle);
            }
        });

        // Render normal particles
        ctx.globalCompositeOperation = 'source-over';
        this.renderParticleBatch(ctx, normalParticles);

        // Render glowing particles with additive blending
        ctx.globalCompositeOperation = 'screen';
        this.renderParticleBatch(ctx, additiveParticles);

        ctx.globalCompositeOperation = 'source-over';
    }

    renderParticleBatch(ctx, particles) {
        particles.forEach(particle => {
            const lifeRatio = 1 - (particle.age / particle.lifetime);

            // Render trail
            if (particle.trail.length > 1) {
                ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${lifeRatio * 0.3})`;
                ctx.lineWidth = particle.size * 0.5;
                ctx.beginPath();
                particle.trail.forEach((point, i) => {
                    if (i === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                });
                ctx.stroke();
            }

            // Render particle with glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );

            gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${lifeRatio})`);
            gradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${lifeRatio * 0.5})`);
            gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (1 + (1 - lifeRatio) * 2), 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 3. CINEMATIC CAMERA SYSTEM
    shakeCamera(intensity, duration) {
        this.camera.shake.intensity = intensity;
        this.camera.shake.duration = duration;
        this.camera.shake.startTime = performance.now();
    }

    updateCamera(deltaTime) {
        // Smooth zoom transitions
        if (this.camera.zoom !== this.camera.targetZoom) {
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        }

        // Camera shake
        if (this.camera.shake.intensity > 0) {
            const elapsed = performance.now() - this.camera.shake.startTime;
            const progress = elapsed / this.camera.shake.duration;

            if (progress < 1) {
                const decay = 1 - progress;
                this.camera.shake.x = (Math.random() - 0.5) * this.camera.shake.intensity * decay;
                this.camera.shake.y = (Math.random() - 0.5) * this.camera.shake.intensity * decay;
            } else {
                this.camera.shake.intensity = 0;
                this.camera.shake.x = 0;
                this.camera.shake.y = 0;
            }
        }

        // Follow target
        if (this.camera.followTarget) {
            const target = this.camera.followTarget;
            this.camera.x += (target.x - this.camera.x) * 0.05;
            this.camera.y += (target.y - this.camera.y) * 0.05;
        }
    }

    cinematicKillCam(killer, victim) {
        // Store current camera state
        const previousState = { ...this.camera };

        // Zoom to action
        this.camera.cinematicMode = true;
        this.camera.targetZoom = 2;
        this.camera.followTarget = victim;

        // Slow motion effect
        window.gameSpeed = 0.2;

        // Add dramatic lighting
        this.createSpotlight(victim.x, victim.y);

        // Camera sequence
        setTimeout(() => {
            // Switch to killer perspective
            this.camera.followTarget = killer;
            this.shakeCamera(20, 500);
        }, 500);

        setTimeout(() => {
            // Return to normal
            this.camera = previousState;
            this.camera.cinematicMode = false;
            window.gameSpeed = 1;
        }, 2000);
    }

    // 4. PREMIUM UI/UX POLISH
    applyPremiumTheme() {
        // Glass morphism effect for UI elements
        const style = document.createElement('style');
        style.textContent = `
            /* Clash Royale / Supercell inspired UI */
            .premium-button {
                position: relative;
                background: linear-gradient(135deg,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(255, 255, 255, 0.05) 100%);
                backdrop-filter: blur(10px) saturate(180%);
                -webkit-backdrop-filter: blur(10px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 20px;
                box-shadow:
                    0 8px 32px rgba(0, 0, 0, 0.37),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .premium-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent);
                transition: left 0.5s;
            }

            .premium-button:hover::before {
                left: 100%;
            }

            .premium-button:active {
                transform: scale(0.95);
                box-shadow:
                    0 4px 16px rgba(0, 0, 0, 0.37),
                    inset 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            /* Liquid metal transitions */
            .liquid-transition {
                animation: liquidMorph 2s ease-in-out infinite;
            }

            @keyframes liquidMorph {
                0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            }

            /* Holographic effect */
            .holographic {
                background: linear-gradient(45deg,
                    #ff0080, #ff8080, #80ff00, #00ff80,
                    #0080ff, #8080ff, #ff0080);
                background-size: 400% 400%;
                animation: holographicShift 3s ease infinite;
            }

            @keyframes holographicShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            /* Premium glow */
            .premium-glow {
                box-shadow:
                    0 0 20px rgba(255, 215, 0, 0.5),
                    0 0 40px rgba(255, 215, 0, 0.3),
                    0 0 60px rgba(255, 215, 0, 0.1);
                animation: pulse 2s ease-in-out infinite;
            }

            /* Sound reactive pulse */
            .sound-pulse {
                animation: soundReact 0.15s ease-out;
            }

            @keyframes soundReact {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            /* 3D card flip */
            .card-3d {
                transform-style: preserve-3d;
                transition: transform 0.6s;
            }

            .card-3d:hover {
                transform: rotateY(180deg);
            }

            /* Neumorphic elements */
            .neumorphic {
                background: linear-gradient(145deg, #f0f0f0, #cacaca);
                box-shadow:
                    20px 20px 60px #bebebe,
                    -20px -20px 60px #ffffff;
            }

            /* Particle cursor trail */
            .cursor-particle {
                position: fixed;
                pointer-events: none;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle,
                    rgba(255, 255, 255, 1) 0%,
                    rgba(255, 255, 255, 0) 70%);
                border-radius: 50%;
                animation: cursorFade 1s ease-out forwards;
            }

            @keyframes cursorFade {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(3);
                }
            }
        `;
        document.head.appendChild(style);

        // Apply to existing buttons
        this.upgradeUIElements();

        // Add cursor particle trail
        this.initializeCursorEffects();

        // Sound feedback system
        this.initializeSoundFeedback();
    }

    upgradeUIElements() {
        // Upgrade all buttons to premium style
        document.querySelectorAll('button').forEach(btn => {
            btn.classList.add('premium-button');

            // Add haptic feedback for iOS
            btn.addEventListener('touchstart', () => {
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(10);
                }
            });

            // Sound feedback
            btn.addEventListener('click', () => {
                this.playUISound('button_click');
                btn.classList.add('sound-pulse');
                setTimeout(() => btn.classList.remove('sound-pulse'), 200);
            });
        });

        // Liquid metal transitions for modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('liquid-transition');
        });
    }

    initializeCursorEffects() {
        let lastX = 0, lastY = 0;
        let particleCount = 0;

        document.addEventListener('mousemove', (e) => {
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Create particle trail for fast movements
            if (distance > 20 && particleCount < 30) {
                const particle = document.createElement('div');
                particle.className = 'cursor-particle';
                particle.style.left = e.clientX + 'px';
                particle.style.top = e.clientY + 'px';
                document.body.appendChild(particle);

                particleCount++;
                setTimeout(() => {
                    particle.remove();
                    particleCount--;
                }, 1000);
            }

            lastX = e.clientX;
            lastY = e.clientY;
        });
    }

    initializeSoundFeedback() {
        // Create Web Audio context for UI sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.uiSounds = {
            button_click: () => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);

                osc.frequency.value = 800;
                gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.1);
            },

            success: () => {
                const notes = [523.25, 659.25, 783.99]; // C, E, G
                notes.forEach((freq, i) => {
                    setTimeout(() => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(audioContext.destination);

                        osc.frequency.value = freq;
                        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                        osc.start(audioContext.currentTime);
                        osc.stop(audioContext.currentTime + 0.3);
                    }, i * 100);
                });
            }
        };
    }

    playUISound(soundName) {
        if (this.uiSounds[soundName]) {
            this.uiSounds[soundName]();
        }
    }

    // 5. LIVING BATTLEFIELD SYSTEM
    updateBattlefield(deltaTime) {
        // Update vegetation growth
        this.updateVegetation(deltaTime);

        // Update battlefield scars
        this.fadeScars(deltaTime);

        // Update debris physics
        this.updateDebris(deltaTime);

        // Update crowd animations
        this.updateCrowd(deltaTime);

        // Weather effects on battlefield
        this.applyWeatherToBattlefield(deltaTime);
    }

    createExplosionScar(x, y, radius) {
        this.battlefield.scars.push({
            x: x,
            y: y,
            radius: radius,
            age: 0,
            maxAge: 30, // 30 seconds to fade
            type: 'explosion'
        });

        // Add debris
        for (let i = 0; i < 5; i++) {
            this.battlefield.debris.push({
                x: x + (Math.random() - 0.5) * radius,
                y: y + (Math.random() - 0.5) * radius,
                vx: (Math.random() - 0.5) * 100,
                vy: -Math.random() * 100,
                rotation: Math.random() * Math.PI * 2,
                angularVelocity: (Math.random() - 0.5) * 5,
                size: 5 + Math.random() * 10,
                type: 'rock'
            });
        }
    }

    updateVegetation(deltaTime) {
        // Grass grows back over time
        const growthRate = 0.01 * deltaTime;

        this.battlefield.vegetation.forEach(grass => {
            if (grass.height < grass.maxHeight) {
                grass.height += growthRate;
            }

            // Wind effect
            grass.sway = Math.sin(performance.now() * 0.001 + grass.offset) *
                        this.environment.windStrength * 10;
        });
    }

    fadeScars(deltaTime) {
        for (let i = this.battlefield.scars.length - 1; i >= 0; i--) {
            const scar = this.battlefield.scars[i];
            scar.age += deltaTime;

            if (scar.age >= scar.maxAge) {
                this.battlefield.scars.splice(i, 1);
            }
        }
    }

    updateDebris(deltaTime) {
        this.battlefield.debris.forEach(debris => {
            // Physics
            debris.x += debris.vx * deltaTime;
            debris.y += debris.vy * deltaTime;
            debris.vy += 200 * deltaTime; // Gravity
            debris.rotation += debris.angularVelocity * deltaTime;

            // Friction
            debris.vx *= 0.98;
            debris.angularVelocity *= 0.95;

            // Bounce
            if (debris.y > window.canvas.height - 50) {
                debris.y = window.canvas.height - 50;
                debris.vy *= -0.5;
            }
        });
    }

    updateCrowd(deltaTime) {
        // Animated background villagers cheering
        this.battlefield.crowdSprites.forEach(sprite => {
            sprite.animationFrame += deltaTime * 10;

            // Jump when something exciting happens
            if (window.lastKillTime && performance.now() - window.lastKillTime < 1000) {
                sprite.y = sprite.baseY - Math.sin(sprite.animationFrame) * 20;
            } else {
                sprite.y = sprite.baseY;
            }
        });
    }

    renderBattlefield(ctx) {
        // Render in correct order for depth

        // 1. Scars (bottom layer)
        this.renderScars(ctx);

        // 2. Vegetation
        this.renderVegetation(ctx);

        // 3. Debris
        this.renderDebris(ctx);

        // 4. Weather effects
        this.renderWeatherEffects(ctx);

        // 5. Crowd (background)
        this.renderCrowd(ctx);
    }

    renderScars(ctx) {
        this.battlefield.scars.forEach(scar => {
            const opacity = 1 - (scar.age / scar.maxAge);

            const gradient = ctx.createRadialGradient(
                scar.x, scar.y, 0,
                scar.x, scar.y, scar.radius
            );

            gradient.addColorStop(0, `rgba(50, 30, 20, ${opacity * 0.5})`);
            gradient.addColorStop(0.5, `rgba(30, 20, 10, ${opacity * 0.3})`);
            gradient.addColorStop(1, `rgba(20, 10, 5, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(scar.x, scar.y, scar.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 6. NEXT-GEN TOWER EFFECTS
    createTowerEffect(tower, type) {
        switch(type) {
            case 'laser':
                this.createLaserBeam(tower);
                break;
            case 'tesla':
                this.createLightningEffect(tower);
                break;
            case 'plasma':
                this.createPlasmaField(tower);
                break;
            case 'railgun':
                this.createRailgunEffect(tower);
                break;
            case 'quantum':
                this.createQuantumPortal(tower);
                break;
            case 'void':
                this.createBlackHole(tower);
                break;
            case 'omega':
                this.createOrbitalStrike(tower);
                break;
        }
    }

    createLaserBeam(tower) {
        // Refraction effect through atmosphere
        const beam = {
            start: { x: tower.x, y: tower.y },
            end: { x: tower.target.x, y: tower.target.y },
            color: { r: 255, g: 0, b: 0 },
            width: 5,
            segments: []
        };

        // Create refraction segments
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = beam.start.x + (beam.end.x - beam.start.x) * t;
            const y = beam.start.y + (beam.end.y - beam.start.y) * t;

            // Add atmospheric distortion
            const offset = Math.sin(performance.now() * 0.01 + i) * 2;
            beam.segments.push({ x: x + offset, y: y });
        }

        // Heat distortion around beam
        this.createHeatDistortion(beam.start, beam.end);

        return beam;
    }

    createLightningEffect(tower) {
        const lightning = {
            branches: [],
            mainBolt: []
        };

        // Generate main bolt with subdivisions
        const generateBolt = (start, end, offset = 0) => {
            const points = [start];
            const segments = 5;

            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = start.x + (end.x - start.x) * t;
                const y = start.y + (end.y - start.y) * t;

                // Random displacement for lightning effect
                const displacement = (Math.random() - 0.5) * 30;
                points.push({
                    x: x + displacement,
                    y: y + displacement
                });
            }

            points.push(end);
            return points;
        };

        lightning.mainBolt = generateBolt(
            { x: tower.x, y: tower.y },
            { x: tower.target.x, y: tower.target.y }
        );

        // Add branches
        for (let i = 1; i < lightning.mainBolt.length - 1; i++) {
            if (Math.random() < 0.3) {
                const start = lightning.mainBolt[i];
                const angle = Math.random() * Math.PI * 2;
                const length = 20 + Math.random() * 30;
                const end = {
                    x: start.x + Math.cos(angle) * length,
                    y: start.y + Math.sin(angle) * length
                };

                lightning.branches.push(generateBolt(start, end));
            }
        }

        return lightning;
    }

    createPlasmaField(tower) {
        // Animated containment field
        const field = {
            x: tower.x,
            y: tower.y,
            radius: tower.range,
            rotation: 0,
            plasma: []
        };

        // Generate plasma particles
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const radius = tower.range * (0.8 + Math.random() * 0.2);

            field.plasma.push({
                angle: angle,
                radius: radius,
                speed: (Math.random() - 0.5) * 2,
                size: 2 + Math.random() * 3,
                heat: Math.random()
            });
        }

        return field;
    }

    createOrbitalStrike(tower) {
        // Beam from space
        const strike = {
            x: tower.target.x,
            y: tower.target.y,
            chargeTime: 1000,
            beamWidth: 50,
            satellitePosition: { x: tower.target.x, y: -100 }
        };

        // Warning indicator
        this.createWarningCircle(strike.x, strike.y, 100);

        // Charge up effect
        setTimeout(() => {
            // Main beam
            this.emitParticleBurst(strike.x, strike.y, 200, {
                color: { r: 255, g: 255, b: 255, a: 1 },
                size: 5,
                lifetime: 2,
                speed: 20,
                glow: true
            });

            // Screen flash
            this.createScreenFlash(0.5);

            // Camera shake
            this.shakeCamera(30, 1000);
        }, strike.chargeTime);

        return strike;
    }

    // Utility functions
    detectQualityLevel() {
        // Detect device capabilities
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');

        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);

            // Check for high-end GPUs
            if (renderer.includes('Apple') && renderer.includes('Pro')) {
                return 'ultra';
            } else if (renderer.includes('Apple')) {
                return 'high';
            } else {
                return 'medium';
            }
        }

        return 'low';
    }

    createWarningCircle(x, y, radius) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: absolute;
            left: ${x - radius}px;
            top: ${y - radius}px;
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            border: 3px solid rgba(255, 0, 0, 0.8);
            border-radius: 50%;
            animation: warningPulse 0.5s ease-in-out infinite;
            pointer-events: none;
            z-index: 4999;
        `;

        document.body.appendChild(warning);

        setTimeout(() => warning.remove(), 1000);
    }

    createScreenFlash(intensity) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: ${intensity};
            pointer-events: none;
            z-index: 9999;
            animation: flashFade 0.3s ease-out forwards;
        `;

        document.body.appendChild(flash);

        setTimeout(() => flash.remove(), 300);
    }

    createSpotlight(x, y) {
        const spotlight = document.createElement('div');
        spotlight.style.cssText = `
            position: absolute;
            left: ${x - 100}px;
            top: ${y - 100}px;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle,
                rgba(255, 255, 255, 0.3) 0%,
                transparent 70%);
            pointer-events: none;
            z-index: 4998;
            animation: spotlightFade 2s ease-out forwards;
        `;

        document.body.appendChild(spotlight);

        setTimeout(() => spotlight.remove(), 2000);
    }

    playAmbientSound(type) {
        // Placeholder for ambient sound system
        console.log(`Playing ambient sound: ${type}`);
    }

    createHeatDistortion(start, end) {
        // Create heat shimmer effect along beam path
        // This would use a displacement shader in WebGL
    }

    createPuddles() {
        // Add reflective puddles during rain
        for (let i = 0; i < 5; i++) {
            this.battlefield.scars.push({
                x: Math.random() * window.canvas.width,
                y: window.canvas.height - 30 - Math.random() * 100,
                radius: 30 + Math.random() * 20,
                age: 0,
                maxAge: 60,
                type: 'puddle'
            });
        }
    }

    animateWeatherTransition(oldWeather, newWeather) {
        // Smooth weather transitions
        const duration = 3000;
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Interpolate visibility
            if (oldWeather === 'clear') {
                this.environment.visibility = 1.0 - (1.0 - this.getWeatherVisibility(newWeather)) * progress;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    getWeatherVisibility(weather) {
        const visibilityMap = {
            'clear': 1.0,
            'rain': 0.7,
            'snow': 0.8,
            'fog': 0.5,
            'storm': 0.6
        };
        return visibilityMap[weather] || 1.0;
    }

    startSnowEffect() {
        // Create snow particles
        for (let i = 0; i < 100; i++) {
            this.battlefield.weatherEffects.push({
                type: 'snow',
                x: Math.random() * window.canvas.width,
                y: -Math.random() * 100,
                speed: 2 + Math.random() * 3,
                size: 2 + Math.random() * 3,
                sway: Math.random() * Math.PI
            });
        }
    }

    createFogLayer() {
        // Create fog overlay
        const fog = {
            type: 'fog',
            opacity: 0.5,
            clouds: []
        };

        for (let i = 0; i < 5; i++) {
            fog.clouds.push({
                x: Math.random() * window.canvas.width,
                y: Math.random() * window.canvas.height,
                radius: 100 + Math.random() * 100,
                speed: 0.5 + Math.random() * 1
            });
        }

        this.battlefield.weatherEffects.push(fog);
    }

    startStormEffect() {
        // Lightning flashes
        const flashLightning = () => {
            if (this.environment.weather === 'storm') {
                this.createScreenFlash(0.3);
                this.playAmbientSound('thunder');

                // Random delay for next flash
                setTimeout(flashLightning, 3000 + Math.random() * 7000);
            }
        };

        flashLightning();

        // Heavy rain
        this.startRainEffect();

        // Dark clouds
        this.environment.ambientLight = { r: 100, g: 100, b: 120 };
    }

    updateShadows() {
        // Calculate sun/moon position based on time
        const hour = this.environment.timeOfDay;
        const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;

        this.environment.sunPosition = {
            x: Math.cos(angle),
            y: Math.abs(Math.sin(angle))
        };

        // Shadow length based on sun height
        const shadowLength = 20 / Math.max(this.environment.sunPosition.y, 0.1);
        const shadowAngle = Math.atan2(this.environment.sunPosition.y, this.environment.sunPosition.x);

        // Store for rendering
        this.shadowSettings = {
            length: Math.min(shadowLength, 50),
            angle: shadowAngle,
            opacity: Math.max(0.1, this.environment.sunPosition.y)
        };
    }

    progressSeason() {
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        const currentIndex = seasons.indexOf(this.environment.season);
        this.environment.season = seasons[(currentIndex + 1) % seasons.length];

        // Apply seasonal changes
        this.applySeasonalEffects();
    }

    applySeasonalEffects() {
        switch(this.environment.season) {
            case 'spring':
                // Green, flowers
                this.spawnFlowers();
                break;
            case 'summer':
                // Bright, hot
                this.environment.temperature = 30;
                break;
            case 'fall':
                // Orange leaves
                this.createFallingLeaves();
                break;
            case 'winter':
                // Snow cover
                this.environment.temperature = -5;
                this.changeWeather('snow');
                break;
        }
    }

    spawnFlowers() {
        for (let i = 0; i < 20; i++) {
            this.battlefield.vegetation.push({
                type: 'flower',
                x: Math.random() * window.canvas.width,
                y: window.canvas.height - 20 - Math.random() * 50,
                height: 0,
                maxHeight: 15,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                offset: Math.random() * Math.PI * 2,
                sway: 0
            });
        }
    }

    createFallingLeaves() {
        for (let i = 0; i < 30; i++) {
            this.battlefield.weatherEffects.push({
                type: 'leaf',
                x: Math.random() * window.canvas.width,
                y: -Math.random() * 100,
                speed: 1 + Math.random() * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                color: `hsl(${30 + Math.random() * 30}, 70%, 50%)`,
                size: 10 + Math.random() * 5
            });
        }
    }

    renderVegetation(ctx) {
        this.battlefield.vegetation.forEach(plant => {
            ctx.save();
            ctx.translate(plant.x, plant.y);

            if (plant.type === 'flower') {
                // Draw stem
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(plant.sway, -plant.height / 2, plant.sway, -plant.height);
                ctx.stroke();

                // Draw flower
                ctx.fillStyle = plant.color;
                ctx.beginPath();
                ctx.arc(plant.sway, -plant.height, 5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw grass
                ctx.strokeStyle = `rgba(100, 200, 100, ${0.5 + plant.height / plant.maxHeight * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(plant.sway, -plant.height / 2, plant.sway, -plant.height);
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    renderDebris(ctx) {
        this.battlefield.debris.forEach(debris => {
            ctx.save();
            ctx.translate(debris.x, debris.y);
            ctx.rotate(debris.rotation);

            ctx.fillStyle = 'rgba(100, 80, 60, 0.8)';
            ctx.fillRect(-debris.size / 2, -debris.size / 2, debris.size, debris.size);

            ctx.restore();
        });
    }

    renderWeatherEffects(ctx) {
        this.battlefield.weatherEffects.forEach(effect => {
            switch(effect.type) {
                case 'rain':
                    ctx.strokeStyle = `rgba(150, 150, 200, ${effect.opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(effect.x, effect.y);
                    ctx.lineTo(effect.x, effect.y + effect.length);
                    ctx.stroke();

                    // Update position
                    effect.y += effect.speed;
                    if (effect.y > window.canvas.height) {
                        effect.y = -effect.length;
                        effect.x = Math.random() * window.canvas.width;
                    }
                    break;

                case 'snow':
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(
                        effect.x + Math.sin(effect.sway) * 10,
                        effect.y,
                        effect.size,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    // Update position
                    effect.y += effect.speed;
                    effect.sway += 0.05;
                    if (effect.y > window.canvas.height) {
                        effect.y = -effect.size;
                        effect.x = Math.random() * window.canvas.width;
                    }
                    break;

                case 'leaf':
                    ctx.save();
                    ctx.translate(effect.x, effect.y);
                    ctx.rotate(effect.rotation);
                    ctx.fillStyle = effect.color;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, effect.size, effect.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // Update position
                    effect.y += effect.speed;
                    effect.x += Math.sin(effect.y * 0.01) * 2;
                    effect.rotation += effect.rotationSpeed;
                    if (effect.y > window.canvas.height) {
                        effect.y = -effect.size;
                        effect.x = Math.random() * window.canvas.width;
                    }
                    break;
            }
        });
    }

    renderCrowd(ctx) {
        this.battlefield.crowdSprites.forEach(sprite => {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.fillRect(sprite.x - 5, sprite.y - 10, 10, 20);

            // Simple arms waving
            const armAngle = Math.sin(sprite.animationFrame * 0.1) * 0.5;
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sprite.x, sprite.y);
            ctx.lineTo(sprite.x - 10, sprite.y - 10 + armAngle * 10);
            ctx.moveTo(sprite.x, sprite.y);
            ctx.lineTo(sprite.x + 10, sprite.y - 10 - armAngle * 10);
            ctx.stroke();
        });
    }

    applyWeatherToBattlefield(deltaTime) {
        // Weather affects battlefield elements
        if (this.environment.weather === 'rain') {
            // Grass grows faster
            this.battlefield.vegetation.forEach(plant => {
                plant.maxHeight = Math.min(plant.maxHeight * 1.01, 30);
            });
        } else if (this.environment.weather === 'snow') {
            // Snow accumulation
            // Would add snow layer rendering here
        }
    }
}

// Initialize premium visual system
window.premiumVisuals = new PremiumVisualSystem();

// Hook into game loop
if (window.gameLoop) {
    const originalGameLoop = window.gameLoop;
    window.gameLoop = function(currentTime) {
        const deltaTime = currentTime - (window.lastFrameTime || currentTime);
        window.lastFrameTime = currentTime;

        // Update visual systems
        if (window.premiumVisuals) {
            window.premiumVisuals.updateCamera(deltaTime / 1000);
            window.premiumVisuals.updateParticles(deltaTime / 1000);
            window.premiumVisuals.updateBattlefield(deltaTime / 1000);
        }

        // Original game loop
        originalGameLoop.apply(this, arguments);

        // Render premium effects
        if (window.ctx && window.premiumVisuals) {
            window.premiumVisuals.renderBattlefield(window.ctx);
            window.premiumVisuals.renderParticles(window.ctx);

            // Apply lighting overlay
            if (window.premiumVisuals.lightingOverlay) {
                window.ctx.globalCompositeOperation = 'multiply';
                window.ctx.drawImage(window.premiumVisuals.lightingOverlay, 0, 0);
                window.ctx.globalCompositeOperation = 'source-over';
            }
        }
    };
}

// Export for use in game
window.PremiumVisualSystem = PremiumVisualSystem;