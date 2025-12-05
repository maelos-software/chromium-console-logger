# Distribution Guide

## Current Status

✅ **The tool is now installable as a global binary!**

## Installation Methods Available

### 1. ✅ Global npm Installation (Working Now)

```bash
npm install -g chromium-console-logger
chromium-console-logger --tui
```

**Status:** Fully functional
**Location:** `/opt/homebrew/bin/chromium-console-logger` (macOS with Homebrew)

### 2. ✅ npx (Working Now)

```bash
npx chromium-console-logger --tui
```

**Status:** Fully functional
**Requires:** Internet connection for first run

### 3. ✅ Local Installation (Working Now)

```bash
npm install chromium-console-logger
npx chromium-console-logger --tui
```

**Status:** Fully functional

### 4. 🚧 npm Registry (Ready to Publish)

To make it available to everyone:

```bash
npm login
npm publish
```

Then anyone can install with:
```bash
npm install -g chromium-console-logger
```

**Status:** Ready, just needs publishing

### 5. 🔮 Standalone Binaries (Future)

Create platform-specific binaries that don't require Node.js:

**Tools to use:**
- `pkg` - Package Node.js apps into executables
- `nexe` - Create standalone executables
- `caxa` - Bundle Node.js apps

**Example with pkg:**
```bash
npm install -g pkg
pkg package.json
```

This would create:
- `chromium-console-logger-macos`
- `chromium-console-logger-linux`
- `chromium-console-logger-win.exe`

**Status:** Not implemented yet

---

## Publishing to npm

### Prerequisites

1. Create npm account at https://www.npmjs.com/signup
2. Login: `npm login`
3. Verify: `npm whoami`

### Steps

1. **Update version:**
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Test locally:**
   ```bash
   npm run build
   npm test
   npm install -g .
   chromium-console-logger --tui
   ```

3. **Publish:**
   ```bash
   npm publish
   ```

   Or use the script:
   ```bash
   ./scripts/publish.sh
   ```

4. **Verify:**
   ```bash
   npm view chromium-console-logger
   npm install -g chromium-console-logger
   ```

### Package Scope

**Option 1: Unscoped (requires unique name)**
```json
{
  "name": "chromium-console-logger"
}
```

**Option 2: Scoped (under your username)**
```json
{
  "name": "@yourusername/chromium-console-logger"
}
```

Then publish with:
```bash
npm publish --access public
```

---

## Distribution Checklist

- [x] Package.json configured with bin entry
- [x] Build script creates dist/
- [x] Executable bin script created
- [x] README with installation instructions
- [x] Tests passing
- [x] Global installation tested
- [x] TUI mode working
- [ ] Published to npm registry
- [ ] GitHub repository created
- [ ] CI/CD setup (optional)
- [ ] Standalone binaries (future)

---

## Current File Structure

```
chromium-console-logger/
├── bin/
│   └── chromium-console-logger          # Executable entry point
├── dist/                                 # Compiled JavaScript
│   ├── index.js
│   ├── cdpClient.js
│   ├── logWriter.js
│   ├── tui-runner.mjs                   # TUI module
│   └── ...
├── src/                                  # TypeScript source
├── package.json                          # npm configuration
├── README.md                             # User documentation
├── INSTALL.md                            # Installation guide
└── DISTRIBUTION.md                       # This file
```

---

## What Users Get

When users install globally:

1. **Binary in PATH:** `chromium-console-logger`
2. **All dependencies:** Automatically installed
3. **Both modes:** Headless and TUI
4. **All features:** Filtering, rotation, reconnection

---

## Next Steps

### To Make Public

1. **Create GitHub repo:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/chromium-console-logger.git
   git push -u origin main
   ```

2. **Publish to npm:**
   ```bash
   npm publish
   ```

3. **Announce:**
   - Tweet about it
   - Post on Reddit (r/javascript, r/webdev)
   - Share on Hacker News
   - Write a blog post

### To Create Standalone Binaries

```bash
# Install pkg
npm install -g pkg

# Add to package.json
{
  "bin": "dist/index.js",
  "pkg": {
    "scripts": "dist/**/*.js",
    "assets": "dist/**/*",
    "targets": ["node18-macos-x64", "node18-linux-x64", "node18-win-x64"]
  }
}

# Build
pkg .
```

This creates binaries that users can download and run without Node.js!

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/chromium-console-logger/issues
- npm: https://www.npmjs.com/package/chromium-console-logger
