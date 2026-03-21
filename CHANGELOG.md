Changelog

All notable changes to ChatyPlayer will be documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning.



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