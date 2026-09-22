import { mkdirSync, writeFileSync } from "node:fs";

const debugBase = "http://127.0.0.1:9223";
const siteBase = "http://127.0.0.1:4173";
const outputDir = "/tmp/lihi-domain-fold-check";
mkdirSync(outputDir, { recursive: true });

const pages = [
  ["d", "version-d.html?domain=werwerasfsf.com", ".offer-perks"],
];

const viewports = [
  ["desktop", 1920, 1080, false],
  ["mobile", 414, 896, true],
];

function connect(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return {
    ready,
    close: () => socket.close(),
    send: async (method, params = {}) => {
      await ready;
      const messageId = ++id;
      const response = new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }));
      socket.send(JSON.stringify({ id: messageId, method, params }));
      return response;
    },
  };
}

for (const [sizeName, width, height, mobile] of viewports) {
  for (const [pageName, path, selector] of pages) {
    const target = await fetch(`${debugBase}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
    const cdp = connect(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    await cdp.send("Page.navigate", { url: `${siteBase}/${path}` });
    await new Promise((resolve) => setTimeout(resolve, 900));
    const { result } = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        const rect = element?.getBoundingClientRect();
        const addon = document.querySelector('.perk-selectable input[data-bundle-checkbox], .domain-row-link input[data-bundle-checkbox]');
        if (addon && !addon.checked) addon.click();
        return {
          width: innerWidth,
          height: innerHeight,
          importantBottom: rect ? Math.round(rect.bottom) : null,
          aboveFold: rect ? rect.bottom <= innerHeight : false,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          scrollHeight: document.documentElement.scrollHeight,
          addonTotal: document.querySelector('[data-bundle-total]')?.textContent || null
        };
      })()`,
      returnByValue: true,
    });
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    writeFileSync(`${outputDir}/${pageName}-${sizeName}.png`, Buffer.from(screenshot.data, "base64"));
    console.log(JSON.stringify({ page: pageName, viewport: sizeName, ...result.value }));
    cdp.close();
    await fetch(`${debugBase}/json/close/${target.id}`);
  }
}
