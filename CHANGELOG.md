Changelog

All notable changes to ChatyPlayer will be documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning.

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