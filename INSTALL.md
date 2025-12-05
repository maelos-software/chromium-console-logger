# Installation Guide

## Quick Install (Recommended)

```bash
npm install -g chromium-console-logger
chromium-console-logger --tui
```

---

## Installation Methods

### 1. Global Installation via npm

Install once, use anywhere:

```bash
npm install -g chromium-console-logger
```

Then run from any directory:

```bash
chromium-console-logger --tui
chromium-console-logger --verbose
chromium-console-logger --log-file ~/logs/browser.ndjson
```

**Uninstall:**
```bash
npm uninstall -g chromium-console-logger
```

---

### 2. Use with npx (No Installation Required)

Run directly without installing:

```bash
npx chromium-console-logger --tui
```

This downloads and runs the latest version each time.

---

### 3. Local Project Installation

Install in your project:

```bash
npm install chromium-console-logger
```

Add to package.json scripts:

```json
{
  "scripts": {
    "capture": "chromium-console-logger --tui",
    "capture-logs": "chromium-console-logger --log-file logs/browser.ndjson"
  }
}
```

Run with:

```bash
npm run capture
```

---

### 4. Install from Source

Clone and build from source:

```bash
# Clone the repository
git clone https://github.com/yourusername/chromium-console-logger.git
cd chromium-console-logger

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .

# Or link for development
npm link
```

**For development:**
```bash
npm link
# Now you can edit source and rebuild, changes will be available globally
npm run build
```

---

### 5. Standalone Binary (Coming Soon)

We're working on standalone binaries for macOS, Linux, and Windows that don't require Node.js.

---

## Verify Installation

Check if installed correctly:

```bash
chromium-console-logger --version
chromium-console-logger --help
```

---

## Publishing to npm (For Maintainers)

To publish this package to npm:

```bash
# Login to npm
npm login

# Publish
npm publish
```

For scoped packages:

```bash
npm publish --access public
```

---

## Platform-Specific Notes

### macOS

After global installation, the binary is typically at:
```
/usr/local/bin/chromium-console-logger
# or with Homebrew Node:
/opt/homebrew/bin/chromium-console-logger
```

### Linux

Binary location:
```
/usr/local/bin/chromium-console-logger
# or
~/.npm-global/bin/chromium-console-logger
```

Add to PATH if needed:
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

### Windows

Binary location:
```
%APPDATA%\npm\chromium-console-logger.cmd
```

---

## Troubleshooting

### Command not found after global install

**macOS/Linux:**
```bash
# Check npm global bin path
npm config get prefix

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$(npm config get prefix)/bin:$PATH"
```

**Windows:**
```cmd
# Check npm global path
npm config get prefix

# Add to PATH in System Environment Variables
```

### Permission errors on macOS/Linux

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g chromium-console-logger

# Option 2: Configure npm to use a different directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
npm install -g chromium-console-logger
```

### Module not found errors

Ensure you've built the project:
```bash
npm run build
```

---

## Next Steps

After installation, see:
- [README.md](README.md) - Usage guide
- [Quick Start](#quick-start) - Get started in 2 minutes

## Quick Start

1. **Launch browser with CDP:**
   ```bash
   # Vivaldi
   /Applications/Vivaldi.app/Contents/MacOS/Vivaldi --remote-debugging-port=9222
   
   # Or Chrome
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   
   # Or Brave
   /Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --remote-debugging-port=9222
   ```

2. **Start capture with TUI:**
   ```bash
   chromium-console-logger --tui
   ```

3. **Browse and watch events appear in real-time!**
