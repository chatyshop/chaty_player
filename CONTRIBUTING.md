# Contributing to ChatyPlayer

Thank you for your interest in contributing to **ChatyPlayer**! 🎬
We welcome contributions that help improve the player, fix bugs, add features, or enhance documentation.

ChatyPlayer is developed and maintained by **Chaty Technologies**.

---

## Code of Conduct

Please be respectful and constructive when participating in this project.

* Be respectful to all contributors.
* Provide clear explanations for suggestions.
* Focus on improving the project.

---

## How to Contribute

### 1. Fork the Repository

Click **Fork** on the GitHub repository to create your own copy.

---

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/chatyplayer.git
cd chatyplayer
```

---

### 3. Create a Branch

Create a branch for your change.

```bash
git checkout -b feature/your-feature-name
```

Examples:

```
feature/subtitle-improvements
fix/seek-bug
docs/readme-update
```

---

### 4. Make Your Changes

Ensure your code follows the project standards:

* Use **TypeScript**
* Maintain **modular architecture**
* Avoid unsafe DOM manipulation
* Follow existing code patterns
* Keep features **isolated and reusable**

---

### 5. Test Your Changes

Before submitting a pull request, ensure:

* The player builds successfully
* Existing functionality works
* No console errors appear
* Code is formatted properly

Run development build:

```bash
npm run dev
```

Run production build:

```bash
npm run build
```

---

### 6. Commit Your Changes

Write clear commit messages.

Example:

```
feat: add improved subtitle positioning
fix: resolve quality switch playback issue
docs: update README installation section
```

Commit:

```bash
git commit -m "feat: your feature description"
```

---

### 7. Push Your Branch

```bash
git push origin feature/your-feature-name
```

---

### 8. Open a Pull Request

Go to your fork on GitHub and open a **Pull Request**.

Include:

* Clear description of changes
* Screenshots (if UI changes)
* Steps to test

---

## Contribution Guidelines

Please follow these guidelines when contributing:

### Code Style

* Use **TypeScript**
* Use **strict typing**
* Avoid `any` when possible
* Follow existing project structure

### Security

ChatyPlayer prioritizes safe coding practices:

* No unsafe `innerHTML`
* Validate external URLs
* Avoid DOM injection risks

### Performance

* Avoid unnecessary DOM updates
* Use throttling where appropriate
* Keep features lightweight

---

## Feature Requests

If you want to suggest a feature:

1. Open an **Issue**
2. Explain the use case
3. Provide examples if possible

---

## Bug Reports

When reporting a bug, include:

* Browser and version
* Operating system
* Steps to reproduce
* Expected behavior
* Actual behavior

---

## Project Structure

ChatyPlayer follows a modular architecture:

```
src
├── core
├── features
├── ui
├── api
├── utils
└── styles
```

Please place new code in the appropriate module.

---

## License

By contributing to this project, you agree that your contributions will be licensed under the **MIT License** used by this repository.

---

## Thank You ❤️

Your contributions help improve **ChatyPlayer** and make it better for the developer community.

Developed by **Chaty Technologies**
https://chatyshop.com
