var T = Object.defineProperty;
var E = (r, t, e) => t in r ? T(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var f = (r, t, e) => E(r, typeof t != "symbol" ? t + "" : t, e);
import { ipcMain as h, app as c, BrowserWindow as P } from "electron";
import l from "node:path";
import { fileURLToPath as v } from "node:url";
import { SerialPort as R } from "serialport";
import D from "stream";
var _ = {}, u = {};
Object.defineProperty(u, "__esModule", { value: !0 });
u.DelimiterParser = void 0;
const O = D;
class j extends O.Transform {
  constructor({ delimiter: e, includeDelimiter: i = !1, ...o }) {
    super(o);
    f(this, "includeDelimiter");
    f(this, "delimiter");
    f(this, "buffer");
    if (e === void 0)
      throw new TypeError('"delimiter" is not a bufferable object');
    if (e.length === 0)
      throw new TypeError('"delimiter" has a 0 or undefined length');
    this.includeDelimiter = i, this.delimiter = Buffer.from(e), this.buffer = Buffer.alloc(0);
  }
  _transform(e, i, o) {
    let n = Buffer.concat([this.buffer, e]), a;
    for (; (a = n.indexOf(this.delimiter)) !== -1; )
      this.push(n.slice(0, a + (this.includeDelimiter ? this.delimiter.length : 0))), n = n.slice(a + this.delimiter.length);
    this.buffer = n, o();
  }
  _flush(e) {
    this.push(this.buffer), this.buffer = Buffer.alloc(0), e();
  }
}
u.DelimiterParser = j;
Object.defineProperty(_, "__esModule", { value: !0 });
var w = _.ReadlineParser = void 0;
const S = u;
class k extends S.DelimiterParser {
  constructor(t) {
    const e = {
      delimiter: Buffer.from(`
`, "utf8"),
      encoding: "utf8",
      ...t
    };
    typeof e.delimiter == "string" && (e.delimiter = Buffer.from(e.delimiter, e.encoding)), super(e);
  }
}
w = _.ReadlineParser = k;
const B = v(import.meta.url), I = l.dirname(B), d = /* @__PURE__ */ new Map();
process.env.APP_ROOT = l.join(I, "..");
const m = process.env.VITE_DEV_SERVER_URL, M = l.join(process.env.APP_ROOT, "dist-electron"), p = l.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = m ? l.join(process.env.APP_ROOT, "public") : p;
let s = null;
function b() {
  if (s = new P({
    icon: l.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: v(new URL("./preload.mjs", import.meta.url))
    }
  }), s.webContents.on("did-finish-load", () => {
    s == null || s.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), s.webContents.on("did-fail-load", (r, t, e) => {
    console.log("Failed to load:", t, e);
  }), m) {
    let r = 0;
    const t = 10, e = async () => {
      try {
        await (s == null ? void 0 : s.loadURL(m)), console.log("Successfully loaded dev server");
      } catch {
        r++, r < t ? (console.log(`Retrying to load dev server... (${r}/${t})`), setTimeout(e, 2e3)) : (console.error("Failed to load dev server after maximum retries, falling back to production build"), s == null || s.loadFile(l.join(p, "index.html")));
      }
    };
    setTimeout(e, 2e3);
  } else
    s.loadFile(l.join(p, "index.html"));
}
h.handle("serial:list", async () => {
  try {
    return { ok: !0, ports: await R.list() };
  } catch (r) {
    return { ok: !1, error: (r == null ? void 0 : r.message) ?? String(r) };
  }
});
h.handle("serial:open", async (r, t) => {
  const { path: e, baudRate: i = 9600 } = t;
  if (d.has(e)) return { ok: !0, message: "already open" };
  try {
    const o = new R({ path: e, baudRate: i, autoOpen: !1 }), n = o.pipe(new w({ delimiter: `\r
` }));
    return n.on("data", (a) => {
      r.sender.send("serial:data", { path: e, data: a });
    }), o.on("error", (a) => {
      r.sender.send("serial:error", { path: e, error: a.message });
    }), o.on("close", () => {
      r.sender.send("serial:closed", { path: e }), d.delete(e);
    }), await new Promise((a, y) => {
      o.open((g) => g ? y(g) : a());
    }), d.set(e, { port: o, parser: n }), { ok: !0 };
  } catch (o) {
    return { ok: !1, error: (o == null ? void 0 : o.message) ?? String(o) };
  }
});
h.handle("serial:close", async (r, t) => {
  const e = d.get(t);
  if (!e) return { ok: !1, error: "not open" };
  try {
    return await new Promise((i, o) => {
      e.port.close((n) => n ? o(n) : i());
    }), d.delete(t), { ok: !0 };
  } catch (i) {
    return { ok: !1, error: (i == null ? void 0 : i.message) ?? String(i) };
  }
});
c.on("before-quit", () => {
  for (const { port: r } of d.values())
    try {
      r.close();
    } catch {
    }
});
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), s = null);
});
c.on("activate", () => {
  P.getAllWindows().length === 0 && b();
});
c.whenReady().then(b);
export {
  M as MAIN_DIST,
  p as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
