
# 📘 PROMPT FOR LLM — Build the “Vivaldi Console Capture” Tool (CDP → NDJSON Logger)

## SYSTEM / ROLE INSTRUCTIONS
You are an expert full-stack engineer specializing in:
- Node.js + TypeScript
- Chrome DevTools Protocol (CDP)
- CLI tools
- macOS developer workflows
- Robust logging, reconnection logic, and developer tooling

You must produce **production-quality code**, organized into a real project, with correct TypeScript types, error handling, documentation, and a fully functional CLI.

You must follow the specification below **exactly** and generate **no placeholders** and **no pseudo-code**.  
All code must be complete, runnable, and integrated.

---

## PRIMARY OBJECTIVE
Build a standalone **local developer tool** called:

```
vivaldi-console-capture
```

This tool:

1. Connects to a **Chromium browser** (Vivalid, Chrome, Brave, Edge) via the **Chrome DevTools Protocol**.
2. Subscribes to JavaScript console events (`console.log`, `console.warn`, `console.error`, etc.).
3. Subscribes to uncaught exceptions.
4. Streams these events into a **local NDJSON file**.
5. Automatically **reconnects** if the browser restarts.
6. Provides a clean, robust **CLI interface** with multiple configuration flags.
7. Is implemented in **Node.js + TypeScript**, compiled into a `dist/` folder, and runnable as a CLI via a bin entry.

---

## FUNCTIONAL REQUIREMENTS

### 1. CDP CONNECTION REQUIREMENTS

**Default behavior**
- Host: `127.0.0.1`
- Port: `9222`
- Attach to the **first “page” target**

**Reconnection rules**
- Retry with exponential backoff up to 5 seconds
- Never exit unless SIGINT
- Detect target closure and reattach
- Detect browser restart and reconnect seamlessly

**Target selection**
```
--target-url-substring <string>
```

---

### 2. EVENT CAPTURE REQUIREMENTS

**Console events**
Use `Runtime.consoleAPICalled` to capture:
- log
- info
- warn
- error
- debug
- trace

**Exceptions**
Use `Runtime.exceptionThrown` to capture full exception details.

**Serialization rules**
- Every event is **one NDJSON line**
- If argument can't serialize → stringify safely
- Include:
  - `ts` (epoch ms)
  - `event` ("console" | "exception")
  - `type`
  - `url`
  - `stackTrace` if available
  - `args` array

---

### 3. LOG FILE REQUIREMENTS

**Defaults**
- `browser-console.ndjson` in CWD

**CLI flags**
```
--log-file <path>
--host <string>
--port <number>
--include-console <bool>
--include-exceptions <bool>
--level <string>
--verbose
--target-url-substring <string>
--max-size-bytes <N>
--rotate-keep <count>
```

**Rotation**
- If file exceeds `--max-size-bytes`:
  - rename to `<filename>.1`
  - keep up to `rotate-keep` rotated files

---

### 4. CLI REQUIREMENTS

**Basic usage**
```
npx vivaldi-console-capture
```

**Examples**
```
vivaldi-console-capture --verbose
vivaldi-console-capture --log-file logs/out.ndjson
vivaldi-console-capture --level error --level warn
vivaldi-console-capture --target-url-substring myapp
```

Verbose logs must include connection, reconnection, rotation, and attachment messages.

---

## PROJECT ARCHITECTURE

```
project-root/
  package.json
  tsconfig.json
  README.md
  bin/
    vivaldi-console-capture
  src/
    index.ts
    cdpClient.ts
    logWriter.ts
    types.ts
    util.ts
```

**cdpClient.ts**
- CDP connection logic
- Target selection
- Reconnection logic
- Emits normalized events

**logWriter.ts**
- Append NDJSON
- Rotation
- Flush on SIGINT

**index.ts**
- CLI parsing
- Wires CDP events to log writer

---

## VALIDATION REQUIREMENTS

### A. Functional
- Running Vivaldi with `--remote-debugging-port=9222` +
  running `vivaldi-console-capture` must reliably connect.

### B. Event Capture
Running this in DevTools:
```js
console.log("hello");
console.error("boom");
throw new Error("fatal");
```
Must append three lines of **valid NDJSON**.

### C. Reconnection
- Closing the browser must NOT crash the tool.
- Reopening must reconnect automatically.

### D. Logging
- All lines are valid individual JSON objects.
- No multiline output.
- Rotation works as configured.

### E. Code Quality
- Strict TypeScript
- No TODOs, placeholders, or stub functions

### F. README
Must include:
- Purpose
- Installation
- Launching with CDP
- CLI usage examples
- NDJSON output samples
- Troubleshooting

---

## IMPLEMENTATION GUIDELINES

**DO**
- Use async/await cleanly
- Handle all CDP errors
- Add comments for non-trivial code
- Use safe JSON serialization utilities

**DO NOT**
- Skip error handling
- Generate incomplete code
- Use experimental or unstable dependencies

---

## FINAL OUTPUT EXPECTATIONS

The LLM must generate:

1. A complete TypeScript project with all code implemented.
2. A functioning CLI in `bin/vivaldi-console-capture`.
3. A polished README.
4. Two macOS helper scripts:
   - `launch-vivaldi-with-cdp.command`
   - `start-logger.command`
5. All code fully runnable via:

```
npm install
npm run build
npx vivaldi-console-capture
```

---

# ✔️ END OF PROMPT (for the LLM to execute)
