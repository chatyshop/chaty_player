Changelog

All notable changes to ChatyPlayer will be documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning.


## [1.0.5] – Stability & Demo Improvements

Release date: 25 Mar 2026

This release focuses on stability improvements, UI refinements, and better developer experience.

### 🛠 Fixed

* Fixed edge cases in subtitle positioning during rapid UI state changes
* Fixed thumbnail preview jitter and alignment inconsistencies
* Fixed minor UI sync issues when toggling menus and controls
* Improved handling of hover interactions on timeline

### 🎨 Improvements

* Improved thumbnail preview smoothness using optimized transforms
* Enhanced UI responsiveness across normal, theater, and fullscreen modes
* Minor visual refinements for controls and overlays
* Better consistency in subtitle rendering across different player states

### 🚀 Developer Experience

* Improved internal architecture for UI modules
* Cleaner separation between controls, timeline, and subtitle layers
* More stable event handling across features


---

## [1.0.4] – Subtitles & Thumbnail System Upgrade

Release date: 23 Mar 2026

This release introduces a fully custom subtitle engine and timeline thumbnail preview system, improving user experience and player interactivity.

### ✨ Added

* Custom subtitle rendering engine (WebVTT parser)
* Dynamic subtitle positioning based on controls visibility
* Subtitle language selector (custom UI menu)
* Timeline thumbnail preview (sprite-based)
* Hover preview with time indicator
* Support for multiple subtitle tracks with labels

### 🛠 Fixed

* Fixed subtitle position not updating when controls auto-hide
* Fixed subtitle overlap with settings and controls UI
* Fixed subtitle menu interaction issues
* Fixed thumbnail positioning and alignment issues
* Fixed UI update sync when menus open/close

### 🎨 Improvements

* Improved subtitle readability and styling
* Better subtitle scaling in mini player mode
* Smooth thumbnail animation using GPU transforms
* Enhanced timeline interaction feedback
* Cleaner UI layering (z-index fixes)

### 🔒 Security

* Safe subtitle URL sanitization (prevents unsafe protocols)
* XSS-safe subtitle text rendering

### 👨‍💻 Developer Experience

* Extended Player API:

  * `enableSubtitle(lang)`
  * `disableSubtitles()`
  * `getAvailableSubtitles()`
  * `getCurrentSubtitle()`
* Cleaner modular structure for subtitles and thumbnails
* Improved event-driven UI updates (`chatyplayer-ui-update`)

---



[1.0.3] – CSS & Rendering Fixes

Release date: 21 Mar 2026

This patch improves visual rendering and ensures consistent player display across environments.

Fixed
Fixed issue where player UI was not visible due to missing CSS load
Fixed layout issue causing collapsed player container
Fixed controls rendering inconsistencies
Improvements

Consolidated all styles into single export:

chatyplayer/styles/index.css
Improved default styling for better out-of-the-box experience
Reduced styling conflicts with external frameworks (Tailwind, etc.)
Developer Experience
Clearer CSS usage for CDN and npm users
Improved documentation for style imports


[1.0.2] – React Integration & Stability Update

Release date: 20 Mar 2026

This release focuses on improving compatibility with modern frameworks like React and fixing initialization timing issues.

Added
Improved support for manual initialization (ChatyPlayer.create)
Better handling of dynamic DOM rendering (React/Vite apps)
Safer initialization flow to avoid race conditions
Fixed
Fixed issue where player initialized before dataset (data-src) was available
Fixed "No supported video source found" error in SPA environments
Fixed duplicate initialization edge cases
Improvements
More reliable lifecycle handling for mount/unmount
Cleaner integration for framework-based apps

[1.0.1] – CDN & Distribution Update

Release date: 18 Mar 2026

This patch release improves distribution, CDN support, and package configuration without affecting core functionality.

Added
CDN Support

Added jsDelivr CDN compatibility via GitHub

UMD build exposed for direct browser usage

Support for global `window.ChatyPlayer`

Package Improvements

Added "unpkg" and "jsdelivr" fields for CDN resolution

Added CSS export (`chatyplayer/style.css`)

Improved TypeScript type resolution (typesVersions)

Publishing Improvements

Ensured only production-ready files are included via "files"

Added publishConfig for safe public npm publishing

Improved module exports for better compatibility (ESM + CJS)

Fixed
Distribution Issues

Fixed issue where ChatyPlayer was not accessible when loaded via script tag

Resolved incorrect asset loading paths in Vite environments

Ensured UMD build loads correctly outside bundlers

Notes

No breaking changes

Fully backward compatible with v1.0.0

Recommended update for all users using CDN or direct script integration

[1.0.0] – Initial Release

Release date: 2026

First stable release of ChatyPlayer, a lightweight modular HTML5 video player built with TypeScript.

Added
Core Player

Secure HTML5 video player engine

Modular architecture

Safe initialization and lifecycle handling

Event emitter system

Internal state manager

Playback Features

Play / Pause

Seek controls

Volume control

Playback speed adjustment

Loop playback support

Player Modes

Fullscreen mode

Theater mode (viewport fill)

Picture-in-Picture (PiP)

Scroll activated mini player

Smart Playback

Resume playback from last position

Timestamp sharing via URL (?t= and #t=)

Video Quality

Multi-resolution video support

Automatic quality switching

Buffer-aware quality optimization

Playback state preserved during switching

Subtitles

WebVTT subtitle support

Multiple language tracks

Safe subtitle loading

Automatic subtitle positioning above controls

Navigation

Chapter markers on timeline

Clickable chapter segments

Chapter highlighting during playback

Interaction Controls

Keyboard shortcuts

Touch gestures

Double-tap seek

Swipe volume control

UI Components

Custom controls UI

Timeline progress bar

Settings panel

Tooltips

Thumbnail preview system

Dark and light themes

Security

Safe DOM utilities

URL sanitization

Prototype pollution protection

Secure storage wrapper

No unsafe HTML injection

Utilities

Throttle utility for performance optimization

Time formatting utilities

Environment detection

Video format detection

Safe localStorage wrapper

Developer API

Public player API

Event subscription system

Plugin-friendly architecture

Architecture

ChatyPlayer uses a modular architecture:

src
├── core
├── features
├── ui
├── api
├── utils
└── styles

This structure allows features to be developed independently while maintaining performance and maintainability.

License

MIT License
© 2026 Chaty Technologies
https://chatyshop.com