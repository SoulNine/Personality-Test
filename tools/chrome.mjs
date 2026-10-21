// Finds a local Chrome/Chromium for puppeteer-core. Override with CHROME_PATH=/path/to/chrome.
import { existsSync } from "node:fs";
export function chromePath() {
  const c = [process.env.CHROME_PATH,
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean);
  return c.find(p => existsSync(p)) || null;
}
