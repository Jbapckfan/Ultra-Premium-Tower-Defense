# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Recent Major Updates (2024)

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

### iOS/Touch Optimizations
- Fully touch-based controls (no mouse/keyboard required)
- Multi-touch support for 2-player co-op
- Touch-friendly UI with larger buttons
- Click-outside-to-close for all modals
- Sell mode button for easy tower selling
- iPad keyboard support (optional)

### Visual Improvements
- Ultra HD particle effects with gradients and glows
- Boss explosions 3-4x larger than normal
- Smooth pulsing glow on tower selection (removed aggressive spinning)
- Red circular close buttons with rotation animation
- Boss health bar with animated shine effect
- Floating damage numbers (performance-aware)
- Money popup animations

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

## Important Notes
- The game logic is entirely contained in `game.html` - modifying game mechanics requires editing this file
- SwiftUI wrapper provides native macOS integration but game runs in web view
- Test coverage is minimal - tests are scaffolded but not implemented
- Project targets macOS 15.5+ with Swift 5.0
- Game is optimized for iOS/iPadOS touch controls
- All visual effects are canvas-based (no WebGL required)