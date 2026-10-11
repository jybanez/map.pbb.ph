import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createAudioGraph } from "./ui.audio.audiograph.js";

const DEFAULT_OPTIONS = {
  items: [],
  index: 0,
  open: false,
  fit: "contain", // contain | cover | original
  zoomStep: 0.2,
  minZoom: 1,
  maxZoom: 6,
  wheelZoom: true,
  pinchZoom: true,
  panWhenZoomed: true,
  loop: false,
  showHeader: true,
  showFooter: true,
  showCounter: true,
  showClose: true,
  showPrevNext: true,
  showToolbar: true,
  keyboard: true,
  trapFocus: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  autoplayVideo: true,
  mutedVideo: false,
  loopVideo: false,
  showVideoControls: true,
  showAudiograph: false,
  audiographStyle: "neon",
  audiographSensitivity: 3.4,
  className: "",
  baseUrl: "",
  ariaLabel: "Media viewer",
  onOpen: null,
  onChange: null,
  onClose: null,
  onZoomChange: null,
};

const tabbableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "video[controls]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function createMediaViewer(container, options = {}) {
  const events = createEventBag();
  let currentOptions = normalizeOptions(options);
  let currentItems = normalizeItems(currentOptions.items, currentOptions);
  let isOpen = Boolean(currentOptions.open);
  let activeIndex = clampIndex(currentOptions.index, currentItems.length);
  let fit = currentOptions.fit;
  let zoom = currentOptions.minZoom;
  let panX = 0;
  let panY = 0;
  let focusReturnEl = null;
  let dragState = null;
  const pointers = new Map();
  let pinchState = null;
  let mediaGraphApi = null;
  let mediaEvents = createEventBag();

  let shell = null;
  let dialog = null;
  let titleEl = null;
  let counterEl = null;
  let bodyEl = null;
  let viewport = null;
  let transformLayer = null;
  let panLayer = null;
  let mediaHost = null;
  let panSurface = null;
  let toolbar = null;
  let footer = null;
  let prevBtn = null;
  let nextBtn = null;
  let closeBtn = null;
  let zoomInBtn = null;
  let zoomOutBtn = null;
  let resetBtn = null;
  let fitContainBtn = null;
  let fitCoverBtn = null;
  let fitOriginalBtn = null;
  let audiographHost = null;
  let mediaEl = null;

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    clearGesture();
    pauseVideo();
    events.clear();
    mediaEvents.clear();
    destroyGraph();
    clearNode(container);

    shell = createElement("div", {
      className: [
        "ui-media-viewer-shell",
        isOpen ? "is-open" : "",
      ].filter(Boolean).join(" "),
    });
    const backdrop = createElement("div", { className: "ui-media-viewer-backdrop" });
    dialog = createElement("section", {
      className: `ui-media-viewer ${currentOptions.className || ""}`.trim(),
      attrs: {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": currentOptions.ariaLabel,
        tabindex: "-1",
      },
    });

    if (currentOptions.showHeader) {
      const header = createElement("div", { className: "ui-media-viewer-header" });
      const headingWrap = createElement("div", { className: "ui-media-viewer-heading" });
      titleEl = createElement("p", { className: "ui-media-viewer-title" });
      counterEl = createElement("p", { className: "ui-media-viewer-counter" });
      headingWrap.append(titleEl);
      if (currentOptions.showCounter) {
        headingWrap.appendChild(counterEl);
      }
      header.appendChild(headingWrap);
      if (currentOptions.showClose) {
        closeBtn = createElement("button", {
          className: "ui-button ui-button-ghost ui-media-viewer-close",
          html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 1 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4l-4.9-4.9 4.9-4.9a1 1 0 0 0 0-1.4z"></path></svg>',
          attrs: { type: "button", "aria-label": "Close media viewer" },
        });
        events.on(closeBtn, "click", () => close());
        header.appendChild(closeBtn);
      }
      dialog.appendChild(header);
    }

    bodyEl = createElement("div", { className: "ui-media-viewer-body" });
    prevBtn = createElement("button", {
      className: "ui-button ui-button-ghost ui-media-viewer-nav ui-media-viewer-nav-prev",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 4.5L8 12l7.5 7.5-1.5 1.5L5 12l9-9z"></path></svg>',
      attrs: { type: "button", "aria-label": "Previous media" },
    });
    nextBtn = createElement("button", {
      className: "ui-button ui-button-ghost ui-media-viewer-nav ui-media-viewer-nav-next",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 19.5L16 12 8.5 4.5 10 3l9 9-9 9z"></path></svg>',
      attrs: { type: "button", "aria-label": "Next media" },
    });
    events.on(prevBtn, "click", () => prev());
    events.on(nextBtn, "click", () => next());

    viewport = createElement("div", {
      className: "ui-media-viewer-viewport",
      attrs: { role: "group", tabindex: "0", "aria-label": "Media viewport" },
    });
    transformLayer = createElement("div", { className: "ui-media-viewer-transform" });
    panLayer = createElement("div", { className: "ui-media-viewer-pan-layer" });
    mediaHost = createElement("div", { className: "ui-media-viewer-media-host" });
    panSurface = createElement("div", {
      className: "ui-media-viewer-pan-surface",
      attrs: { "aria-hidden": "true" },
    });
    panLayer.appendChild(mediaHost);
    transformLayer.appendChild(panLayer);
    viewport.append(transformLayer, panSurface);
    bodyEl.append(prevBtn, viewport, nextBtn);
    dialog.appendChild(bodyEl);

    if (currentOptions.showToolbar) {
      toolbar = createElement("div", { className: "ui-media-viewer-toolbar" });
      zoomOutBtn = createElement("button", { className: "ui-button ui-button-ghost", text: "-", attrs: { type: "button", "aria-label": "Zoom out" } });
      zoomInBtn = createElement("button", { className: "ui-button ui-button-ghost", text: "+", attrs: { type: "button", "aria-label": "Zoom in" } });
      resetBtn = createElement("button", { className: "ui-button ui-button-ghost", text: "Reset", attrs: { type: "button" } });
      fitContainBtn = createElement("button", { className: "ui-button ui-button-ghost", text: "Contain", attrs: { type: "button" } });
      fitCoverBtn = createElement("button", { className: "ui-button ui-button-ghost", text: "Cover", attrs: { type: "button" } });
      fitOriginalBtn = createElement("button", { className: "ui-button ui-button-ghost", text: "Original", attrs: { type: "button" } });
      events.on(zoomOutBtn, "click", () => zoomOut());
      events.on(zoomInBtn, "click", () => zoomIn());
      events.on(resetBtn, "click", () => resetView());
      events.on(fitContainBtn, "click", () => setFit("contain"));
      events.on(fitCoverBtn, "click", () => setFit("cover"));
      events.on(fitOriginalBtn, "click", () => setFit("original"));
      toolbar.append(zoomOutBtn, zoomInBtn, resetBtn, fitContainBtn, fitCoverBtn, fitOriginalBtn);
      dialog.appendChild(toolbar);
    }

    audiographHost = createElement("div", { className: "ui-media-viewer-audiograph-host" });
    dialog.appendChild(audiographHost);

    footer = createElement("footer", { className: "ui-media-viewer-footer" });
    dialog.appendChild(footer);

    shell.append(backdrop, dialog);
    container.appendChild(shell);

    events.on(backdrop, "click", () => {
      if (currentOptions.closeOnBackdrop) {
        close();
      }
    });
    events.on(document, "keydown", onDocumentKeyDown);
    events.on(viewport, "wheel", onViewportWheel, { passive: false });
    events.on(viewport, "pointerdown", onViewportPointerDown);
    events.on(window, "pointermove", onViewportPointerMove, { passive: false });
    events.on(window, "pointerup", onViewportPointerUp);
    events.on(window, "pointercancel", onViewportPointerCancel);
    events.on(viewport, "lostpointercapture", (event) => {
      // Moving implicit capture from a media child to this surface is not cancellation.
      if (event.target === viewport) onViewportPointerCancel(event);
    });
    events.on(window, "blur", clearGesture);
    events.on(document, "fullscreenchange", clearGesture);

    syncUi();
  }

  function renderCurrentItem({ emitChange = true, emitOpen = false } = {}) {
    if (!mediaHost || !footer || !audiographHost) {
      return;
    }
    clearGesture();
    pauseVideo();
    mediaEvents.clear();
    destroyGraph();
    clearNode(mediaHost);
    clearNode(footer);
    clearNode(audiographHost);
    mediaEl = null;

    const item = currentItems[activeIndex] || null;
    if (!item) {
      titleEl && (titleEl.textContent = "No media");
      counterEl && (counterEl.textContent = "0 / 0");
      syncUi();
      return;
    }

    titleEl && (titleEl.textContent = item.title || `${item.type === "video" ? "Video" : "Photo"} ${activeIndex + 1}`);
    counterEl && (counterEl.textContent = `${activeIndex + 1} / ${currentItems.length}`);

    mediaHost.classList.toggle("is-image", item.type === "image");
    mediaHost.classList.toggle("is-video", item.type === "video");

    if (item.type === "video") {
      mediaEl = createElement("video", {
        className: "ui-media-viewer-media ui-media-viewer-video",
        attrs: {
          src: item.srcUrl,
          poster: item.posterUrl || null,
          controls: currentOptions.showVideoControls ? "controls" : null,
          muted: currentOptions.mutedVideo ? "muted" : null,
          loop: currentOptions.loopVideo ? "loop" : null,
          playsinline: "playsinline",
          preload: "metadata",
          "aria-label": item.alt || item.title || `Video ${activeIndex + 1}`,
        },
      });
      mediaHost.appendChild(mediaEl);
      renderVideoTracks(mediaEl, item.tracks);
      bindVideoState(item);
      mediaEvents.on(mediaEl, "webkitbeginfullscreen", clearGesture);
      mediaEvents.on(mediaEl, "loadedmetadata", () => syncUi());
      if (currentOptions.showAudiograph) {
        mediaGraphApi = createAudioGraph(audiographHost, {
          role: "video",
          roleLabel: "Video audio",
          muted: currentOptions.mutedVideo,
          isPlaying: false,
          currentMs: 0,
          durationMs: 0,
        }, {
          ariaLabel: "Video audio graph",
          style: currentOptions.audiographStyle,
          sensitivity: currentOptions.audiographSensitivity,
          showMute: false,
        });
        mediaGraphApi.attachAudio(mediaEl);
      }
      if (currentOptions.autoplayVideo && isOpen) {
        mediaEl.play?.().catch(() => {});
      }
    } else {
      mediaEl = createElement("img", {
        className: "ui-media-viewer-media ui-media-viewer-image",
        attrs: {
          src: item.srcUrl,
          alt: item.alt,
          draggable: "false",
        },
      });
      mediaHost.appendChild(mediaEl);
      mediaEvents.on(mediaEl, "load", () => syncUi());
    }

    renderFooter(item);
    resetView({ emit: false });
    syncUi();

    if (emitOpen && typeof currentOptions.onOpen === "function") {
      currentOptions.onOpen(item, activeIndex);
    }
    if (emitChange && typeof currentOptions.onChange === "function") {
      currentOptions.onChange(item, activeIndex);
    }
  }

  function renderFooter(item) {
    if (!footer) {
      return;
    }
    const hasMetadata = item && item.metadata && typeof item.metadata === "object" && Object.keys(item.metadata).length;
    footer.hidden = !currentOptions.showFooter || !hasMetadata;
    if (footer.hidden || !hasMetadata) {
      return;
    }
    const metaGrid = createElement("dl", { className: "ui-media-viewer-meta" });
    Object.entries(item.metadata).forEach(([key, value]) => {
      metaGrid.appendChild(createElement("dt", { text: prettifyKey(key) }));
      metaGrid.appendChild(createElement("dd", { text: value == null ? "-" : String(value) }));
    });
    footer.appendChild(metaGrid);
  }

  function bindVideoState(item) {
    if (!(mediaEl instanceof HTMLMediaElement)) {
      return;
    }
    const syncPlayback = () => {
      mediaGraphApi?.setPlayback({
        isPlaying: !mediaEl.paused && !mediaEl.ended,
        currentMs: Math.round((mediaEl.currentTime || 0) * 1000),
        durationMs: Math.round((Number(mediaEl.duration) || Number(item.duration) || 0) * 1000),
      });
    };
    mediaEvents.on(mediaEl, "play", () => {
      mediaGraphApi?.unlockAudioContext?.();
      syncPlayback();
    });
    mediaEvents.on(mediaEl, "pause", syncPlayback);
    mediaEvents.on(mediaEl, "ended", syncPlayback);
    mediaEvents.on(mediaEl, "timeupdate", syncPlayback);
    mediaEvents.on(mediaEl, "loadedmetadata", syncPlayback);
  }

  function renderVideoTracks(videoEl, tracks = []) {
    (Array.isArray(tracks) ? tracks : []).forEach((track) => {
      const trackEl = createElement("track", {
        attrs: {
          kind: track.kind,
          src: track.src,
          srclang: track.srclang,
          label: track.label,
          default: track.default ? "default" : null,
        },
      });
      videoEl.appendChild(trackEl);
    });
  }

  function onDocumentKeyDown(event) {
    if (!isOpen) {
      return;
    }
    if (event.key === "Tab" && currentOptions.trapFocus) {
      trapDialogFocus(event);
      return;
    }
    if (!currentOptions.keyboard) {
      return;
    }
    if (event.key === "Escape" && currentOptions.closeOnEscape) {
      event.preventDefault();
      close();
      return;
    }
    if (event.target?.closest?.("video[controls]")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomIn();
      return;
    }
    if (event.key === "-") {
      event.preventDefault();
      zoomOut();
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      resetView();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setIndex(currentItems.length - 1);
    }
  }

  function trapDialogFocus(event) {
    if (!dialog) {
      return;
    }
    const focusable = getFocusable(dialog);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onViewportWheel(event) {
    if (!isOpen || !currentOptions.wheelZoom) {
      return;
    }
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoom(zoom + (direction * currentOptions.zoomStep));
  }

  function capturePointer(id) {
    try { viewport?.setPointerCapture?.(id); } catch (_) { /* Pointer may already be released. */ }
  }

  function clearGesture() {
    const ids = [...pointers.keys()];
    pointers.clear();
    dragState = null;
    pinchState = null;
    panLayer?.classList.remove("is-panning");
    for (const id of ids) {
      try { if (viewport?.hasPointerCapture?.(id)) viewport.releasePointerCapture(id); } catch (_) { /* Detached surface. */ }
    }
  }

  function pinchGeometry() {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return null;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(b.x - a.x, b.y - a.y) };
  }

  function rebaseGesture() {
    pinchState = pointers.size === 2 ? pinchGeometry() : null;
    const first = pointers.entries().next().value;
    dragState = first && pointers.size === 1 ? {
      pointerId: first[0], startX: first[1].x, startY: first[1].y,
      panStartX: panX, panStartY: panY, allowPan: first[1].allowPan,
    } : null;
  }

  function onViewportPointerDown(event) {
    if (!isOpen || !mediaEl || event.button !== 0 || pointers.size >= 2) return;
    if (document.fullscreenElement === mediaEl || mediaEl.webkitDisplayingFullscreen) return;
    if (event.target?.closest?.("button, input, select, textarea, a, [role=slider]")) return;
    const touch = event.pointerType === "touch";
    const nativeVideo = Boolean(event.target?.closest?.("video[controls]"));
    // Observe touch on inline video without consuming its single-pointer native controls.
    const allowPan = !nativeVideo && currentOptions.panWhenZoomed && canPan(zoom);
    if (!(touch && currentOptions.pinchZoom) && !allowPan) return;
    if (pointers.size && (!touch || !currentOptions.pinchZoom || [...pointers.values()].some(p => p.type !== "touch"))) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType, allowPan });
    if (pointers.size === 2) {
      for (const [id, point] of pointers) { point.allowPan = true; capturePointer(id); }
      event.preventDefault();
    } else if (allowPan) {
      event.preventDefault();
      capturePointer(event.pointerId);
    }
    rebaseGesture();
  }

  function onViewportPointerMove(event) {
    const point = pointers.get(event.pointerId);
    if (!isOpen || !point) return;
    point.x = event.clientX;
    point.y = event.clientY;
    if (pinchState) {
      event.preventDefault();
      const next = pinchGeometry();
      if (next.distance > 0 && pinchState.distance > 0) {
        setZoom(zoom * next.distance / pinchState.distance, { gesture: true, anchor: pinchState, midpoint: next });
      }
      // Callback may close/update/destroy the viewer; never resurrect its gesture.
      if (pointers.size === 2) pinchState = next;
    } else if (dragState?.allowPan && currentOptions.panWhenZoomed && canPan(zoom)) {
      event.preventDefault();
      capturePointer(event.pointerId);
      panLayer?.classList.add("is-panning");
      setPan(dragState.panStartX + point.x - dragState.startX,
        dragState.panStartY + point.y - dragState.startY);
    }
  }

  function onViewportPointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    try { if (viewport?.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId); } catch (_) { /* Already released. */ }
    panLayer?.classList.remove("is-panning");
    rebaseGesture();
  }

  function onViewportPointerCancel(event) {
    if (pointers.has(event.pointerId)) clearGesture();
  }

  function syncUi() {
    if (!shell || !dialog || !bodyEl || !viewport || !transformLayer || !panLayer || !panSurface) {
      return;
    }
    shell.classList.toggle("is-open", isOpen);
    shell.hidden = !isOpen;
    dialog.hidden = !isOpen;
    if (!isOpen) {
      return;
    }

    prevBtn.hidden = !currentOptions.showPrevNext || currentItems.length < 2;
    nextBtn.hidden = !currentOptions.showPrevNext || currentItems.length < 2;
    prevBtn.disabled = !canNavigate(-1);
    nextBtn.disabled = !canNavigate(1);
    bodyEl.classList.toggle("is-nav-hidden", prevBtn.hidden && nextBtn.hidden);

    toolbar && (toolbar.hidden = !currentOptions.showToolbar);
    counterEl && (counterEl.hidden = !currentOptions.showCounter);
    closeBtn && (closeBtn.hidden = !currentOptions.showClose);

    fitContainBtn?.classList.toggle("is-active", fit === "contain");
    fitCoverBtn?.classList.toggle("is-active", fit === "cover");
    fitOriginalBtn?.classList.toggle("is-active", fit === "original");
    zoomInBtn && (zoomInBtn.disabled = zoom >= currentOptions.maxZoom);
    zoomOutBtn && (zoomOutBtn.disabled = zoom <= currentOptions.minZoom);
    syncMediaHostLayout();
    const viewportWidth = Number(viewport?.clientWidth) || 0;
    const viewportHeight = Number(viewport?.clientHeight) || 0;
    const hostWidth = parseFloat(mediaHost?.style.width || "") || Number(mediaHost?.offsetWidth) || 0;
    const hostHeight = parseFloat(mediaHost?.style.height || "") || Number(mediaHost?.offsetHeight) || 0;
    transformLayer.style.transform = "none";
    transformLayer.dataset.fit = fit;
    panLayer.style.left = `${((viewportWidth - hostWidth) / 2) + panX}px`;
    panLayer.style.top = `${((viewportHeight - hostHeight) / 2) + panY}px`;
    panLayer.style.width = `${hostWidth}px`;
    panLayer.style.height = `${hostHeight}px`;
    panLayer.style.transform = "none";
    if (mediaHost) {
      mediaHost.style.translate = "0px 0px";
      mediaHost.style.transform = "none";
    }
    mediaHost?.classList.toggle("is-zoomed", zoom > currentOptions.minZoom);
    viewport.classList.toggle("has-pinch-zoom", currentOptions.pinchZoom);
    // Never put an overlay over native video controls.
    panSurface.hidden = mediaEl instanceof HTMLVideoElement && currentOptions.showVideoControls
      || !(currentOptions.panWhenZoomed && canPan(zoom));
    panSurface.classList.toggle("is-active", !panSurface.hidden);
  }

  function open(index = activeIndex) {
    if (!currentItems.length) {
      return;
    }
    const targetIndex = clampIndex(index, currentItems.length);
    const wasOpen = isOpen;
    focusReturnEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    isOpen = true;
    activeIndex = targetIndex;
    if (!wasOpen) {
      render();
      renderCurrentItem({ emitChange: true, emitOpen: true });
      focusInitial();
      return;
    }
    renderCurrentItem({ emitChange: true, emitOpen: false });
  }

  function focusInitial() {
    const target = closeBtn && !closeBtn.hidden && !closeBtn.disabled
      ? closeBtn
      : viewport || dialog;
    target?.focus?.({ preventScroll: true });
  }

  function close() {
    if (!isOpen) {
      return;
    }
    clearGesture();
    isOpen = false;
    pauseVideo();
    destroyGraph();
    syncUi();
    currentOptions.onClose?.();
    focusReturnEl?.focus?.({ preventScroll: true });
  }

  function setIndex(index) {
    if (!currentItems.length) {
      return;
    }
    const safeIndex = clampIndex(index, currentItems.length);
    if (safeIndex === activeIndex && isOpen) {
      return;
    }
    activeIndex = safeIndex;
    if (!isOpen) {
      open(safeIndex);
      return;
    }
    renderCurrentItem({ emitChange: true, emitOpen: false });
  }

  function next() {
    if (!currentItems.length) {
      return;
    }
    if (currentOptions.loop) {
      setIndex((activeIndex + 1) % currentItems.length);
      return;
    }
    if (activeIndex < currentItems.length - 1) {
      setIndex(activeIndex + 1);
    }
  }

  function prev() {
    if (!currentItems.length) {
      return;
    }
    if (currentOptions.loop) {
      setIndex((activeIndex - 1 + currentItems.length) % currentItems.length);
      return;
    }
    if (activeIndex > 0) {
      setIndex(activeIndex - 1);
    }
  }

  function canNavigate(direction) {
    if (currentOptions.loop) {
      return currentItems.length > 1;
    }
    if (direction < 0) {
      return activeIndex > 0;
    }
    return activeIndex < currentItems.length - 1;
  }

  function setZoom(nextZoom, { emit = true, gesture = false, anchor = null, midpoint = anchor } = {}) {
    if (!gesture) clearGesture();
    const previousZoom = zoom;
    const clamped = clampNumber(nextZoom, currentOptions.minZoom, currentOptions.maxZoom);
    const previousSize = getHostSizeForZoom(zoom);
    const nextSize = getHostSizeForZoom(clamped);
    zoom = clamped;
    if (zoom <= currentOptions.minZoom) {
      panX = 0;
      panY = 0;
    } else {
      if (anchor && midpoint && viewport) {
        const rect = viewport.getBoundingClientRect();
        const cx = rect.left + viewport.clientLeft + viewport.clientWidth / 2;
        const cy = rect.top + viewport.clientTop + viewport.clientHeight / 2;
        const ratio = zoom / previousZoom;
        panX = midpoint.x - cx - (anchor.x - cx - panX) * ratio;
        panY = midpoint.y - cy - (anchor.y - cy - panY) * ratio;
      } else if (previousSize && nextSize) {
        panX = scalePanForViewportCenter(panX, previousSize.width, nextSize.width);
        panY = scalePanForViewportCenter(panY, previousSize.height, nextSize.height);
      }
      const clampedPan = clampPan(panX, panY, zoom);
      panX = clampedPan.x;
      panY = clampedPan.y;
    }
    syncUi();
    if (emit) {
      currentOptions.onZoomChange?.(getState());
    }
  }

  function zoomIn() {
    setZoom(zoom + currentOptions.zoomStep);
  }

  function zoomOut() {
    setZoom(zoom - currentOptions.zoomStep);
  }

  function setPan(nextPanX, nextPanY, { emit = false } = {}) {
    const clamped = clampPan(nextPanX, nextPanY, zoom);
    panX = clamped.x;
    panY = clamped.y;
    syncUi();
    if (emit) {
      currentOptions.onZoomChange?.(getState());
    }
  }

  function clampPan(nextPanX, nextPanY, nextZoom) {
    const limits = getPanLimits(nextZoom);
    if (!limits) {
      return { x: 0, y: 0 };
    }
    return {
      x: clampNumber(nextPanX, -limits.maxPanX, limits.maxPanX),
      y: clampNumber(nextPanY, -limits.maxPanY, limits.maxPanY),
    };
  }

  function canPan(nextZoom = zoom) {
    const limits = getPanLimits(nextZoom);
    return Boolean(limits && (limits.maxPanX > 0 || limits.maxPanY > 0));
  }

  function getPanLimits(nextZoom = zoom) {
    const viewportWidth = Number(viewport?.clientWidth) || 0;
    const viewportHeight = Number(viewport?.clientHeight) || 0;
    const nextHostSize = getHostSizeForZoom(nextZoom);
    const hostWidth = nextHostSize?.width || 0;
    const hostHeight = nextHostSize?.height || 0;
    if (!viewportWidth || !viewportHeight || !hostWidth || !hostHeight) {
      return null;
    }
    return {
      maxPanX: Math.max(0, (hostWidth - viewportWidth) / 2),
      maxPanY: Math.max(0, (hostHeight - viewportHeight) / 2),
    };
  }

  function getMediaIntrinsicSize() {
    if (!mediaEl) {
      return null;
    }
    if (mediaEl instanceof HTMLImageElement) {
      return {
        width: Number(mediaEl.naturalWidth) || Number(mediaEl.clientWidth) || 0,
        height: Number(mediaEl.naturalHeight) || Number(mediaEl.clientHeight) || 0,
      };
    }
    if (mediaEl instanceof HTMLVideoElement) {
      return {
        width: Number(mediaEl.videoWidth) || Number(mediaEl.clientWidth) || 0,
        height: Number(mediaEl.videoHeight) || Number(mediaEl.clientHeight) || 0,
      };
    }
    return {
      width: Number(mediaEl.clientWidth) || 0,
      height: Number(mediaEl.clientHeight) || 0,
    };
  }

  function syncMediaHostLayout() {
    if (!mediaHost) {
      return;
    }
    const hostSize = getHostSizeForZoom(zoom);
    if (!hostSize) {
      mediaHost.style.width = "100%";
      mediaHost.style.height = "100%";
      return;
    }
    mediaHost.style.width = `${hostSize.width}px`;
    mediaHost.style.height = `${hostSize.height}px`;
  }

  function getHostSizeForZoom(nextZoom = zoom) {
    const viewportWidth = Number(viewport?.clientWidth) || 0;
    const viewportHeight = Number(viewport?.clientHeight) || 0;
    const mediaSize = getMediaIntrinsicSize();
    if (!viewportWidth || !viewportHeight || !mediaSize || !mediaSize.width || !mediaSize.height) {
      return null;
    }
    const baseScale = getFitBaseScale(
      viewportWidth,
      viewportHeight,
      mediaSize.width,
      mediaSize.height,
      fit
    );
    return {
      width: Math.max(1, mediaSize.width * baseScale * nextZoom),
      height: Math.max(1, mediaSize.height * baseScale * nextZoom),
    };
  }

  function scalePanForViewportCenter(currentPan, previousSize, nextSize) {
    if (!previousSize || !nextSize) {
      return currentPan;
    }
    return currentPan * (nextSize / previousSize);
  }

  function resetView({ emit = true } = {}) {
    clearGesture();
    zoom = currentOptions.minZoom;
    panX = 0;
    panY = 0;
    syncUi();
    if (emit) {
      currentOptions.onZoomChange?.(getState());
    }
  }

  function setFit(nextFit) {
    fit = normalizeFit(nextFit);
    resetView({ emit: false });
    syncUi();
  }

  function pauseVideo() {
    if (mediaEl instanceof HTMLMediaElement) {
      mediaEl.pause();
    }
  }

  function destroyGraph() {
    mediaEvents.clear();
    if (mediaGraphApi) {
      mediaGraphApi.destroy();
      mediaGraphApi = null;
    }
  }

  function update(nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    currentItems = normalizeItems(currentOptions.items, currentOptions);
    fit = normalizeFit(currentOptions.fit);
    activeIndex = clampIndex(activeIndex, currentItems.length);
    if (!currentItems.length) {
      activeIndex = 0;
      isOpen = false;
    }
    render();
    if (isOpen && currentItems.length) {
      renderCurrentItem({ emitChange: false, emitOpen: false });
    }
  }

  function destroy() {
    isOpen = false;
    clearGesture();
    pauseVideo();
    events.clear();
    mediaEvents.clear();
    destroyGraph();
    clearNode(container);
    shell = null;
    dialog = null;
    titleEl = null;
    counterEl = null;
    bodyEl = null;
    viewport = null;
    transformLayer = null;
    panLayer = null;
    mediaHost = null;
    panSurface = null;
    toolbar = null;
    footer = null;
    prevBtn = null;
    nextBtn = null;
    closeBtn = null;
    zoomInBtn = null;
    zoomOutBtn = null;
    resetBtn = null;
    fitContainBtn = null;
    fitCoverBtn = null;
    fitOriginalBtn = null;
    audiographHost = null;
    mediaEl = null;
  }

  function getState() {
    return {
      open: isOpen,
      index: activeIndex,
      item: currentItems[activeIndex] ? clone(currentItems[activeIndex]) : null,
      zoom,
      panX,
      panY,
      fit,
      canZoomIn: zoom < currentOptions.maxZoom,
      canZoomOut: zoom > currentOptions.minZoom,
      items: clone(currentItems),
    };
  }

  function getDebugState() {
    const viewportWidth = Number(viewport?.clientWidth) || 0;
    const viewportHeight = Number(viewport?.clientHeight) || 0;
    const hostWidth = parseFloat(mediaHost?.style.width || "") || Number(mediaHost?.offsetWidth) || 0;
    const hostHeight = parseFloat(mediaHost?.style.height || "") || Number(mediaHost?.offsetHeight) || 0;
    const mediaSize = getMediaIntrinsicSize();
    const panLimits = getPanLimits(zoom);
    const viewportRect = viewport?.getBoundingClientRect?.();
    const panLayerRect = panLayer?.getBoundingClientRect?.();
    const hostRect = mediaHost?.getBoundingClientRect?.();
    const mediaRect = mediaEl?.getBoundingClientRect?.();
    const mediaStyle = mediaEl ? window.getComputedStyle(mediaEl) : null;
    const panLayerStyle = panLayer ? window.getComputedStyle(panLayer) : null;
    return {
      open: isOpen,
      fit,
      zoom,
      panX,
      panY,
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
      },
      host: {
        width: hostWidth,
        height: hostHeight,
      },
      intrinsic: mediaSize ? {
        width: mediaSize.width,
        height: mediaSize.height,
      } : null,
      rects: {
        viewport: viewportRect ? {
          left: viewportRect.left,
          top: viewportRect.top,
          width: viewportRect.width,
          height: viewportRect.height,
          right: viewportRect.right,
          bottom: viewportRect.bottom,
        } : null,
        panLayer: panLayerRect ? {
          left: panLayerRect.left,
          top: panLayerRect.top,
          width: panLayerRect.width,
          height: panLayerRect.height,
          right: panLayerRect.right,
          bottom: panLayerRect.bottom,
        } : null,
        host: hostRect ? {
          left: hostRect.left,
          top: hostRect.top,
          width: hostRect.width,
          height: hostRect.height,
          right: hostRect.right,
          bottom: hostRect.bottom,
        } : null,
        media: mediaRect ? {
          left: mediaRect.left,
          top: mediaRect.top,
          width: mediaRect.width,
          height: mediaRect.height,
          right: mediaRect.right,
          bottom: mediaRect.bottom,
        } : null,
      },
      mediaStyle: mediaStyle ? {
        objectFit: mediaStyle.objectFit,
        objectPosition: mediaStyle.objectPosition,
        position: mediaStyle.position,
      } : null,
      panLayerStyle: panLayerStyle ? {
        transform: panLayerStyle.transform,
        position: panLayerStyle.position,
      } : null,
      panLimits: panLimits ? {
        maxPanX: panLimits.maxPanX,
        maxPanY: panLimits.maxPanY,
      } : null,
      mediaType: mediaEl instanceof HTMLVideoElement ? "video" : mediaEl instanceof HTMLImageElement ? "image" : null,
    };
  }

  render();
  if (isOpen && currentItems.length) {
    open(activeIndex);
  }

  return {
    open,
    close,
    next,
    prev,
    setIndex,
    zoomIn,
    zoomOut,
    resetView,
    setFit,
    update,
    getState,
    getDebugState,
    destroy,
  };
}

