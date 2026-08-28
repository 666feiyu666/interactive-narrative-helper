import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { access } from "node:fs/promises";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const WINDOWS_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function findChrome(explicitPath) {
  if (explicitPath) {
    if (!(await exists(explicitPath))) {
      throw new Error(`Browser executable does not exist: ${explicitPath}`);
    }
    return explicitPath;
  }

  for (const candidate of WINDOWS_CHROME_PATHS) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error("Chrome or Edge was not found; pass --chrome-path explicitly.");
}

async function findFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolve) => server.close(resolve));
  if (!port) throw new Error("Could not allocate a local browser-control port.");
  return port;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Browser control request failed: ${response.status}`);
  return response.json();
}

async function waitForBrowser(port, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch (error) {
      lastError = error;
      await wait(250);
    }
  }
  throw new Error(`Browser did not expose its control endpoint: ${lastError?.message ?? "timeout"}`);
}

async function getPageTarget(port) {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((target) => target.type === "page");
  if (page) return page;
  return fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
}

export class CdpPage {
  constructor(webSocketDebuggerUrl) {
    this.webSocketDebuggerUrl = webSocketDebuggerUrl;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketDebuggerUrl);
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("Network.enable");
    await this.send("Network.setBlockedURLs", {
      urls: [
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.gif",
        "*.webp",
        "*.avif",
        "*.svg",
        "*.mp3",
        "*.ogg",
        "*.wav",
        "*.mp4",
        "*.webm",
        "*.woff",
        "*.woff2",
        "*://itch.io/embed/*",
        "*://*.itch.io/embed/*",
        "*://itch.io/game/download/*",
        "*://*.itch.io/game/download/*",
      ],
    });
  }

  send(method, params = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Browser page connection is not open.");
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Page evaluation failed.");
    }
    return result.result?.value;
  }

  async navigate(url, timeoutMs = 45_000) {
    await this.send("Page.navigate", { url });
    const deadline = Date.now() + timeoutMs;
    let state;
    while (Date.now() < deadline) {
      try {
        state = await this.evaluate(`({
          href: location.href,
          readyState: document.readyState,
          hasBody: Boolean(document.body)
        })`);
        if (
          state?.hasBody &&
          state.href !== "about:blank" &&
          ["interactive", "complete"].includes(state.readyState)
        ) {
          await wait(1_000);
          return state;
        }
      } catch {
        // Navigation briefly destroys the old execution context; poll the new one.
      }
      await wait(250);
    }
    throw new Error(`Timed out loading ${url}; last state: ${JSON.stringify(state)}`);
  }

  close() {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.close();
  }
}

export async function launchBrowser({ executablePath, profileDirectory, headless = false }) {
  const browserPath = await findChrome(executablePath);
  const port = await findFreePort();
  const args = [
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profileDirectory}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-sync",
    "--blink-settings=imagesEnabled=false",
    "--new-window",
    "about:blank",
  ];
  if (headless) args.unshift("--headless=new", "--disable-gpu");
  const process = spawn(browserPath, args, { stdio: "ignore", windowsHide: headless });
  let page;

  try {
    await waitForBrowser(port);
    const target = await getPageTarget(port);
    page = new CdpPage(target.webSocketDebuggerUrl);
    await page.connect();
  } catch (error) {
    process.kill();
    throw error;
  }

  return {
    page,
    async close() {
      try {
        await page.send("Browser.close");
      } catch {
        process.kill();
      } finally {
        page.close();
      }
    },
  };
}

export { wait };
