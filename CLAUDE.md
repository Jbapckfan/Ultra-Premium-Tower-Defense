# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Important Notes
- The game logic is entirely contained in `game.html` - modifying game mechanics requires editing this file
- SwiftUI wrapper provides native macOS integration but game runs in web view
- Test coverage is minimal - tests are scaffolded but not implemented
- Project targets macOS 15.5+ with Swift 5.0