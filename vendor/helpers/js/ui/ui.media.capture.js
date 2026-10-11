import { createElement } from "./ui.dom.js";
import { createActionModal } from "./ui.modal.js?v=0.21.235";
import { createToggleButton } from "./ui.toggle.button.js";
import { createIcon } from "./ui.icons.js?v=0.21.240";
import { createAudioGraph } from "./ui.audio.audiograph.js?v=0.21.62";
import { createAudioPlayer } from "./ui.audio.player.js?v=0.21.271";

// Own only streams acquired here. No caller/call-session streams are accepted.
export function captureMedia({ kind = "audio", signal, maxBytes = 25 * 1024 * 1024, maxDurationMs = 60000, mimeTypes, audioGraphOptions = {} } = {}) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(null); return; }
    let stream, recorder, timer, deadline, url, graphContext, graphSource, chunks = [], bytes = 0;
    let disposed = false, phase = "permission", result = null;
    const status = createElement("p", { text: "Requesting permission...", attrs: { role: "status", "aria-live": "polite" } });
    const error = createElement("p", { attrs: { role: "alert", hidden: "hidden" } });
    const preview = createElement(kind === "video" ? "video" : "audio", { attrs: { playsinline: "", "aria-label": "Recording preview" } });
    preview.style.maxWidth = "100%";
    preview.style.width = "100%";
    preview.style.display = "block";
    if (kind !== "video") preview.style.maxHeight = "45vh";
    const content = createElement("div", { className: "ui-chat-capture-content" }); content.append(status, preview, error);
    const playerHost = createElement("div", { className: "ui-chat-capture-player", attrs: { hidden: "hidden" } });
    if (kind === "audio") content.append(playerHost);
    let player = null, removePlayerEvents = null;
    function showAudioPlayer(durationMs) {
      playerHost.hidden = false;
      player = createAudioPlayer(playerHost, { durationMs }, {
        ariaLabel: "Recording preview playback",
        onTogglePlay(playing) {
          if (playing) preview.play().catch(() => {
            if (!disposed && phase === "preview" && player) {
              error.textContent = "Unable to play this recording. Try recording again."; error.hidden = false;
            }
          });
          else preview.pause();
        },
        onSeek(ms) { if (preview.readyState > 0) preview.currentTime = ms / 1000; },
      });
      const sync = () => player?.update({
        isPlaying: !preview.paused && !preview.ended,
        currentMs: preview.currentTime * 1000,
        durationMs: Number.isFinite(preview.duration) ? preview.duration * 1000 : durationMs,
      });
      const events = ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended"];
      events.forEach(name => preview.addEventListener(name, sync));
      removePlayerEvents = () => events.forEach(name => preview.removeEventListener(name, sync));
    }
    const graphHost = createElement("div", { className: "ui-chat-capture-graph" });
    if (kind === "audio") content.insertBefore(graphHost, preview);
    const graph = kind === "audio" ? createAudioGraph(graphHost, { role: "recording-input", roleLabel: "Microphone" }, {
      style: "classic-waveform", transparentBackground: true, ariaLabel: "Microphone input waveform",
      ...Object.fromEntries(['style', 'sensitivity', 'gateThreshold', 'attackMs', 'releaseMs', 'intensityCurve', 'freezeOnPause', 'transparentBackground', 'className', 'ariaLabel'].filter(key => audioGraphOptions?.[key] !== undefined).map(key => [key, audioGraphOptions[key]])),
      showMute: false, overlayHeader: false,
    }) : null;
    const controls = createElement("div", { className: "ui-chat-capture-control", attrs: { hidden: "hidden" } });
    const toggleHost = createElement("div");
    const attachButton = createElement("button", { className: "ui-button ui-chat-capture-attach", attrs: { type: "button", "aria-label": "Attach recording", title: "Attach recording", hidden: "hidden" } });
    attachButton.append(createIcon("actions.check"));
    controls.append(toggleHost, attachButton);
    content.append(controls);
    let toggleAction = null, attachAction = null;
    attachButton.addEventListener("click", () => { if (!disposed && phase === "preview") attachAction?.onClick(); });
    const toggle = createToggleButton(toggleHost, {
      icon: createIcon("media.record").outerHTML, ariaLabel: "Start recording", variant: "icon", tone: "danger",
      onChange() { if (!disposed) toggleAction?.onClick(); },
    });
    function setCaptureActions(actions) {
      const hadFocus = controls.contains(document.activeElement);
      toggleAction = actions.find(action => ["start", "stop", "retake"].includes(action.id));
      attachAction = actions.find(action => action.id === "attach");
      const playerActions = kind === "audio" && phase === "preview" && player;
      if (playerActions) player.update({}, { actions: actions.filter(action => ["retake", "attach"].includes(action.id)).map(action => ({
        id: action.id, label: action.label, icon: action.id === "retake" ? "media.record" : "actions.check",
        onClick() { if (!disposed && phase === "preview") action.onClick(); },
      })) });
      controls.hidden = Boolean(playerActions) || (!toggleAction && !attachAction);
      toggleHost.hidden = !toggleAction;
      attachButton.hidden = !attachAction;
      if (toggleAction) toggle.update({
        pressed: toggleAction.id === "stop", ariaLabel: toggleAction.label, tooltip: toggleAction.label,
        icon: createIcon(toggleAction.id === "stop" ? "media.stop" : "media.record").outerHTML,
      });
      modal.setActions([]);
      modal.setHeaderActions(actions.filter(action => !["start", "stop", "retake", "attach", "cancel", "discard"].includes(action.id)));
      if (hadFocus) (playerActions ? playerHost.querySelector("button") : toggleAction ? toggleHost.querySelector("button") : modal.refs?.headerActions?.querySelector("button"))?.focus();
    }
    function stopTracks() {
      graph?.attachAudioNode(null); graph?.setPlayback({ isPlaying: false, isLive: false, isActive: false });
      graphSource?.disconnect(); graphSource = null;
      if (graphContext) { void graphContext.close().catch(() => {}); graphContext = null; }
      stream?.getTracks().forEach(track => { track.onended = null; track.stop(); }); stream = null; preview.srcObject = null;
    }
    function cleanup() {
      removePlayerEvents?.(); removePlayerEvents = null;
      player?.destroy(); player = null; playerHost.hidden = true;
      preview.pause(); preview.removeAttribute("src");
      clearInterval(timer); clearTimeout(deadline);
      if (recorder) { recorder.ondataavailable = null; recorder.onstop = null; recorder.onerror = null; if (recorder.state !== "inactive") { try { recorder.stop(); } catch {} } }
      stopTracks(); chunks = [];
      if (url) { URL.revokeObjectURL(url); url = null; }
    }
    const cancel = () => { if (disposed) return; result = null; void modal.close({ reason: "cancel" }); };
    const modal = createActionModal({
      className: `ui-chat-capture ui-chat-capture-${kind}`,
      title: kind === "video" ? "Record video" : "Record audio", content, size: "md",
      closeOnEscape: true, closeOnBackdrop: false, showCloseButton: true,
      closeWhileBusy: true, escapeCloseWhileBusy: true,
      onBeforeClose() { disposed = true; cleanup(); graph?.destroy(); preview.pause(); },
      onClose() { signal?.removeEventListener("abort", cancel); window.removeEventListener("pagehide", cancel); toggle?.destroy(); modal.destroy(); resolve(result); },
    });
    function fail(message) {
      if (disposed) return;
      phase = "error"; result = null; cleanup(); modal.setBusy(false);
      status.hidden = false;
      status.textContent = "Nothing was attached. Your draft is unchanged.";
      error.textContent = message; error.hidden = false;
      setCaptureActions([{ id: "close", label: "Close", onClick: cancel, closeOnClick: false }]);
    }
    function start() {
      if (disposed || phase !== "ready") return false;
      try {
        if (graphContext?.state === "suspended") void graphContext.resume().catch(() => {});
        phase = "recording"; chunks = []; bytes = 0;
        recorder.ondataavailable = event => {
          if (disposed || phase === "error") return;
          if (event.data?.size) { bytes += event.data.size; if (bytes > maxBytes) { fail("Recording exceeds the attachment size limit. Record a shorter clip."); return; } chunks.push(event.data); }
        };
        recorder.onerror = () => fail("Recording failed. Check your device and try a new recording.");
        recorder.onstop = () => {
          if (disposed || phase === "error") return;
          clearInterval(timer); clearTimeout(deadline); stopTracks();
          const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || "" }); chunks = [];
          if (!blob.size || !blob.type || blob.size > maxBytes) { fail("The recording is empty, unsupported, or too large. Try a shorter recording in a supported browser."); return; }
          phase = "preview";
          const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: blob.type });
          url = URL.createObjectURL(blob); preview.src = url; preview.muted = false; preview.controls = kind === "video";
          if (kind === "audio") showAudioPlayer(Date.now() - began);
          status.textContent = "Preview your recording. Attach adds it to your draft; it does not send.";
          status.hidden = true;
          modal.setBusy(false);
          setCaptureActions([
            { id: "retake", label: "Record again", onClick() {
              if (disposed || phase !== "preview") return;
              phase = "permission"; result = null; cleanup();
              preview.pause(); preview.removeAttribute("src"); preview.load(); preview.controls = false;
              setCaptureActions([]); status.textContent = "Preparing recording..."; status.hidden = false;
              modal.setBusy(true, { message: "Preparing recording..." });
              void prepare(true);
            } },
            { id: "discard", label: "Discard", onClick: cancel, closeOnClick: false },
            { id: "attach", label: "Attach recording", variant: "primary", closeOnClick: false, onClick() { if (disposed || phase !== "preview") return; result = file; void modal.close({ reason: "attach" }); } },
          ]);
        };
        recorder.start(250);
        const began = Date.now();
        status.hidden = false;
        status.textContent = "Recording — 0 seconds";
        timer = setInterval(() => { status.textContent = `Recording — ${Math.floor((Date.now() - began) / 1000)} seconds`; }, 500);
        deadline = setTimeout(() => fail("Recording reached the duration limit. Record a shorter clip; this recording was not attached."), maxDurationMs);
        setCaptureActions([
          { id: "cancel", label: "Cancel recording", closeOnClick: false, onClick: cancel },
          { id: "stop", label: "Stop recording", variant: "primary", closeOnClick: false, onClick() {
            if (phase !== "recording") return; phase = "stopping"; clearInterval(timer); clearTimeout(deadline);
            status.textContent = "Preparing preview..."; modal.setBusy(true, { message: "Preparing preview..." });
            deadline = setTimeout(() => fail("The browser could not finish recording. Close this dialog and try again."), 10000);
            try { recorder.stop(); } catch { fail("Unable to finish recording. Try a new recording."); }
          } },
        ]);
      } catch { fail("Unable to start recording. Check device permissions and try again."); }
      return false;
    }
    modal.open(); modal.setBusy(true, { message: "Requesting camera/microphone permission..." });
    signal?.addEventListener("abort", cancel, { once: true });
    window.addEventListener("pagehide", cancel, { once: true });
    async function prepare(autoStart = false) {
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Recording is unavailable. Use HTTPS or localhost in a browser with camera/microphone recording support.");
        if (!(maxBytes > 0) || !(maxDurationMs > 0)) throw new Error("No recording allowance remains. Remove an attachment or check the configured limits.");
        const candidates = mimeTypes || (kind === "video" ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"] : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]);
        const mimeType = candidates.find(type => type.startsWith(kind + "/") && MediaRecorder.isTypeSupported(type));
        if (!mimeType) throw new Error("This browser cannot record an allowed media format. Try another supported browser or attach an existing file.");
        const acquired = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
        if (disposed) { acquired.getTracks().forEach(track => track.stop()); return; }
        stream = acquired;
        stream.getTracks().forEach(track => { track.onended = () => fail("The recording device disconnected. Reconnect it and start a new recording."); });
        recorder = new MediaRecorder(stream, { mimeType });
        if (graph) {
          const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextCtor) throw new Error("Microphone visualization is unavailable in this browser. Try a browser with Web Audio support.");
          graphContext = new AudioContextCtor();
          graphSource = graphContext.createMediaStreamSource(stream);
          graph.attachAudioNode(graphSource);
          graph.setPlayback({ isPlaying: true, isLive: true, isActive: true });
          // The graph connects only to its analyser, never to speakers.
          void graph.resume();
        }
        preview.srcObject = stream; preview.muted = true;
        if (kind === "video") void preview.play().catch(() => {});
        phase = "ready"; modal.setBusy(false);
        status.textContent = `Ready. Up to ${Math.floor(maxDurationMs / 1000)} seconds and ${(maxBytes / 1024 / 1024).toFixed(1)} MiB. Select Start recording.`;
        status.hidden = true;
        setCaptureActions([{ id: "cancel", label: "Cancel", onClick: cancel, closeOnClick: false }, { id: "start", label: "Start recording", variant: "primary", onClick: start, closeOnClick: false }]);
        if (autoStart) { start(); toggleHost.querySelector("button")?.focus(); }
      } catch (cause) {
        const messages = { NotAllowedError: "Camera/microphone access was denied. Allow access in browser site settings, then try again.", NotFoundError: "No camera/microphone was found. Connect a device and try again.", NotReadableError: "The device is unavailable or busy. Check other applications and try again." };
        fail(messages[cause?.name] || cause?.message || "Unable to prepare recording. Check your device and try again.");
      }
    }
    void prepare();
  });
}
