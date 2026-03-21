# 🎬 ChatyPlayer

**ChatyPlayer** is a lightweight, modular, and secure **HTML5 video player** built with **TypeScript**.
It provides a modern UI, modular feature system, advanced playback controls, and a safe architecture designed for real-world production environments.

ChatyPlayer focuses on **performance, security, and extensibility**, making it suitable for modern web applications.

---

# ✨ Features

## 🎥 Core Playback

* Play / Pause
* Seek controls
* Volume control
* Playback speed adjustment
* Autoplay support
* Loop playback

---

## 📺 Player Modes

* Fullscreen mode
* Theater mode (viewport fill)
* Picture-in-Picture (PiP)
* Scroll-activated mini player

---

## 📊 Video Quality

* Multiple quality sources
* Automatic quality switching
* Buffer-based quality optimization
* Playback state preserved during switching

---

## 💬 Subtitles

* WebVTT subtitle support
* Multi-language subtitle tracks
* Safe subtitle loading
* Automatic subtitle positioning above controls

---

## 🧭 Navigation

* Video chapters
* Timeline segments
* Clickable chapter seeking
* Timestamp sharing (`?t=` or `#t=`)

---

## 🎮 Interaction Controls

* Keyboard shortcuts
* Touch gestures
* Double-tap seeking
* Swipe volume control

---

## 🧠 Smart Playback

* Resume playback from last position
* Local storage save system
* Timestamp link sharing

---

## ⚡ Performance

* Throttle utilities
* Auto-hide UI
* Efficient event system
* Optimized DOM operations

---

## 🔐 Security

* URL sanitization
* Safe DOM utilities
* Prototype pollution protection
* Safe storage wrapper
* No unsafe `innerHTML` usage

---

## 🧱 Architecture

ChatyPlayer uses a **modular architecture** that separates responsibilities into layers.

```
src
│
├── core
│   ├── Player engine
│   ├── State manager
│   ├── Event system
│   └── Lifecycle manager
│
├── features
│   ├── fullscreen
│   ├── gestures
│   ├── keyboard
│   ├── quality
│   ├── subtitles
│   ├── chapters
│   ├── speed
│   ├── resume
│   ├── timestamp
│   ├── theater
│   └── pip
│
├── ui
│   ├── controls
│   ├── timeline
│   ├── miniPlayer
│   ├── settings
│   ├── thumbnails
│   └── tooltips
│
├── api
│   └── publicAPI
│
├── utils
│   ├── storage
│   ├── throttle
│   ├── dom
│   ├── formats
│   ├── time
│   └── environment
│
└── styles
```

This structure keeps the player **maintainable, scalable, and extensible**.

---

# 📦 Basic Usage

### HTML

```html
<div id="player"></div>
```

---

### JavaScript / TypeScript

```ts
import { Player } from "chatyplayer";

const container = document.getElementById("player");

const player = new Player(container, {
  sources: [
    { src: "video-720.mp4", label: "720p" },
    { src: "video-1080.mp4", label: "1080p" }
  ],
  autoplay: false,
  loop: false
});
```

---

# ⚙️ Configuration

Example configuration:

```ts
const player = new Player(container, {
  sources: [
    { src: "video.mp4", label: "720p" }
  ],
  poster: "poster.jpg",
  autoplay: false,
  loop: false,
  muted: false,
  preload: "metadata"
});
```

---

# 🎛 Public API

ChatyPlayer exposes a safe public API.

```ts
player.play();
player.pause();
player.seek(30);
player.setVolume(0.5);
player.toggleFullscreen();
player.toggleTheater();
player.togglePiP();
player.setSpeed(1.5);
```

---

# 📡 Events

You can subscribe to player events.

```ts
player.api.on("play", () => {
  console.log("Video started");
});

player.api.on("pause", () => {
  console.log("Video paused");
});
```

Available events include:

* `ready`
* `play`
* `pause`
* `ended`
* `timeupdate`
* `fullscreenchange`
* `pipchange`
* `subtitlechange`

---

# ⌨ Keyboard Shortcuts

| Key         | Action        |
| ----------- | ------------- |
| Space / K   | Play / Pause  |
| J           | Seek backward |
| L           | Seek forward  |
| Arrow Left  | Seek backward |
| Arrow Right | Seek forward  |
| Arrow Up    | Volume up     |
| Arrow Down  | Volume down   |
| M           | Mute          |
| F           | Fullscreen    |

---

# 🧑‍💻 Development

Clone the repository:

```bash
git clone https://github.com/chatyshop/chatyplayer.git
```

Install dependencies:

```bash
npm install
```

Run development build:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

---

# 🤝 Contributing

Contributions are welcome.

If you find a bug or want to improve the player:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

# 📄 License

MIT License

---

# ⭐ Support

If you find ChatyPlayer useful, please consider **starring the repository** on GitHub.

---
