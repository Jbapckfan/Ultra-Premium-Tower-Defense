# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Recent Major Updates (2024-2025)

### Latest Fixes (September 2025)
- **Fixed Split-Screen Layout**: Players now truly separated with left/right territories
- **Improved Path Spacing**: Wider gaps between path segments for easier tower placement
- **Reduced Path Validation**: Tower placement radius reduced from 40 to 25 pixels
- **Added Tower Spacing**: Minimum 35 pixel spacing between towers to prevent overlap
- **Enhanced Visual Divider**: Glowing cyan divider with player labels and territory backgrounds
- **Better Path Design**: More gradual turns with strategic placement opportunities

### Core Features Added
- **Sound System**: Web Audio API-based sound effects for shooting, hits, and explosions
- **Auto-Save System**: Saves every 30 seconds, restores on launch
- **Multi-Touch Co-op**: Two players can play simultaneously on iPad using multi-touch
- **Boss System**: Boss health bars, warnings, and enhanced explosions
- **Achievement Popups**: Golden notifications slide in from right with sound
- **Resource Animations**: Money floats up when earned, damage numbers on hits
- **Enhanced Visual Effects**: 5 particle types (explosion, spark, ring, smoke, default) with physics
- **Speed Controls**: 1x-5x game speed with color-coded buttons
- **Tower Targeting**: Nearest, Farthest, Strongest, Weakest, First, Last priorities

### 2-Player Modes (NEW - 2025)
- **Split-Screen PvP**: True left vs right competitive tower defense with visual divider
- **Separate Resources**: Each player has own money, lives, and towers
- **Freeze Ability**: $150 to freeze opponent for 5 seconds (20s cooldown)
- **Attack Units**: Send enemies to opponent's lane (5 types: Rusher, Tank, Swarm, Stealth, Boss)
- **Middle Zone Control**: Contested area with bonus resources
- **Power Surges**: Game-changing temporary abilities
- **True Competitive Play**: Not just shared screen, actual versus gameplay
- **Improved Path Design**: Wider spacing between path segments for easier tower placement
- **Territory Visualization**: Subtle colored backgrounds and glowing divider line

### iOS/Touch Optimizations
- Fully touch-based controls (no mouse/keyboard required)
- Multi-touch support for 2-player modes
- Touch-friendly UI with larger buttons
- Click-outside-to-close for all modals
- Sell mode button for easy tower selling
- iPad keyboard support (optional)
- Split-screen optimized for iPad landscape mode

### Visual Improvements
- Ultra HD particle effects with gradients and glows
- Boss explosions 3-4x larger than normal
- Smooth pulsing glow on tower selection (removed aggressive spinning)
- Red circular close buttons with rotation animation
- Boss health bar with animated shine effect
- Floating damage numbers (performance-aware)
- Money popup animations

## Deployment to iPad

### Quick Start for iPad
1. **Run the server**: `python3 serve_ipad.py` in project directory
2. **Get IP address**: Script will display local IP (e.g., 10.15.0.117)
3. **On iPad**: Open Safari, go to `http://YOUR_IP:8000/game_2player_working.html`
4. **Requirements**: iPad and Mac must be on same WiFi network

### Available Game Versions
- `game_2player_working.html` - **RECOMMENDED**: Full 2-player split-screen with freeze ability and improved path spacing
- `game_ipad.html` - Original single-player version optimized for iPad
- `game_ios.html` - Simplified iOS-specific version
- `game.html` - Main development version (may have issues)
- `game_original.html` - Stable backup of original game

## Development Commands

### Building and Running
- **Build**: Open `Ultra Premium Tower Defense.xcodeproj` in Xcode and build (⌘B)
- **Run**: Click Run in Xcode (⌘R) or use `xcodebuild build`
- **Test**: Run tests in Xcode (⌘U) or use `xcodebuild test`
- **Archive**: Product → Archive in Xcode or `xcodebuild archive`

### Running Tests
- **All Tests**: `xcodebuild test -project "Ultra Premium Tower Defense.xcodeproj" -scheme "Ultra Premium Tower Defense"`
- **Unit Tests Only**: Run from Xcode Test Navigator or filter to `Ultra_Premium_Tower_DefenseTests`
- **UI Tests Only**: Run from Xcode Test Navigator or filter to `Ultra_Premium_Tower_DefenseUITests`

## Architecture Overview

### Application Structure
This is a macOS SwiftUI application that embeds an HTML5 tower defense game. The architecture consists of:

1. **Native Layer (Swift/SwiftUI)**
   - `Ultra_Premium_Tower_DefenseApp.swift`: App entry point using SwiftUI App protocol
   - `ContentView.swift`: Main view that likely hosts the web content
   - `Persistence.swift`: Core Data stack for local data persistence
   - Uses MVVM pattern implied by SwiftUI architecture

2. **Game Layer (HTML5/JavaScript)**
   - `game.html`: Complete self-contained tower defense game (34K+ tokens)
   - Canvas-based rendering with JavaScript game loop
   - Object-oriented design with Tower and Enemy classes
   - Wave-based progression system with achievements

### Key Technical Decisions
- **Hybrid Architecture**: Native macOS wrapper around HTML5 game allows for App Store distribution while maintaining web game portability
- **App Sandboxing**: Enabled for Mac App Store compliance with read-only file access
- **Core Data**: Configured but minimally used (single Item entity)
- **No External Dependencies**: Self-contained project without package managers