function normalizeOptions(options = {}) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  next.fit = normalizeFit(next.fit);
  next.zoomStep = clampNumber(Number(next.zoomStep) || 0.2, 0.05, 2);
  next.minZoom = clampNumber(Number(next.minZoom) || 1, 0.1, 20);
  next.maxZoom = Math.max(next.minZoom, Number(next.maxZoom) || 6);
  next.index = Math.max(0, Number(next.index) || 0);
  next.open = Boolean(next.open);
  next.trapFocus = next.trapFocus !== false;
  next.pinchZoom = next.pinchZoom !== false;
  return next;
}

function normalizeItems(items, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const normalizedType = item?.type === "video"
        ? "video"
        : item?.type === "photo" || item?.type === "image"
          ? "image"
          : "unsupported";
      const rawPath = String(item?.path || item?.srcUrl || item?.src || "");
      const srcUrl = resolveUrl(rawPath, normalizedOptions.baseUrl);
      const thumbUrl = resolveUrl(String(item?.thumbUrl || item?.thumb || ""), normalizedOptions.baseUrl) || (normalizedType === "image" ? srcUrl : "");
      return {
        id: item?.id ?? String(index),
        type: normalizedType,
        srcUrl,
        thumbUrl,
        alt: Object.prototype.hasOwnProperty.call(item || {}, "alt")
          ? String(item?.alt ?? "")
          : String(item?.title || ""),
        title: String(item?.title || ""),
        posterUrl: resolveUrl(String(item?.posterUrl || item?.poster || ""), normalizedOptions.baseUrl),
        tracks: normalizeTracks(item, normalizedOptions.baseUrl),
        duration: item?.duration ?? item?.duration_seconds ?? null,
        metadata: item?.metadata && typeof item.metadata === "object" ? { ...item.metadata } : {},
        raw: item,
      };
    })
    .filter((item) => (item.type === "image" || item.type === "video") && Boolean(item.srcUrl));
}

