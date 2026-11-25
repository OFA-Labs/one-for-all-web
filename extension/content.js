// ONE FOR ALL agent overlay: double-tap Caps Lock on any page to open/close.
(() => {
  if (window.top !== window || window.__ofaAgent) return;
  window.__ofaAgent = true;

  const DOUBLE_TAP_MS = 400;
  const ORB_RATE = 3;
  const WORKSPACE_URL = "http://127.0.0.1:3000/";
  const isMac = /Mac/i.test(navigator.platform);

  let host = null;
  let ui = null;
  let open = false;
  let lastTap = 0;

  const css = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .cue {
      position: fixed; top: 10px; left: 50%; width: 46px; height: 46px;
      transform: translateX(-50%) scale(.4); opacity: 0; border-radius: 50%;
      background: radial-gradient(circle, #0b0f14 52%, transparent 54%),
        conic-gradient(from 0deg, #00ffa3, #00c8ff, #7a5cff, #00ffa3);
      box-shadow: 0 0 18px #00e5ff99, 0 0 40px #00ffa355;
      z-index: 2147483647; pointer-events: none;
    }
    .cue.on { animation: cue 900ms cubic-bezier(.2,.9,.3,1.2) forwards, spin 900ms linear; }
    @keyframes cue {
      0% { transform: translateX(-50%) scale(.4); opacity: 0; }
      25% { transform: translateX(-50%) scale(1.08); opacity: 1; }
      70% { transform: translateX(-50%) scale(1); opacity: 1; }
      100% { transform: translateX(-50%) scale(.6); opacity: 0; }
    }
    @keyframes spin { to { filter: hue-rotate(360deg); } }
    .panel {
      position: fixed; top: 8px; left: 50%; width: min(420px, calc(100vw - 32px));
      transform: translate(-50%, -16px); opacity: 0; pointer-events: none;
      transition: transform 220ms ease, opacity 220ms ease;
      background: rgba(10,12,16,.92); color: #f4f6f8; border-radius: 18px;
      border: 1px solid rgba(255,255,255,.12); padding: 16px;
      box-shadow: 0 18px 50px rgba(0,0,0,.45); backdrop-filter: blur(14px);
      z-index: 2147483646;
    }
    .panel.on { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
    .head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; letter-spacing: .3em; }
    .x { background: none; border: 0; color: #aab; font-size: 18px; cursor: pointer; }
    video { display: block; width: 120px; height: 120px; margin: 10px auto; border-radius: 50%;
      object-fit: cover; border: 1px solid rgba(255,255,255,.5); background: #000; }
    .reply { min-height: 20px; font-size: 13px; color: #c9d1d9; text-align: center; margin: 4px 0 10px; }
    .row { display: flex; gap: 8px; }
    input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.06); color: #fff; font-size: 14px; outline: none; }
    input:focus { border-color: #00c8ff; }
    button.b { padding: 0 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.08); color: #fff; font-size: 13px; cursor: pointer; }
    button.b.live { background: #00c8ff33; border-color: #00c8ff; }
    .foot { display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: #8b949e; }
    .foot a { color: #8bd5ff; text-decoration: none; }
    @media (prefers-reduced-motion: reduce) { .cue.on { animation-duration: 1ms; } .panel { transition: none; } }
  `;

  function build() {
    host = document.createElement("div");
    host.id = "ofa-agent-root";
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>${css}</style>
      <div class="cue"></div>
      <div class="panel" role="dialog" aria-label="ONE FOR ALL agent">
        <div class="head"><span>O F A</span><button class="x" aria-label="Close">×</button></div>
        <video muted loop playsinline preload="auto"
          poster="${chrome.runtime.getURL("media/orb-poster.webp")}"
          src="${chrome.runtime.getURL("media/orb.mp4")}"></video>
        <div class="reply">How can I help on this page?</div>
        <form class="row">
          <input placeholder="Ask or talk to your agent…" aria-label="Message" />
          <button type="button" class="b mic" title="Talk">🎤</button>
          <button type="button" class="b read" title="Read page aloud">🔊</button>
        </form>
        <div class="foot"><span>Caps Lock ×2 or Esc to close</span>
          <a href="${WORKSPACE_URL}" target="_blank" rel="noopener">Open workspace</a></div>
      </div>`;
    document.documentElement.appendChild(host);
    const $ = (s) => root.querySelector(s);
    ui = {
      cue: $(".cue"), panel: $(".panel"), video: $("video"),
      input: $("input"), reply: $(".reply"), mic: $(".mic"),
    };
    $(".x").onclick = () => toggle(false);
    $("form").onsubmit = (e) => {
      e.preventDefault();
      const text = ui.input.value.trim();
      if (!text) return;
      ui.input.value = "";
      // No backend exists yet: this is the same preview reply as the web app.
      ui.reply.textContent = `Preview: “${text}” — agent backend not connected yet.`;
    };
    $(".read").onclick = readPage;
    ui.mic.onclick = listen;
  }

  function toggle(next = !open) {
    if (!host) build();
    open = next;
    if (open) {
      ui.cue.classList.remove("on");
      void ui.cue.offsetWidth; // restart the cue animation
      ui.cue.classList.add("on");
      setTimeout(() => {
        if (!open) return;
        ui.panel.classList.add("on");
        ui.video.playbackRate = ORB_RATE;
        ui.video.play().catch(() => {});
        ui.input.focus();
      }, 450);
    } else {
      ui.panel.classList.remove("on");
      ui.video.pause();
      speechSynthesis.cancel();
      recognition?.stop();
    }
  }

  function readPage() {
    if (speechSynthesis.speaking) return speechSynthesis.cancel();
    const text = (String(window.getSelection()) || document.body.innerText || "")
      .trim().slice(0, 4000);
    if (!text) return;
    ui.reply.textContent = "Reading…";
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => (ui.reply.textContent = "Done reading.");
    speechSynthesis.speak(u);
  }

  let recognition = null;
  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return (ui.reply.textContent = "Voice input isn't supported here.");
    if (recognition) return recognition.stop();
    recognition = new SR();
    recognition.interimResults = true;
    ui.mic.classList.add("live");
    ui.reply.textContent = "Listening…";
    recognition.onresult = (e) => {
      ui.input.value = [...e.results].map((r) => r[0].transcript).join("");
    };
    recognition.onerror = () => (ui.reply.textContent = "Microphone unavailable.");
    recognition.onend = () => {
      ui.mic.classList.remove("live");
      recognition = null;
      if (ui.input.value) ui.reply.textContent = "Press Enter to send.";
    };
    recognition.start();
  }

  function onCaps(e) {
    if (e.code !== "CapsLock" && e.key !== "CapsLock") return;
    if (e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    const now = performance.now();
    if (now - lastTap < DOUBLE_TAP_MS) {
      lastTap = 0;
      toggle();
    } else lastTap = now;
  }

  window.addEventListener("keydown", onCaps, true);
  // macOS reports Caps Lock "off" as a keyup only, so count both edges there.
  if (isMac) window.addEventListener("keyup", onCaps, true);
  window.addEventListener("keydown", (e) => {
    if (open && e.key === "Escape") toggle(false);
  }, true);
})();