### Game Systems Architecture
The HTML5 game implements:
- **Entity System**: Tower and Enemy classes with update/render cycles
- **State Management**: Global game state variables for waves, score, resources
- **Rendering Pipeline**: Canvas-based with particle effects and animations
- **Input Handling**: Unified mouse/touch events for cross-platform support
- **Progression System**: Achievements, upgrades, and difficulty scaling

## Game Features

### Tower Types (10 total)
1. **Pulse Cannon** - Rapid-fire kinetic weapon
2. **Laser Beam** - Continuous beam weapon
3. **Missile Launcher** - Explosive splash damage
4. **Tesla Coil** - Chain lightning attacks
5. **Plasma Cannon** - Energy splash damage
6. **Railgun** - High-damage piercing shots
7. **Quantum Tower** - Phase-shifting attacks
8. **Void Graviton** - Black hole effects
9. **Crystal Prism** - Refracting light beams
10. **Omega Cannon** - Ultimate destruction

### Enemy Types (30+ variants)
- Basic: Slime, Golem, Speeder
- Advanced: Tank, Ghost, Healer, Bomber
- Elite: Shadow Assassin, Void Walker, Elemental types
- Bosses: Boss, Mega Boss, Final Boss

### Game Modes
- **Single Player**: Classic tower defense
- **Co-op Mode**: 2-player simultaneous play via multi-touch
- **Challenge Mode**: Endless waves with increasing difficulty

### Save System Functions
- `saveGame()` - Manual save
- `loadGame()` - Manual load
- `clearSave()` - Clear save data
- Auto-saves every 30 seconds during gameplay

## Technical Implementation

### Performance Optimizations
- Object pooling for projectiles and particles
- Performance mode toggle reduces visual effects
- Damage numbers only show for hits >10 damage
- Batch rendering for particles by color
- Dynamic quality adjustments

### Audio System
- Web Audio API for procedural sound generation
- 3 shooting sound variations
- 2 hit sound variations  
- 2 explosion sound variations
- Achievement unlock fanfare
- Volume control and mute options

### Visual Effects Engine
- 5 particle types with unique physics
- Gradient-based explosion effects
- Screen shake for impacts
- Animated health bars
- Floating text system for damage/money
- Boss warning animations

## Game Files Structure

### Core Game Files
- **game_2player_working.html** - Latest working 2-player split-screen version with freeze ability
- **real_2player_mode.js** - Advanced 2-player system with competitive/cooperative modes
- **pvp_dynamics.js** - PvP features: unit sending, middle zone control, power surges
- **multitouch_coop.js** - Multi-touch support for simultaneous play
- **serve_ipad.py** - Python server script for iPad deployment

### Enhancement Files (Currently Disabled)
- **app_store_features.js** - Monetization and progression systems
- **game_assets.js** - Visual sprite system
- **visual_excellence.js** - GPU particles and dynamic lighting
- **enhanced_particles.js** - Simplified particle system

### Backup Files
- **game_original.html** - Last known stable version
- **game_backup_*.html** - Timestamped backups

## Troubleshooting

### Game Won't Load
1. **Check browser console** for JavaScript errors
2. **Use game_2player_working.html** - Most stable version
3. **Disable external scripts** - Comment out script includes if issues persist
4. **Clear browser cache** - Force reload with Cmd+Shift+R

### iPad Connection Issues
1. **Verify same WiFi network** - Both devices must be on same network
2. **Check firewall** - Mac firewall might block port 8000
3. **Try different browser** - Safari recommended for iPad
4. **Restart server** - Kill and restart `serve_ipad.py`

### Performance Issues
1. **Reduce particle effects** - Disable visual enhancements
2. **Lower enemy spawn rate** - Adjust wave timing
3. **Use game_ios.html** - Simplified version for older iPads
4. **Close other apps** - Free up iPad memory

## 2-Player Mode Features

### Freeze Ability Details
- **Cost**: $150 per use
- **Duration**: 5 seconds (opponent cannot place/upgrade towers)
- **Cooldown**: 20 seconds
- **Visual**: Frozen overlay with countdown timer
- **Strategy**: Time it before big waves or when opponent is low on defenses

### Competitive Mechanics
- **Split Screen**: Left player (P1) vs Right player (P2)
- **Separate Paths**: Each player defends their own lane
- **Independent Resources**: Own money, lives, towers
- **Victory Condition**: First to lose all lives loses

### Future PvP Features (Implemented but not integrated)
- **Attack Units**: Send enemies to opponent ($75-$400)
- **Power Surges**: Temporary abilities (double speed, mega damage, shield)
- **Middle Zone**: Contested area with bonus resources
- **Sabotage Actions**: Disable towers, steal money, speed boost enemies

## Important Notes
- The game logic is entirely contained in `game.html` - modifying game mechanics requires editing this file
- SwiftUI wrapper provides native macOS integration but game runs in web view
- Test coverage is minimal - tests are scaffolded but not implemented
- Project targets macOS 15.5+ with Swift 5.0
- Game is optimized for iOS/iPadOS touch controls
- All visual effects are canvas-based (no WebGL required)