function normalizeTracks(item, baseUrl) {
  const candidates = item?.tracks || item?.textTracks || item?.captionTracks || item?.captions || [];
  return (Array.isArray(candidates) ? candidates : [])
    .map((track) => {
      const src = resolveUrl(String(track?.src || track?.url || track?.path || ""), baseUrl);
      if (!src) {
        return null;
      }
      return {
        kind: normalizeTrackKind(track?.kind),
        src,
        srclang: String(track?.srclang || track?.lang || track?.language || "en").trim() || "en",
        label: String(track?.label || track?.title || "Captions").trim() || "Captions",
        default: Boolean(track?.default),
      };
    })
    .filter(Boolean);
}

function normalizeTrackKind(value) {
  const kind = String(value || "").toLowerCase().trim();
  if (["subtitles", "captions", "descriptions", "chapters", "metadata"].includes(kind)) {
    return kind;
  }
  return "captions";
}

function normalizeFit(value) {
  const fit = String(value || "").toLowerCase();
  if (fit === "cover" || fit === "original") {
    return fit;
  }
  return "contain";
}

function getFitBaseScale(viewportWidth, viewportHeight, mediaWidth, mediaHeight, fit) {
  if (!viewportWidth || !viewportHeight || !mediaWidth || !mediaHeight) {
    return 1;
  }
  if (fit === "original") {
    return 1;
  }
  const widthScale = viewportWidth / mediaWidth;
  const heightScale = viewportHeight / mediaHeight;
  if (fit === "cover") {
    return Math.max(widthScale, heightScale);
  }
  return Math.min(widthScale, heightScale);
}

function prettifyKey(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveUrl(url, baseUrl) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:") || value.startsWith("./")) {
    return value;
  }
  if (!baseUrl) {
    return value;
  }
  return `${String(baseUrl).replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function clampIndex(index, length) {
  if (!length) {
    return 0;
  }
  return Math.min(length - 1, Math.max(0, Number(index) || 0));
}

function getFocusable(root) {
  return Array.from(root.querySelectorAll(tabbableSelector)).filter((node) => {
    if (!(node instanceof HTMLElement) || node.disabled || node.hidden || node.getAttribute("aria-hidden") === "true") {
      return false;
    }
    const style = window.getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch (_error) {
    return JSON.parse(JSON.stringify(value));
  }
}
