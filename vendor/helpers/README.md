# Incident Component Helpers (Prototype)

A lightweight helper-library prototype for rendering incident-related UI components using plain JavaScript and CSS.

## Repository And Live Demo

- GitHub Repository: `https://github.com/jybanez/helpers.pbb.ph`
- Live Demo (GitHub Pages): `https://jybanez.github.io/helpers.pbb.ph`
- Refactor Playbook (for `*.pbb.ph` project integrations): `docs/pbb-refactor-playbook.md`
- Agent Working Protocol: `docs/agent-working-protocol.md`
- Safe Markdown renderer: [API and security guide](docs/markdown.md) · [interactive demo](demos/demo.markdown.html)
- JSON, Markdown and CSV file viewers: [API and limits](docs/file-viewers.md) · [JSON demo](demos/demo.json.viewer.html) · [Markdown demo](demos/demo.markdown.viewer.html) · [CSV demo](demos/demo.csv.viewer.html)
- Repository picker and composer attachments: [API and lifecycle](docs/repository-picker.md) · [Interactive developer demo](demos/demo.repository.picker.html)

Latest documented release: `v0.21.70`

This repository currently covers **7 helpers**:

- `incidentBase`
- `incidentTeamsAssignments`
- `incidentTeamsAssignmentsEditor`
- `incidentTeamsAssignmentsViewer`
- `incidentTypes`
- `incidentTypesDetailsEditor`
- `incidentTypesDetailsViewer`

## Project Structure

```text
css/
  ui/
    ui.tokens.css
    ui.components.css
    ui.modal.css
    ui.dialog.css
    ui.iframe.host.css
    ui.toast.css
    ui.busy.overlay.css
    ui.form.modal.css
    ui.select.css
    ui.tree.select.css
    ui.toggle.css
    ui.datepicker.css
    ui.elapsed.time.css
    ui.clock.css
    ui.signal.strength.css
    ui.heartbeat.strip.css
    ui.stat.cards.css
    ui.icon.grid.css
    ui.device.selector.css
    ui.path.picker.css
    ui.timeline.css
    ui.timeline.scrubber.css
    ui.command.palette.css
    ui.tree.css
    ui.kanban.css
    ui.stepper.css
    ui.splitter.css
    ui.data.inspector.css
    ui.empty.state.css
    ui.skeleton.css
    ui.chat.thread.css
    ui.chat.composer.css
    ui.chat.upload.queue.css
    ui.file.input.css
    ui.file.uploader.css
    ui.tabs.css
    ui.strips.css
    ui.media.strip.css
    ui.media.viewer.css
    ui.pdf.viewer.css
    ui.audio.css
    ui.grid.css
    ui.tree.grid.css
    ui.hierarchy.map.css
    ui.tree.mind.map.css
    ui.progress.css
    ui.virtual.list.css
    ui.scheduler.css
    ui.map.controls.css
    ui.map.legend.css
    ui.map.markers.css
    ui.map.drawing.css
    ui.charts.css
    ui.chart.xy.css
    ui.nav.css
    ui.popover.css
  incident/
    incident.css
    incident.base.css
    incident.teams.assignments.css
    incident.teams.assignments.editor.css
    incident.teams.assignments.viewer.css
    incident.types.css
    incident.types.details.editor.css
    incident.types.details.viewer.css
js/
  ui/
    ui.dom.js
    ui.events.js
    ui.loader.js
    ui.drawer.js
    ui.search.js
    ui.modal.js
    ui.dialog.js
    ui.semantic.icons.js
    ui.toast.js
    ui.busy.overlay.js
    ui.workspace.bridge.js
    ui.form.modal.js
    ui.form.modal.presets.js
    ui.select.js
    ui.tree.select.js
    ui.toggle.button.js
    ui.toggle.group.js
    ui.datepicker.js
    ui.elapsed.time.js
    ui.clock.js
    ui.signal.strength.js
    ui.heartbeat.strip.js
    ui.stat.cards.js
    ui.icon.grid.js
    ui.device.selector.js
    ui.path.picker.js
    ui.timeline.js
    ui.timeline.scrubber.js
    ui.command.palette.js
    ui.tree.js
    ui.kanban.js
    ui.stepper.js
    ui.splitter.js
    ui.data.inspector.js
    ui.empty.state.js
    ui.skeleton.js
    ui.chat.thread.js
    ui.chat.composer.js
    ui.chat.upload.queue.js
    ui.file.input.js
    ui.file.uploader.js
    ui.tabs.js
    ui.strips.js
    ui.media.strip.js
    ui.media.viewer.js
    ui.pdf.viewer.js
    ui.grid.js
    ui.tree.grid.js
    ui.hierarchy.map.js
    ui.tree.mind.map.js
    ui.progress.js
    ui.virtual.list.js
    ui.scheduler.js
    ui.map.controls.js
    ui.map.legend.js
    ui.map.markers.js
    ui.map.drawing.js
    ui.charts.js
    ui.chart.xy.js
    ui.menu.js
    ui.popover.js
    ui.dropdown.js
    ui.dropup.js
    ui.navbar.js
    ui.sidebar.js
    ui.breadcrumbs.js
    ui.audio.player.js
    ui.audio.audiograph.js
    ui.audio.timeline.js
    ui.audio.callSession.js
  incident/
    incident.base.js
    incident.teams.assignments.js
    incident.teams.assignments.editor.js
    incident.teams.assignments.viewer.js
    incident.types.js
    incident.types.details.editor.js
    incident.types.details.viewer.js
demos/
  index.html
  cookbook.html
  guide.which-helper.html
  demo.team.assignments.html
  demo.incident.types.html
  demo.grid.html
  demo.tree.grid.html
  demo.hierarchy.map.html
  demo.tree.mind.map.html
  demo.progress.html
  demo.virtual.list.html
  demo.scheduler.html
  demo.timeline.html
  demo.timeline.scrubber.html
  demo.window.html
  demo.window.manager.html
  demo.iframe.host.html
  demo.workspace.bridge.html
  demo.ui.html
  demo.toast.html
  demo.select.html
  demo.tree.select.html
  demo.toggle.button.html
  demo.toggle.group.html
  demo.buttons.html
  demo.audio.html
  demo.audio.timeline.html
  demo.media.viewer.html
  demo.nav.html
  demo.navbar.html
  demo.sidebar.html
  demo.breadcrumbs.html
  demo.dropdown.html
  demo.dropup.html
  demo.popover.html
  demo.stepper.html
  demo.splitter.html
  demo.inspector.html
  demo.empty.state.html
  demo.skeleton.html
  demo.form.modal.html
index.html
samples/
  samplehierarchy_cebu.json
  sampledata.json
  sampledata_*.json
  samplemedia.json
  iframe/
    iframe-host.fixture.html
    workspace-ui-bridge.fixture.html
scripts/
  generate.hierarchy.sample.ps1
boot.*.json
```

## Contracts

All helpers accept:

1. `container` - target DOM element
2. `data` - data to render
3. `options` - extra behavior/config

All helpers return a stable API:

- `destroy()` - cleanup and unmount
- `update(nextData, nextOptions?)` - re-render without remount

## Internal UI Utilities

Reusable shared UI utilities live under `js/ui`:

- `ui.dom.js`
  - `createElement(tag, config)`
  - `clearNode(node)`
- `ui.events.js`
  - `createEventBag()` for safe event binding/unbinding
- `ui.loader.js`
  - `uiLoader.load(name)` ensures component CSS is injected once
  - `uiLoader.import(name)` injects CSS and dynamically imports the component module
  - `uiLoader.get(name)` resolves the registry export directly
  - `uiLoader.create(name, ...args)` invokes factory-style exports by registry key
  - `uiLoader.loadMany(names)` batch-loads multiple registry entries
  - `uiLoader.loadManyGroup(names)` loads named registry groups like `core-shell`, `forms`, `data`, `media`
  - diagnostics: `getRegistry()`, `getGroups()`, `getLoadedCss()`, `getLoadedModules()`, `getFailedCss()`, `getFailedModules()`, `getDiagnostics()`
- `ui.drawer.js`
  - `createDrawer(options)` reusable anchored drawer shell
  - `createBottomDrawer(options)` compatibility alias for older integrations
- `ui.search.js`
  - `createSearchField(options)` reusable search field with clear + `Esc`-to-clear behavior
- `ui.password.js`
  - `createPasswordField(container, options)` reusable password input with shared show/hide toggle behavior for standalone use and auth flows
- `ui.path.picker.js`
  - `createPathPicker(container, options)` adapter-driven file/folder path input for local runtime setup and admin configuration
- `ui.number.stepper.js`
  - `createNumberStepper(container, options)` numeric stepper with decrement/increment buttons, typed input, min/max bounds, and optional prefix/suffix text
- `ui.checkbox.js`
  - `createCheckbox(container, options)` shared checkbox primitive with boolean mode and explicit `checkedValue` / `uncheckedValue` mode
- `ui.checkbox.group.js`
  - `createCheckboxGroup(container, options)` shared multi-checkbox primitive with array values and min/max validation
- `ui.combobox.js`
  - `createCombobox(container, options)` free-text input with suggestions and optional localStorage-backed recent history
- `ui.field.group.js`
  - `createFieldGroup(container, options)` reusable grouped-field editor with optional repeatable entries for workflows such as evacuation registries, missing-person reports, addresses, vehicles, and contact lists
- `ui.field.group.presets.js`
  - `fieldGroupPresets` schema factories for common grouped fields: person, address, missing person, evacuee, family, casualty/patient, infrastructure damage, shelter damage, and road/access status
- `ui.fieldset.js`
  - `createFieldset(container, options)` semantic grouped form section helper using form-modal-style `rows[]` so pages can mix fields, repeatable field groups, notes, alerts, images, and custom content
- `ui.device.primer.js`
  - `createDevicePrimer(container, data, options)` project-configurable startup readiness checks for permissions, devices, and browser capabilities
  - `createDevicePrimerModal(data, options)` modal preset wrapper for startup primer flows, with default auto-close after successful checks
- `ui.icons.js`
  - optional [file, social, and AI icon packs](docs/ui-icon-packs.md), registered with `registerIconPack(...)`; includes file-type detection, explicit fallbacks, brand accents, and artwork attribution
  - `createIcon(name, options)` shared SVG icon creation over a categorized registry with namespaced ids and `currentColor` inheritance
  - `getIconDefinition(name)`, `listIcons()`, and `listIconCategories()` expose registry lookup without requiring projects to own raw SVG strings
  - includes operational/SITREP categories for shared report sections, hazards, population groups, routes, resources, teams, maps, alerts, and data-quality cues
- `ui.modal.js`
  - `createModal(options)` general-purpose modal shell (content/header/secondaryHeader/footer, sizing, focus trap, backdrop/escape close)
  - `createActionModal(options)` modal wrapper with declarative header/footer actions (`headerActions[]`, `actions[]`)
- `ui.window.js`
  - `createWindowManager(options)` desktop-style window manager with draggable/resizable stacked windows, configurable taskbar modes, and maximize/restore behavior
- `ui.iframe.host.js`
  - `createIframeHost(options)` helper-owned iframe surface with loading/error states, narrow source controls, and clean composition with `ui.window`
- `ui.workspace.bridge.js`
  - `installWorkspaceUiBridgeHost(options)` trusted parent-side bridge for iframe-hosted apps
  - `getWorkspaceUiBridge(options)` child-side bridge helper for delegated toasts, dialogs, explicit action-modals, explicit cross-origin form-modal requests, and session-style bridged preset submit loops
  - `showWorkspaceActionModal(payload, options)` narrow child-side request helper for parent-owned simple action-modals
  - `showWorkspaceFormModal(payload, options)` narrow child-side request helper for parent-owned cross-origin login, re-auth, account, change-password, and generic-form modals through `modal.form.open`
  - `bridge.openFormSession(payload)` long-lived child-side session helper for cross-origin preset submits that need parent-modal busy/error updates through `modal.form.session.open`, `modal.form.update`, and `modal.form.close`
  - operational routing guide:
    - `docs/ui-workspace-overlay-routing-guide.md`
- `ui.dialog.js`
  - `uiAlert(message, options)` promise-based alert modal
  - `uiConfirm(message, options)` promise-based confirm modal
  - `uiPrompt(message, options)` promise-based prompt modal
- `ui.toast.js`
  - `createToastStack(options)` global toast notifications (info/success/warn/error), optional speech synthesis (`speak`, `speakTypes`, `speakRate`, `speakPitch`, `speakVolume`, `voiceName`, `speakFormatter`, `speakCooldownMs`)
  - persistent status toasts can use `persistent`, `busy`, `dismissible`, and the returned handle's `update(...)` / `resolve(...)` / `close()` methods for app-owned async lifecycles
  - default semantic status icons are shown per toast variant; callers can suppress or override them with `showVariantIcon` / `variantIcon`
  - speech is opt-in (`speak: false` by default); can be overridden per-toast via `show(message, { speak: true | false })`
  - when speech is enabled, auto-dismiss countdown can start after speech ends via `waitForSpeechBeforeDismiss` (default `true`)
  - `getVoices()` returns available speech voices so UI can render a voice selector; per-toast `voiceName` override is supported in `show(message, { voiceName })`
- `ui.busy.overlay.js`
  - `createBusyOverlay(options)` fullscreen blocking busy overlay with shared spinner treatment, optional text, and optional cancel handling
  - `createBusyOverlay(container, options)` scoped busy overlay for one host surface while keeping the same spinner and cancel contract
- `ui.form.modal.js`
  - `createFormModal(options)` schema-driven modal form helper for short login/re-auth/CRUD flows using a strict row-based body model over `createActionModal(...)`
- exposes helper-owned values, field errors, form error, busy submit lifecycle, declarative mode rules, hidden/display fields, hosted `ui.select` / `ui.treeSelect`, and helper-owned avatar-file picking without widening the base modal shell contract
- `ui.form.modal.presets.js`
  - `createLoginFormModal(options)` opinionated login wrapper over `createFormModal(...)` with field-name remapping support
  - `createReauthFormModal(options)` opinionated re-auth wrapper over `createFormModal(...)` with locked identifier support and field-name remapping
  - `createStatusUpdateFormModal(options)` operational status-change wrapper over `createFormModal(...)` with app-supplied status options and field-name remapping
  - `createReasonFormModal(options)` categorized reason-required wrapper over `createFormModal(...)` with app-supplied reason options and field-name remapping
- `createAccountFormModal(options)` opinionated account/profile wrapper over `createFormModal(...)` with helper-owned optional avatar picker, Name, and Email rows plus additive `extraRows`
  - `createChangePasswordFormModal(options)` opinionated password-change wrapper over `createFormModal(...)` with helper-owned current/new/confirm password rows
- `ui.select.js`
  - `createSelect(container, items, options)` single/multi select with optional search and keyboard navigation (`ArrowUp/ArrowDown/Home/End/Enter/Escape`, optional `selectOnTab`)
- `ui.tree.select.js`
  - `createTreeSelect(container, items, options)` hierarchical single-select picker with parent-context search, floating menu behavior, and branch expand/collapse keyboard support
- `ui.toggle.button.js`
  - `createToggleButton(container, options)` reusable binary toggle button with `aria-pressed`, tones, variants, icon/label support, and `setPressed/getPressed`
- `ui.toggle.group.js`
  - `createToggleGroup(container, options)` grouped toggle composition with `multi` or single-select behavior, `getValue()`, `setItems()`, and `updateItem()`
- `ui.datepicker.js`
  - Native time fields follow Helper themes via `--ui-datepicker-color-scheme` (`dark` by default, `light` for light themes). Custom themes can override this token. Forced-colors mode leaves the native indicator and disabled rendering under browser control; no WebKit inversion filter is applied. Browser coverage: `tests/datepicker.time.theme.regression.html`.
  - `createDatepicker(container, options)` single/range date picker with optional time controls, min/max bounds, disabled-date callback, and `setValue/getValue`
- `ui.elapsed.time.js`
  - `createElapsedTime(container, options)` compact live `dd:hh:mm:ss` elapsed-duration readout with shared ticker, optional thresholds, optional chrome-less rendering, and pause/stop lifecycle methods
- `ui.clock.js`
  - `createClock(container, options)` compact wall-clock display with label, HH:MM:SS AM/PM time, date row, chrome-less mode, and the shared one-second ticker used by elapsed-time instances
- `ui.signal.strength.js`
  - `createSignalStrength(container, options)` transport-agnostic 0-4 bar signal indicator with stable compact text, tone variants, bars-only mode, and update/destroy lifecycle
- `ui.stat.cards.js`
  - `createStatCards(container, items, options)` operational KPI cards with shared icons, tones, trends, selection, chrome-less rendering, and update/destroy lifecycle
- `ui.icon.grid.js`
  - `createIconGrid(container, items, options)` draggable icon/app launcher grid with keyboard reorder, chrome-less rendering, and app-owned layout persistence callbacks
- `ui.map.controls.js`
  - `createMapControls(container, options)` MapLibre-oriented control dock for zoom, compass/bearing, pitch presets, locate, fit, and layer toggles
- `ui.map.legend.js`
  - `createMapLegend(container, options)` MapLibre-agnostic legend for alert levels, markers, line/route styles, counts, and data-quality keys
- `ui.map.markers.js`
  - `createMapMarker(options)`, `createMapClusterMarker(options)`, and `getMapMarkerClass(options)` MapLibre-compatible DOM marker factories for incidents, hubs, hotspots, routes, and clusters
- `ui.map.drawing.js`
  - `createMapDrawingTools(container, options)` adapter-based drawing toolbar for map modes, edit actions, measurements, and GeoJSON events
- `ui.charts.js`
- `createChart(container, options)` and chart-specific wrappers for dependency-free bar, horizontal-bar, stacked-bar, donut, and sparkline charts
- `ui.chart.xy.js`
- `createXyChart(container, options)` generic SVG X/Y chart primitive for line trends, point markers, Y-axis thresholds, shaded bands, and accessible summaries
- `ui.timeline.js`
  - Optional `item.contextMenu` and `onContextMenuAction` provide native header action menus independent of custom-content lifecycle. See [timeline item menus](docs/timeline-item-menus.md).
  - `createTimeline(container, items, options)` event timeline with `vertical`/`horizontal` orientation, optional date grouping, lifecycle-managed custom item content, and item/action click hooks
  - `invalidateLayout(ids, { mutate })` refreshes presentation heights while preserving the virtual viewport anchor; `scrollToItem(id, { align, focus })` mounts and navigates to loaded items. See [layout and navigation](docs/timeline-layout-navigation.md).
- `ui.timeline.scrubber.js`
  - `createTimelineScrubber(container, options)` timeline scrubber/playhead with optional range handles and zoom levels
- `ui.command.palette.js`
  - `createCommandPalette(options)` global command launcher with keyboard shortcut, search, and action execution
- `ui.tree.js`
  - `createTree(container, data, options)` expandable/selectable tree view with optional checkboxes, lazy child loading, and optional chrome-less rendering
- `ui.kanban.js`
  - `createKanban(container, lanes, options)` lane-based board with intrinsic-height draggable cards, configurable empty-lane placeholders, fixed-lane card-stack scrolling, and move callbacks
- `ui.stepper.js`
  - `createStepper(container, steps, options)` step indicator/navigation component for multi-step workflows
- `ui.splitter.js`
  - `createSplitter(container, options)` resizable two-pane layout primitive (horizontal/vertical)
- `ui.navigation.stack.js`
  - `createNavigationStack(container, options)` stateful drill-in page stack with `push`, `pop`, `replace`, `goTo`, `reset`, and slide/fade/none transitions
- `ui.data.inspector.js`
  - `createDataInspector(container, data, options)` expandable object/JSON inspector with copy-path actions and optional chrome-less rendering
- `ui.empty.state.js`
  - `createEmptyState(container, data, options)` standardized empty/error/no-result presentation block with optional chrome-less rendering
- `ui.skeleton.js`
  - `createSkeleton(container, data, options)` loading placeholders (`lines`, `card`, `grid`)
- `ui.chat.thread.js`
  - `createChatThread(container, data, options)` conversation thread with incoming/outgoing/system messages, grouped runs, delivery states, grouped media/file attachments, helper-owned per-message action menus, and opt-in long-thread virtualization
- `ui.chat.composer.js`
  - `createChatComposer(container, data, options)` message composer with multiline input, send action, busy/disabled state, and helper-owned native file picking
  - Choose and order buttons with `attachments: ['files', 'video', 'audio']`; explicit lists use the helper row and override `showAttachmentButton`. `[]` disables all attachments. Omitting `files` also disables file paste; recordings remain independently available. Omit `attachments` to retain the published file-picker configuration. Duplicate entries are deduplicated; unsupported entries (including future `emoji`) are ignored.
  - Configure each type through `attachmentOptions: { files, videos, audios, emojis }`. `files` accepts `accept`, `multiple`, `capture`, and `attachmentAdapter`, falling back to published top-level file settings. `videos` and `audios` accept `maxBytes`, `maxDurationMs`, `mimeTypes`, and `accept` (default recording limits: 25 MiB / 60 seconds). `emojis` is reserved and has no effect yet. Settings do not enable buttons. The canonical modal requests permission, then requires Start, Stop, preview and Attach; recordings never auto-send, and device streams are released on stop/cancel/error/disposal.
  - `attachmentOptions.audios.audioGraphOptions` supports canonical graph `style`, `sensitivity`, `gateThreshold`, `attackMs`, `releaseMs`, `intensityCurve`, `freezeOnPause`, `transparentBackground`, `className`, and `ariaLabel`. Recorder-owned source/state/cleanup, hidden header and mute controls remain fixed.
  - Supply synchronous `getAttachmentPolicy()` returning `{ maxAttachments, attachmentCount, maxFileBytes, maxTotalBytes, usedBytes }` from the effective server policy and current draft. Recording allowance is checked before capture and again before emitting `onFilesSelected(files, { source: "record-audio" | "record-video" })`. Consumers still validate picker/paste files, upload authorization and all server limits. Demo limits are examples, not production policy.
  - Both recording modes use floating Record/Stop controls. Video preview keeps native playback and floating Record again/Check controls. Audio displays the canonical live microphone graph, then the shared audio player with Record again and Attach recording actions. Its owned analysis context is released at stop/cancel; microphone audio is never routed to speakers.
- `ui.chat.upload.queue.js`
  - `createChatUploadQueue(container, data, options)` draft attachment queue with grouped image/video previews, listed audio/file rows, and visual upload progress/state before send
- `ui.property.editor.js`
  - `createPropertyEditor(container, data, options)` inspector-style property editor with grouped sections, typed property rows, mixed/read-only states, hosted `ui.select` / `password` rows, toggle/checkbox booleans, and structured property/action callbacks
- `ui.file.input.js`
  - `createFileInput(container, options)` lightweight file picker for selected, dropped, or pasted `File` objects before app-owned avatar, icon, or attachment flows
- `ui.file.uploader.js`
  - `createFileUploader(container, options)` drag/drop file queue with validation, progress, retry/cancel/remove, and adapter upload hook
- `ui.tabs.js`
  - `createTabs(container, options)` accessible tablist + panel component. `tab.render(panel, tab)` is the recommended lifecycle hook and takes precedence; `tab.content` accepts text, DOM nodes, DocumentFragments, and arrays of nodes/text for simple composition.
- `ui.strips.js`
  - `createStrip(container, items, options)` selectable pill-strip component (single/multi)
- `ui.media.strip.js`
  - `createMediaStrip(container, items, options)` media thumbnails strip (image/video) with modal viewer/player + in-modal prev/next navigation
  - options include `layout: "scroll" | "wrap"` and `animationMs` (default `300`)
- `ui.media.viewer.js`
  - `createMediaViewer(container, options)` standalone image/video lightbox viewer with zoom/pan, fit modes, gallery navigation, and optional video audiograph
- `ui.pdf.viewer.js`
  - `createPdfViewer(options)` / `createPdfViewer(container, options)` browser-native inline PDF viewer shell with Helper-owned accessibility, lifecycle, loading/error states, and no Helper-rendered download action
- `ui.grid.js`
  - `createGrid(container, rows, options)` data grid/table with local/remote modes, optional sort/search/pagination, optional row virtualization, and optional chrome-less rendering
- `ui.tree.grid.js`
  - `createTreeGrid(container, options)` tree grid with first-column hierarchy, aligned tabular columns, expand/collapse controls, tree-aware search, column resize, optional fixed-row-height virtualization, lazy child loading, and optional chrome-less rendering
- `ui.hierarchy.map.js`
  - `createHierarchyMap(container, options)` hierarchy-first visual explorer with external entity lane, overlay relationship links, search, zoom/pan, selection, and optional chrome-less rendering
- `ui.tree.mind.map.js`
  - `createTreeMindMap(container, options)` Canvas tree mind-map surface for large hierarchical registries with expand/collapse, zoom/pan, single or multi node selection, selected-node object arrays for external detail panels, and object or JSON-loaded theme configuration
- `ui.progress.js`
  - `createProgress(container, data, options)` progress indicator with multiple styles (linear, segmented, steps, radial, ring, etc.)
  - Linear/striped/gradient `setValue` and `update` calls retain the fill element: `animate: true` transitions width and preserves running stripes; `animate: false` updates immediately. Reduced-motion preference disables transitions and animations. ARIA values and percentage labels update immediately in either mode. See `tests/progress.animation.regression.html` for browser coverage.
- `ui.virtual.list.js`
  - `createVirtualList(container, items, options)` virtualized list primitive for very large row sets with optional chrome-less rendering
- `ui.scheduler.js`
  - `createScheduler(container, data, options)` month/week scheduler primitive with slot/event interactions and optional chrome-less rendering
- `ui.menu.js`
  - `createMenu(triggerEl, items, options)` anchored popover menu primitive
  - item icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.popover.js`
  - `createPopover(triggerEl, options)` accessible anchored panel for arbitrary interactive content
  - supports viewport collision handling, focus restoration, custom mount parents, and nested portaled controls
- `ui.dropdown.js`
  - `createDropdown(triggerEl, items, options)` preset wrapper for bottom placement
  - uses `ui.menu` item icon contract
- `ui.dropup.js`
  - `createDropup(triggerEl, items, options)` preset wrapper for top placement
  - uses `ui.menu` item icon contract
- `ui.navbar.js`
  - `createNavbar(container, data, options)` top navigation bar
  - item/action icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.sidebar.js`
  - `createSidebar(container, data, options)` side navigation panel
  - item icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.breadcrumbs.js`
  - `createBreadcrumbs(container, data, options)` breadcrumb navigation
  - crumb icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.audio.player.js`
  - `createAudioPlayer(container, data, options)` reusable transport UI (play/pause, time, seek)
- `ui.audio.audiograph.js`
  - `createAudioGraph(container, data, options)` standalone role audiograph renderer with playback and livestream source support
- `ui.audio.timeline.js`
  - `createAudioTimeline(container, data, options)` synchronized multi-track audio timeline for arbitrary sources, including pending processing segments
- `ui.audio.callSession.js`
  - `createAudioCallSession(container, incident, options)` incident-media adapter over `createAudioTimeline(...)`

Reusable UI styles live under `css/ui`:

- `ui.tokens.css` shared spacing/color/typography tokens
- `ui.components.css` shared primitives (`.ui-button`, `.ui-input`, `.ui-panel`, `.ui-surface`, `.ui-field`, `.ui-label`, `.ui-badge`, `.ui-eyebrow`, `.ui-shell-header`, `.ui-shell-search`)
  - button variants:
    - `.ui-button-primary` emphasized filled action
    - `.ui-button-ghost` transparent background with border
    - `.ui-button-borderless` borderless transparent action
    - `.ui-button-quiet` low-emphasis bordered action
    - `.ui-button-link` link-style action
    - `.ui-button-icon` square icon button sizing helper
  - cell-action helpers:
    - `.ui-cell-actions` inline action-row wrapper for grid/tree-grid/list cells
    - `.ui-cell-action` per-action alignment helper for icon/button controls inside dense cells
  - form feedback:
    - `.ui-form-error` inline validation/auth error text for shared form/modal flows
- `ui.modal.css` shared modal shell styles
- `ui.dialog.css` dialog-specific styles on top of modal shell
- `ui.toast.css` toast notification styles
- `ui.select.css` select/dropdown styles
- `ui.tree.select.css` hierarchical tree-select styles
- `ui.toggle.css` toggle button + toggle group styles
- `ui.datepicker.css` datepicker styles
- `ui.elapsed.time.css` elapsed-duration readout styles
- `ui.clock.css` wall-clock display styles
- `ui.signal.strength.css` signal-strength status indicator styles
- `ui.heartbeat.strip.css` heartbeat history strip styles
- `ui.device.selector.css` adapter-driven device selector styles
- `ui.path.picker.css` local file/folder path picker styles
- `ui.timeline.css` timeline styles
- `ui.timeline.scrubber.css` timeline scrubber styles
- `ui.command.palette.css` command palette styles
- `ui.tree.css` tree view styles
- `ui.kanban.css` kanban board styles
- `ui.stepper.css` stepper styles
- `ui.splitter.css` splitter/pane resize styles
- `ui.data.inspector.css` data inspector styles
- `ui.empty.state.css` empty-state styles
- `ui.skeleton.css` skeleton loading styles
- `ui.file.input.css` file input picker styles
- `ui.file.uploader.css` file uploader styles
- `ui.tabs.css` tab UI styles
- `ui.strips.css` strip/chip selector styles
- `ui.media.strip.css` media strip and thumbnail launcher styles
- `ui.media.viewer.css` modal media viewer styles
- `ui.audio.css` audio player, audiograph, and call session styles
- `ui.grid.css` data-grid/table styles
- `ui.tree.grid.css` tree-grid styles
- `ui.hierarchy.map.css` hierarchy map styles
- `ui.tree.mind.map.css` tree mind-map canvas shell styles
- `ui.progress.css` progress styles
- `ui.virtual.list.css` virtual-list styles
- `ui.scheduler.css` scheduler styles
- `ui.map.controls.css` MapLibre-oriented control styles
- `ui.nav.css` navigation/menu styles

Current usage:

- `incident.types` now uses `createEventBag` and `createDrawer`.
- `incident.teams.assignments` now uses `createEventBag` and `createDrawer`.
- `incident.types` and `incident.teams.assignments` now share `createSearchField` for drawer search UX.
- Editor/viewer helpers now apply shared `ui-*` primitives (`ui-title`, `ui-input`, `ui-button`) alongside existing `hh-*` classes for non-breaking style migration.

## Component Loading

Application integrations should use the registry loader.

- `uiLoader` is the public app-loading contract.
- App code should call components by registry key.
- Direct path imports are for internal library work only and should be avoided in consuming apps.
- `uiLoader.loadManyGroup(...)` group names such as `core-shell`, `forms`, `communication`, `data`, `media`, `workflow`, and `incident` are retained as backward-compatible preload bundles.
- Treat loader groups as runtime loading bundles, not as the public documentation taxonomy.
- The source tree stays modular, but the repo now also supports generated distribution bundles: `dist/helpers.ui.bundle.min.js/css` for general UI and incident helpers, `dist/helpers.game.bundle.min.js/css` for `ui.game.*`, and `dist/helpers.inspection.bundle.min.js` for `ui.inspection.*`.
- Teams that want fewer helper requests can generate the bundle with `npm run build:ui-bundle` and then opt in at runtime with `uiLoader.setPreferBundles(true)` or `createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true })`.
- The main UI bundle covers general `ui.*` and `incident.*` registry entries. Optional game and inspection bundles cover `ui.game.*` and `ui.inspection.*` so unrelated pages do not carry those component families.
- Production PBB apps can ship only `dist/helpers.ui.bundle.min.js` and `dist/helpers.ui.bundle.min.css`. Import `{ uiLoader, AI_ICONS }` directly from the JS bundle; no source loader or icon module is required. See [dist-only consumption](docs/ui-bundle-standalone.md) and [the runnable example](examples/bundle-only.html). The existing source-loader `preferBundles: true` integration remains supported.
- In `preferBundles: true` mode, matching `ui.*`, `incident.*`, `ui.game.*`, and `ui.inspection.*` entries are strict bundle loads. Missing bundle JavaScript exports or required bundle CSS URLs fail loudly instead of falling back to per-component source files.
- Default shared, game, and inspection bundle URLs are version-tagged by `ui.loader.js`, so downstream vendor refreshes pull the matching bundle export table when registry exports change.
- Game pages may optionally preload the game bundle with `<script type="module" src="/assets/helper/helpers.game.bundle.min.js"></script>`; `uiLoader` can reuse the preloaded `window.__PBB_HELPER_GAME_BUNDLE__` map when bundle preference is enabled.
- Inspection pages may optionally preload `helpers.inspection.bundle.min.js`; `uiLoader` reuses `window.__PBB_HELPER_INSPECTION_BUNDLE__` when bundle preference is enabled. See `docs/ui-inspection-bundle-v1-spec.md`.
- Current optional game modules include `ui.game.core`, `ui.game.objects`, `ui.game.grid`, `ui.game.audio`, `ui.game.effects`, and `ui.game.state.chrome`.
- The README and demo catalog use stable component families for discovery so public categorization can improve without changing runtime group keys.
- `chrome: false` is only exposed by components that own a real library-managed outer shell.
- Components without distinct wrapper chrome should not add a no-op `chrome` flag.
- Prefer shared styling contracts before adding project-local CSS overrides.
- Prefer documented helper components and preset wrappers before building app-local UI for the same workflow.
- Common helper-first checks for repeated operational flows:
  - `createWindowManager(...)`
  - `installWorkspaceUiBridgeHost(...)`
  - `getWorkspaceUiBridge(...)`
  - `createFormModal(...)`
  - `createLoginFormModal(...)`
  - `createReauthFormModal(...)`
  - `createAccountFormModal(...)`
  - `createChangePasswordFormModal(...)`
  - `createIcon(...)`
  - `createStatusUpdateFormModal(...)`
  - `createReasonFormModal(...)`
  - `uiAlert(...)`, `uiConfirm(...)`, `uiPrompt(...)`
  - `createToastStack(...)`
  - `createMediaViewer(...)`
  - `createPdfViewer(...)`
  - `createHierarchyMap(...)`
- If the library is close but missing a repeated capability, do not patch the shared helper contract ad hoc from project work.
- Submit a proposal or spec update first so the shared helper change can be reviewed for:
  - cross-project reuse
  - naming consistency
  - contract boundaries
  - demo and regression impact
- Start with `css/ui/ui.components.css` primitives such as:
  - button variants: `.ui-button-primary`, `.ui-button-ghost`, `.ui-button-borderless`, `.ui-button-quiet`, `.ui-button-link`, `.ui-button-icon`
  - dense cell actions: `.ui-cell-actions`, `.ui-cell-action`
  - form feedback: `.ui-form-error`
  - shell/layout primitives: `.ui-panel`, `.ui-surface`, `.ui-field`, `.ui-label`, `.ui-badge`, `.ui-eyebrow`, `.ui-shell-header`, `.ui-shell-search`
- If the same override appears more than once in a consuming app, it is a candidate to move back into the shared library instead of remaining project-local.

#### `createGameEffectTimeline(options)` (`js/ui/ui.game.effects.js`)

- Optional game-bundle helper for non-rendering short-lived feedback effects.
- Helper owns effect lifetime, delay handling, normalized `progress`, `eased` progress, pause/resume, cleanup, reduced-motion compression, and iteration.
- Games own effect meaning, payload shape, spawn timing, rendering, scoring, and gameplay impact.
- Main methods:
  - `spawn(effect)`
  - `update(deltaMs)`
  - `forEach(callback, options?)`
  - `getEffects(options?)`
  - `getEffect(id)`
  - `remove(id)`
  - `clear()`
  - `pause()` / `resume()` / `setPaused(paused)`
  - `getState()`
  - `destroy()`
- Effect fields:
  - `id`
  - `type`
  - `payload`
  - `duration`
  - `delay`
  - `easing`
- Snapshot fields include `elapsed`, `age`, `remaining`, `progress`, `eased`, `active`, and `done`.
- `GAME_EFFECT_EASINGS` currently includes `linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, and `inOutCubic`.
- Related demo: `demos/demo.game.effects.html`

Public component families:

- Modal and feedback:
  - `ui.modal`, `ui.action.modal`, `ui.dialog`, `ui.toast`, `ui.busy.overlay`
- Forms and input:
  - `ui.form.modal`, preset wrappers, `ui.select`, `ui.tree.select`, `ui.toggle.button`, `ui.toggle.group`, `ui.password`, `ui.path.picker`, `ui.file.input`, `ui.number.stepper`, `ui.datepicker`, `ui.fieldset`, `ui.property.editor`, `ui.file.uploader`, `ui.device.primer`, `ui.device.selector`
- Data, timeline, map, and inspection:
- `ui.grid`, `ui.tree`, `ui.tree.grid`, `ui.hierarchy.map`, `ui.tree.mind.map`, `ui.virtual.list`, `ui.scheduler`, `ui.elapsed.time`, `ui.clock`, `ui.signal.strength`, `ui.heartbeat.strip`, `ui.stat.cards`, `ui.icon.grid`, `ui.map.controls`, `ui.map.legend`, `ui.map.markers`, `ui.map.drawing`, `ui.charts`, `ui.chart.xy`, `ui.timeline`, `ui.timeline.scrubber`, `ui.data.inspector`, `ui.empty.state`, `ui.skeleton`, `ui.progress`
- Media and playback:
  - `ui.media.viewer`, `ui.pdf.viewer`, `ui.media.strip`, `ui.audio.player`, `ui.audio.audiograph`, `ui.audio.timeline`, `ui.audio.callSession`
- Navigation and command surfaces:
  - `ui.navbar`, `ui.sidebar`, `ui.breadcrumbs`, `ui.menu`, `ui.popover`, `ui.dropdown`, `ui.dropup`, `ui.command.palette`, `ui.tabs`, `ui.strips`
- Workflow and layout:
  - `ui.drawer`, `ui.kanban`, `ui.stepper`, `ui.splitter`
- Workspace and embedding:
  - `ui.window`, `ui.iframe.host`, `ui.workspace.bridge`
- Shared foundations:
  - `ui.icons`, `ui.dom`, `ui.events`, `ui.search`
- Incident helpers:
  - `incident.base`, `incident.teams.assignments`, `incident.teams.assignments.editor`, `incident.teams.assignments.viewer`, `incident.types`, `incident.types.details.editor`, `incident.types.details.viewer`

Loader example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

const modal = await uiLoader.create("ui.modal", {
  title: "Registry Loaded Modal",
  content: "CSS and JS were loaded through uiLoader.",
});

modal.open();
```

Batch loading example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

await uiLoader.loadMany([
  "ui.modal",
  "ui.dialog",
  "ui.toast",
]);
```

Group loading example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

await uiLoader.loadManyGroup(["core-shell", "forms"]);
```

Diagnostics example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

uiLoader.setDebug(true);
console.log(uiLoader.getDiagnostics());
```

Registry contract test:

```sh
node tests/registry.contract.mjs
node tests/tree.grid.regression.mjs
node tests/modal.busy.regression.mjs
node tests/form.modal.regression.mjs
node tests/form.modal.presets.regression.mjs
```

## Chrome-less Components

`chrome: false` is supported only on components that own a real library-managed outer shell.

| Component key | Factory | `chrome: false` | Notes |
| --- | --- | --- | --- |
| `ui.grid` | `createGrid` | Yes | Removes outer grid frame; table internals remain intact. |
| `ui.tree` | `createTree` | Yes | Removes outer tree shell; node rendering and lazy loading are unchanged. |
| `ui.tree.grid` | `createTreeGrid` | Yes | Removes outer tree-grid frame; hierarchy, resize, and virtualization remain intact. |
| `ui.virtual.list` | `createVirtualList` | Yes | Removes list and viewport shell visuals; viewport scrolling, height, and layer virtualization remain intact. |
| `ui.data.inspector` | `createDataInspector` | Yes | Removes outer inspector shell; nested node rendering remains intact. |
| `ui.empty.state` | `createEmptyState` | Yes | Removes dashed empty-state frame so the host layout owns the presentation shell. |
| `ui.scheduler` | `createScheduler` | Yes | Removes outer scheduler shell; month/week layout and interactions remain intact. |
| `ui.elapsed.time` | `createElapsedTime` | Yes | Removes the elapsed-time pill border/background/padding so host cards can own the visual shell. |
| `ui.clock` | `createClock` | Yes | Removes the clock border/background/padding so host chrome can own the visual shell. |
| `ui.icon.grid` | `createIconGrid` | Yes | Removes the launcher grid border/background/padding so host cards or landing pages can own the shell. |
| `ui.navigation.stack` | `createNavigationStack` | Yes | Removes the stack border/background/radius so host panels can own the visual shell. |
| `ui.timeline` | `createTimeline` | No | No distinct outer shell today; no-op `chrome` flags are intentionally avoided. |
| `ui.stepper` | `createStepper` | No | Styling is item-level, not wrapper-shell-level. |
| `ui.skeleton` | `createSkeleton` | No | Visuals are internal placeholder blocks; there is no meaningful outer shell to disable. |

Rule of thumb:

- If the component owns a visible outer border/background/padding shell, it may expose `chrome: false`.
- If the component only renders internal items/blocks and has no distinct wrapper chrome, it should not expose the flag.

## Common Options

- `theme`: `"dark"` | `"light"` (default `"dark"`)
- `className`: extra class for root element
- `ariaLabel`: accessible label for wrapper/region style components where supported
- `emptyText`: fallback text for empty state
- `locale`, `timezone`: formatting support
- `debug`: boolean (default `false`)
- `lookups`: boot-reference object

## Shared Theme Presets

Helper components resolve palette through shared `--ui-*` tokens. Apps can set a theme on an app shell, modal host, or component surface with `data-theme`.

Stable presets:

- `dark`: existing default operational dark theme
- `light`: existing general light theme
- `dark-slate`: calmer slate admin surface
- `night-command`: high-contrast command-center surface
- `civic-light`: standard public/admin light surface
- `care-light`: softer care and citizen-facing surface
- `field-contrast`: high-visibility field/mobile surface

Example:

```html
<main data-theme="night-command">
  ...
</main>
```

The `data-theme` presets are token-level palettes. Older component-specific `theme` options may still accept only `dark` or `light` where documented.

Related demos:

- `demos/demo.themes.html`

Editor-only options:

- `onChange(payload)`
- `onSubmit(payload)` (emit-only, no auto-submit)

## Toggle Components

The shared toggle layer standardizes binary on/off controls so consuming apps do not need to invent local active/inactive button behavior.

Recommended use cases:

- map-toolbar toggles such as `Terrain` and `POI`
- filter chips
- admin settings toggles
- compact action strips
- segmented single-select controls

### `createToggleButton(container, options)`

Reusable binary toggle rendered as a native `button` with `aria-pressed`.

Supported options:

- `id`
- `label`
- `pressed`
- `icon`
- `ariaLabel`
- `variant`: `"pill" | "segmented" | "chip" | "icon" | "ghost"`
- `tone`: `"neutral" | "success" | "info" | "warning" | "danger"`
- `size`: `"sm" | "md" | "lg"`
- `quiet`
- `disabled`
- `leadingDot`
- `iconPosition`: `"start" | "end"`
- `count`
- `loading`
- `tooltip`
- `className`
- `onChange(payload)`

Accessibility contract:

- renders as a native `button`
- always sets `type="button"`
- always syncs `aria-pressed="true|false"`
- icon-only toggles require `ariaLabel`; invalid icon-only usage logs `console.error(...)` and renders nothing

Returned API:

- `setPressed(nextPressed, emit = false)`
- `getPressed()`
- `setDisabled(nextDisabled)`
- `setLabel(nextLabel)`
- `update(nextOptions = {})`
- `getState()`
- `destroy()`

`onChange(payload)` callback shape:

```js
{
  id: "terrain",
  pressed: true,
  button, // toggle-button instance
  event,  // click event or null when emitted programmatically
}
```

Example:

```js
const toggle = createToggleButton(container, {
  id: "terrain",
  label: "Terrain",
  pressed: true,
  variant: "pill",
  tone: "success",
  leadingDot: true,
  onChange(payload) {
    console.log(payload.id, payload.pressed);
  },
});
```

### `createToggleGroup(container, options)`

Composes multiple toggle buttons with shared sizing, tone, and selection rules.

Supported options:

- `items`
- `variant`: `"pill" | "segmented" | "chip" | "icon" | "ghost"`
- `tone`: `"neutral" | "success" | "info" | "warning" | "danger"`
- `size`: `"sm" | "md" | "lg"`
- `multi`
- `allowNone`
- `quiet`
- `disabled`
- `leadingDot`
- `className`
- `name`
- `onChange(payload)`

Group modes:

- `multi: true`
  - each toggle is independent
  - best for overlays and filters
- `multi: false`
  - behaves like a single-select group
  - `allowNone: false` guarantees one pressed item remains selected

Implementation note:

- `segmented` is supported at the button level but is primarily intended for grouped usage

Returned API:

- `getItems()`
- `getValue()`
- `setItems(nextItems = [])`
- `updateItem(id, patch = {})`
- `setPressed(id, nextPressed, emit = false)`
- `update(nextOptions = {})`
- `destroy()`

`onChange(payload)` callback shape:

```js
{
  items,        // cloned group item array
  changedItem,  // cloned item that changed
  changedIndex, // index of the changed item
  group,        // toggle-group instance
  value,        // pressed ids[] for multi, single id|null for single-select
}
```

Example:

```js
const group = createToggleGroup(container, {
  items: [
    { id: "terrain", label: "Terrain", pressed: true },
    { id: "poi", label: "POI", pressed: false },
  ],
  variant: "segmented",
  tone: "success",
  multi: true,
  onChange(payload) {
    console.log(payload.value, payload.changedItem);
  },
});
```

Shared styling contract:

- Use `ui.toggle.css` for toggle-specific visuals.
- For toolbar shells and surrounding layout, prefer shared primitives from `ui.components.css`.
- Do not replace toggle styling with project-local pressed-state implementations unless the shared contract is insufficient.

## Team Assignment Helpers

### List Helper: `incidentTeamsAssignments`

Required options:

- `categories` (array)
- `teams` (array)
- `noticeAlreadyExist(team)` (function)
- `incident_id`
- `operator_id`

Optional list options:

- `editable` (default `true`)
- `busyAssignments` (default `{}`), keyed by assignment `id`, `_client_key`, `client_key`, or `team_assignment_id`
- `headerText` (default `"Dispatch Details"`)
- `drawerHeaderText` (default `"Select Teams to Dispatch"`)
- `onAssignTeam(newAssignment)`
- `onItemChange(nextItem, meta)`
- `onChange(nextList, meta)`
- `requestCancelReason(fromStatus, meta)`
- `onOpenDrawer()`
- `onCloseDrawer()`

List behavior:

- `editable=true`: list renders editor instances and shows `Assign Teams` button
- `editable=false`: list renders viewer instances and does not show drawer/actions
- Assign drawer supports:
  - category filtering (`All Categories` default)
  - search within filtered team set
  - initial focus on the search field when opened
- duplicate hint on already assigned teams (same `team_id` where status is not `cancelled`)
- adding a team closes the drawer and moves focus to the first editable field on the new assignment card
- busy assignment cards set `aria-busy`, render a compact spinner/status row, and disable card controls until cleared by the app

If required list options are missing:

- helper logs console error
- renders nothing
- still returns stable API

`incidentTeamsAssignmentsEditor` and `incidentTeamsAssignmentsViewer` now support enriched team assignment rendering:

- Header with team name + category
- Status stepper timeline (`requested`, `accepted`, `en_route`, `on_scene`)
- Cancellation reason block when status is `cancelled`
- Notes thread (editor includes add-note input)
- Resource allocation table (shown only for `accepted|en_route|on_scene|completed` and when team resources exist)

Required options for editor/viewer:

- `incident_id`
- `team_id`
- `assigned_by_operator_id`

If required options are missing:

- helper logs console error
- that instance renders nothing
- helper still returns stable `{ destroy, update }`

Editor callbacks:

- `onStatusNext(assignmentId, toStatus)`
- `onCancel(assignmentId, fromStatus, reasonCode, reasonNote)`
- `onDelete(assignmentId)`
- `onContactChange(assignmentId, value)`
- `onNoteAdd(assignmentId, note)`
- `onAllocateChange(assignmentId, resourceTypeId, allocated)`
- `onItemChange(nextItem, meta)`
- `requestCancelReason(fromStatus, meta)` -> `{ reasonCode, reasonNote } | null` (sync or async)
- item-level `busy`, `busyAction`/`busy_action`, and `busyMessage`/`busy_message` fields may be supplied directly on an assignment row

Confirm handlers (required in editor):

- `confirmStatus(toStatus)`
- `confirmCancel(fromStatus, reasonCode, reasonNote)`
- `confirmDelete()`

All confirm handlers may return `boolean | Promise<boolean>`.

Runtime methods:

- `incidentTeamsAssignmentsEditor.getData()` -> current assignment payload object
- `incidentTeamsAssignmentsViewer.getData()` -> current assignment payload object
- `incidentTeamsAssignments.setList(items[])` -> replaces current list and rebuilds child instances
- `incidentTeamsAssignments.setItemBusy(assignmentId, true, { action, message })` -> marks one assignment busy
- `incidentTeamsAssignments.clearItemBusy(assignmentId)` -> clears one assignment busy state
- `incidentTeamsAssignments.getData()` -> array of assignment payloads from child instances
- `incidentTeamsAssignments.getState()` -> `{ list, options, busyAssignments, drawerState }`

Normalized change contract:

- unsaved assignment rows now always carry a stable `_client_key`
- `onItemChange(nextItem, meta)` emits normalized candidate item payloads for add/contact/allocation/status/cancel/note/remove interactions
- `onChange(nextList, meta)` emits the corresponding normalized candidate list
- persistence, debounce/autosave timing, optimistic behavior, rollback/conflict handling, and canonical state ownership remain app-owned
- `requestCancelReason(fromStatus, meta)` lets the host replace the native prompt-based cancel-reason collector with Helper modal UI or another app-owned adapter while preserving the existing `confirmCancel(...)` and `onCancel(...)` boundaries
- `busyAssignments` and item-level busy fields are app-owned async state; the helper only reflects and gates the affected card

## Incident Types Helpers

`incidentTypes` supports list rendering for incident type cards.

- `editable=true` (default): renders `incidentTypesDetailsEditor` children
- `editable=false`: renders `incidentTypesDetailsViewer` children
- `headerText` default: `"Incident Details"`
- `drawerHeaderText` default: `"Select Reported Incidents"`
- required: `categories` (incident categories array)
- required: `incidentTypes` (incident types array)
- optional callbacks: `noticeAlreadyExists(incidentType)`, `onOpenDrawer()`, `onCloseDrawer()`, `onAddIncidentType(payload)`, `onItemChange(nextItem, meta)`, `onChange(nextList, meta)`
- accepts incident payload or normalized incident-type item array
- `setList(items[])` replaces list and re-renders
- `getData()` returns current child payload array
- `getState()` returns `{ list, options, drawerState }`
- required when `editable=true`: `options.removeIncidentType` must be a function
- missing required list options: console error + render nothing + stable API

Single item shape used by editor/viewer:

```js
{
  id,
  _client_key,
  incident_id,
  incident_type_id,
  incident_type_category_id,
  incident_type_category_name,
  name,
  fields: [],
  detail_entries: [],
  resources: [],
  resources_needed: []
}
```

`incidentTypesDetailsEditor` options:

- `removeIncidentType(incidentTypeData)` (required in editor)
- `onFieldChange(incidentTypeId, fieldKey, value)`
- `onResourceChange(incidentTypeId, resourceTypeId, quantityNeeded)`
- `onItemChange(nextItem, meta)`

`incidentTypesDetailsEditor` methods:

- `getData()`
- `validate()` -> `{ status, errors: [{ field_key, error }] }`
- `isValid()`

`incidentTypesDetailsViewer` methods:

- `getData()`
- `validate()`
- `isValid()`

Behavior implemented:

- Header shows incident type name + category subtitle
- Editor shows remove icon (viewer hides it)
- Editor list shows `Add Incidents` button
- Add flow uses a bottom drawer with:
  - category filter from `options.categories`
  - type chips from `options.incidentTypes`
  - search with clear button and `Esc`-to-clear
  - initial focus on the search field when opened
  - duplicate block on existing `incident_type_id` in current list
- adding an incident type closes the drawer and moves focus to the first editable field on the new incident-type card
- Fields section:
  - sorted by `field.sort_order`
  - supports `text|number|textarea|select|multiselect|group`
  - supports existing backend field keys (`field_key`, `field_label`, `input_type`, `is_required`) and schema-style aliases (`key`, `label`, `type`, `required`)
  - required indicator + required attribute for required fields
  - scalar required/number validation paints warning state on the field row, sets `aria-invalid`, and clears the warning as the operator corrects the value
  - number `min/max/step` support
  - multiselect stored as comma-separated values in `detail_entries[].field_value`
  - grouped fields render nested child fields using the same text/number/textarea/select/multiselect input renderer
  - grouped fields can resolve built-in child schemas from `preset`, `field_preset`, `config.preset`, or JSON `config_json.preset` when `fields[]` is omitted
  - non-repeatable `group` values are stored as a JSON object string in `detail_entries[].field_value`
  - repeatable `group` values are stored as a JSON array string in `detail_entries[].field_value`
  - values resolved by `detail_entries[].field_key`

Grouped field example:

```js
{
  key: "missing_persons",
  label: "Missing Persons",
  type: "group",
  repeatable: true,
  required: true,
  fields: [
    { key: "name", label: "Complete name", type: "text", computed: { template: "{last_name}, {first_name}" }, hidden: true },
    [
      { key: "last_name", label: "Last name / Family name", type: "text", required: true },
      { key: "first_name", label: "First name", type: "text", required: true }
    ],
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { key: "age", label: "Age", type: "number", min: 1, max: 100 }
  ]
}
```

Preset-backed grouped fields can store only preset metadata:

```js
{
  field_key: "missing_persons",
  field_label: "Missing Persons",
  input_type: "group",
  config_json: JSON.stringify({
    preset: "missingPerson",
    preset_label: "Missing Persons",
    repeatable: true
  })
}
```

Repeatable group value shape:

```js
[
  { last_name: "Dela Cruz", first_name: "Juan", name: "Dela Cruz, Juan", gender: "Male", age: "17" },
  { last_name: "Santos", first_name: "Maria", name: "Santos, Maria", gender: "Female", age: "22" }
]
```

Group validation:

- required group with no non-empty item fails validation
- required child fields fail with nested `field_key` paths such as `missing_persons.0.last_name`
- child number fields honor `min` and `max`
- Resources section:
  - rendered only when `resources_needed` is not empty
  - labels from `resources[].name`
  - quantities resolved by `resource_type_id`
  - editor uses numeric inputs; viewer uses text
- unsaved incident-type rows now always carry a stable `_client_key`, even when they already have a lookup `incident_type_id` but do not yet have a persisted row `id`
- Missing required data/options:
  - logs console error
  - renders nothing
  - returns stable API object

## Lookup Keys

Supported lookup keys in `incidentBase`:

- `teamStatuses`
- `incidentStatuses`
- `alertLevels`
- `incidentTypes`
- `incidentCategories`
- `teams`
- `resourceTypes`
- `operators`

Missing references trigger console warnings.

## Audio UI Helpers

### `createAudioGraph(container, data, options)` (standalone)

Standalone audiograph component for a single role, usable with or without the call-session helper.

Data:

- `role`
- `roleLabel`
- `muted`
- `isPlaying`
- `isLive`
- `isActive`
- `currentMs`
- `durationMs`

Options:

- `style`: `vu | dots | mirrored | spectrum | neon | particle | shockwave | tsunami | plasma | burst | heartbeat`
- `sensitivity` (default `3.4`)
- `gateThreshold` (default `0.06`)
- `attackMs` (default `45`)
- `releaseMs` (default `260`)
- `intensityCurve` (default `1.7`)
- `freezeOnPause` (default `true`)
- `overlayHeader` (default `true`)
- `transparentBackground` (default `false`)
- `headerInsetPx` (default `30`)
- `showMute`, `muteLabel`, `unmuteLabel`
- `onToggleMute(muted, state)`

Methods:

- `destroy()`
- `update(nextData, nextOptions?)`
- `setMuted(muted, { notify? })`
- `setPlayback({ isPlaying, currentMs, durationMs })`
- `attachAudio(audioElement)`
- `attachMediaStream(stream)`
- `attachAudioNode(node)`
- `resume()`
- `unlockAudioContext()`
- `getState()`

Notes:

- One source is active at a time:
  - media element
  - media stream
  - audio node
- `unlockAudioContext()` remains as a compatibility alias to `resume()`.
- For live sources, the helper visualizes signal activity but does not own microphone/call mute policy.

### `createAudioPlayer(container, data, options)`

Reusable transport controls.

Data:

- `isPlaying`
- `currentMs`
- `durationMs`

Options:

- `ariaLabel`, `seekLabel`
- `playLabel`, `pauseLabel`
- `onTogglePlay(nextPlaying, state)`
- `onSeek(nextMs, meta)`

Methods:

- `destroy()`
- `update(nextData, nextOptions?)`
- `setPlaying(isPlaying)`
- `setCurrent(currentMs)`
- `setDuration(durationMs)`
- `getState()`

### `createAudioTimeline(container, data, options)`

Generic synchronized playback surface for multiple audio sources on one shared timeline.

Data:

```js
{
  durationMs: 24000,
  tracks: [
    {
      id: "radio-net",
      label: "Radio Net",
      muted: false,
      segments: [
        { id: "radio-1", srcUrl: "/audio/radio.wav", startOffsetMs: 0, durationMs: 24000 },
        { id: "radio-processing", processing: true, processingLabel: "Preparing radio channel..." }
      ]
    }
  ]
}
```

Behavior:

- Tracks are not role-limited; ids such as `caller`, `operator`, `radio-net`, `mixer-left`, or conference participant ids are valid.
- Segments align by `startOffsetMs` on the shared transport timeline.
- Segment source fields can use `srcUrl`, `src`, or `path`, resolved through `baseUrl` when relative.
- Pending segments with `processing: true` render a preparing notice and are excluded from playback until `update(...)` supplies a source URL.
- Mixed playable and pending timelines keep playback controls enabled; pending-only timelines disable playback controls.
- `durationMs` is the explicit timeline duration when provided; otherwise playable segment end offsets determine the duration.

Options:

- `ariaLabel`
- `autoplay`
- `baseUrl`
- `audiographStyle`
- `trackStyles`
- `sensitivity`
- `showMute`
- `onError(error)`
- `onStateChange(state)`

State:

- `isPlaying`, `currentMs`, `durationMs`
- `hasPending`, `hasPlayable`
- `tracks[]` with `id`, `label`, `muted`, `processing`, `playable`, and `segments[]`

Methods:

- `destroy()`
- `update(nextData, nextOptions?)`
- `play()`
- `pause()`
- `seek(nextMs)`
- `getState()`

### `createAudioCallSession(container, incident, options)`

Incident-media adapter for session playback from `incident.media[]`. It normalizes supported audio rows into `createAudioTimeline(...)` tracks and preserves the existing role-oriented state contract.

Behavior:

- Parses audio roles using `incident.media[].metadata.recording_role` with format:
  - `<role>-<call_id>-<timestamp>`
- Invalid `recording_role` format is skipped.
- Role streams are timestamp-aligned on one timeline.
- Timestamp gaps are treated as silence.
- Per-role mute keeps global timeline playing.
- Timeline seek/rewind works across the full session.
- Uses `incident.call_duration_seconds` (when present) as total timeline duration source of truth.
- Pending audio rows with `processing: true` or `metadata.processing: true` survive without a playable path, render a disabled preparing role track, and are excluded from playback until a later `update(...)` supplies a source URL.
- Pending-only sessions disable playback controls and expose `hasPending: true`, `hasPlayable: false`.
- `getTimeline()` returns the underlying generic timeline instance for advanced integration.

Role labels:

- `caller` -> `incident.caller.name` fallback `caller`
- `operator` -> `incident.operator.name` fallback `operator`
- unknown role -> role token

Pending audio rows:

```js
{
  id: "caller-audio-1",
  type: "audio",
  processing: true,
  processingLabel: "Preparing caller audio...",
  peer_role: "caller",
  peer_label: "PBB Caller",
  created_at: "2026-04-29T00:00:00Z",
  metadata: {
    processing: true,
    track_kind: "audio"
  }
}
```

When `metadata.recording_role` is unavailable on a pending row, `peer_role` plus a timestamp field such as `created_at` can provide the fallback role/timeline placement. Once a later update supplies the same media `id` with `path` / `srcUrl`, the row resolves into normal playback.

Options:

- `ariaLabel`
- `autoplay`
- `baseUrl`
- `audiographStyle`
- `roleStyles`
- `sensitivity`
- `showMute`
- `onError(error)`
- `onStateChange(state)`

Methods:

- `destroy()`
- `update(nextIncident, nextOptions?)`
- `play()`
- `pause()`
- `seek(nextMs)`
- `getState()`
- `getTimeline()`

### Navigation/Menu Utilities

#### `createPopover(triggerEl, options)`

Purpose:

- Reusable anchored panel for arbitrary interactive content such as filters, compact settings, and inspectors.
- Unlike `createMenu`, the content is app-composed and may contain form controls or nested Helpers.

Content can be an existing `HTMLElement` or a mount callback. A callback receives `(host, context)` and may return an element, a cleanup function, or a lifecycle object with `update(options, context)` and `destroy()` methods.

```js
import { createPopover } from "./js/ui/ui.popover.js";

const popover = createPopover(document.getElementById("filtersBtn"), {
  placement: "bottom-end",
  ariaLabel: "Timeline filters",
  content(host, context) {
    const form = document.createElement("form");
    form.innerHTML = '<button type="button">Apply filters</button>';
    form.querySelector("button").addEventListener("click", () => {
      context.close({ reason: "apply" });
    });
    host.appendChild(form);
    return form;
  },
});
```

Options:

- `content`: `HTMLElement` or `(host, context) => HTMLElement | cleanup | lifecycle`
- `placement`: `"bottom-start" | "bottom-end" | "top-start" | "top-end"`
- `offset`: number of pixels between trigger and panel (default `8`)
- `matchTriggerWidth`: make the panel exactly as wide as the trigger
- `panelParent`: `"body"`, `"trigger-parent"`, a selector, or an `HTMLElement`
- `panelRole`: ARIA role for the panel (default `"dialog"`)
- `ariaLabel`: accessible panel label
- `initialFocus`: `"first"`, `"panel"`, `false`, a selector, an element, or a resolver function
- `closeOnOutsideClick`, `closeOnEscape`, `restoreFocus`: dismissal and focus behavior
- `className`: additional panel class
- `onOpenChange(open, meta)`: receives the reason, resolved placement, and element refs

Methods:

- `open(meta?)`
- `close(meta?)`
- `toggle(meta?)`
- `update(options)`
- `position()`
- `getState()`
- `getRefs()`
- `destroy()`

The Helper flips and shifts the panel to remain in the viewport, repositions it on scroll/resize, owns `aria-expanded`/`aria-controls` on the trigger, closes on unhandled Escape or outside interaction, and restores focus after dismissal. Body-portaled `ui.select` and `ui.datepicker` panels mounted inside a popover are treated as owned child surfaces, so interacting with them does not dismiss the parent. Use Menu/Dropdown/Dropup for command lists, Modal for blocking tasks, and Drawer for persistent or responsive side panels.

#### `createMenu(triggerEl, items, options)`

Purpose:

- Reusable anchored popover menu used by dropdown/dropup wrappers.

Menu item icon contract:

- `icon`: SVG/HTML string
- `iconPosition`: `"start"` or `"end"` (optional, per-item override)
- `iconOnly`: `true|false` (optional, per-item override)

Example item:

```js
{
  id: "archive",
  label: "Archive",
  icon: '<svg viewBox="0 0 24 24"><path d="M20 6H4v14h16V6Zm-2 4v2H6v-2h12ZM21 2H3v2h18V2Z"/></svg>',
  iconPosition: "start",
  iconOnly: false
}
```

Useful options:

- `placement`: `"bottom-start" | "bottom-end" | "top-start" | "top-end"`
- `align`: `"left" | "right"` (overrides horizontal side while keeping top/bottom from placement)
- `offset`: number
- `closeOnSelect`: boolean
- `closeOnOutsideClick`: boolean
- `closeOnEscape`: boolean
- `matchTriggerWidth`: boolean
- `onSelect(item, meta)`
- `onOpenChange(open)`

Methods:

- `open()`
- `close()`
- `toggle()`
- `update(items?, options?)`
- `destroy()`
- `getState()`

#### `createDropdown(triggerEl, items, options)`

- Wrapper over `createMenu` with default `placement: "bottom-start"`.
- Supports the same item icon contract and options/methods.
- Supports `align: "left" | "right"` shortcut:
  - `left` -> `bottom-start`
  - `right` -> `bottom-end`

#### `createDropup(triggerEl, items, options)`

- Wrapper over `createMenu` with default `placement: "top-start"`.
- Supports the same item icon contract and options/methods.
- Supports `align: "left" | "right"` shortcut:
  - `left` -> `top-start`
  - `right` -> `top-end`

#### `createNavbar(container, data, options)`

- Top navigation with `items[]` and `actions[]`.
- Brand region supports:
  - `brandText`
  - optional `brandSubtitle`
  - optional `brandMedia`
- Additive slot content supports:
  - `contentStart`
  - `contentCenter`
  - `contentEnd`
- Persistent status content supports:
  - `statusContent`
  - `statusContentLabel`
  - The status region renders once, stays visible beside the mobile hamburger, and is not copied into the hamburger menu.
- Mobile-collapse helpers:
  - `mobileCollapse` (default `true`) keeps the brand visible on narrow screens and moves the rest into a hamburger menu.
  - `mobileLayout` (default `"auto"`) controls the narrow-screen layout:
    - `"auto"` preserves legacy behavior: `mobileCollapse: true` resolves to `"collapse"` and `mobileCollapse: false` resolves to `"stack"`.
    - `"collapse"` keeps the brand/status visible and moves content, items, and actions into the hamburger menu.
    - `"stack"` keeps items/actions inline but uses the existing stacked mobile rows.
    - `"scroll"` keeps the navbar in one row with horizontal overflow for compact app chrome.
  - `contentStartMobile`
  - `contentCenterMobile`
  - `contentEndMobile`
  - When explicit `content*Mobile` entries are omitted, narrow-screen menus fall back to the text content of `contentStart`, `contentCenter`, and `contentEnd`, then list `items[]`, then `actions[]`.
  - Menu-backed items and actions are grouped under their parent label in the mobile hamburger menu rather than being flattened as `Parent: Child`.
  - The hamburger path is viewport-aware: it activates only inside the mobile breakpoint and auto-closes when the navbar returns to desktop width.
- `items[]` and `actions[]` support the same icon contract (`icon`, `iconPosition`, `iconOnly`).
- `items[]` can render dropdown menus by providing:
  - `menuItems: []`
  - optional `menuOptions: {}`
- `actions[]` can render dropdown menus by providing:
  - `menuItems: []`
  - optional `menuOptions: {}`
- item-menu callbacks:
  - `onItemMenuSelect(item, menuItem, meta)`
  - `onItemMenuOpenChange(item, open)`
- menu callbacks:
  - `onActionMenuSelect(action, item, meta)`
  - `onActionMenuOpenChange(action, open)`
- Global defaults:
  - `iconPosition` (default `"start"`)
  - `iconOnly` (default `false`)

#### `createChatThread(container, data, options)`

- Shared conversation thread for:
  - incoming
  - outgoing
  - system messages
- Supports:
  - sender names
  - sender avatars through `message.senderAvatar` or `message.sender.avatar`
  - initials fallback when a sender has no avatar URL
  - online sender presence indicators through `message.senderPresence` or `message.sender.presence`
  - reply previews through `message.replyTo`
  - timestamps
  - outgoing delivery/read states
  - hidden/deleted moderation placeholders through `message.status`
  - reaction chips and optional picker callbacks through `message.reactions`
  - grouped message runs
  - grouped image/video attachments through `ui.media.strip`
  - audio/file attachments as listed rows
  - helper-owned per-message action trigger when apps return menu items
- Reusable avatar presence utilities:
  - wrap app-owned avatars with `.ui-avatar-presence-host`
  - add `.is-presence-online` and a child `.ui-avatar-presence-dot`
  - V1 renders the online dot; offline/unknown states should omit the dot or use `none`
- Reply preview shape:
  - `message.replyTo.id`
  - `message.replyTo.senderName`
  - `message.replyTo.text`
  - `message.replyTo.attachmentLabel`
- Reply preview callback:
  - `onReplyPreviewOpen(message, replyTo)` makes the preview clickable and lets the app jump to or focus the referenced message
- Reactions:
  - `message.reactions` accepts `{ id, label, count, reactedByCurrentUser }` entries
  - `allowedReactions` defines compact picker options when the app provides `onReactionSelect`
  - `showReactionPicker: false` keeps existing reaction chips visible without rendering picker options
  - `onReactionSelect(message, reaction)` fires for existing chips and picker options
  - apps own persistence, permission checks, realtime sync, and updated counts
- Moderation placeholders:
  - set `message.status` to `hidden` or `deleted`
  - hidden/deleted messages render as muted placeholders instead of normal message bubbles
  - placeholder defaults are `Message hidden by moderator` and `Message deleted`
  - override the placeholder text with `message.statusLabel` or `message.placeholderLabel`
  - placeholders preserve sender avatars, initials fallback, outgoing placement, and online presence dots
  - placeholders suppress original text, attachments, reply previews, sender labels/subtitles, reactions, and regular message menus
- Instance methods:
  - `setMessages(messages)`
  - `getMessages()`
  - `getState()`

#### `createChatComposer(container, data, options)`

- Shared message composer with:
  - multiline text entry
  - send button
  - helper-owned attachment picker
  - busy/disabled state
- Supports:
  - `Enter` submit
  - `Shift+Enter` newline
  - hidden native `<input type="file">`
  - `accept`
  - `multiple`
  - optional `capture`
  - `onFilesSelected(files, meta)`
- Instance methods:
  - `setValue(value)`
  - `getValue()`
  - `clear()`
  - `focus()`
  - `setBusy(busy)`
  - `getState()`

#### `createChatUploadQueue(container, data, options)`

- Shared pending-attachment queue for unsent drafts.
- Supports:
  - grouped `image` / `video` attachments through `ui.media.strip`
  - listed `audio` / `file` attachments with remove actions
  - visual per-item upload state:
    - `queued`
    - `uploading`
    - `uploaded`
    - `failed`
  - visual per-item progress/error fields:
    - `progress`
    - `progressLabel`
    - `errorText`
  - hidden empty state by default
- Instance methods:
  - `setItems(items)`
  - `getItems()`
  - `getState()`

#### `createSidebar(container, data, options)`

- Side navigation with `items[]`.
- `items[]` support the same icon contract (`icon`, `iconPosition`, `iconOnly`).
- Global defaults:
  - `iconPosition` (default `"start"`)
  - `iconOnly` (default `false`)

#### `createBreadcrumbs(container, data, options)`

- Breadcrumb trail with optional stateful helpers (`setItems`, `addCrumb`, `getItems`, `reset`).
- `items[]` support the same icon contract (`icon`, `iconPosition`, `iconOnly`).
- Global defaults:
  - `iconPosition` (default `"start"`)
  - `iconOnly` (default `false`)

### Navigation/Menu Quickstart

Copy-paste snippets (all are ES module usage):

#### 1) `createMenu`

```js
import { createMenu } from "./js/ui/ui.menu.js";

const trigger = document.getElementById("menuBtn");
const menu = createMenu(trigger, [
  { id: "new", label: "New", icon: "<svg viewBox='0 0 24 24'><path d='M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6Z'/></svg>" },
  { id: "delete", label: "Delete", danger: true },
], {
  placement: "bottom-start",
  onSelect(item) { console.log("menu.select", item); },
});

trigger.addEventListener("click", () => menu.toggle());
```

#### 2) `createDropdown`

```js
import { createDropdown } from "./js/ui/ui.dropdown.js";

const dd = createDropdown(document.getElementById("dropdownBtn"), [
  { id: "caller", label: "Caller View" },
  { id: "operator", label: "Operator View" },
], {
  onSelect(item) { console.log("dropdown.select", item.id); },
});
```

#### 3) `createDropup`

```js
import { createDropup } from "./js/ui/ui.dropup.js";

const du = createDropup(document.getElementById("dropupBtn"), [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
], {
  onSelect(item) { console.log("dropup.select", item.id); },
});
```

#### 4) `createNavbar`

```js
import { createNavbar } from "./js/ui/ui.navbar.js";

createNavbar(document.getElementById("navbarHost"), {}, {
  brandText: "Hotline UI",
  brandSubtitle: "Build app-DWv_LvMM",
  brandMedia: "<svg viewBox='0 0 24 24'><path d='M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z'/></svg>",
  mobileLayout: "collapse",
  statusContentLabel: "System status",
  statusContent() {
    const status = document.createElement("span");
    status.textContent = "Syncing 3 calls";
    return status;
  },
  contentCenter() {
    const pill = document.createElement("span");
    pill.textContent = "Realtime Connected";
    return pill;
  },
  activeId: "dashboard",
  items: [
    { id: "dashboard", label: "Dashboard" },
    {
      id: "apps",
      label: "Apps",
      menuItems: [
        { id: "app:relay", label: "Relay" },
        { id: "app:workspace", label: "Workspace" },
      ],
    },
  ],
  actions: [
    { id: "help", label: "Help", icon: "<svg viewBox='0 0 24 24'><path d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'/></svg>" },
  ],
  onNavigate(item) { console.log("navbar.navigate", item); },
  onItemMenuSelect(item, menuItem) { console.log("navbar.itemMenu.select", item, menuItem); },
  onAction(action) { console.log("navbar.action", action); },
});
```

#### 5) `createSidebar`

```js
import { createSidebar } from "./js/ui/ui.sidebar.js";

createSidebar(document.getElementById("sidebarHost"), {}, {
  title: "Sections",
  activeId: "calls",
  items: [
    { id: "calls", label: "Calls" },
    { id: "dispatch", label: "Dispatch" },
  ],
  onNavigate(item) { console.log("sidebar.navigate", item); },
  onToggleCollapsed(collapsed) { console.log("sidebar.collapsed", collapsed); },
});
```

#### 6) `createBreadcrumbs`

```js
import { createBreadcrumbs } from "./js/ui/ui.breadcrumbs.js";

const bc = createBreadcrumbs(document.getElementById("crumbHost"), {}, {
  autoTruncateOnNavigate: true,
  items: [
    { id: "home", label: "Home" },
    { id: "incidents", label: "Incidents" },
    { id: "details", label: "Details" },
  ],
  onNavigate(item, index, nextItems) {
    console.log("breadcrumbs.navigate", item, index, nextItems);
  },
});

bc.addCrumb({ id: "photos", label: "Photos" });
console.log(bc.getItems());
```

## Demo Usage

Open from a local server (Apache/WAMP/Nginx):

- `demos/index.html` -> demo catalog and documentation entry points
- `demos/cookbook.html` -> workflow-first recipe guide for common operational UI patterns
- `demos/guide.which-helper.html` -> helper decision guide for choosing the narrowest documented component
- root `index.html` -> lightweight redirect into `demos/index.html`
- `demos/demo.team.assignments.html` -> two-column Team Assignments demo
  - left: editable list helper
  - right: read-only list helper
  - right column mirrors left via `setList(items[])`
- `demos/demo.incident.types.html` -> Incident Types demo
  - left: editable list helper
  - right: viewer list helper
  - right column mirrors left via `setList(items[])`
- `demos/demo.grid.html` -> dedicated grid demo
  - local grid (client search/sort/pagination)
  - remote grid (query-driven updates)
  - large virtualized grid with fixed-height scrolling
- `demos/demo.tree.grid.html` -> dedicated tree-grid playground
  - expandable hierarchy in tabular columns
  - tree-aware search and lazy loading
  - fixed-row-height virtualization
- `demos/demo.hierarchy.map.html` -> dedicated hierarchy-map playground
  - hierarchy-first visual exploration
  - external entity lane and overlay links
  - zoom/pan and search
- `demos/demo.progress.html` -> progress styles demo
  - live configurable progress
  - style gallery for all rendering variants
- `demos/demo.virtual.list.html` -> dedicated virtual-list playground
  - large row-set windowing
  - `scrollToIndex(...)` controls
  - visible-range callback logging
- `demos/demo.scheduler.html` -> dedicated scheduler/calendar playground
  - month/week views
  - slot and event callback interactions
- `demos/demo.elapsed.time.html` -> dedicated elapsed-time playground
  - active incident duration readouts
  - team assignment status-duration readouts
  - dense dashboard sample using one shared ticker
- `demos/demo.clock.html` -> dedicated clock playground
  - operator header wall-clock display
  - label, HH:MM:SS AM/PM time, and date row
  - shared ticker with elapsed-time instances
- `demos/demo.signal.strength.html` -> dedicated signal-strength playground
  - stable navbar/header placement
  - all signal levels and tones
  - bars-only compact mode
- `demos/demo.heartbeat.strip.html` -> dedicated heartbeat-strip playground
  - current source/node status and age
  - compact 24/48/72-hour history buckets
  - Relay/Support-style source rail card sample
- `demos/demo.stat.cards.html` -> dedicated stat-cards playground
  - operational KPI rows
  - selectable cards, tones, trends, and chrome-less rendering
  - responsive column and size controls
- `demos/demo.map.controls.html` -> dedicated MapLibre-style map-controls playground
  - zoom and compass/bearing controls
  - pitch presets
  - locate, fit, and layer toggles
- `demos/demo.map.legend.html` -> dedicated map-legend playground
  - alert, marker, route, and data-quality sections
  - compact, collapsible, count, and empty states
  - works without MapLibre globals
- `demos/demo.map.markers.html` -> dedicated map-marker playground
  - incidents, hubs, hotspots, routes, boundary centroids, and clusters
  - selected, active, muted, pulsing, count, and custom-color states
  - returns plain DOM elements for app-owned map engines
- `demos/demo.map.drawing.html` -> dedicated map-drawing playground
  - drawing modes, edit actions, measurements, and mock adapter events
  - vertical map overlay and horizontal external toolbar layouts
  - no MapLibre global dependency
- `demos/demo.charts.html` -> dedicated charts playground
- bar, horizontal-bar, stacked-bar, donut, and sparkline charts
- `demos/demo.chart.xy.html` -> dedicated X/Y chart playground
- line/point series, Y-axis thresholds, shaded bands, and point callbacks
  - empty, selectable, long-label, and state examples
  - dependency-free DOM/SVG rendering
- `demos/demo.ui.html` -> UI utilities overview/router
  - jump to focused pages for toast, select, toggle button, toggle group, and buttons
- `demos/demo.themes.html` -> shared theme preset playground
  - dark, light, slate, command, civic, care, and field token palettes
- `demos/demo.media.viewer.html` -> dedicated media-viewer playground
  - standalone image/video viewer
  - zoom/pan + fit modes
  - optional video audiograph
- `demos/demo.timeline.html` -> dedicated timeline playground
  - vertical grouped timeline
  - horizontal timeline
  - lifecycle-managed custom item content
- `demos/demo.timeline.scrubber.html` -> dedicated timeline scrubber playground
  - playhead seek behavior
  - range handles and zoom controls
  - linked timeline filtering/highlighting example
- `demos/demo.audio.html` -> incident call-session adapter + stacked role audiographs
  - sample selector for available `sampledata_*.json`
  - graph style selector
  - sensitivity slider
  - theme toggle
- `demos/demo.audio.timeline.html` -> generic synchronized audio timeline
  - arbitrary `tracks[]` / `segments[]`
  - pending processing segment resolution
  - per-track graph style override
- `demos/demo.nav.html` -> navigation overview and routing page
- `demos/demo.navbar.html` -> dedicated navbar manual/demo
- `demos/demo.sidebar.html` -> dedicated sidebar manual/demo
- `demos/demo.breadcrumbs.html` -> dedicated breadcrumbs manual/demo
- `demos/demo.dropdown.html` -> dedicated dropdown manual/demo
- `demos/demo.dropup.html` -> dedicated dropup manual/demo
- `demos/demo.popover.html` -> dedicated interactive popover manual/demo
- `demos/demo.stepper.html` -> dedicated stepper playground
  - workflow progression states
  - orientation toggle + step navigation
- `demos/demo.splitter.html` -> dedicated splitter playground
  - horizontal and vertical pane resizing
  - pointer + keyboard resize behavior
- `demos/demo.inspector.html` -> dedicated data inspector playground
  - nested object/array inspection
  - copy-path interactions
- `demos/demo.empty.state.html` -> dedicated empty-state playground
  - action callbacks and icon/title/description variants
- `demos/demo.skeleton.html` -> dedicated skeleton playground
  - lines/card/grid variants
  - animation toggle
- `demos/demo.form.modal.html` -> dedicated base form-modal playground
  - base `createFormModal(...)`
  - acceptance-proof hub/uplink flows
- `demos/demo.form.modal.login.html` -> dedicated login preset page
- `demos/demo.form.modal.reauth.html` -> dedicated re-auth preset page
- `demos/demo.form.modal.status.html` -> dedicated status-update preset page
- `demos/demo.form.modal.reason.html` -> dedicated reason-required preset page
- `demos/demo.tree.select.html` -> dedicated grouped tree-select page
- `demos/demo.field.group.html` -> repeatable grouped custom field page
- `demos/demo.checkbox.html` -> shared checkbox primitive page
- `demos/demo.checkbox.group.html` -> shared multi-checkbox primitive page
- `demos/demo.combobox.html` -> shared local-history combobox page
- `demos/demo.fieldset.html` -> dedicated fieldset/grouped-form page
  - semantic `fieldset` / `legend` grouping
  - form-modal-style `rows[]` outside modal lifecycle
  - mixed field/text/alert/image/custom-content rows

Demo pages load:

- `samples/sampledata.json`
- `samples/sampledata_*.json` (in specific demos)
- `samples/samplemedia.json` (for media-strip and media-viewer demos)
- `boot.team.assignment.status.json`
- `boot.incident.status.json`
- `boot.alert.levels.json`
- `boot.incident.types.json`
- `boot.incident.categories.json`
- `boot.teams.json`
- `boot.resource.types.json`
- `boot.operators.json`

## Minimal Import Example

```html
<script type="module">
  import { incidentTeamsAssignments } from "./js/incident/incident.teams.assignments.js";

  const api = incidentTeamsAssignments(
    document.getElementById("target"),
    incidentData,
    { theme: "dark", lookups }
  );

  // later
  api.update(nextIncidentData, { theme: "light" });
  // cleanup
  api.destroy();
</script>
```

Theme note:

- Incident helpers still expose `options.theme` (`"dark"` or `"light"`), but their palette now derives from the shared helper `--ui-*` tokens through the local `--hh-*` layer. This keeps incident cards, drawers, chips, and status surfaces aligned with the active helper theme instead of using an isolated hard-coded palette.

## Detailed Usage Reference

### `incidentBase(container, data, options)`

Purpose:

- Shared incident-level utilities, lookup resolving, debug logging.

Key options:

- `lookups`: object containing boot references.
- `debug`: `true|false`, enables extra console/debug output.

Lookup keys expected:

- `teamStatuses`, `incidentStatuses`, `alertLevels`, `incidentTypes`, `incidentCategories`, `teams`, `resourceTypes`, `operators`

Behavior:

- Missing lookup reference entries are warned in console.
- Returns stable API (`destroy`, `update`) even with invalid data.

Example:

```js
import { incidentBase } from "./js/incident/incident.base.js";

const baseApi = incidentBase(document.createElement("div"), {}, {
  debug: false,
  lookups,
});
```

### `incidentTeamsAssignments(container, data, options)`

Purpose:

- Renders list of team assignment cards.
- Chooses editor/viewer child helper per `options.editable`.

Required options:

- `categories`, `teams`, `noticeAlreadyExist(team)`, `incident_id`, `operator_id`

Optional options:

- `editable` (default `true`)
- `busyAssignments` (default `{}`), keyed by assignment `id`, `_client_key`, `client_key`, or `team_assignment_id`
- `headerText` (default `"Dispatch Details"`)
- `drawerHeaderText` (default `"Select Teams to Dispatch"`)
- `theme` (default `"dark"`), used to set the helper variant while inheriting colors from the shared `--ui-*` theme tokens
- `onOpenDrawer()`, `onCloseDrawer()`
- `onAssignTeam(newAssignmentPayload)`
- `onItemChange(nextItem, meta)`
- `onChange(nextList, meta)`
- `requestCancelReason(fromStatus, meta)` -> `{ reasonCode, reasonNote } | null` (sync or async)
- item-level `busy`, `busyAction`/`busy_action`, and `busyMessage`/`busy_message`

Methods:

- `setList(items[])`
- `setItemBusy(assignmentId, true, { action, message })`
- `clearItemBusy(assignmentId)`
- `getData()`
- `getState()`
- `update(nextData, nextOptions?)`
- `destroy()`

Example:

```js
import { incidentTeamsAssignments } from "./js/incident/incident.teams.assignments.js";

const api = incidentTeamsAssignments(container, incidentPayload, {
  editable: true,
  incident_id: incidentPayload.id,
  operator_id: 2,
  categories,
  teams,
  noticeAlreadyExist(team) {
    console.log("Already assigned:", team.name);
  },
  onAssignTeam(payload) {
    console.log("New assignment payload:", payload);
  },
});

api.setItemBusy(assignmentId, true, {
  action: "status",
  message: "Updating assignment...",
});

await saveAssignmentStatus(assignmentId, nextStatus);
api.clearItemBusy(assignmentId);
```

### `incidentTeamsAssignmentsEditor(container, data, options)`

Purpose:

- Single assignment editable card with status progression, notes, and allocations.

Required options:

- `incident_id`, `team_id`, `assigned_by_operator_id`
- `confirmStatus(toStatus)`, `confirmCancel(fromStatus, reasonCode, reasonNote)`, `confirmDelete()`

Callbacks:

- `onStatusNext(assignmentId, toStatus)`
- `onCancel(assignmentId, fromStatus, reasonCode, reasonNote)`
- `onDelete(assignmentId)`
- `onContactChange(assignmentId, value)`
- `onNoteAdd(assignmentId, note)`
- `onAllocateChange(assignmentId, resourceTypeId, allocated)`
- `onItemChange(nextItem, meta)`
- `requestCancelReason(fromStatus, meta)` -> `{ reasonCode, reasonNote } | null` (sync or async)

Notes:

- Confirm callbacks may return `boolean | Promise<boolean>`.
- `requestCancelReason(...)` may return sync or async results; `null` aborts the cancel flow and native prompts remain the fallback when the option is omitted.
- Missing required options: logs error, renders nothing, returns stable API.

### `incidentTeamsAssignmentsViewer(container, data, options)`

Purpose:

- Single assignment read-only card mirroring editor output.

Required options:

- `incident_id`, `team_id`, `assigned_by_operator_id`

Notes:

- No editor controls rendered (cancel/next status/note input hidden).
- Same stable API (`destroy`, `update`, `getData`).

### `incidentTypes(container, data, options)`

Purpose:

- List helper for incident type details cards.
- `editable=true` uses editor children, `editable=false` uses viewer children.

Required options:

- `categories`, `incidentTypes`
- `removeIncidentType(incidentTypeData)` is required when `editable=true`

Optional options:

- `headerText` (default `"Incident Details"`)
- `drawerHeaderText` (default `"Select Reported Incidents"`)
- `theme` (default `"dark"`), used to set the helper variant while inheriting colors from the shared `--ui-*` theme tokens
- `noticeAlreadyExists(incidentType)`
- `onOpenDrawer()`, `onCloseDrawer()`, `onAddIncidentType(payload)`
- `onItemChange(nextItem, meta)`
- `onChange(nextList, meta)`

Methods:

- `setList(items[])`
- `getData()`
- `getState()`
- `update(nextData, nextOptions?)`
- `destroy()`

### `incidentTypesDetailsEditor(container, data, options)`

Purpose:

- Single incident-type editable detail card.

Required options:

- `removeIncidentType(incidentTypeData)`

Optional callbacks:

- `onFieldChange(incidentTypeId, fieldKey, value)`
- `onResourceChange(incidentTypeId, resourceTypeId, quantityNeeded)`
- `onItemChange(nextItem, meta)`

Methods:

- `getData()`
- `validate()`
- `isValid()`
- `update(nextData, nextOptions?)`
- `destroy()`

Field support:

- `text`, `number`, `textarea`, `select`, `multiselect`, `group`
- field definitions can use `field_key`/`field_label`/`input_type`/`is_required` or `key`/`label`/`type`/`required`
- `multiselect` stored as comma-separated string in `detail_entries[].field_value`
- `group` can be repeatable; non-repeatable groups store a JSON object string and repeatable groups store a JSON array string in `detail_entries[].field_value`
- group child fields reuse the same primitive input renderer and validation rules
- unsaved rows retain stable `_client_key` values for host-side reconciliation

### `incidentTypesDetailsViewer(container, data, options)`

Purpose:

- Read-only version of incident-type details card.
- Composes `ui.property.viewer` with dense, chrome-free sections. Repeatable groups use labelled `Group #N` sections; scalar fields use their own labels without a generic Fields heading.
- Person/patient groups show the computed complete name once, retaining legacy/partial names and other populated details. Resources Needed is a separate section containing positive quantities only.
- Loader users receive the Property Viewer dependency and styles automatically. Direct source imports must also load `css/ui/ui.property.viewer.css` alongside the incident styles. Stored data and editor inputs are unchanged.
- Opt into side-by-side mobile properties with `propertyViewerOptions: { mobileLayout: "columns" }` on either `incidentTypesDetailsViewer(...)` or `incidentTypes(..., { editable: false, ... })`. Only `mobileLayout` is forwarded; default is `"stack"`. Pass the option again through `update(nextData, nextOptions)` to change layout. Long labels and values wrap; desktop layout and editors are unchanged.

Methods:

- `getData()`
- `validate()`
- `isValid()`
- `update(nextData, nextOptions?)`
- `destroy()`

### `createDrawer(options)` (`js/ui/ui.drawer.js`)

Purpose:

- Reusable drawer shell used by list helpers and demo UIs.
- `createBottomDrawer(options)` remains available as a compatibility alias for older code, but new integrations should use `createDrawer(options)` because the component supports top, bottom, left, and right positions.

Key options:

- `title`
- `closeLabel`
- `animationMs` (default `220`)
- `position`: `"top" | "bottom" | "left" | "right"` (default `"bottom"`)
- `headerActions`: declarative header buttons rendered before the close button:
  - `id`
  - `label`
  - `icon`: Helper icon id such as `"actions.refresh"`, or a DOM node
  - `title`
  - `disabled`
  - `busy`
  - `tone`: `"default" | "primary" | "danger" | "quiet" | "ghost"`
  - `showLabel`: render visible label text beside the icon
  - `onClick(action, event, drawerApi)`
- class overrides:
  - `backdropClass`, `panelClass`, `headerClass`, `titleClass`, `headerControlsClass`, `headerActionsClass`, `closeClass`, `bodyClass`
- `onClose()`

Returned refs/methods:

- refs: `panel`, `body`, `header`, `title`, `headerControls`, `headerActions`, `closeButton`, `backdrop`
- methods: `open(parent?)`, `close()`, `destroy()`, `isOpen()`
- header action methods: `updateHeaderActions(actions)`, `setHeaderActionState(id, patch)`, `getHeaderAction(id)`

Example:

```js
import { createDrawer } from "./js/ui/ui.drawer.js";

const drawer = createDrawer({
  title: "Select Teams",
  position: "right",
  animationMs: 260,
  headerActions: [
    {
      id: "refresh",
      label: "Refresh teams",
      icon: "actions.refresh",
      onClick(action, event, drawerApi) {
        drawerApi.setHeaderActionState(action.id, { busy: true });
        refreshTeams().finally(() => {
          drawerApi.setHeaderActionState(action.id, { busy: false });
        });
      },
    },
  ],
  onClose() {
    console.log("drawer closed");
  },
});
drawer.open(document.body);
```

Related demos:

- `demos/demo.drawers.html`

### `createPasswordField(container, options)` (`js/ui/ui.password.js`)

Purpose:

- Shared password-entry primitive with a helper-owned show/hide toggle.
- Used directly by teams and composed by `createFormModal(...)` password rows, including login and re-auth presets.
- Toggle target is sized by Helper to meet WCAG 2.2 target-size minimums in standalone and modal/preset usage.

Factory:

```js
import { createPasswordField } from "./js/ui/ui.password.js";

const password = createPasswordField(container, options);
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `""` | Initial password value. |
| `visible` | `boolean` | `false` | Initial visibility state for the password text. |
| `placeholder` | `string` | `""` | Input placeholder text. |
| `name` | `string` | `""` | Submitted field name. |
| `id` | `string` | `""` | Input id for external labels. |
| `autocomplete` | `string` | `""` | Password-manager hint such as `current-password` or `new-password`. |
| `required` | `boolean` | `false` | Marks the input as required. |
| `disabled` | `boolean` | `false` | Disables both the input and toggle button. |
| `readonly` | `boolean` | `false` | Keeps the value visible/toggleable but non-editable. |
| `ariaLabel` | `string` | `"Password"` | Direct aria-label for unlabeled standalone usage. |
| `showLabel` | `string` | `"Show password"` | Accessible label for the hidden-state icon toggle. |
| `hideLabel` | `string` | `"Hide password"` | Accessible label for the visible-state icon toggle. |
| `onChange` | `function` | `null` | Called as `onChange(value, api)` when the value changes. |
| `onToggle` | `function` | `null` | Called as `onToggle(visible, api)` when visibility changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getValue()` | none | `string` | Returns the current password value. |
| `setValue(value)` | `string` | `void` | Updates the current value. |
| `isVisible()` | none | `boolean` | Returns whether the password is currently shown as text. |
| `setVisible(visible)` | `boolean` | `void` | Forces the current visibility state. |
| `focus()` | none | `void` | Focuses the underlying input. |
| `update(options)` | partial options | `void` | Updates options such as disabled or visible state. |
| `destroy()` | none | `void` | Removes the helper content from the host container. |

Example:

```js
const password = createPasswordField(document.getElementById("passwordHost"), {
  id: "operator-password",
  name: "operator_password",
  placeholder: "Enter password",
  autocomplete: "current-password",
  onToggle(visible) {
    console.log("visible:", visible);
  },
});
```

Related demos:

- `demos/demo.password.html`
- `demos/demo.form.modal.login.html`
- `demos/demo.form.modal.reauth.html`

### `createPathPicker(container, options)` (`js/ui/ui.path.picker.js`)

Purpose:

- Adapter-driven file/folder path input for local setup and admin configuration screens.
- Use this when the app stores a local filesystem path, not when it uploads file contents.
- Helper owns the text-editable path UI, browse/clear controls, required and extension validation, async host validation, and status rendering.
- The host app owns filesystem access through `pickFile`, `pickFolder`, or `pickPath`; browser-only file inputs should not be treated as a reliable real-path source.

Factory:

```js
import { createPathPicker } from "./js/ui/ui.path.picker.js";

const phpPicker = createPathPicker(container, {
  label: "PHP",
  mode: "file",
  value: "C:\\wamp64\\bin\\php\\php8.2.29\\php.exe",
  extensions: [".exe"],
  browseLabel: "Choose PHP executable",
  async pickFile(context) {
    return kitBridge.pickFile(context);
  },
  async validatePath(path) {
    return kitBridge.validateExecutable(path);
  },
});
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | `"file" \| "folder" \| "save-file"` | `"file"` | Picker target mode. |
| `value` | `string` | `""` | Initial path value. |
| `label` | `string` | `""` | Optional visible field label. |
| `placeholder` | `string` | `""` | Input placeholder text. |
| `name` / `id` | `string` | `""` | Standard input attributes. |
| `accept` | `string` | `""` | Accept-style extension string, used as an extension fallback. |
| `extensions` | `string[]` | `[]` | Allowed file extensions such as `[".exe", ".json"]`; ignored in folder mode. |
| `required` | `boolean` | `false` | Marks an empty path invalid. |
| `browseLabel` | `string` | mode-specific | Browse button label. |
| `showClear` | `boolean` | `true` | Shows a clear button when a value is present. |
| `validateOnChange` | `boolean` | `true` | Runs validation as the value changes. |
| `pickFile` / `pickFolder` / `pickPath` | `function` | `null` | App/native/local-agent picker adapters. |
| `validatePath` | `function` | `null` | Optional sync/async host validation. Return `true`, a message string, or `{ valid, tone, message }`. |
| `onChange` | `function` | `null` | Called as `onChange(value, meta)` for manual, browse, and clear updates. |
| `onBrowse` | `function` | `null` | Called after a browse adapter resolves. |
| `onValidate` | `function` | `null` | Called with normalized validation results. |
| `onError` | `function` | `null` | Called when browse or adapter validation fails unexpectedly. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getValue()` | none | `string` | Returns the current path. |
| `setValue(value, meta?)` | path string | `void` | Updates the current path and optionally validates. |
| `browse()` | none | `Promise<string \| null>` | Runs the configured picker adapter. |
| `validate(meta?)` | optional metadata | `Promise<object>` | Runs local and host validation. |
| `setStatus(message, tone)` | status copy, tone | `object` | Applies a manual status message. |
| `clearStatus()` | none | `void` | Clears the status state. |
| `focus()` | none | `void` | Focuses the path input. |
| `update(options)` | partial options | `void` | Re-renders with updated options. |
| `destroy()` | none | `void` | Removes helper content from the host container. |

Related demos:

- `demos/demo.path.picker.html`

### `createNumberStepper(container, options)` (`js/ui/ui.number.stepper.js`)

Purpose:

- Shared numeric stepper with decrement/increment buttons around a typed input.
- Intended for bounded counters, quantities, prices, or other narrow numeric entry flows where stepping matters as much as typing.

Factory:

```js
import { createNumberStepper } from "./js/ui/ui.number.stepper.js";

const stepper = createNumberStepper(container, options);
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| null` | `0` | Initial numeric value. |
| `min` | `number \| null` | `null` | Optional minimum value. |
| `max` | `number \| null` | `null` | Optional maximum value. |
| `step` | `number` | `1` | Increment/decrement amount used by the step buttons and arrow keys. |
| `decimals` | `number \| null` | `null` | Optional fixed decimal precision for display/commit formatting. |
| `placeholder` | `string` | `""` | Input placeholder when empty values are allowed. |
| `name` | `string` | `""` | Submitted field name. |
| `id` | `string` | `""` | Input id for external labels. |
| `required` | `boolean` | `false` | Marks the input as required. |
| `disabled` | `boolean` | `false` | Disables both buttons and the input. |
| `readonly` | `boolean` | `false` | Prevents stepping and typed edits while keeping the control readable. |
| `ariaLabel` | `string` | `"Number input"` | Direct aria-label for standalone usage. |
| `describedBy` | `string` | `""` | Optional `aria-describedby` target ids for helper-hosted or externally described usage. |
| `decrementLabel` | `string` | `"Decrease value"` | Accessible label for the decrement button. |
| `incrementLabel` | `string` | `"Increase value"` | Accessible label for the increment button. |
| `prefixText` | `string` | `""` | Optional text shown before the input value, such as `$`. |
| `suffixText` | `string` | `""` | Optional text shown after the input value, such as `kg`. |
| `allowEmpty` | `boolean` | `false` | Allows a committed empty value instead of forcing a numeric fallback. |
| `onChange` | `function` | `null` | Called as `onChange(value, api)` when a committed value changes. |
| `onInput` | `function` | `null` | Called as `onInput(rawValue, api)` while the user types before commit. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getValue()` | none | `number \| null` | Returns the current committed numeric value. |
| `setValue(value)` | `number \| null` | `void` | Sets the current value and reapplies bounds/formatting. |
| `stepUp()` | none | `void` | Increments the value by the configured `step`. |
| `stepDown()` | none | `void` | Decrements the value by the configured `step`. |
| `focus()` | none | `void` | Focuses the underlying input. |
| `update(options)` | partial options | `void` | Updates bounds, formatting, disabled state, or text chrome. |
| `destroy()` | none | `void` | Removes the helper content from the host container. |

Example:

```js
const priceStepper = createNumberStepper(document.getElementById("priceHost"), {
  value: 1,
  min: 0,
  max: 10,
  step: 0.25,
  decimals: 2,
  prefixText: "$",
  onChange(value) {
    console.log("price:", value);
  },
});
```

Behavior notes:

- Typed edits commit on blur or `Enter`; invalid text reverts to the last committed value.
- `ArrowUp` / `ArrowDown` trigger the same step behavior as the buttons.
- Prefix/suffix text is presentational only; numeric parsing still comes from the typed value itself.

Related demos:

- `demos/demo.number.stepper.html`

### `createTreeSelect(container, items, options)` (`js/ui/ui.tree.select.js`)

Purpose:

- Shared hierarchical single-select picker for grouped taxonomies that become noisy when flattened into label strings.
- Reuses the same floating-menu model as `createSelect(...)` so menus can escape clipped modal and drawer containers.

Factory:

```js
import { createTreeSelect } from "./js/ui/ui.tree.select.js";

const treeSelect = createTreeSelect(container, items, options);
```

Recommended item shape:

| Property | Type | Description |
|---|---|---|
| `id` or `value` | `string` | Stable node identifier. |
| `label` | `string` | Visible branch or leaf label. |
| `disabled` | `boolean` | Disables a node from interaction. |
| `selectable` | `boolean` | Optional override. Defaults to `false` for branches and `true` for leaves. |
| `children` | `array` | Nested child nodes for grouped vocabularies. |
| `meta` | `any` | Optional app-owned metadata passed back in `onChange(..., node)`. |

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | `""` | Extra class name applied to the root wrapper. |
| `ariaLabel` | `string` | `"Tree Select"` | Trigger/menu accessible label. |
| `placeholder` | `string` | `"Select..."` | Trigger placeholder when nothing is selected. |
| `emptyText` | `string` | `"No options found."` | Empty-state copy when search has no visible matches. |
| `searchable` | `boolean` | `true` | Shows the inline search field above the tree menu. |
| `closeOnSelect` | `boolean` | `true` | Closes the menu after selecting a leaf node. |
| `selectOnTab` | `boolean` | `false` | Selects the current active leaf on `Tab` when enabled. |
| `clearable` | `boolean` | `true` | Shows a trigger-level clear button when a value is selected. |
| `defaultExpanded` | `boolean` | `false` | Expands all branches by default for browse-heavy datasets. |
| `selected` | `string \| null` | `null` | Initial selected leaf value. |
| `onChange` | `(value, node) => void` | `null` | Fires when the selected leaf changes. |

Keyboard behavior:

- `ArrowUp` / `ArrowDown` move the active row.
- `Home` / `End` jump to the first or last visible row.
- `ArrowRight` expands the active branch when search is not active.
- `ArrowLeft` collapses the active branch or moves focus to its parent branch.
- `Enter` / `Space` select the active leaf or toggle the active branch.
- `Escape` closes the menu.

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Replaces the tree items/options and re-renders the picker. |
| `setValue` | `value` | `void` | Selects a leaf value or clears when passed `null`. |
| `getValue` | none | `string \| null` | Returns the current selected leaf value. |
| `getState` | none | `object` | Returns open/search/selection state plus current visible entries. |
| `destroy` | none | `void` | Removes DOM and listeners from the host container. |

Behavior notes:

- V1 is intentionally `single-select` only.
- Search matches `label` text and preserves parent context for matching descendants.
- If a parent label matches search, its descendants remain visible so the branch is still actionable.
- Trigger text shows the selected path as `Parent / Leaf`.

Example:

```js
const resourcePicker = createTreeSelect(document.getElementById("resourceHost"), [
  {
    id: "medical",
    label: "Medical",
    children: [
      { id: "ambulance", label: "Ambulance" },
      { id: "triage", label: "Triage Nurse" },
    ],
  },
  {
    id: "fire",
    label: "Fire Response",
    children: [
      { id: "engine", label: "Fire Engine" },
      { id: "rescue", label: "Rescue Truck" },
    ],
  },
], {
  searchable: true,
  selected: "ambulance",
  onChange(value, node) {
    console.log(value, node?.pathLabels);
  },
});
```

Related demos:

- `demos/demo.tree.select.html`

### `createCheckbox(container, options)` (`js/ui/ui.checkbox.js`)

Purpose:

- Shared checkbox primitive for boolean flags and explicit checked/unchecked values.
- Used directly by apps and hosted by grouped field helpers.

Factory:

```js
import { createCheckbox } from "./js/ui/ui.checkbox.js";

const checkbox = createCheckbox(container, {
  name: "needs_followup",
  label: "Needs follow-up",
  checkedValue: "followup_required",
  uncheckedValue: "",
  onChange({ checked, value }) {
    console.log(checked, value);
  }
});
```

Value behavior:

- Without `checkedValue` / `uncheckedValue`, `getValue()` returns `true` or `false`.
- With `checkedValue` / `uncheckedValue`, `getValue()` returns the configured value for the current checked state.
- Use explicit value mode for optional flags, not mandatory yes/no reporting fields.

Methods:

- `getChecked()`
- `setChecked(checked, meta?)`
- `getValue()`
- `setValue(value, meta?)`
- `setDisabled(disabled)`
- `update(options)`
- `destroy()`

Related demos:

- `demos/demo.checkbox.html`

### `createCheckboxGroup(container, options)` (`js/ui/ui.checkbox.group.js`)

Purpose:

- Shared multi-checkbox primitive for short visible option lists.
- Returns an array of selected option values.
- Supports min/max selected-count validation.

Factory:

```js
import { createCheckboxGroup } from "./js/ui/ui.checkbox.group.js";

const needs = createCheckboxGroup(container, {
  name: "needs",
  label: "Immediate needs",
  values: ["food", "medicine"],
  options: [
    { label: "Food", value: "food" },
    { label: "Water", value: "water" },
    { label: "Medicine", value: "medicine" }
  ],
  min: 1,
  max: 3
});
```

Methods:

- `getValue()`
- `setValue(values, meta?)`
- `selectAll(meta?)`
- `clear(meta?)`
- `validate()`
- `setDisabled(disabled)`
- `update(options)`
- `destroy()`

`createFieldGroup(...)` and `createFieldset(...)` can host checkbox groups with:

```js
{
  type: "checkbox-group",
  name: "needs",
  label: "Immediate needs",
  options: ["Food", "Water", "Medicine"]
}
```

Behavior notes:

- Each option renders as a separate `ui.checkbox` instance with a unique generated input id.
- Clicking an option label toggles that option only.
- `getValue()` preserves selected values in option order.

Related demos:

- `demos/demo.checkbox.group.html`

### `createCombobox(container, options)` (`js/ui/ui.combobox.js`)

Purpose:

- Shared free-text input for values that operators can type manually but often reuse.
- Supports static suggestions plus optional localStorage-backed history through `storageKey`.
- Useful for route/location names, facilities, landmarks, contact points, and other repeated operational text values.

Factory:

```js
import { createCombobox } from "./js/ui/ui.combobox.js";

const route = createCombobox(container, {
  name: "route_location",
  storageKey: "helpers.fieldGroup.roadAccessStatus.routeLocation",
  suggestions: ["Coastal Road", "Old Bridge"],
  maxSuggestions: 20,
  onChange(value) {
    console.log(value);
  }
});
```

Behavior notes:

- The input remains free text; suggestions never restrict valid values.
- Committed non-empty values are stored locally when `storageKey` is provided.
- History is deduplicated case-insensitively and kept recent-first.
- Avoid local history for sensitive values that should not persist on the device.

Methods:

- `getValue()`
- `setValue(value)`
- `getSuggestions()`
- `clearHistory()`
- `update(options)`
- `focus()`
- `destroy()`

`createFieldGroup(...)` can host combobox fields with:

```js
{
  type: "combobox",
  key: "route_location",
  label: "Route / location",
  storageKey: "helpers.fieldGroup.roadAccessStatus.routeLocation"
}
```

Related demos:

- `demos/demo.combobox.html`

### `createFieldset(container, options)` (`js/ui/ui.fieldset.js`)

Purpose:

- Semantic grouped form section for page-sized or admin-sized forms.
- Uses a form-modal-style `rows[]` contract so teams can mix fields with text, alerts, images, display values, and custom content without building ad hoc page markup around each section.

Factory:

```js
import { createFieldset } from "./js/ui/ui.fieldset.js";

const fieldset = createFieldset(container, options);
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `legend` | `string` | `""` | Semantic fieldset legend/title. |
| `description` | `string` | `""` | Optional descriptive text shown under the legend. |
| `rows` | `Array<Array<object>>` | `[]` | Page-level grouped-row model aligned with the practical item vocabulary used by `createFormModal(...)`, plus page-safe content items such as `image` and `custom`. |
| `className` | `string` | `""` | Extra class name applied to the root fieldset. |

Shared row types with `createFormModal(...)`:

- `input`
- `textarea`
- `select`
- `checkbox`
- `ui.select`
- `hidden`
- `text`
- `alert`
- `divider`
- `display`

Additional fieldset row type:

- `group`

Fieldset-specific content emphasis:

- `image`
- `custom` / `content`

Contract note:

- `ui.fieldset` intentionally reuses the practical row vocabulary from `createFormModal(...)`, but it is not a modal-form engine.
- Shared row types should stay semantically compatible across both helpers so engineers can move grouped content between page forms and modal forms without inventing a second schema.
- `image` and `custom` / `content` are documented here as fieldset-friendly page content rows. Modal usage may still be possible in app code, but `ui.fieldset` is the public reference surface for those richer grouped-content rows.

Password row note:

- `input: "password"` rows compose over the shared `createPasswordField(...)` helper, so grouped page forms and modal forms use the same show/hide password behavior.

Grouped field note:

- `type: "group"` rows compose over `createFieldGroup(...)`, so page-sized forms can collect structured object values without depending on incident-specific helpers.
- Set `repeatable: true` when the value should be an array of objects, such as evacuees, missing persons, household members, vehicles, or contact methods.
- Leave `repeatable` false when the value should be a single object, such as one address.
- Group `fields` can be declared as an array of field objects and field-row arrays. A field object renders as one full-width row; an array of field objects renders one row split into that many columns.
- Set `chrome: false` when the host surface already owns the surrounding label, required badge, border, background, and padding. This flattens the field-group wrapper while keeping repeatable item cards, add/remove controls, validation, and values intact.

Example:

```js
const registry = createFieldset(container, {
  legend: "Evacuation Registry",
  rows: [
    [{
      type: "group",
      name: "evacuees",
      label: "Evacuees",
      repeatable: true,
      chrome: false,
      fields: [
        { key: "name", label: "Complete name", type: "text", computed: { template: "{last_name}, {first_name}" }, hidden: true },
        [
          { key: "last_name", label: "Last name / Family name", type: "text", required: true },
          { key: "first_name", label: "First name", type: "text", required: true }
        ],
        [
          { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
          { key: "age", label: "Age", type: "number", min: 1, max: 120 }
        ]
      ]
    }]
  ]
});

registry.getValues();
// {
//   evacuees: [
//     { last_name: "Reyes", first_name: "Ana", name: "Reyes, Ana", gender: "Female", age: "34" }
//   ]
// }
```

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getValues()` | none | `object` | Returns current values keyed by field name. |
| `getErrors()` | none | `object` | Returns the current field-error map keyed by field name. |
| `getFormError()` | none | `string` | Returns the current form-level error string. |
| `setValue(name, value)` | field name, next value | `void` | Updates one field value. |
| `setValues(values)` | object | `void` | Updates multiple field values. |
| `setErrors(errors)` | field-error object | `void` | Applies field-level errors, renders inline error text, and marks matching controls invalid. |
| `clearErrors()` | none | `void` | Clears field-level errors and removes invalid state from controls. |
| `setFormError(message)` | string | `void` | Shows a form-level error message above the row grid. |
| `clearFormError()` | none | `void` | Clears the form-level error message. |
| `applyApiErrors(response)` | API-style error payload | `object` | Normalizes common API validation payloads and applies field/form errors. |
| `setRows(rows)` | rows array | `void` | Replaces the rendered row set. |
| `update(options)` | partial options | `void` | Updates legend, description, rows, or class name. |
| `destroy()` | none | `void` | Removes the fieldset from the host container and tears down hosted controls. |

Validation note:

- `ui.fieldset` now supports narrow validation parity for grouped page forms:
  - field-level error text
  - form-level error text
  - `aria-invalid` state on matching controls
  - API error mapping through `applyApiErrors(...)`
- grouped two-column rows keep their control alignment stable when only one side is showing an error; hidden error slots remain reserved so adjacent controls do not jump vertically
- It still does not become a submit engine or full form framework. App code continues to own submit lifecycle and server calls.

Example:

```js
const fieldset = createFieldset(document.getElementById("appFieldset"), {
  legend: "Workspace App Settings",
  description: "Group access, launch, and display fields together.",
  rows: [
    [
      { type: "input", name: "app_code", label: "App code" },
      { type: "input", name: "name", label: "Name" },
    ],
    [
      {
        type: "alert",
        tone: "info",
        span: 2,
        content: "Document the access-check endpoint before enabling the app in Workspace.",
      },
    ],
    [
      { type: "input", name: "base_url", label: "Base URL", span: 2 },
    ],
  ],
});
```

### Field Group Presets

`ui.field.group.presets` exports `fieldGroupPresets` plus named factory functions for common grouped custom fields.

Preset factories return plain configuration objects. They can be spread into:

- standalone `createFieldGroup(...)` calls
- `createFieldset(...)` rows with `type: "group"`
- incident custom field definitions

`createFieldGroup(...)`, grouped `createFieldset(...)` rows, and incident type detail editor/viewer rendering also resolve built-in presets directly from metadata. Use `preset`, `field_preset`, `config.preset`, or JSON `config_json.preset` when a backend should store only the preset reference instead of duplicating Helper-owned child schemas.

Available presets:

| Preset | Fields |
|---|---|
| `person()` | `name` hidden computed from `last_name`/`first_name`, `last_name`, `first_name`, `gender`, `age` |
| `address()` | `neighborhood`, `barangay`, `town`, `city`, `state`, `country` |
| `missingPerson()` | person fields plus `last_seen_days`, `last_seen_location` |
| `evacuee()` | person fields plus `local_citizen`, `needs` |
| `family()` | `household_head`, `adult_count`, `children_count`, `member_count`, `displaced`, `address`; adult/children breakdown subfields |
| `casualtyPatient()` | person fields plus `condition`, `injury_type`, `consciousness`, `triage_color`, `transported`, `destination_facility` |
| `infrastructureDamage()` | `asset_type`, `name_location`, `damage_level`, `operational_status`, `estimated_affected_users` |
| `shelterDamage()` | `structure_type`, `damage_level`, `families_affected`, `persons_affected`, `habitable` |
| `roadAccessStatus()` | `route_location`, `status` rendered as Access, `obstruction_type`, `passable_by_vehicle_type`, `passability_warning` notice when closed |
| `vehicleInvolved()` | `vehicle_type`, `plate_number`, `color`, `damage_level` |

Preset layout:

- `person()` renders `last_name` / `first_name` as a two-column row, keeps hidden computed `name` in the payload as `Last, First`, then renders `gender` and `age` as a two-column row.
- `address()` renders three two-column rows: `neighborhood`/`barangay`, `town`/`city`, and `state`/`country`.
- `missingPerson()` extends person with a `last_seen_days`/`last_seen_location` row; `last_seen_location` uses combobox history for repeated landmarks.
- `evacuee()` extends person with full-width `local_citizen` and `needs` rows.
- `family()` captures affected household counts and local address/sitio/purok text. It intentionally omits barangay/city/province because those are expected to come from the hotline context. `address` uses combobox history. `adult_count` and `children_count` are operator-entered base counts, while hidden `member_count` is still computed into the value as `adult_count + children_count` for reporting/SITREP use.
- `casualtyPatient()` extends person with condition, injury, consciousness, triage, transport, and destination facility fields.
- In `casualtyPatient()`, `consciousness`, `triage_color`, and `transported` hide when `condition` is `Deceased`; `destination_facility` uses combobox history and appears only when `transported` is `Yes`.
- `infrastructureDamage()` captures asset damage and operational status for roads, bridges, utilities, facilities, communications, and other infrastructure. `name_location` uses combobox history for repeated asset/place names.
- `shelterDamage()` focuses on residential/shelter impact using structure types: house, apartment/boarding house, temporary shelter, evacuation center, and other.
- `roadAccessStatus()` captures route access condition and passable vehicle types through `checkbox-group`; `obstruction_type` appears only when Access is `Blocked` or `Closed`, and closed access replaces vehicle passability choices with a highlighted not-passable warning.
- `roadAccessStatus()` includes warning validation for responder-critical routing data: route/location and Access should be filled, blocked/closed access needs an obstruction type, and closed access should not list passable vehicle types.
- `vehicleInvolved()` captures lean bystander-friendly vehicle details for road accidents: vehicle type, plate number when visible, common vehicle color through a select field, and apparent damage level.
- Numeric preset fields use `type: "number-stepper"` so count-style values can be changed through the shared stepper controls while still allowing direct keyboard entry.

Breakdown fields:

- Any field-group child field can define `breakdown: { label, fields, defaultOpen? }`.
- Breakdown fields render behind a compact toggle beside the parent field label.
- Breakdown values are stored flat in the same group item object, not nested.
- `family()` uses breakdowns on:
  - `adult_count`: `adult_male_count`, `adult_female_count`, `adult_senior_count`, `adult_pwd_count`, `adult_pregnant_count`
  - `children_count`: `children_male_count`, `children_female_count`, `children_pwd_count`

Computed fields:

- Field groups support simple additive computed expressions such as `computed: "adult_count + children_count"` and string templates such as `computed: { template: "{last_name}, {first_name}" }`.
- Computed fields are normalized into the same group item object and update when their dependencies change.
- Use `readonly: true` for computed fields that should display but not accept operator edits.
- Use `hidden: true` for derived fields that should remain in the normalized value without rendering in the operator UI. Hidden fields are skipped by required/basic validation.
- Use `visibleWhen` for value-dependent field visibility inside a group. String values mean exact match, arrays mean inclusion, and `{ not: value }` hides a field for one or more excluded values.

Breakdown validation:

- Field groups can define non-blocking `validations` alongside `fields`.
- `validate()` and `onChange(..., meta.validation)` return `{ status, errors, warnings }`. Warning-only issues keep `status: true`, so autosave flows can persist operator input while still surfacing data-quality issues.
- `autoValidate` defaults to `true`, refreshing warning indicators only when validation state changes. Set `autoValidate: false` or `validateOnChange: false` when a host wants to show warnings only after calling `validate()`.
- Rules that reference breakdown subfields stay quiet while that breakdown is collapsed. They start evaluating only when the breakdown is opened/enabled.
- Open breakdowns render their validation guidance in-place. Valid rules are shown muted, and invalid rules are highlighted, so the breakdown panel does not relayout when a warning appears or clears.
- Supported validation rule types are `lte` for one field not exceeding another field or fixed `max`, `sum_lte` for a list of fields whose total must not exceed another field or fixed `max`, and `sum_eq` for a list of fields whose total must exactly match another field or fixed `max`.
- `required` / `required_when` rules warn when a field is empty, optionally gated by `when`; `empty` / `empty_when` / `forbidden_when` rules warn when a field has a value under a matching condition.
- Set `severity: "error"` on a rule only when the issue should block validation status. The default severity is `warning`.
- `family()` includes exact-match warning rules for adult/child sex subtotals, plus upper-bound rules for senior/PWD subtotals and pregnant adults not exceeding adult female count. Overlapping categories such as senior and PWD are validated individually rather than summed together.

SITREP metadata:

- Operational presets expose a plain `sitrep` array for downstream reporting/aggregation hints.
- This metadata is descriptive only; it does not render additional input fields.
- Current SITREP hints are:
  - `family()`: `affected_families`, `affected_persons`, `vulnerable_population`
  - `casualtyPatient()`: `injured_count`, `critical_count`, `transported_count`
  - `infrastructureDamage()`: `damaged_infrastructure_count`, `impassable_roads_bridges`
  - `shelterDamage()`: `partially_damaged_houses`, `totally_damaged_houses`, `displaced_families`
  - `roadAccessStatus()`: `blocked_routes`
  - `vehicleInvolved()`: `vehicles_involved_count`

Custom row layout example:

```js
fields: [
  { key: "name", label: "Complete name", type: "text", computed: { template: "{last_name}, {first_name}" }, hidden: true },
  [
    { key: "last_name", label: "Last name / Family name", type: "text", required: true },
    { key: "first_name", label: "First name", type: "text", required: true }
  ],
  [
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { key: "age", label: "Age", type: "number", min: 0, max: 120 }
  ],
  { key: "local_citizen", label: "Local citizen", type: "select", options: ["Yes", "No"] },
  { key: "needs", label: "Needs", type: "textarea" }
]
```

Example:

```js
import { fieldGroupPresets } from "./js/ui/ui.field.group.presets.js";

const group = createFieldGroup(container, {
  name: "missing_persons",
  ...fieldGroupPresets.missingPerson({
    label: "Missing Persons",
    required: true
  })
});
```

Preset overrides:

```js
fieldGroupPresets.evacuee({
  label: "Evacuees",
  fields: {
    age: { max: 100 }
  },
  extraFields: [
    { key: "remarks", label: "Remarks", type: "textarea" }
  ]
});
```

Passing `fields` as an array replaces the preset fields entirely. Passing `fields` as an object merges overrides by field key.

When preset metadata is used directly on a group field, an omitted or empty `fields[]` uses the preset's baseline rows. Supplying a non-empty `fields[]` is treated as an explicit schema override for that field.

Reference/demo coverage now includes both forms:

- factory spread with `...fieldGroupPresets.<name>(...)`
- metadata-only group fields with `preset` / `config_json.preset` and no duplicated `fields[]`

Related demos:

- `demos/demo.field.group.html`
- `demos/demo.field.group.preset.person.html`
- `demos/demo.field.group.preset.address.html`
- `demos/demo.field.group.preset.missing-person.html`
- `demos/demo.field.group.preset.evacuee.html`
- `demos/demo.field.group.preset.family.html`
- `demos/demo.field.group.preset.casualty-patient.html`
- `demos/demo.field.group.preset.infrastructure-damage.html`
- `demos/demo.field.group.preset.shelter-damage.html`
- `demos/demo.field.group.preset.road-access-status.html`
- `demos/demo.field.group.preset.vehicle-involved.html`
- `demos/demo.fieldset.html`

### `createIcon(name, options)`, `getIconDefinition(name)`, `listIcons()`, `listIconCategories()` (`js/ui/ui.icons.js`)

Purpose:

- Shared categorized SVG icon registry for helper and app usage.

Design rule:

- one outline visual language
- namespaced stable icon ids
- `SVGElement` output instead of raw HTML strings

Registry categories:

- `actions`
- `navigation`
- `status`
- `media`
- `data`
- `people`
- `workflow`
- `places`
- `time`
- `comms`
- `assets`
- `sitrep`
- `alert`
- `hazard`
- `population`
- `route`
- `resource`
- `team`
- `map`
- `quality`

Primary options:

| Option | Default | Description |
|---|---|---|
| `size` | `16` | Icon width/height in pixels. |
| `title` | `""` | Optional SVG title for non-decorative use. |
| `className` | `""` | Additional SVG class name(s). |
| `strokeWidth` | `1.8` | Outline stroke width override. |
| `decorative` | `true` | Decorative icons are hidden from assistive tech unless a label/title is supplied. |
| `ariaLabel` | `""` | Direct accessible label for non-decorative icons. |

Example:

```js
import { createIcon } from "./js/ui/ui.icons.js";

const closeIcon = createIcon("actions.close", {
  size: 16,
  title: "Close",
  decorative: false,
});

button.prepend(closeIcon);
```

Action audio icons:

- Use `actions.volume` for sound on / unmuted controls.
- Use `actions.volume-muted` for muted controls.
- `actions.sound-on` and `actions.sound-off` are aliases for teams that prefer sound-toggle wording.

Common state and launcher icons:

- Use `actions.lock` and `actions.unlock` for locked/unlocked controls, rooms, or resources.
- Use `people.agent` for small agent-identity badges; omit the badge for human identities.
- Use `people.userBlocked` and `people.userAllowed` for direct-chat block and unblock actions.
- Use `notifications.muted` and `notifications.unmuted` for muted/unmuted conversation notification states.
- Use `comms.envelope` for pending message requests or closed inbox/request states.
- Use `comms.envelope-plus` for send/create message-request actions.
- Use `comms.envelope-minus` for cancel/remove message-request actions.
- Use `comms.envelope-open` for opened/read request states or inbox flows.
- Use `media.gamepad` as the shared fallback for game launcher or game-category surfaces.

Related demos:

- `demos/demo.icons.html`

### `createModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- General-purpose modal shell for custom content, forms, media, and reusable overlays.

Factory:

```js
import { createModal } from "./js/ui/ui.modal.js";

const modal = createModal(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `title` | `string` | `""` | no | Header title text. |
| `ownerTitle` | `string` | `""` | no | Optional secondary ownership/context text rendered below the main title. Useful for Workspace-bridged parent-owned modals. |
| `content` | `string \| HTMLElement \| (() => HTMLElement)` | `""` | no | Body content source. |
| `headerActions` | `string \| HTMLElement \| HTMLElement[] \| (() => HTMLElement)` | `null` | no | Custom header action content. |
| `secondaryHeader` | `string \| HTMLElement \| HTMLElement[] \| (() => HTMLElement)` | `null` | no | Optional fixed context row rendered between the title header and scrollable modal body. |
| `footer` | `string \| HTMLElement \| (() => HTMLElement)` | `null` | no | Custom footer content. |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | no | Modal width preset. |
| `position` | `"center" \| "top"` | `"center"` | no | Vertical placement. |
| `draggable` | `boolean` | `true` | no | Enables header-only dragging so the modal can be moved aside. |
| `showHeader` | `boolean` | `true` | no | Shows modal header shell. |
| `showCloseButton` | `boolean` | `true` | no | Shows header close button. |
| `closeOnBackdrop` | `boolean` | `true` | no | Allows backdrop click close. |
| `closeOnEscape` | `boolean` | `true` | no | Allows `Esc` close. |
| `busy` | `boolean` | `false` | no | Opens the modal in busy state. |
| `busyMessage` | `string` | `""` | no | Busy overlay status text. |
| `cancelBusy` | `false \| true \| function \| { label?, onCancel? }` | `false` | no | Adds an optional busy-overlay cancel action. `true` shows a helper-owned cancel button that simply clears busy state; function/object forms can abort app-owned work before the helper clears busy. |
| `closeWhileBusy` | `boolean` | `false` | no | Allows explicit close while busy. |
| `backdropCloseWhileBusy` | `boolean` | `false` | no | Allows backdrop close while busy. |
| `escapeCloseWhileBusy` | `boolean` | `false` | no | Allows `Esc` close while busy. |
| `trapFocus` | `boolean` | `true` | no | Keeps keyboard focus inside the modal while open. |
| `lockScroll` | `boolean` | `true` | no | Locks page scroll while open. |
| `initialFocus` | `string \| HTMLElement \| ((panel) => HTMLElement)` | `null` | no | Initial focus target on open. |
| `renderTarget` | `"auto" \| "local" \| "parent"` | `"auto"` | no | Overlay routing preference. `"auto"` prefers a trusted same-origin Workspace overlay parent when available. |
| `className` | `string` | `""` | no | Extra panel/root classes. |
| `onOpen` | `(ctx) => void` | `null` | no | Fires after open completes. |
| `onBeforeClose` | `(meta) => boolean \| Promise<boolean>` | `null` | no | Can veto close by returning `false`. |
| `onClose` | `(meta) => void` | `null` | no | Fires after close completes. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onOpen` | `{ modal, refs, state }` | `void` | Fired after the modal opens. |
| `onBeforeClose` | `meta` | `boolean \| Promise<boolean>` | Return `false` to block close. |
| `onClose` | `meta` | `void` | Fired after the modal closes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | `content?, nextOptions?` | `Promise<void>` | Opens the modal and optionally swaps content/options first. |
| `close` | `meta?` | `Promise<boolean>` | Attempts to close and respects `onBeforeClose`. |
| `update` | `nextOptions?` | `void` | Updates modal options without remounting. |
| `setContent` | `content` | `void` | Replaces body content. |
| `setHeaderActions` | `headerActions` | `void` | Replaces header actions. |
| `setSecondaryHeader` | `secondaryHeader` | `void` | Replaces or clears the fixed secondary context header. |
| `setFooter` | `footer` | `void` | Replaces footer content. |
| `setTitle` | `title` | `void` | Updates header title. |
| `setBusy` | `isBusy, { message?, cancelBusy? }` | `void` | Toggles helper-owned busy lock state and optionally configures the busy-overlay cancel action for that busy run. |
| `isBusy` | none | `boolean` | Returns current busy state. |
| `getState` | none | `object` | Returns current modal state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Accessibility:

- Modal title chrome renders as non-landmark markup, so Helper modals do not introduce a second page banner inside app shells.
- The modal panel owns `role="dialog"` / `aria-modal="true"` and labels itself from the helper title.

Returned refs:

- `panel`
- `body`
- `header`
- `secondaryHeader`
- `title`
- `ownerTitle`
- `closeButton`
- `backdrop`

Busy-state behavior:

- modal shell exposes a helper-owned busy overlay
- modal headers are draggable by default; drag starts only from the header itself, not from close buttons or other interactive header controls
- on phone-sized viewports (`<= 640px`), modal shells switch to a fullscreen presentation with no border or rounded corners, and header dragging is disabled
- `ownerTitle` renders as a secondary ownership line below the main title when provided
- `secondaryHeader` renders as an optional fixed row between the title header and body, hides when empty, and can be updated through `setSecondaryHeader(...)` or `update({ secondaryHeader })`
- long modal content now scrolls inside the body region only; the header, secondary header, and footer stay fixed inside the shell
- when a trusted same-origin Workspace host is installed, modal-family helpers now prefer mounting into the parent Workspace overlay surface automatically
- `setBusy(true, { message, cancelBusy })`:
  - sets `aria-busy="true"` on the modal panel
  - disables body/footer/header actions
  - disables close controls when the close policy forbids close while busy
  - suppresses duplicate interaction while the modal is intentionally locked
  - `cancelBusy: true` shows a helper-owned `Cancel` button that clears busy state
  - `cancelBusy: fn` or `cancelBusy: { label, onCancel }` lets app code abort work before busy clears
  - returning `false` from `cancelBusy.onCancel(...)` keeps the busy overlay active, which is useful when the app will clear it later through `ctx.clearBusy()`
- default busy close policies are safe:
  - `closeWhileBusy: false`
  - `backdropCloseWhileBusy: false`
  - `escapeCloseWhileBusy: false`

Example:

```js
import { createModal } from "./js/ui/ui.modal.js";

const modal = createModal({
  title: "Reusable Modal",
  ownerTitle: "PBB HQ",
  draggable: true,
  size: "md",
  secondaryHeader: "Optional context row",
  content: "Hello from modal body",
  headerActions: [
    Object.assign(document.createElement("button"), { className: "ui-button ui-button-ghost", type: "button", textContent: "Refresh" }),
  ],
});

modal.open();
modal.setBusy(true, { message: "Saving..." });
// later
modal.setBusy(false);
modal.close({ reason: "done" });
```

Related demos:

- `demos/demo.modal.html`

### `createActionModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- Faster modal setup when footer buttons are known up front.

Factory:

```js
import { createActionModal } from "./js/ui/ui.modal.js";

const modal = createActionModal(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| All `createModal(...)` options | inherited | inherited | no | Base modal-shell options remain available. |
| `autoBusy` | `boolean` | `true` | no | Automatically enters busy state for promise-returning actions. |
| `headerActions` | `Action[]` | `[]` | no | Declarative header action buttons. |
| `actions` | `Action[]` | `[]` | no | Declarative footer action buttons. |

Action object contract:

| Property | Type | Default | Required | Description |
|---|---|---:|---|---|
| `id` | `string` | `""` | no | Stable action identifier. |
| `label` | `string` | - | yes | Visible button label. |
| `variant` | `"default" \| "primary" \| "danger" \| "ghost"` | `"default"` | no | Shared button emphasis preset. |
| `icon` | `string` | `null` | no | SVG/HTML icon markup. |
| `iconPosition` | `"start" \| "end"` | `"start"` | no | Icon placement relative to label. |
| `iconOnly` | `boolean` | `false` | no | Renders icon-only action. |
| `ariaLabel` | `string` | `""` | no | Accessible label for icon-only actions. |
| `busyMessage` | `string` | `""` | no | Per-action busy text when auto-busy is active. |
| `closeOnClick` | `boolean` | `true` | no | Controls default close on truthy result. |
| `disabled` | `boolean` | `false` | no | Starts the action disabled. |
| `autoFocus` | `boolean` | `false` | no | Autofocuses the action on open. |
| `onClick` | `({ action, modal, event, placement }) => any` | `null` | no | Action click handler; can return `false` to keep the modal open. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `action.onClick` | `{ action, modal, event, placement }` | `any \| Promise<any>` | Action handler for header/footer buttons. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| All `createModal(...)` methods | inherited | inherited | Base modal API remains available. |
| `setHeaderActions` | `actions[]` | `void` | Replaces declarative header actions. |
| `setActions` | `actions[]` | `void` | Replaces declarative footer actions. |

Auto-busy behavior:

- if `autoBusy !== false` and an action `onClick(...)` returns a promise:
  - modal enters busy state before awaiting the promise
  - modal leaves busy state after resolve/reject
  - duplicate action clicks are ignored while busy
- close rules remain normal:
  - resolved `false` keeps the modal open
  - rejected promise keeps the modal open
  - resolved truthy value closes when `closeOnClick !== false`

Related demos:

- `demos/demo.action.modal.html`

### `createWindowManager(options)` (`js/ui/ui.window.js`)

Purpose:

- Shared desktop-style window manager for non-modal floating tools that need drag, resize, stacking, minimize, and maximize behavior.

Factory:

```js
import { createWindowManager } from "./js/ui/ui.window.js";

const manager = createWindowManager(options);
```

Manager options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `container` | `HTMLElement \| null` | `document.body` | no | Host surface for the manager layer and taskbar. |
| `bounds` | `"viewport"` | `"viewport"` | no | Clamps movement and resize to the manager viewport. |
| `showTaskbar` | `boolean` | `true` | no | Enables manager-owned taskbar rendering. |
| `taskbarMode` | `"auto" \| "always" \| "minimized-only"` | `"auto"` | no | Controls whether the taskbar behaves like a workspace window list or a minimized-only recovery strip. |
| `showTaskbarClose` | `boolean` | `true` | no | Shows inline close affordances on taskbar items for closable windows. |
| `taskbarItemOrder` | `"open-order" \| "z-order"` | `"open-order"` | no | Controls taskbar item ordering. |
| `className` | `string` | `""` | no | Extra class names applied to the manager root. |
| `onWindowOpen` | `({ id, window, state }) => void` | `null` | no | Fires after a window opens. |
| `onWindowClose` | `({ id, window, state, meta? }) => void` | `null` | no | Fires after a window closes. |
| `onActiveChange` | `({ id, window, state }) => void` | `null` | no | Fires when active/focused window changes. |

Window factory:

```js
const win = manager.createWindow(options);
```

Window options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `id` | `string` | auto-generated | no | Stable window identifier. |
| `title` | `string` | `"Window"` | no | Title-bar label. |
| `content` | `Node \| string \| (window) => Node \| string` | `null` | no | Window body content or content factory. |
| `width` | `number` | `420` | no | Initial window width in pixels. |
| `height` | `number` | `320` | no | Initial window height in pixels. |
| `x` | `number` | centered | no | Initial x position. |
| `y` | `number` | centered | no | Initial y position. |
| `minWidth` | `number` | `280` | no | Minimum resize width. |
| `minHeight` | `number` | `180` | no | Minimum resize height. |
| `draggable` | `boolean` | `true` | no | Enables title-bar drag. |
| `resizable` | `boolean` | `true` | no | Enables edge and corner resize handles. |
| `minimizable` | `boolean` | `true` | no | Enables minimize action and taskbar recovery. |
| `maximizable` | `boolean` | `true` | no | Enables maximize and restore behavior. |
| `closable` | `boolean` | `true` | no | Enables close action. |
| `initialState` | `"normal" \| "maximized" \| "minimized"` | `"normal"` | no | Initial state applied after creation. |
| `className` | `string` | `""` | no | Extra class names for the window root. |
| `headerActions` | `Array<Action>` | `[]` | no | Extra title-bar actions kept inline between the shrinking title and fixed minimize/maximize/close controls. |
| `onOpen` | `({ state }) => void` | `null` | no | Fires when this window opens. |
| `onClose` | `({ state, meta? }) => void` | `null` | no | Fires when this window closes. |
| `onFocus` | `({ state }) => void` | `null` | no | Fires when this window becomes active. |
| `onMove` | `({ state }) => void` | `null` | no | Fires after drag-based position changes. |
| `onResize` | `({ state }) => void` | `null` | no | Fires after resize changes. |
| `onStateChange` | `({ type, state }) => void` | `null` | no | Fires on minimize, maximize, restore, move, and resize transitions. |

Header action object contract:

Header actions stay inside the title-bar row. The title truncates as needed, built-in window controls remain fixed on the far right, and interactive header actions do not initiate title-bar dragging. Maximized windows render flush to the manager work area without rounded outer chrome.

| Property | Type | Default | Required | Description |
|---|---|---:|---|---|
| `id` | `string` | `""` | no | Stable action identifier. |
| `label` | `string` | - | yes | Visible or accessible action label. |
| `variant` | `"default" \| "ghost" \| "primary" \| "danger"` | `"ghost"` | no | Shared title-bar action emphasis. |
| `title` | `string` | `""` | no | Native tooltip text. |
| `ariaLabel` | `string` | `""` | no | Accessible label for icon-style actions. |
| `onClick` | `({ manager, window, action, event }) => any` | `null` | no | Header action click handler. |

Returned manager API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `createWindow` | `options` | `WindowInstance` | Creates and registers a managed window. |
| `getWindows` | none | `WindowInstance[]` | Returns the current window instances. |
| `getTaskbarWindows` | none | `WindowInstance[]` | Returns windows currently represented in the taskbar in rendered order. |
| `focusWindow` | `id` | `boolean` | Brings the matching window to front. |
| `closeWindow` | `id, meta?` | `boolean` | Closes one window by id. |
| `closeAll` | `meta?` | `void` | Closes all windows. |
| `destroy` | none | `void` | Removes the manager layer, taskbar, and window DOM. |

Taskbar behavior:

- `taskbarMode: "auto"` resolves to:
  - `"minimized-only"` for body-level managers
  - `"always"` for contained workspace-style managers
- `taskbarMode: "always"` keeps all open windows in the taskbar for desktop-style switching
- clicking a non-minimized taskbar item focuses it
- clicking a minimized taskbar item restores and focuses it
- if taskbar items exceed available width, the taskbar scrolls horizontally instead of shrinking items into unreadable pills

Returned window API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | none | `boolean` | Opens the window if closed. |
| `close` | `meta?` | `boolean` | Closes the window. |
| `focus` | none | `boolean` | Activates and raises the window. |
| `minimize` | none | `boolean` | Minimizes the window into the taskbar. |
| `maximize` | none | `boolean` | Maximizes the window to manager bounds. |
| `restore` | none | `boolean` | Restores from minimized or maximized state. |
| `setTitle` | `title` | `void` | Replaces title-bar text. |
| `setContent` | `content` | `void` | Replaces body content. |
| `setPosition` | `{ x, y }` | `void` | Updates window position with bounds clamping. |
| `setSize` | `{ width, height }` | `void` | Updates window size with min/bounds enforcement. |
| `getState` | none | `object` | Returns current id, title, rect, z-index, and state flags. |
| `destroy` | none | `void` | Fully disposes the instance. |

Behavior notes:

- V1 is intentionally narrow:
  - drag by title bar
  - resize by edges/corners
  - active-window stacking
  - minimize/maximize/restore
  - manager-owned taskbar recovery
- V1 does not include:
  - docking
  - snapping
  - tiled layouts
  - saved workspace persistence

Related demos:

- `demos/demo.window.html`
- `demos/demo.window.manager.html`

### `createIframeHost(options)` (`js/ui/ui.iframe.host.js`)

Purpose:

- Shared iframe surface for embedded PBB applications or local helper-owned fixtures, designed to compose over `ui.window` without widening the window subsystem.
- When used as window content, the iframe host can occupy the full window body instead of inheriting generic body padding.

Factory:

```js
import { createIframeHost } from "./js/ui/ui.iframe.host.js";

const iframeHost = createIframeHost(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `src` | `string` | `""` | no | URL loaded into the iframe. |
| `srcdoc` | `string` | `""` | no | Inline document markup used instead of `src` when provided. |
| `title` | `string` | `"Embedded content"` | no | Accessible iframe title. |
| `loadingText` | `string` | `"Loading embedded page..."` | no | Helper-owned loading message. |
| `errorTitle` | `string` | `"Unable to load embedded page"` | no | Helper-owned error heading. |
| `errorMessage` | `string` | `"Check the requested URL or embedded app availability."` | no | Helper-owned error message body. |
| `sandbox` | `string` | documented default | no | Raw iframe sandbox attribute. |
| `referrerPolicy` | `string` | `"strict-origin-when-cross-origin"` | no | Referrer policy applied to the iframe. |
| `allow` | `string` | `""` | no | Raw iframe `allow` attribute. |
| `allowFullscreen` | `boolean` | `false` | no | Adds `allowfullscreen` when needed. |
| `className` | `string` | `""` | no | Extra classes applied to the host root. |
| `onLoad` | `(state) => void` | `null` | no | Fires after a successful iframe load. |
| `onError` | `(state) => void` | `null` | no | Fires when the helper enters an error state. |

Returned API:

| Property / Method | Arguments | Returns | Description |
|---|---|---|---|
| `root` | - | `HTMLElement` | Root host surface. |
| `iframe` | - | `HTMLIFrameElement` | Managed iframe element. |
| `getSrc` | none | `string` | Current `src` value. |
| `setSrc` | `url` | `void` | Replaces the current iframe URL and clears `srcdoc`. |
| `reload` | none | `void` | Reloads the current source. |
| `update` | `options` | `void` | Applies partial option updates. |
| `getState` | none | `object` | Returns current source, title, status, and error state. |
| `destroy` | none | `void` | Removes helper-owned DOM and listeners. |

Behavior notes:

- V1 owns:
  - iframe DOM creation
  - loading surface
  - deterministic error surface for empty/invalid source
  - narrow source changes via `setSrc(...)` and `update(...)`
  - full-bleed composition inside `ui.window` through helper-owned content-fill markers
- V1 intentionally does not own:
  - cross-frame messaging
  - auth brokering
  - Workspace launcher logic
  - automatic embedded title sync
- The dedicated demo uses a same-origin fixture file for deterministic browser behavior:
  - `samples/iframe/iframe-host.fixture.html`

Composition example:

```js
const iframeHost = createIframeHost({
  src: "/pbb/hq/",
  title: "PBB HQ",
});

const win = manager.createWindow({
  title: "PBB HQ",
  content: iframeHost.root,
});
```

Related demos:

- `demos/demo.iframe.host.html`

### `installWorkspaceUiBridgeHost(options)`, `getWorkspaceUiBridge(options)`, `showWorkspaceActionModal(payload, options)`, `showWorkspaceFormModal(payload, options)` (`js/ui/ui.workspace.bridge.js`)

Purpose:

- Explicit trusted bridge between a parent workspace shell and iframe-hosted child apps so helper-owned overlays can render in the parent document instead of being trapped inside the iframe.
- Same-origin Workspace hosts now also act as an automatic parent overlay portal for modal-family helpers, so plain `createModal(...)`, `createActionModal(...)`, `createFormModal(...)`, and presets can mount into the parent shell without manual bridge code.

Design rule:

- parent host owns the rendered overlay surfaces
- child helpers delegate only when a trusted bridge is available
- local iframe rendering remains the fallback
- automatic modal-family parent routing is same-origin only
- cross-origin arbitrary form/modal DOM is still outside the helper contract
- cross-origin login, re-auth, account, change-password, and generic-form rendering can use the explicit `modal.form.open` bridge contract through `showWorkspaceFormModal(...)`
- long async cross-origin submit flows should use the session-style bridge through `bridge.openFormSession(payload)` so the parent-owned modal can stay open while the child pushes busy/error updates
- if a cross-origin admin modal such as `Add User`, `Edit User`, `Add App`, or `Edit App` still renders inside the iframe, treat that as a child integration gap first: the flow likely has not been moved onto the helper-owned `generic-form` bridge/session path yet

Operational guidance:

- `docs/ui-workspace-overlay-routing-guide.md`

Parent host:

```js
import { installWorkspaceUiBridgeHost } from "./js/ui/ui.workspace.bridge.js";

const host = installWorkspaceUiBridgeHost({
  trustedOrigins: [window.location.origin],
});
```

Same-origin automatic parent routing:

```js
const modal = createActionModal({
  title: "Workspace-owned modal",
  content: "This plain helper modal will mount into the parent Workspace surface when a same-origin host is installed.",
});

modal.open();
```

Child helper:

```js
import { getWorkspaceUiBridge } from "./js/ui/ui.workspace.bridge.js";

const bridge = getWorkspaceUiBridge();
const available = await bridge.isAvailable();
```

Cross-origin form bridge:

```js
import { showWorkspaceFormModal } from "./js/ui/ui.workspace.bridge.js";

const result = await showWorkspaceFormModal({
  intent: "login",
  title: "Login",
  submitLabel: "Login",
  showCloseButton: false,
  showCancelButton: false,
  closeOnBackdrop: false,
  closeOnEscape: false,
  rows: [
    [{ type: "input", input: "email", name: "email", label: "Email address", required: true }],
    [{ type: "input", input: "password", name: "password", label: "Password", required: true }],
  ],
});
```

Parent options:

| Option | Type | Default | Description |
|---|---|---:|---|
| `trustedOrigins` | `string[]` | `[window.location.origin, "null"]` | Allowed child origins for bridge requests. |
| `toastOptions` | `object` | `{}` | Passed to the parent-owned toast stack. |
| `parent` | `HTMLElement` | `document.body` | Parent document node used for delegated modal/dialog rendering. |

Child options:

| Option | Type | Default | Description |
|---|---|---:|---|
| `timeoutMs` | `number` | `900` | Handshake / availability timeout in milliseconds. Interactive parent-owned dialogs and form-modals do not auto-timeout once the request is accepted by the parent host. |
| `targetOrigin` | `string` | `"*"` | `postMessage` target origin. |

Child API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `isAvailable` | none | `Promise<boolean>` | Probes for a trusted parent bridge host. |
| `showToast` | `payload` | `Promise<string \| null>` | Requests parent-owned toast rendering. |
| `dismissToast` | `id` | `Promise<boolean>` | Dismisses a delegated toast by id. |
| `clearToasts` | none | `Promise<boolean>` | Clears delegated toasts. |
| `alert` | `payload` | `Promise<any>` | Delegates `uiAlert(...)` behavior to the parent host. |
| `confirm` | `payload` | `Promise<any>` | Delegates `uiConfirm(...)` behavior to the parent host. |
| `prompt` | `payload` | `Promise<any>` | Delegates `uiPrompt(...)` behavior to the parent host. |
| `showActionModal` | `payload` | `Promise<object>` | Requests a parent-owned simple action modal. |
| `showFormModal` | `payload` | `Promise<object>` | Requests a parent-owned cross-origin login, re-auth, account, or change-password form modal through `modal.form.open`. |

V1 scope:

- delegated toast delivery
- delegated alert / confirm / prompt dialogs
- explicit parent-owned simple action modal
- automatic same-origin parent routing for:
  - `createModal(...)`
  - `createActionModal(...)`
  - `createFormModal(...)`
  - presets built over `createFormModal(...)`
- explicit cross-origin form bridge for:
  - `intent: "login"`
  - `intent: "reauth"`
  - `intent: "account"`
  - `intent: "change-password"`
  - `intent: "generic-form"`

Cross-origin form-bridge contract:

- request namespace:
  - `pbb.workspace.ui.bridge.v2`
- request method:
  - `modal.form.open`
- request timeout behavior:
  - `timeoutMs` applies to bridge availability probing and transport setup
  - accepted interactive parent-owned login, re-auth, account, and change-password modals stay open until the user responds
- result shape:
  - `{ reason, values, actionId? }`
  - where `reason` is `submit | cancel | dismiss | action`
- child app still owns:
  - API submission
  - auth/session logic
  - CSRF refresh sequence
  - retry/error mapping

V1 non-goals:

- arbitrary parent command execution
- auth brokering or iframe/session ownership
- automatic cross-origin mirroring of arbitrary form or modal DOM

Related demos:

- `demos/demo.workspace.bridge.html`
- `demos/demo.workspace.bridge.cross.origin.html`
- `demos/demo.iframe.host.html`

Cross-origin local harness:

- doc:
  - `docs/ui-workspace-cross-origin-demo-harness.md`
- manual launcher:
  - `node scripts/run-workspace-bridge-cross-origin-demo.mjs`
- automated regression:
  - `node tests/workspace.bridge.cross.origin.regression.mjs`

### `createFormModal(options)` (`js/ui/ui.form.modal.js`)

Purpose:

- Schema-driven helper for short modal-bound forms such as login, re-auth, and simple CRUD flows.

Architecture:

- Composes over `createActionModal(...)`
- Reuses helper-owned modal busy-state, close, and focus behavior
- Keeps the public action contract narrow to helper-owned cancel/submit flows with additive `extraActions` support in V1

Factory:

```js
import { createFormModal } from "./js/ui/ui.form.modal.js";

const formModal = createFormModal(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| Safe modal options | inherited | inherited | no | Accepts modal-shell options such as `title`, `size`, `className`, `showCloseButton`, `closeOnBackdrop`, `closeOnEscape`, `busyMessage`, and `renderTarget`. |
| `rows` | `Array<Array<FormItem>>` | `[]` | yes | Strict V1 row model for form body layout. |
| `columns` | `1 \| 2 \| 3` | `2` | no | Maximum visible columns allowed per row. Use `3` only for dense operational forms that have enough modal width, such as prescription composers. |
| `initialValues` | `object` | `{}` | no | Initial field values keyed by field name. |
| `context` | `{ badge?, summary?, kind? }` | `null` | no | Narrow top-level context strip for acceptance-target flows such as geodata-driven hub editing. |
| `mode` | `string` | `""` | no | Declarative form mode used by first-pass rule evaluation. |
| `extraActions` | `Array<FormModalExtraAction>` | `[]` | no | Additive footer actions rendered before helper-owned `Cancel` and `Submit`. Reserved IDs: `cancel`, `submit`. |
| `extraActionsPlacement` | `"start" \| "end"` | `"end"` | no | Places additive footer actions either in the same end cluster or split to the start side of the footer. |
| `submitLabel` | `string` | `"Submit"` | no | Submit action label. |
| `cancelLabel` | `string` | `"Cancel"` | no | Cancel action label. |
| `showCancelButton` | `boolean` | `true` | no | Renders the helper-owned Cancel footer action. Set to `false` for blocking auth gates where dismissal is not allowed. |
| `submitVariant` | `string` | `"primary"` | no | Submit button variant. |
| `submitIcon` | `string` | `null` | no | Submit button icon markup. |
| `cancelIcon` | `string` | `null` | no | Cancel button icon markup. |
| `closeOnSuccess` | `boolean` | `true` | no | Closes modal on truthy submit result. |
| `onSubmit` | `(values, ctx) => any` | `null` | no | Submit handler. |
| `onChange` | `(values, ctx) => void` | `null` | no | Fires on form value change. |

Supported V1 item types:

- `text`
- `alert`
- `divider`
- `hidden`
- `display`
- `ui.select`
- `ui.treeSelect`
- `number-stepper` or `number_stepper`
- `avatar`
- `input`
- `textarea`
- `select`
- `checkbox`

Supported V1 `input` types:

- `text`
- `email`
- `password`
- `number`
- `date`
- `url`
- `search`

Password-input note:

- `input: "password"` rows now compose over the shared `createPasswordField(...)` primitive so login, re-auth, and standalone password entry all use the same show/hide behavior.

Field properties:

- `name`
- `label`
- `value`
- `placeholder`
- `required`
- `requiredOn`
- `disabled`
- `readonly`
- `readonlyOn`
- `hiddenOn`
- `visibleWhen`
- `autocomplete`
- `min`
- `max`
- `step`
- `options`
- `help`
- `span`
- `rowClassName`
- `className` (row-item alias for `rowClassName`; modal-level `className` still belongs to the outer modal shell)

`ui.select` field properties:

- `options` or `items`
- `placeholder`
- `emptyText`
- `searchable`
- `multiple`
- `closeOnSelect`
- `selectOnTab`
- `clearable`

`ui.treeSelect` field properties:

- `options` or `items`
- `placeholder`
- `emptyText`
- `searchable`
- `closeOnSelect`
- `selectOnTab`
- `clearable`
- `defaultExpanded`

`number-stepper` field properties:

- `min`
- `max`
- `step`
- `decimals`
- `allowEmpty`
- `prefixText`
- `suffixText`
- `decrementLabel`
- `incrementLabel`
- `ariaLabel`

`avatar` field properties:

- `accept`
- `capture`
- `previewUrl` or `src`
- `previewAlt`
- `placeholderText`
- `selectLabel`
- `changeLabel`
- `emptyText`
- `previewText`
- `required`

Avatar behavior notes:

- avatar fields return the selected `File` object from `getValues()` and submit payloads
- preview URLs are visual-only and are not treated as payload values

Row model:

| Row shape | Behavior |
|---|---|
| 1 item | Full-width row |
| 2 items | Equal-width two-column row |
| 3 items with `columns: 3` | Equal-width three-column row |
| More visible items than `columns` allows | Warns and renders the first allowed visible items only |

Layout notes:

- `span: 2` spans two columns when `columns: 3` is active, and remains full-width in one/two-column rows.
- `span: 3` makes an item full-width in three-column forms.
- `hidden` items do not count toward the visible row-column layout.

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onSubmit` | `values, ctx` | `any \| Promise<any>` | Submit handler. Truthy result closes by default. |
| `extraActions[].onClick` | `values, ctx` | `any \| Promise<any>` | Additive footer action callback. Defaults to non-closing behavior unless `closeOnClick: true` is explicitly provided. |
| `onChange` | `values, ctx` | `void` | Fires on field changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| Modal instance methods | inherited | inherited | Includes `open()`, `close()`, `destroy()`, `setBusy()`, `isBusy()`. |
| `update` | `nextOptions` | `void` | Re-renders form rows/options and updates the composed action modal. |
| `getState` | none | `object` | Returns modal state plus current `mode` and current form `values`. |
| `getValues` | none | `object` | Returns current form values. |
| `setValues` | `values` | `void` | Updates current form values. |
| `setErrors` | `fieldErrors` | `void` | Applies field-level errors by field name. |
| `clearErrors` | none | `void` | Clears field-level errors. |
| `setFormError` | `message` | `void` | Applies a form-level error message. |
| `clearFormError` | none | `void` | Clears the form-level error message. |
| `applyApiErrors` | `response` | `{ fieldErrors, formError }` | Maps common backend error payloads onto helper field/form errors. |

Submit context helpers:

| Helper | Arguments | Returns | Description |
|---|---|---|---|
| `ctx.setErrors` | `fieldErrors` | `void` | Applies field errors from submit logic. |
| `ctx.setFormError` | `message` | `void` | Applies a form-level error from submit logic. |
| `ctx.applyApiErrors` | `response` | `{ fieldErrors, formError }` | Maps common backend error shapes into helper field/form errors. |
| `ctx.mode` | none | `string` | Current declarative form mode. |

Validation and submit behavior:

- helper owns required/basic validation
- app owns domain/business validation
- first invalid field receives focus on helper validation failure
- truthy async submit result closes by default
- falsy or rejected submit keeps the modal open
- `extraActions` render before helper-owned `Cancel` and `Submit`, stay additive, and disable together with the rest of the footer during helper-owned busy state
- `extraActionsPlacement: "start"` visually splits the last extra action away from the helper-owned `Cancel` and `Submit` cluster
- `requiredOn`, `hiddenOn`, and `readonlyOn` are first-pass declarative mode rules
- `visibleWhen` is a narrow field-level conditional-visibility rule for value-dependent admin-form cases
- `visibleWhen` accepts an object where string values mean exact match, array values mean inclusion, and all declared keys must match
- fields hidden by `visibleWhen` are omitted from helper validation and `getValues()` / submit payloads while hidden, but their prior value is retained and restored if they become visible again
- `context` is intentionally narrow and exists to cover real acceptance-target header/context needs without reopening a larger form-builder surface
- `display` is visual-only and does not participate in payload output
- `hidden` participates in payload output without rendering visible validation UI
- dotted backend error keys such as `uplink_hub_ids.0` map back onto the base field when possible
- `ui.select` hosts the existing shared select helper inside the form modal instead of introducing a second select system
- hosted `ui.select` menus render in a floating body-level layer so they are not clipped by modal or drawer overflow containers
- `ui.treeSelect` hosts the existing shared tree-select helper inside the form modal instead of introducing app-local grouped picker markup
- hosted `ui.treeSelect` menus render in the same floating body-level layer so they are not clipped by modal or drawer overflow containers
- `number-stepper` hosts the existing shared number stepper for bounded quantities and participates in `getValues()`, `setValues(...)`, helper validation/errors, disabled/readOnly state, and invalid-field focus

Example:

```js
import { createFormModal } from "./js/ui/ui.form.modal.js";

const formModal = createFormModal({
  title: "Operator Login",
  rows: [
    [{ type: "text", content: "Please sign in to continue." }],
    [{ type: "input", input: "email", name: "email", label: "Email address", required: true }],
    [{ type: "input", input: "password", name: "password", label: "Password", required: true }],
  ],
  submitLabel: "Login",
  busyMessage: "Signing in...",
  async onSubmit(values, ctx) {
    const ok = await apiLogin(values);
    if (!ok) {
      ctx.setErrors({ password: "Invalid password." });
      return false;
    }
    return true;
  },
});

formModal.open();
```

Related demos:

- `demos/demo.dialog.alert.html`
- `demos/demo.dialog.confirm.html`
- `demos/demo.dialog.prompt.html`

### `createLoginFormModal(options)`, `createReauthFormModal(options)`, `createStatusUpdateFormModal(options)`, `createReasonFormModal(options)`, `createAccountFormModal(options)`, `createChangePasswordFormModal(options)` (`js/ui/ui.form.modal.presets.js`)

Purpose:

- Prebuilt auth wrappers over `createFormModal(...)` for shared cross-project consistency.

Design rule:

- wrappers own structure and defaults
- engineers can still provide field-name mappings and submit behavior

Preset summary:

| Factory | Primary use | App-supplied vocabulary | Field remapping |
|---|---|---|---|
| `createLoginFormModal(...)` | Shared login flow | no | `identifier`, `password` |
| `createReauthFormModal(...)` | Re-auth/session confirmation | no | `identifier`, `password` |
| `createStatusUpdateFormModal(...)` | Operational status update | `statusOptions` | `status`, `remarks`, `notify` |
| `createReasonFormModal(...)` | Categorized reason-required flow | `reasonOptions` | `reasonCode`, `reasonDetails`, `confirmText`, `notify` |
| `createAccountFormModal(...)` | Shared account/profile edit flow | optional helper-owned avatar picker | `avatar`, `name`, `email` |
| `createChangePasswordFormModal(...)` | Shared password-change flow | no | `currentPassword`, `newPassword`, `confirmPassword` |

Common preset rules:

| Rule | Description |
|---|---|
| Structure ownership | Helper owns row structure, ordering, and validation defaults. |
| Field-name mapping | Engineers can remap payload field names to match project backends. |
| Conditional details requirement | `createReasonFormModal(...)` supports `detailsRequiredFor` so details can stay required for all reasons, no reasons, or a specific subset such as `["other"]`. |
| Busy behavior | Presets reuse `createFormModal(...)` busy submit handling. |
| Submit behavior | App code still owns the actual `onSubmit(values, ctx)` implementation. |
| Session expiry detection | Re-auth auto-launch is app-owned. `createReauthFormModal(...)` does not monitor timeout state or open itself. |
| Cross-origin Workspace bridge | Login, re-auth, account, and change-password presets can delegate through `modal.form.open` when running in a cross-origin Workspace iframe and same-origin parent mounting is unavailable. Bridged account presets also preserve serializable `extraActions` and return `reason: "action"` plus `actionId` to the child app. Account avatar upload is local-render only because selected `File` objects are not serialized through the current bridge contract. |

Preset options:

| Factory | Notable options |
|---|---|
| `createLoginFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `showCancelButton`, `identifierKind`, `identifierLabel`, `identifierPlaceholder`, `identifierAutocomplete`, `passwordLabel`, `passwordPlaceholder`, `fields`, `initialValues`, `onSubmit` |
| `createReauthFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `identifierKind`, `identifierLabel`, `identifierValue`, `passwordLabel`, `passwordPlaceholder`, `fields`, `initialValues`, `onSubmit` |
| `createStatusUpdateFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `statusOptions`, `statusLabel`, `remarksLabel`, `remarksPlaceholder`, `showNotify`, `notifyLabel`, `fields`, `initialValues`, `onSubmit` |
| `createReasonFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `reasonOptions`, `reasonLabel`, `detailsLabel`, `detailsPlaceholder`, `detailsRequiredFor`, `detailsRequiredMessage`, `confirmPhrase`, `confirmLabel`, `showNotify`, `notifyLabel`, `fields`, `initialValues`, `onSubmit` |
| `createAccountFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `avatar`, `nameLabel`, `namePlaceholder`, `emailLabel`, `emailPlaceholder`, `fields`, `initialValues`, `extraRows`, `extraActions`, `extraActionsPlacement`, `onSubmit` |
| `createChangePasswordFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `currentPasswordLabel`, `currentPasswordPlaceholder`, `newPasswordLabel`, `newPasswordPlaceholder`, `confirmPasswordLabel`, `confirmPasswordPlaceholder`, `fields`, `initialValues`, `onSubmit` |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| Preset instance methods | inherited | inherited | Presets return the same API shape as `createFormModal(...)`. |

Example:

```js
import { createLoginFormModal } from "./js/ui/ui.form.modal.presets.js";

const modal = createLoginFormModal({
  showCloseButton: false,
  showCancelButton: false,
  closeOnBackdrop: false,
  closeOnEscape: false,
  mediaUrl: "/assets/launcher/app-icon.png",
  mediaAlt: "PBB Chat",
  backgroundImageUrl: "/assets/seasonal/login-bg.png",
  backgroundImageAlt: "",
  backgroundTone: "dark",
  fields: {
    identifier: "user_email",
    password: "user_password",
  },
  initialValues: {
    user_email: "operator@pbb.ph",
  },
  async onSubmit(values, ctx) {
    const ok = await apiLogin(values);
    if (!ok) {
      ctx.setErrors({ user_password: "Invalid password." });
      return false;
    }
    return true;
  },
});

modal.open();
```

Re-auth implementation note:

- `createReauthFormModal(...)` is a UI wrapper, not a session watchdog.
- Detect expiry in app code through:
  - `401` / `419` API responses
  - an app-owned idle/session timer
  - an explicit backend "session expired" contract
- Keep one reusable re-auth modal instance near the authenticated app shell.
- When expiry is detected:
  - pause or defer the protected action
  - open the shared re-auth modal
  - on successful re-auth, resume or retry the blocked action if appropriate
- Do not let each screen create its own competing re-auth modal instance.

Related demos:

- `demos/demo.form.modal.html`
- `demos/demo.form.modal.login.html`
- `demos/demo.form.modal.reauth.html`
- `demos/demo.form.modal.account.html`
- `demos/demo.form.modal.change.password.html`
- `demos/demo.form.modal.status.html`
- `demos/demo.form.modal.reason.html`

### `uiAlert(message, options)`, `uiConfirm(message, options)`, `uiPrompt(message, options)` (`js/ui/ui.dialog.js`)

Purpose:

- Promise-based convenience dialogs built on top of `createActionModal(...)`.

Factory:

```js
const result = await uiConfirm(message, options);
```

Shared options:

| Option | Type | Default | Applies to | Description |
|---|---|---:|---|---|
| Modal shell options | inherited | inherited | all | Supports shell options such as `title`, `size`, `className`, `showCloseButton`, `allowBackdropClose`, `allowEscClose`. Dialog helpers hide the header close button by default; set `showCloseButton: true` only when that dismissal path is explicitly desired. |
| `headerActions` | `Action[]` | `[]` | all | Declarative header actions using the same contract as `createActionModal(...)`. |
| `variant` | `"default" \| "success" \| "info" \| "warning" \| "error"` | `"default"` | all | Dialog-level semantic styling. |
| `description` | `string` | `""` | all | Secondary guidance text shown below the main message. |
| `showVariantIcon` | `boolean` | `true` for non-default variants | all | Suppresses built-in semantic status icon when `false`. |
| `variantIcon` | `string` | `null` | all | Custom SVG markup replacing the built-in semantic icon. |
| `speak` | `boolean` | `false` | all | Speaks dialog content after open. |
| `speakText` | `string` | `""` | all | Custom speech text override. |
| `voiceName` | `string` | `""` | all | Preferred speech-synthesis voice. |
| `speakRate` | `number` | speech default | all | Speech rate override. |
| `speakPitch` | `number` | speech default | all | Speech pitch override. |
| `speakVolume` | `number` | speech default | all | Speech volume override. |

Variant behavior:

| Variant | Default primary emphasis |
|---|---|
| `default` | standard button emphasis |
| `success` | `primary` |
| `info` | `primary` |
| `warning` | `danger` for confirm/prompt primary action |
| `error` | `danger` for confirm/prompt primary action |

Action-icon options:

| Helper | Icon options |
|---|---|
| `uiAlert(...)` | `okIcon`, `okIconPosition`, `okIconOnly`, `okAriaLabel` |
| `uiConfirm(...)` | `cancelIcon`, `cancelIconPosition`, `cancelIconOnly`, `cancelAriaLabel`, `confirmIcon`, `confirmIconPosition`, `confirmIconOnly`, `confirmAriaLabel` |
| `uiPrompt(...)` | `cancelIcon`, `cancelIconPosition`, `cancelIconOnly`, `cancelAriaLabel`, `submitIcon`, `submitIconPosition`, `submitIconOnly`, `submitAriaLabel` |

Returned values:

| Helper | Returns |
|---|---|
| `uiAlert(...)` | `Promise<boolean>`; true for acknowledgement/dismissal, false for explicit signal cancellation |
| `uiConfirm(...)` | `Promise<boolean>` |
| `uiPrompt(...)` | `Promise<string \| null>` |

Alert lifecycle options:

`uiAlert` accepts an optional `signal: AbortSignal` and `onClose(meta)` observer.
These options keep the alert local instead of delegating to a workspace host.
`onAcknowledge(value, { kind, signal, isActive })` receives the alert's lifetime
signal and an activity check. The lifetime ends when closing starts, before the
close animation. `onClose` runs once after unmount with the modal close `reason`
and the invalidated lifetime signal. An already-aborted caller signal opens no
modal and reports `reason: "abort"` once. Caller-signal listeners are removed on
close. Observer exceptions are logged and do not prevent cleanup or settlement.

Escape, backdrop and the close button remain blocked during a busy action.
Explicit caller cancellation closes even a busy alert and resolves false after
unmount without waiting for the pending handler. Late handler results/errors are
ignored by Helper. Cancellation does **not** undo a request or authorize retrying
an uncertain mutation. Callers must check the lifetime after every await before
their own side effects, and separately compare captured manager/context and
failure generation where applicable. Ordinary dismissal continues to resolve
true. With lifecycle options, successful acknowledgement also resolves after
unmount; legacy alerts retain their existing settlement timing.

```js
const contextLifetime = new AbortController();
const result = uiAlert("Storage is unavailable", {
  signal: contextLifetime.signal,
  okText: "Retry storage",
  onAcknowledge: async (_value, lifetime) => {
    const status = await checkStorage();
    if (!lifetime.isActive()) return false;
    showCurrentStatus(status);
  },
  onClose: ({ reason }) => console.log("Alert closed", reason),
});
// On surface replacement or context disposal:
contextLifetime.abort();
```

Example:

```js
const confirmed = await uiConfirm("Proceed with dispatch?", {
  title: "Confirm Dispatch",
  variant: "warning",
  headerActions: [
    {
      id: "preview",
      label: "Preview",
      variant: "ghost",
      icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.05 0 9.27 3.11 11 7-1.73 3.89-5.95 7-11 7S2.73 15.89 1 12c1.73-3.89 5.95-7 11-7Z" fill="currentColor"></path></svg>`,
      onClick() {
        return false;
      },
    },
  ],
  cancelIcon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" fill="currentColor"></path></svg>`,
  confirmIcon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.4 4.8 12.65l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65z" fill="currentColor"></path></svg>`,
});
```

Related demos:

- `demos/demo.command.palette.html`

### `createToastStack(options)` (`js/ui/ui.toast.js`)

Purpose:

- Global toast-notification stack for transient feedback, persistent async status messaging, semantic variants, and optional speech synthesis.

Factory:

```js
import { createToastStack } from "./js/ui/ui.toast.js";

const toasts = createToastStack(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `position` | `string` | `"top-right"` | no | Toast stack placement. |
| `maxVisible` | `number` | `4` | no | Maximum visible toasts before queueing. |
| `duration` | `number` | `4000` | no | Default auto-dismiss duration in milliseconds. |
| `speak` | `boolean` | `false` | no | Enables speech synthesis for matching toasts. |
| `speakTypes` | `string[]` | `[]` | no | Restricts speech to selected toast variants. |
| `voiceName` | `string` | `""` | no | Preferred speech voice. |
| `speakRate` | `number` | speech default | no | Speech rate override. |
| `speakPitch` | `number` | speech default | no | Speech pitch override. |
| `speakVolume` | `number` | speech default | no | Speech volume override. |
| `speakFormatter` | `(toast) => string` | `null` | no | Custom speech text formatter. |
| `speakCooldownMs` | `number` | `0` | no | Prevents repeated speech in quick succession. |
| `waitForSpeechBeforeDismiss` | `boolean` | `true` | no | Defers auto-dismiss countdown until speech ends. |
| `showVariantIcon` | `boolean` | `true` | no | Shows built-in semantic icons by default. |
| `variantIcon` | `string` | `null` | no | Replaces built-in semantic icon globally. |

Per-toast `show(...)` options:

| Option | Type | Default | Description |
|---|---|---:|---|
| `type` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Semantic toast variant. |
| `id` | `string` | generated | Optional stable toast id. |
| `title` | `string` | `""` | Optional toast heading. |
| `duration` | `number` | stack default | Per-toast auto-dismiss duration. |
| `persistent` | `boolean` | `false` | Keeps the toast visible until app code closes or updates it. |
| `busy` | `boolean` | `false` | Shows the helper-owned spinner/status visual. |
| `dismissible` | `boolean` | `true` | Shows or hides the manual close button. |
| `showVariantIcon` | `boolean` | stack/default behavior | Suppresses semantic icon per toast. |
| `variantIcon` | `string` | `null` | Custom icon per toast. |
| `speak` | `boolean` | stack/default behavior | Enables or suppresses speech per toast. |
| `voiceName` | `string` | stack/default behavior | Per-toast voice override. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `show` | `message, options?` | `object` | Adds a toast and returns a handle that stringifies to its id. |
| `info` / `success` / `warn` / `error` | `message, options?` | `object` | Adds a semantic toast and returns a handle. |
| `update` | `idOrHandle, messageOrOptions, options?` | `object \| null` | Updates an existing toast by id or handle. |
| `dismiss` | `idOrHandle` | `void` | Removes a single toast. |
| `clear` | none | `void` | Clears all toasts. |
| `getVoices` | none | `SpeechSynthesisVoice[]` | Returns available voices for UI selection. |
| `getState` | none | `object` | Returns current queue/visible state. |
| `destroy` | none | `void` | Removes stack DOM and listeners. |

Behavior notes:

- Dialog and toast semantic icons share the same helper-owned icon language.
- Speech is opt-in and should remain explicit in app integrations.
- When `waitForSpeechBeforeDismiss` is enabled, spoken toasts remain visible until narration completes.
- Persistent toasts ignore auto-dismiss while `persistent: true`; speech still works for the initial toast and any update that sets `speak: true`.
- Toast handles expose `update(...)`, `resolve(message, options?)`, `close()`, `dismiss()`, and `id`.

Example:

```js
import { createToastStack } from "./js/ui/ui.toast.js";

const toasts = createToastStack({
  speak: true,
  speakTypes: ["error"],
});

toasts.show("Settings saved.", { type: "success", title: "Saved" });
toasts.show("Unable to reach gateway.", { type: "error", speak: true });

const mediaToast = toasts.info("Saving call media in the background.", {
  title: "Call media",
  persistent: true,
  busy: true,
  dismissible: false,
  speak: true,
});

mediaToast.update({
  message: "Finalizing call media.",
  speak: true,
});

mediaToast.resolve("Call media is available.", {
  duration: 4000,
  speak: true,
});
```

Related demos:

- `demos/demo.toast.html`

### `createBusyOverlay(options)` / `createBusyOverlay(container, options)` (`js/ui/ui.busy.overlay.js`)

Purpose:

- Show a shared busy overlay with the same spinner styling used by modal busy states.
- Support both fullscreen blocking overlays and scoped overlays on a specific host surface.

Factory:

```js
import { createBusyOverlay } from "./js/ui/ui.busy.overlay.js";

const fullscreenBusy = createBusyOverlay({
  text: "Loading records...",
  cancel: {
    label: "Cancel",
    onCancel({ hide }) {
      abortController.abort();
      hide();
    },
  },
});

const panelBusy = createBusyOverlay(container, {
  text: "Refreshing panel...",
  visible: false,
});
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `text` | `string` | `""` | no | Optional message shown below the spinner. |
| `visible` | `boolean` | `true` | no | Controls initial visibility. |
| `fullscreen` | `boolean` | auto | no | Fullscreen when no target is passed; scoped when a target element is provided. |
| `backdrop` | `boolean` | `true` | no | Shows or suppresses the dimmed overlay scrim. |
| `blockInteraction` | `boolean` | `true` | no | Blocks pointer/focus interactions on the covered surface while visible. |
| `lockScroll` | `boolean` | `true` | no | Locks body scrolling for fullscreen overlays while visible. |
| `cancel` | `function \| { label?, onCancel }` | `null` | no | Optional cancel handler. Returning `false` from `onCancel` keeps the overlay visible. |
| `className` | `string` | `""` | no | Extra root class for host-specific styling. |
| `zIndex` | `string \| number` | `""` | no | Optional root z-index override. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `show` | `nextOptions?` | `void` | Shows the overlay and optionally merges partial options. |
| `hide` | none | `void` | Hides the overlay and restores blocked state. |
| `update` | `nextOptions` | `void` | Applies partial option updates without recreating the instance. |
| `setText` | `text` | `void` | Convenience helper for message updates. |
| `isVisible` | none | `boolean` | Returns current visibility. |
| `getState` | none | `object` | Returns normalized overlay state. |
| `destroy` | none | `void` | Removes DOM, listeners, and helper-managed host/body state. |

Behavior notes:

- Fullscreen overlays mount on `document.body` and lock body scrolling by default.
- Scoped overlays mount inside the target container and will temporarily set `position: relative` on the host when needed.
- The cancel button is only shown when a real cancel handler is provided; hiding the overlay without canceling app-owned work is intentionally not the default.

Related demos:

- `demos/demo.busy.overlay.html`

### `createGrid(container, rows, options)` (`js/ui/ui.grid.js`)

Purpose:

- Reusable data grid/table for local and remote data flows.

Modes:

| Mode | Behavior |
|---|---|
| `local` | Grid applies search, sort, and pagination internally. |
| `remote` | Grid emits query changes; parent fetches and updates rows. |

Factory:

```js
import { createGrid } from "./js/ui/ui.grid.js";

const grid = createGrid(container, rows, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `className` | `string` | `""` | no | Extra class name added to the root grid element. |
| `mode` | `"local" \| "remote"` | `"local"` | no | Chooses internal vs app-owned querying behavior. |
| `columns` | `Column[]` | `[]` | yes | Column definitions. |
| `rowKey` | `string \| ((row, index) => key)` | `"id"` | no | Stable row identifier. |
| `selectable` | `"none" \| "single" \| "multi"` | `"none"` | no | Selection mode. |
| `selectedKeys` | `Array<string \| number>` | `[]` | no | Initial selected rows. |
| `enableSort` | `boolean` | mode-dependent | no | Defaults to `true` in `local` mode and `false` in `remote` mode. |
| `enableSearch` | `boolean` | mode-dependent | no | Defaults to `true` in `local` mode and `false` in `remote` mode. |
| `enablePagination` | `boolean` | mode-dependent | no | Defaults to `true` in `local` mode and `false` in `remote` mode. |
| `enableColumnResize` | `boolean` | `false` | no | Enables resizable columns. |
| `enableVirtualization` | `boolean` | `false` | no | Enables row virtualization for large sets. |
| `minColumnWidth` | `number` | `72` | no | Minimum resizable column width. |
| `columnWidths` | `object` | `{}` | no | Per-column width overrides keyed by `column.key`. |
| `chrome` | `boolean` | `true` | no | Removes the outer helper shell when `false`. |
| `wrapCellContent` | `boolean` | `true` | no | Global cell wrapping behavior. |
| `toolbarStart` | `ToolbarContent` | `null` | no | Additive content rendered after helper-owned left toolbar tools. |
| `toolbarEnd` | `ToolbarContent` | `null` | no | Additive content rendered after helper-owned right toolbar tools. |
| `search` | `string` | `""` | no | Initial search term. |
| `searchPlaceholder` | `string` | `"Search..."` | no | Search field placeholder. |
| `searchFilter` | `({ row, index, query, columns }) => boolean` | `null` | no | Optional local-mode search predicate for domain-specific matching. Current includes-based search is preserved when absent. |
| `searchRank` | `({ row, index, query, columns }) => number` | `null` | no | Optional local-mode search ranking used after filtering and before normal column sort/pagination. Higher ranks appear first when no active column sort overrides order. |
| `filters` | `object` | `{}` | no | Additional query metadata preserved in `getQuery()` and `onQueryChange(...)`. |
| `sortBy` | `string` | `""` | no | Initial sort column key. |
| `sortDir` | `"asc" \| "desc" \| ""` | `""` | no | Initial sort direction. |
| `page` | `number` | `1` | no | Current page. |
| `pageSize` | `number` | `10` | no | Rows per page. |
| `pageSizeOptions` | `number[]` | component default | no | Page-size choices. |
| `totalRows` | `number` | local row count | no | Remote-mode total row count. |
| `virtualRowHeight` | `number` | `40` | no | Virtualized row height. |
| `virtualOverscan` | `number` | `8` | no | Extra rows rendered outside viewport. |
| `virtualThreshold` | `number` | `80` | no | Row-count threshold before virtualization becomes active. |
| `loading` | `boolean` | `false` | no | Loading state. |
| `errorText` | `string` | `""` | no | Error state copy. |
| `emptyText` | `string` | `"No data available."` | no | Empty state copy. |

Column definition:

| Property | Type | Default | Description |
|---|---|---:|---|
| `key` | `string` | - | Required stable column id. |
| `label` | `string` | - | Header label. |
| `width` | `number \| string` | auto | Initial width. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Cell alignment. |
| `sortable` | `boolean` | inherited | Enables sorting for the column. |
| `resizable` | `boolean` | `true` | Enables column resizing when grid-level resizing is on. |
| `wrap` | `boolean` | inherited | Per-column wrapping override. |
| `format` | `(value, row) => string` | `null` | Simple text formatting hook. |
| `renderCell` | `({ row, value, key, column, index }) => any` | `null` | Primary custom cell rendering hook. DOM nodes are mounted directly. |
| `render` | `(value, row, meta) => any` | `null` | Legacy custom cell alias accepted for compatibility. |

`ToolbarContent` may be:

- plain text
- a DOM node
- an array mixing text and DOM nodes
- a function receiving `{ placement, query, selectedKeys, selectedRows, rowCount, visibleRows, totalRows, options, createElement }` and returning one of the above

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onRowClick` | `row, meta` | `void` | Fires when a row is clicked. |
| `onSelectionChange` | `selectedRows, selectedKeys` | `void` | Fires when selection changes. |
| `onQueryChange` | `query` | `void` | Remote-mode query change callback. |
| `onColumnResize` | `{ key, width, columnWidths }` | `void` | Fires after a resize interaction. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextRows, nextOptions?` | `void` | Re-renders rows/options without remounting. |
| `setRows` | `rows[]` | `void` | Replaces current rows. |
| `setQuery` | `query` | `void` | Updates grid query state. |
| `getQuery` | none | `object` | Returns current grid query. |
| `getSelectedRows` | none | `array` | Returns selected rows. |
| `clearSelection` | none | `void` | Clears selected rows. |
| `getState` | none | `object` | Returns `{ mode, query, selectedKeys, rows, options, columnWidths }`. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `local` mode enables search, sort, and pagination by default unless explicitly overridden.
- `remote` mode leaves those controls off by default and expects the app to own fetching via `onQueryChange(...)`.
- `toolbarStart` and `toolbarEnd` are additive seams only; they do not replace helper-owned search or page-size controls.
- Prefer `renderCell(...)` for new custom cells; `render(...)` remains supported for backward compatibility.

Example (remote mode with optional features enabled):

```js
import { createGrid } from "./js/ui/ui.grid.js";

const grid = createGrid(container, [], {
  mode: "remote",
  columns,
  enableSort: true,
  enableSearch: true,
  enablePagination: true,
  page: 1,
  pageSize: 20,
  totalRows: 0,
  onQueryChange(query) {
    // fetch from API using query, then:
    // grid.setRows(apiRows);
    // grid.update(apiRows, { totalRows: apiTotal });
  },
});
```

Related demos:

- `demos/demo.grid.html`

### `createTreeGrid(container, options)` (`js/ui/ui.tree.grid.js`)

Purpose:

- Hierarchical grid with tree indentation in the first column, aligned tabular columns, tree-aware search, and optional virtualization.

Factory:

```js
import { createTreeGrid } from "./js/ui/ui.tree.grid.js";

const treeGrid = createTreeGrid(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `className` | `string` | `""` | no | Extra class name added to the root tree-grid element. |
| `columns` | `Column[]` | `[]` | yes | Column definitions for the tabular layout. |
| `rows` | `TreeRow[]` | `[]` | no | Initial tree rows. |
| `rowKey` | `string` | `"id"` | no | Stable row identifier when `getRowId` is not provided. |
| `getRowId` | `(row) => key` | `null` | no | Explicit row-id resolver. |
| `getChildren` | `(row) => TreeRow[]` | `null` | no | Explicit child resolver. |
| `indent` | `number` | `18` | no | Indentation size for tree depth in the first column. |
| `defaultExpanded` | `boolean` | `false` | no | Starts with all loaded parent rows expanded. |
| `expandedRowIds` | `string[]` | `[]` | no | Explicit initial expanded row ids. |
| `selectable` | `"none" \| "single" \| "multi"` | `"none"` | no | Selection mode. |
| `selectedRowIds` | `string[]` | `[]` | no | Explicit initial selected row ids. |
| `lazyLoadChildren` | `(node) => Promise<TreeRow[]>` | `null` | no | Loads children on demand for nodes with `hasChildren`. |
| `onLoadChildren` | `(row, children, state) => void` | `null` | no | Called after a lazy child load succeeds. |
| `enableColumnResize` | `boolean` | `false` | no | Enables column resize behavior. |
| `minColumnWidth` | `number` | `72` | no | Minimum resize width. |
| `columnWidths` | `object` | `{}` | no | Per-column width overrides keyed by `column.key`. |
| `enableVirtualization` | `boolean` | `false` | no | Enables fixed-row-height virtualization. |
| `virtualRowHeight` | `number` | `40` | no | Virtualized row height. |
| `virtualOverscan` | `number` | `8` | no | Extra virtual rows rendered outside the viewport. |
| `virtualThreshold` | `number` | `120` | no | Visible-row threshold before virtualization activates. |
| `searchTerm` | `string` | `""` | no | Current tree-aware search term. |
| `searchFields` | `string[]` | all column keys | no | Fields included in search matching. |
| `searchText` | `({ row, query, fields, columns }) => string \| string[]` | `null` | no | Optional searchable text resolver for hidden metadata, aliases, or field keys while preserving tree search behavior. |
| `searchPredicate` | `({ row, query, fields, columns }) => boolean` | `null` | no | Optional direct row-match predicate for domain-specific tree search. Ancestor-path inclusion remains Helper-owned. |
| `autoExpandMatches` | `boolean` | `true` | no | Temporarily expands matching ancestor paths. |
| `highlightMatches` | `boolean` | `true` | no | Highlights all occurrences in rendered text. |
| `emptyText` | `string` | `"No data available."` | no | Normal empty state copy. |
| `emptySearchText` | `string` | `"No matching results."` | no | Empty state while search is active. |
| `chrome` | `boolean` | `true` | no | Removes outer shell when `false`. |
| `ariaLabel` | `string` | `"Tree grid"` | no | Table-level accessible label. |

Column definition:

| Property | Type | Default | Description |
|---|---|---:|---|
| `key` | `string` | - | Required stable column id. |
| `label` | `string` | - | Header label. |
| `width` | `number \| string` | auto | Initial width. |
| `tree` | `boolean` | first column if omitted | Marks the hierarchy column. Only one column should declare `tree: true`. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Cell alignment for non-tree columns. |
| `wrap` | `boolean` | `false` | Per-column wrapping override. |
| `resizable` | `boolean` | `true` | Enables resizing when tree-grid-level resizing is on. |
| `className` | `string` | `""` | Extra class name added to each cell in the column. |
| `icon` | `(row, entry) => Node \| string` | `null` | Optional icon renderer for the tree column. |
| `renderCell` | `({ row, value, key, column, entry }) => any` | `null` | Primary custom renderer for non-tree cells. DOM nodes are mounted directly. |
| `render` | `(value, row, entry) => any` | `null` | Legacy custom renderer alias accepted for compatibility. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onRowClick` | `{ row, rowId, depth, entry, event }` | `void` | Fires when a visible tree row is clicked. |
| `onToggle` | `{ row, rowId, expanded, depth }` | `void` | Fires on expand/collapse. |
| `onSelectionChange` | `{ selectedRowIds, selectedRows }` | `void` | Fires when selection changes. |
| `onLoadChildren` | `(row, children, state)` | `void` | Fires after lazy child loading completes. |
| `onColumnResize` | `{ key, width, columnWidths }` | `void` | Fires after a resize interaction. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getData` | none | `TreeRow[]` | Returns current normalized tree rows. |
| `getVisibleRows` | none | `array` | Returns the current flattened visible row entries. |
| `getExpandedRowIds` | none | `string[]` | Returns current expanded row ids. |
| `setExpanded` | `rowId, expanded` | `Promise<boolean>` | Sets one row's expanded state, loading children first when needed. |
| `loadChildren` | `rowId` | `Promise<TreeRow[]>` | Loads lazy children for one row if applicable. |
| `refreshChildren` | `rowId` | `Promise<TreeRow[]>` | Forces a lazy child reload for one row. |
| `toggleRow` | `rowId` | `Promise<boolean>` | Toggles one row's expanded state. |
| `setRows` | `rows[]` | `void` | Replaces current tree data. |
| `update` | `nextOptions?` | `void` | Updates tree-grid options/state. |
| `setSearchTerm` | `term` | `void` | Applies tree-aware search term. |
| `clearSearch` | none | `void` | Clears current search state. |
| `expandAll` | none | `void` | Expands loaded nodes. |
| `collapseAll` | none | `void` | Collapses all nodes. |
| `getState` | none | `object` | Returns `{ rows, visibleRows, expandedRowIds, selectedRowIds, search, options }`. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Search is tree-aware rather than flat filtering.
- Matching descendants keep their ancestor path visible.
- Prefer `renderCell(...)` for new non-tree custom cells; `render(...)` remains supported for backward compatibility.
- If no column declares `tree: true`, the helper promotes the first column automatically.
- `getState().search` includes:
  - `active`
  - `term`
  - `matchCount`
  - `visibleCount`

Related demos:

- `demos/demo.tree.grid.html`

### `createHierarchyMap(container, options)` (`js/ui/ui.hierarchy.map.js`)

Purpose:

- Hierarchy-first visual explorer for rooted structures with optional external-entity lane and overlay relationship links.

Factory:

```js
import { createHierarchyMap } from "./js/ui/ui.hierarchy.map.js";

const map = createHierarchyMap(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `data` | `{ root, externals?, links? }` | `null` | yes | Rooted hierarchy plus optional overlay relationships. |
| `layout` | `"org"` | `"org"` | no | Current hierarchy layout mode. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | no | Primary hierarchy direction. |
| `nodeWidth` | `number` | component default | no | Node-card width. |
| `nodeHeight` | `number` | component default | no | Node-card height basis. |
| `levelGap` | `number` | component default | no | Gap between hierarchy levels. |
| `siblingGap` | `number` | component default | no | Gap between sibling nodes. |
| `externalLane` | `"right" \| "left"` | `"right"` | no | Side used for external entities. |
| `showOverlayLinks` | `boolean` | `true` | no | Shows secondary relationship links. |
| `showExternalNodes` | `boolean` | `true` | no | Shows external-entity lane. |
| `collapsible` | `boolean` | `true` | no | Enables node expand/collapse. |
| `lazyLoadChildren` | `(node) => Promise<Node[]>` | `null` | no | Loads node children on demand. |
| `searchTerm` | `string` | `""` | no | Tree-aware hierarchy search term. |
| `searchFields` | `string[]` | `["label", "type"]` | no | Fields included in matching. |
| `autoExpandMatches` | `boolean` | `true` | no | Expands matching paths while search is active. |
| `highlightMatches` | `boolean` | `true` | no | Highlights matching text in node labels. |
| `selectable` | `boolean` | `true` | no | Enables node/link selection. |
| `pan` | `boolean` | `true` | no | Enables viewport panning. |
| `zoom` | `boolean` | `true` | no | Enables zoom controls/gestures. |
| `fitOnOpen` | `boolean` | `true` | no | Fits hierarchy into viewport on open. |
| `minZoom` | `number` | `0.5` | no | Minimum zoom factor. |
| `maxZoom` | `number` | `2.5` | no | Maximum zoom factor. |
| `zoomStep` | `number` | `0.1` | no | Zoom increment size. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onNodeClick` | `{ node, path }` | `void` | Fires when a node card is selected. |
| `onNodeToggle` | `{ node, expanded }` | `void` | Fires on expand/collapse. |
| `onLinkClick` | `{ link }` | `void` | Fires when an overlay link is selected. |
| `onSelectionChange` | `{ selectedNode, selectedLink }` | `void` | Fires on selection changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getData` | none | `object` | Returns current hierarchy data. |
| `getState` | none | `object` | Returns zoom, pan, selection, expansion, and search state. |
| `setData` | `nextData` | `void` | Replaces hierarchy data. |
| `update` | `nextOptions` | `void` | Updates map options. |
| `setSearchTerm` | `term` | `void` | Applies hierarchy search term. |
| `clearSearch` | none | `void` | Clears search state. |
| `expandNode` | `nodeId` | `void` | Expands a specific node. |
| `collapseNode` | `nodeId` | `void` | Collapses a specific node. |
| `toggleNode` | `nodeId` | `void` | Toggles a specific node. |
| `expandAll` | none | `void` | Expands loaded nodes. |
| `collapseAll` | none | `void` | Collapses all nodes. |
| `focusNode` | `nodeId` | `void` | Focuses/centers a node if possible. |
| `selectNode` | `nodeId` | `void` | Selects a node. |
| `selectLink` | `linkId` | `void` | Selects an overlay link. |
| `zoomIn` | none | `void` | Increases zoom. |
| `zoomOut` | none | `void` | Decreases zoom. |
| `resetView` | none | `void` | Resets pan/zoom. |
| `fitToView` | none | `void` | Fits current hierarchy into the viewport. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Primary hierarchy uses one parent per node.
- Secondary cross-relationships belong in `links`, not as second tree parents.
- External entities render in a side lane and overlay links remain secondary to the tree structure.

Related demos:

- `demos/demo.hierarchy.map.html`

### `createTreeMindMap(container, options)` (`js/ui/ui.tree.mind.map.js`)

Purpose:

- Canvas-backed tree mind-map surface for large registry/topology data where the host app owns the surrounding filters and detail panel.

Usage:

```js
import { createTreeMindMap } from "./js/ui/ui.tree.mind.map.js";

const map = createTreeMindMap(container, {
  nodes: [
    { id: "hq", label: "PBB HQ", subtitle: "Root", status: "active" },
    { id: "region-07", parentId: "hq", label: "Region VII", subtitle: "Region", status: "active" },
  ],
  rootId: "hq",
  selectionMode: "multi",
  onSelectionChange(selectedNodes) {
    renderDetails(selectedNodes);
  },
});
```

Node contract:

- `id`: stable unique id
- `parentId`: optional parent id
- `label`: primary node text
- `subtitle`: secondary node text
- `status`: theme status key
- `data`: app-owned payload copied back through selected-node arrays

Options and methods:

- `expandDepth`, `collapsedIds`, `expandNode(id)`, `collapseNode(id)`, `toggleNode(id)`, `expandAll()`, `collapseAll()`
- `selectionMode: "single" | "multi" | "multi-sticky"`, `selectedIds`, `selectNode(id, meta)`, `setSelectedIds(ids)`, `getSelectedNodes()`
- `zoomIn()`, `zoomOut()`, `setZoom(scale)`, `resetView()`, `fitToView()`
- `theme` accepts a plain object; `themeUrl` / `loadTheme(url)` load JSON theme config

Related demos:

- `demos/demo.tree.mind.map.html`

### `createProgress(container, data, options)` (`js/ui/ui.progress.js`)

Purpose:

- General-purpose progress indicator with multiple rendering styles.
- Useful for upload, sync, workflow, and status-progress surfaces.

Factory:

```js
import { createProgress } from "./js/ui/ui.progress.js";

const progress = createProgress(container, data, options);
```

Data shape:

| Property | Type | Description |
|---|---|---|
| `value` | `number` | Current numeric value. |
| `label` | `string` | Display label. |
| `currentStep` | `number` | Current step for `steps` style. |
| `totalSteps` | `number` | Total steps for `steps` style. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `style` | `"linear" \| "striped" \| "gradient" \| "segmented" \| "steps" \| "radial" \| "ring" \| "indeterminate"` | `"linear"` | no | Progress render style. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | no | Component size preset. |
| `showLabel` | `boolean` | `true` | no | Shows label text. |
| `showPercent` | `boolean` | `false` | no | Shows percent display. |
| `animate` | `boolean` | `false` | no | Enables animated progress updates. |
| `rounded` | `boolean` | `true` | no | Rounds track corners. |
| `glow` | `boolean` | `false` | no | Adds glow emphasis. |
| `indeterminate` | `boolean` | `false` | no | Forces indeterminate mode. |
| `min` | `number` | `0` | no | Minimum progress value. |
| `max` | `number` | `100` | no | Maximum progress value. |
| `segments` | `number` | component default | no | Segment count for segmented style. |
| `totalSteps` | `number` | data/default | no | Total steps fallback. |
| `color` | `string` | theme default | no | Track fill color override. |
| `trackColor` | `string` | theme default | no | Track background color override. |
| `ariaLabel` | `string` | `""` | no | Accessibility label. |
| `className` | `string` | `""` | no | Extra container class. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders progress data/options. |
| `setValue` | `value` | `void` | Updates numeric value. |
| `getState` | none | `object` | Returns progress state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `data.value` is normalized against `min` / `max` for percent-based styles.
- `steps` style prefers `data.currentStep` / `data.totalSteps` and falls back to `options.totalSteps`.
- `indeterminate` rendering can be requested either by style or by `options.indeterminate`.

Example:

```js
import { createProgress } from "./js/ui/ui.progress.js";

const progress = createProgress(container, {
  label: "Upload",
  value: 42,
}, {
  style: "gradient",
  showPercent: true,
  animate: true,
});

progress.setValue(70);
```

Related demos:

- `demos/demo.progress.html`

### `createVirtualList(container, items, options)` (`js/ui/ui.virtual.list.js`)

Purpose:

- Render large lists with stable performance via viewport virtualization/windowing.

Factory:

```js
import { createVirtualList } from "./js/ui/ui.virtual.list.js";

const list = createVirtualList(container, items, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `height` | `number \| string` | component default | no | Viewport height. |
| `rowHeight` | `number` | component default | no | Fixed row height used for virtualization math. |
| `overscan` | `number` | component default | no | Extra rows rendered outside the viewport. |
| `emptyText` | `string` | `"No items."` | no | Empty state copy. |
| `className` | `string` | `""` | no | Extra container class. |
| `renderItem` | `(item, index) => HTMLElement \| string` | required in practice | no | Row renderer. |
| `onRangeChange` | `({ start, end }, state) => void` | `null` | no | Fires when visible window changes. |

Chrome-less behavior:

- `chrome: false` removes both the outer list shell and the viewport border/radius/background.
- The viewport still owns overflow, position, configured height, and the virtualization layer sizing.

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Re-renders items/options. |
| `setItems` | `items` | `void` | Replaces current items. |
| `scrollToIndex` | `index, behavior?` | `void` | Scrolls the list to a given item index. |
| `getState` | none | `object` | Returns virtualization state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.virtual.list.html`

### `createScheduler(container, data, options)` (`js/ui/ui.scheduler.js`)

Purpose:

- Render reusable scheduler/calendar primitives with month/week views.

Factory:

```js
import { createScheduler } from "./js/ui/ui.scheduler.js";

const scheduler = createScheduler(container, data, options);
```

Data shape:

| Property | Type | Description |
|---|---|---|
| `date` | `Date \| string` | Current focused date. |
| `events` | `Array<{ id, title, start, end?, color? }>` | Scheduler events. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `view` | `"month" \| "week"` | `"month"` | no | Current scheduler view. |
| `locale` | `string` | browser default | no | Locale for date formatting. |
| `weekStartsOn` | `number` | `0` | no | First day of week (`0..6`). |
| `events` | `array` | `[]` | no | Default event source if not passed in `data`. |
| `onViewChange` | `(view, state) => void` | `null` | no | Fires when view changes. |
| `onDateChange` | `(date, state) => void` | `null` | no | Fires when focused date changes. |
| `onSlotClick` | `({ date, view }, state) => void` | `null` | no | Fires when a slot is clicked. |
| `onEventClick` | `(event, state) => void` | `null` | no | Fires when an event is clicked. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders scheduler data/options. |
| `setView` | `view` | `void` | Changes active view. |
| `setDate` | `date` | `void` | Changes focused date. |
| `getState` | none | `object` | Returns scheduler state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.scheduler.html`

### `createDatepicker(container, options)` (`js/ui/ui.datepicker.js`)

Purpose:

- Render a reusable date picker for single or range selection with optional time inputs.

Factory:

```js
import { createDatepicker } from "./js/ui/ui.datepicker.js";

const picker = createDatepicker(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `mode` | `"single" \| "range"` | `"single"` | no | Selection mode. |
| `value` | `Date \| string \| null \| { start, end } \| [start, end]` | `null` | no | Initial selected value. |
| `showTime` | `boolean` | `false` | no | Enables time inputs. |
| `closeOnSelect` | `boolean` | `true` | no | Closes picker after selection when possible. |
| `weekStartsOn` | `number` | `0` | no | First day of week (`0..6`). |
| `yearRangePast` | `number` | component default | no | Year range backward from current year. |
| `yearRangeFuture` | `number` | component default | no | Year range forward from current year. |
| `min` | `Date \| string \| null` | `null` | no | Minimum selectable date. |
| `max` | `Date \| string \| null` | `null` | no | Maximum selectable date. |
| `disabledDates` | `(date) => boolean` | `null` | no | Custom date-disable callback. |
| `panelParent` | `"auto" \| "self" \| "body" \| HTMLElement` | `"auto"` | no | Controls where the picker panel mounts. Auto portals out of modal or overflow ancestors to avoid clipping. |
| `appendTo` | `"auto" \| "self" \| "body" \| HTMLElement \| selector` | `undefined` | no | Alias for `panelParent` when `panelParent` is not supplied. |
| `locale` | `string` | browser default | no | Locale for formatting. |
| `placeholder` | `string` | `""` | no | Input placeholder. |
| `className` | `string` | `""` | no | Extra container class. |
| `onChange` | `(value, state) => void` | `null` | no | Fires when the selected value changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Updates picker options. |
| `setValue` | `nextValue` | `void` | Replaces selected value. |
| `getValue` | none | `any` | Returns selected value. |
| `getState` | none | `object` | Returns datepicker state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Example:

```js
import { createDatepicker } from "./js/ui/ui.datepicker.js";

const single = createDatepicker(container, {
  mode: "single",
  placeholder: "Pick date",
  onChange(value) {
    console.log("single", value);
  },
});

const range = createDatepicker(rangeContainer, {
  mode: "range",
  showTime: true,
  closeOnSelect: false,
});

const modalPicker = createDatepicker(modalContainer, {
  panelParent: "auto", // default; portals out of clipping modal bodies when needed
});
```

Related demos:

- `demos/demo.datepicker.html`

### `createTimeline(container, items, options)` (`js/ui/ui.timeline.js`)

Purpose:

- Render incident/activity events in vertical log mode or horizontal milestone mode.

Factory:

```js
import { createTimeline } from "./js/ui/ui.timeline.js";

const timeline = createTimeline(container, items, options);
```

Recommended item shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable event identifier. |
| `timestamp` | `string \| number \| Date` | Event time. |
| `title` | `string` | Primary event label. |
| `subtitle` | `string` | Secondary event label. |
| `description` | `string` | Longer body copy. |
| `status` | `string` | Suggested values: `assigned`, `requested`, `accepted`, `en_route`, `on_scene`, `completed`, `cancelled`. |
| `meta` | `string[]` | Optional tag list. |
| `actions` | `Array<{ id, label, className? }>` | Optional per-item actions. |
| `contentKey` | `string` | Optional custom-content identity; changing it forces a custom slot remount. |
| `hasCustomContent` | `boolean` | Optional `false` value to skip custom slot mounting for this item. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `ariaLabel` | `string` | `"Timeline"` | no | Accessible label for the timeline. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | no | Timeline orientation. |
| `density` | `"compact" \| "comfortable"` | `"comfortable"` | no | Item density preset. |
| `groupByDate` | `boolean` | `false` | no | Groups vertical timeline items by date. |
| `showConnector` | `boolean` | `true` | no | Shows connector lines between items. |
| `linkedRange` | `{ startMs, endMs, anchorMs? } \| null` | `null` | no | Filters visible items by relative timestamp range. |
| `includeUndatedInRange` | `boolean` | `false` | no | Keeps undated items while a linked range is active. |
| `emptyText` | `string` | `"No events."` | no | Empty state copy. |
| `className` | `string` | `""` | no | Extra container class. |
| `locale` | `string` | browser default | no | Locale used for date formatting. |
| `timeZone` | `string` | browser default | no | Time zone used for date formatting. |
| `onItemClick` | `(item) => void` | `null` | no | Fires when an item is clicked. |
| `onActionClick` | `(action, item) => void` | `null` | no | Fires when an item action is clicked. |
| `mountItemContent` | `(host, item, context) => Function \| { update?, destroy? } \| null` | `null` | no | Mounts lifecycle-managed app/helper content inside a timeline item. |
| `enableVirtualization` | `boolean` | `false` | no | Enables measured-height windowing for large vertical timelines. |
| `virtualThreshold` | `number` | `120` | no | Minimum visible item count before virtualization activates. |
| `virtualOverscan` | `number` | `480` | no | Extra pixels rendered above and below the viewport. |
| `endThreshold` | `number` | `320` | no | Distance in pixels from the end that triggers `onReachEnd`. |
| `topAnchorThreshold` | `number` | `48` | no | Distance from the top where prepend remains pinned to the top. |
| `isLoading` | `boolean` | `false` | no | Suppresses end callbacks while the app is loading. |
| `hasMore` | `boolean` | `true` | no | Disables end callbacks when there is no additional page. |
| `onRangeChange` | `(range, state) => void` | `null` | no | Reports the rendered virtual range. |
| `onReachEnd` | `(boundary, state) => void` | `null` | no | Requests another page once per terminal boundary. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Re-renders timeline items/options. |
| `append` | `items` | `void` | Appends items to the end of the timeline. |
| `prepend` | `items` | `void` | Prepends items to the start of the timeline. |
| `setLinkedRange` | `range \| null` | `void` | Applies or clears linked range filtering. |
| `resetReachEnd` | `{ check?: boolean }` | `void` | Clears the end-boundary latch and optionally checks the current position immediately. |
| `getState` | none | `object` | Returns timeline state, including visible items. |
| `destroy` | none | `void` | Removes DOM and listeners. |

`getState()` returns both:
- `items` (full normalized timeline list)
- `visibleItems` (range-filtered list after `linkedRange`)

Custom content notes:

- `mountItemContent(...)` receives an empty helper-owned `.ui-timeline-custom-content` host after fixed timeline fields are rendered.
- Timeline preserves and reparents mounted content across `update(...)` when the same `id` and `contentKey` remain visible.
- Return a cleanup function or an object with `update(nextItem, context)` and/or `destroy()`.
- Changing `contentKey`, removing an item, filtering it out of view, or destroying the timeline calls cleanup.
- Interactive controls inside custom content are guarded so they do not trigger timeline item activation.

Virtualization notes:

- Virtualization is opt-in and applies only to vertical timelines at or above `virtualThreshold`; horizontal timelines retain standard rendering.
- Every virtualized item must have a unique, explicit `id`. Heights are measured from rendered content and cached by `id` plus `contentKey`.
- The timeline host must have a fixed or otherwise constrained height. The timeline's `.ui-timeline-viewport` owns scrolling.
- `append(...)` preserves the visible boundary, while `prepend(...)` preserves the first visible item and pixel offset unless the viewport is within `topAnchorThreshold` of the top.
- `onReachEnd` is deduplicated for the current last-item boundary and respects `isLoading` and `hasMore`. Call `resetReachEnd()` after a failed request to retry the same boundary.

Example:

```js
import { createTimeline } from "./js/ui/ui.timeline.js";

const timeline = createTimeline(container, events, {
  orientation: "vertical",
  groupByDate: true,
  mountItemContent(host, item) {
    if (item.type !== "call_session") {
      return null;
    }
    const nested = createAudioCallSession(host, item.callSession, item.audioOptions);
    return {
      update(nextItem) {
        nested.update?.(nextItem.callSession, nextItem.audioOptions);
      },
      destroy() {
        nested.destroy?.();
      },
    };
  },
  onItemClick(item) {
    console.log("timeline item", item.id);
  },
});
```

Related demos:

- `demos/demo.timeline.scrubber.html`

### `createTimelineScrubber(container, options)` (`js/ui/ui.timeline.scrubber.js`)

Purpose:

- Add an interactive timeline seek bar with optional range selection and zoom.
- Time labels auto-scale by duration:
  - `< 1h` -> `mm:ss`
  - `>= 1h` -> `hh:mm:ss`
  - `>= 1 day` -> `dd:hh:mm:ss`

Factory:

```js
import { createTimelineScrubber } from "./js/ui/ui.timeline.scrubber.js";

const scrubber = createTimelineScrubber(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `ariaLabel` | `string` | `""` | no | Accessible scrubber label. |
| `valueLabel` | `string` | component default | no | Current-value label text. |
| `rangeStartLabel` | `string` | component default | no | Range-start label text. |
| `rangeEndLabel` | `string` | component default | no | Range-end label text. |
| `durationMs` | `number` | `0` | no | Total duration. |
| `valueMs` | `number` | `0` | no | Current seek position. |
| `enableRange` | `boolean` | `false` | no | Enables range handles. |
| `range` | `{ startMs, endMs }` | `null` | no | Selected range. |
| `zoom` | `number` | `1` | no | Current zoom level. |
| `zoomLevels` | `number[]` | component default | no | Available zoom levels. |
| `showZoomControls` | `boolean` | `true` | no | Shows zoom controls. |
| `seekStepMs` | `number` | `1000` | no | Keyboard seek step. |
| `seekStepMsFast` | `number` | `10000` | no | Shift+keyboard seek step. |
| `preventPageScrollOnInteract` | `boolean` | `true` | no | Prevents page scroll during interaction. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onSeek` | `(valueMs, state)` | `void` | Fires when the current playhead position changes. |
| `onRangeChange` | `({ startMs, endMs }, state)` | `void` | Fires when range handles move. |
| `onZoomChange` | `(zoom, state)` | `void` | Fires when zoom changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Updates scrubber options. |
| `setTime` | `ms` | `void` | Sets current time. |
| `setRange` | `startMs, endMs` | `void` | Sets selected range. |
| `setDuration` | `ms` | `void` | Updates total duration. |
| `setZoom` | `zoom` | `void` | Sets zoom level. |
| `getValue` | none | `number` | Returns current time. |
| `getState` | none | `object` | Returns scrubber state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `enableRange` should be enabled when the scrubber is linked to range-aware surfaces like `createTimeline(...)`.
- Keyboard seeking uses `seekStepMs`, and `Shift` uses `seekStepMsFast`.
- Time label formatting automatically changes with total duration so the same control can cover short clips and multi-day ranges.

Example:

```js
import { createTimelineScrubber } from "./js/ui/ui.timeline.scrubber.js";

const scrubber = createTimelineScrubber(container, {
  durationMs: 600000,
  valueMs: 65000,
  enableRange: true,
  range: { startMs: 40000, endMs: 210000 },
  zoomLevels: [1, 2, 5],
  onSeek(valueMs) {
    console.log("seek", valueMs);
  },
});
```

Related demos:

- `demos/demo.timeline.html`

### `createCommandPalette(options)` (`js/ui/ui.command.palette.js`)

Purpose:

- Global quick-action launcher (`Ctrl/Cmd + K`) with search and keyboard navigation.
- Supports static + async command sources with grouped/pinned/recent views.

Factory:

```js
import { createCommandPalette } from "./js/ui/ui.command.palette.js";

const palette = createCommandPalette(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `commands` | `Command[]` | `[]` | no | Static command list. |
| `providers` | `Array<(ctx) => Command[] \| Promise<Command[]>>` | `[]` | no | Static/async providers. |
| `providerDebounceMs` | `number` | component default | no | Debounce before running providers. |
| `title` | `string` | `"Command Palette"` | no | Dialog title. |
| `placeholder` | `string` | `"Search commands"` | no | Search input placeholder. |
| `emptyText` | `string` | `"No commands found."` | no | Empty state copy. |
| `loadingText` | `string` | `"Loading..."` | no | Provider loading copy. |
| `shortcut` | `string` | `"k"` | no | Keyboard shortcut key. |
| `metaKey` | `boolean` | `true` | no | Requires `Meta` / `Cmd`. |
| `ctrlKey` | `boolean` | `true` | no | Requires `Ctrl`. |
| `groupBySection` | `boolean` | `true` | no | Groups commands by section. |
| `showPinned` | `boolean` | `true` | no | Shows pinned commands section. |
| `showRecent` | `boolean` | `true` | no | Shows recent commands section. |
| `pinnedCommandIds` | `string[]` | `[]` | no | Initial pinned commands. |
| `recentCommandIds` | `string[]` | `[]` | no | Initial recent commands. |
| `maxRecent` | `number` | component default | no | Maximum stored recent commands. |
| `historyStorageKey` | `string` | `""` | no | Optional localStorage key for recent history. |
| `onRun` | `(command) => void` | `null` | no | Fires when a command runs. |
| `onHistoryChange` | `(recentCommandIds, state) => void` | `null` | no | Fires when recent-history state changes. |

Command shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable command id. |
| `label` | `string` | Visible command text. |
| `section` | `string` | Optional grouping section. |
| `keywords` | `string[]` | Optional search keywords. |
| `shortcut` | `string` | Optional visible shortcut hint. |
| `icon` | `string` | Optional icon markup. |
| `disabled` | `boolean` | Prevents execution when `true`. |
| `run` | `() => any` | Local command execution handler. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | none | `void` | Opens the palette. |
| `close` | none | `void` | Closes the palette. |
| `update` | `nextOptions?` | `void` | Updates palette options. |
| `setQuery` | `text` | `void` | Applies search text. |
| `getState` | none | `object` | Returns palette state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.media.strip.html`

### `createTree(container, data, options)` (`js/ui/ui.tree.js`)

Purpose:

- Expandable/selectable hierarchical view with optional checkboxes.
- Supports lazy async child loading and optional virtualization for very large node sets.

Factory:

```js
import { createTree } from "./js/ui/ui.tree.js";

const tree = createTree(container, data, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `expandAll` | `boolean` | `false` | no | Starts with all loaded nodes expanded. |
| `selectable` | `boolean` | `true` | no | Enables node selection. |
| `checkable` | `boolean` | `false` | no | Enables checkbox state. |
| `className` | `string` | `""` | no | Extra container class. |
| `lazyLoadChildren` | `(node, state) => Promise<Node[]>` | `null` | no | Loads children for nodes with `hasChildren`. |
| `onLoadChildren` | `(node, children, state) => void` | `null` | no | Fires after lazy children load. |
| `enableVirtualization` | `boolean` | `false` | no | Enables virtualization for large trees. |
| `virtualHeight` | `number \| string` | component default | no | Virtualized viewport height. |
| `virtualRowHeight` | `number` | component default | no | Virtualized row height. |
| `virtualOverscan` | `number` | component default | no | Extra rows rendered outside viewport. |
| `onToggle` | `(node, isExpanded) => void` | `null` | no | Fires on expand/collapse. |
| `onSelect` | `(node) => void` | `null` | no | Fires on node selection. |
| `onCheck` | `(node, checked, checkedIds) => void` | `null` | no | Fires on checkbox changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders tree data/options. |
| `expandAll` | none | `void` | Expands loaded nodes. |
| `collapseAll` | none | `void` | Collapses all nodes. |
| `setSelected` | `nodeId` | `void` | Selects a node by id. |
| `getState` | none | `object` | Returns tree state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

`getState()` includes:
- `visibleRows[]` (`{ id, level }`) for current expanded/filter view

Related demos:

- `demos/demo.datepicker.html`

### `createElapsedTime(container, options)` (`js/ui/ui.elapsed.time.js`)

Purpose:

- Compact live duration readout for records that have a start datetime and remain active until an app-owned lifecycle ends.
- Suitable for incident active age, team assignment status age, queue dwell time, and dense dashboard cards.

Factory:

```js
import { createElapsedTime } from "./js/ui/ui.elapsed.time.js";

const timer = createElapsedTime(container, {
  startTime: incident.reported_at,
  thresholds: [
    { atMs: 30 * 60 * 1000, variant: "warn" },
    { atMs: 2 * 60 * 60 * 1000, variant: "danger" },
  ],
});
```

Display:

- Fixed `dd:hh:mm:ss` text.
- Uses tabular numerals so dashboard cards do not resize every second.
- Active instances share one module-level one-second ticker; the component does not create one interval per card.

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `startTime` | `Date \| number \| string` | `null` | yes | Start datetime. Accepts Date, timestamp milliseconds, or parseable datetime string. |
| `endTime` | `Date \| number \| string` | `null` | no | Optional fixed end datetime; freezes the elapsed value. |
| `running` | `boolean` | `true` | no | Subscribes the instance to the shared ticker when valid and no `endTime` is set. |
| `label` | `string` | `""` | no | Optional visible label when `showLabel` is true. |
| `showLabel` | `boolean` | `false` | no | Renders the label before the duration. |
| `prefix` / `suffix` | `string` | `""` | no | Optional visible text around the duration. |
| `showPrefix` / `showSuffix` | `boolean` | `false` | no | Controls prefix/suffix visibility. |
| `format` | `"fixed" \| "compact"` | `"fixed"` | no | `fixed` renders `dd:hh:mm:ss`; `compact` hides leading zero segments while keeping seconds visible. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | no | Visual size. |
| `variant` | `"neutral" \| "info" \| "success" \| "warn" \| "danger"` | `"neutral"` | no | Base visual tone. |
| `thresholds` | `Array<{ atMs, variant }>` | `[]` | no | Variant changes as elapsed milliseconds pass configured thresholds. |
| `ariaLabel` | `string` | `"Elapsed time"` | no | Accessible label prefix. |
| `ariaLive` | `"off" \| "polite" \| "assertive"` | `"off"` | no | Defaults off to avoid noisy updates on dense dashboards. |
| `chrome` | `boolean` | `true` | no | Removes the pill shell border/background/padding when `false`. |

Methods:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update(options)` | partial options | `void` | Updates start/end/label/threshold options and rerenders. |
| `pause(atTime?)` | optional datetime | `void` | Freezes elapsed time at `atTime` or now. |
| `resume()` | none | `void` | Clears `endTime` and resumes ticking from the original `startTime`. |
| `stop(atTime?)` | optional datetime | `void` | Alias for freezing at `atTime` or now. |
| `getState(nowMs?)` | optional timestamp | `object` | Returns `{ elapsedMs, parts, running, valid, text }`. |
| `destroy()` | none | `void` | Removes DOM and unsubscribes from the shared ticker. |

Related demos:

- `demos/demo.elapsed.time.html`

### `createClock(container, options)` (`js/ui/ui.clock.js`)

Purpose:

- Compact current-time display for operator headers, status strips, dashboards, and workspace chrome.
- Renders an optional label above the time and an optional date row below the time.
- Shares the same module-level one-second ticker used by `createElapsedTime(...)`, so mixed dashboards do not create one interval per component.

Basic usage:

```js
import { createClock } from "./js/ui/ui.clock.js";

const clock = createClock(container, {
  label: "Alert: Normal",
  variant: "warn",
  timezone: "Asia/Manila",
});
```

Default display:

- Time row uses `HH:MM:SS AM/PM` through `Intl.DateTimeFormat`.
- Date row uses a compact uppercase weekday/month/day/year format.
- Numerals are tabular so header layouts stay stable as seconds change.

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `label` | `string` | `""` | no | Optional label above the time. |
| `showLabel` | `boolean` | `true` | no | Controls label row visibility. |
| `showDate` | `boolean` | `true` | no | Controls date row visibility. |
| `showSeconds` | `boolean` | `true` | no | Controls seconds in the time row. |
| `hour12` | `boolean` | `true` | no | Uses AM/PM time by default. |
| `timezone` | `string` | `""` | no | Optional IANA timezone such as `Asia/Manila`; empty uses browser timezone. |
| `locale` | `string` | `"en-US"` | no | Locale used by the default time/date formatter. |
| `dateFormat` | `"short" \| "medium" \| "long" \| "none"` | `"short"` | no | Date row format. |
| `timeFormatter` | `function` | `null` | no | Optional custom time formatter `(date, options) => string`. |
| `dateFormatter` | `function` | `null` | no | Optional custom date formatter `(date, options) => string`. |
| `running` | `boolean` | `true` | no | Subscribes the component to the shared ticker. |
| `variant` | `"neutral" \| "info" \| "success" \| "warn" \| "danger" \| "critical"` | `"neutral"` | no | Visual tone. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | no | Visual size. |
| `ariaLabel` | `string` | `"Current time"` | no | Accessible label prefix. |
| `ariaLive` | `"off" \| "polite" \| "assertive"` | `"off"` | no | Defaults off to avoid noisy screen-reader updates every second. |
| `chrome` | `boolean` | `true` | no | Removes border/background/padding when `false`. |

Methods:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update(options)` | partial options | `void` | Updates display options and rerenders. |
| `pause()` | none | `void` | Unsubscribes from the shared ticker and freezes the current display. |
| `resume()` | none | `void` | Subscribes again to the shared ticker. |
| `getState(nowMs?)` | optional timestamp | `object` | Returns `{ timestamp, date, timeText, dateText, running }`. |
| `destroy()` | none | `void` | Removes DOM and unsubscribes from the shared ticker. |

Related demos:

- `demos/demo.clock.html`

### `createSignalStrength(container, options)` (`js/ui/ui.signal.strength.js`)

Purpose:

- Transport-agnostic 0-4 bar connectivity indicator for compact app chrome.
- Intended for navbars, headers, and dense status areas where stable sizing matters.
- Host apps own the adapter that maps Realtime/browser/reconnect facts into `level`, `tone`, and `text`.

Basic usage:

```js
import { createSignalStrength } from "./js/ui/ui.signal.strength.js";

const signal = createSignalStrength(container, {
  label: "Realtime",
  level: 4,
  tone: "ok",
  text: "84 ms",
  title: "Realtime connected (84 ms)",
  ariaLabel: "Realtime connected, 84 milliseconds",
});

signal.update({
  level: 1,
  tone: "warn",
  text: "Reconnecting",
});
```

Options:

- `level`: integer clamped from `0` through `4`
- `tone`: `ok`, `warn`, `danger`, `offline`, or `neutral`
- `text`: short visible status text
- `label`: status domain used for generated accessible text
- `title`: tooltip text
- `ariaLabel`: explicit accessible status label
- `ariaLive`: `off`, `polite`, or `assertive`; defaults to `off`
- `showText`: set `false` for bars-only rendering
- `size`: `compact` or `regular`
- `className`: extra root class name

Methods:

- `update(options)`
- `getState()`
- `destroy()`

Non-goals:

- Does not call Realtime or any transport API.
- Does not measure latency.
- Does not own reconnect behavior.
- Does not decide RTT or stale-state thresholds.

Related demos:

- `demos/demo.signal.strength.html`

### `createHeartbeatStrip(container, options)` (`js/ui/ui.heartbeat.strip.js`)

Purpose:

- Compact source/node heartbeat history strip for dense dashboards, source rails, worker lists, and status cards.
- Shows current status, helper-computed average uptime, optional last-seen age, and fixed-height buckets without becoming a full diagnostics panel.
- Host apps own heartbeat collection, freshness thresholds, polling/websocket transport, and source-specific routing.
- Host apps own what each bucket status means and what duration each bucket represents; Helper computes uptime from `receivedCount / expectedCount`.

Basic usage:

```js
import { createHeartbeatStrip } from "./js/ui/ui.heartbeat.strip.js";

const strip = createHeartbeatStrip(container, {
  label: "Apas Source Hub",
  status: "online",
  ageSeconds: 42,
  bucketCount: 48,
  rangeLabel: "last 48 hours",
  history: hourlyBuckets,
});

strip.update({
  status: "stale",
  ageSeconds: 420,
  history: nextHourlyBuckets,
});
```

Options:

- `status`: `online`, `stale`, `offline`, or `unknown`
- `lastSeenAt`: timestamp text/date used when `ageSeconds` is not supplied
- `ageSeconds`: current heartbeat age for compact visible age text
- `history`: bucket rows with app-owned `status`, `expectedCount` / `expected_count`, `receivedCount` / `received_count`, and `bucketStartedAt` / `bucket_started_at`
- `bucketCount`: rendered bucket count; defaults to `48`; each bucket can represent any app-owned interval such as 5 minutes, 30 minutes, 1 hour, or 1 day
- `hours`: compatibility shortcut for hourly data; used as `bucketCount` when `bucketCount` is omitted
- `rangeLabel`: human range copy such as `last 48 hours`, `last 24 five-minute buckets`, or `last 7 days`
- `label`: domain label used for generated accessible summaries
- `labels`: optional overrides for status, `labels.buckets`, or `labels.age`
- `chrome`: set `false` when the host card owns the outer border, background, and padding
- `compact`: set `false` for a slightly taller regular strip
- `showStatus`: set `false` to hide the current status label
- `showAge`: set `false` to hide the last-seen age text
- `showAverage`: set `false` to hide the aggregate uptime text
- `bucketTone`: `uptime` or `status`; `uptime` maps each bucket's percentage from red to green
- `ariaLabel`: explicit accessible summary
- `ariaLive`: `off`, `polite`, or `assertive`; defaults to `off`
- `palette`: optional color overrides for status and bucket tones
- `className`: extra root class name

Methods:

- `update(options)`
- `setStatus(status)`
- `getState()`
- `destroy()`

Non-goals:

- Does not call Relay, Realtime, Maestro, or any heartbeat endpoint.
- Does not calculate online/stale/offline thresholds.
- Does not define the semantic meaning of app-owned bucket statuses.
- Does not decide what duration a bucket represents.
- Does not store history.
- Does not render full logs or diagnostics.

Related demos:

- `demos/demo.heartbeat.strip.html`

### `createStatCards(container, items, options)` (`js/ui/ui.stat.cards.js`)

Purpose:

- Compact operational metric cards for dashboards, SITREP summaries, support views, and incident status panels.
- Supports shared icons, tone variants, trend labels, selectable cards, and chrome-less rendering.
- Host apps own metric aggregation and feed already-computed values into the helper.

Basic usage:

```js
import { createStatCards } from "./js/ui/ui.stat.cards.js";

const stats = createStatCards(container, [
  {
    id: "risk",
    label: "People at Risk",
    value: 61,
    unit: "people",
    note: "Across 5 source hubs",
    icon: "population.people-at-risk",
    tone: "warning",
    trend: { direction: "up", label: "+12" },
  },
], {
  columns: "auto",
  selectable: true,
  onSelect(item) {
    openMetric(item.id);
  },
});
```

Item fields:

- `id`: stable card id
- `label`: visible metric label
- `value`: metric value
- `unit`: optional unit label
- `note`: optional supporting text
- `detail`: optional tooltip/accessibility detail
- `icon`: optional `ui.icons` id
- `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `trend`: optional `{ direction, label }` where direction is `up`, `down`, or `flat`
- `action`: optional `{ label, value }` metadata label
- `meta`: app-owned metadata copy

Options:

- `columns`: `auto`, `1`, `2`, `3`, or `4`
- `size`: `sm`, `md`, or `lg`
- `chrome`: set `false` when the host surface owns borders/background
- `selectable`: when true and `onSelect` is provided, cards render as buttons
- `selectedId`: selected card id
- `emptyText`: empty-state text
- `formatter`: optional `(value, item) => string`
- `onSelect`: optional `(item, meta) => void`
- `ariaLabel`: accessible label for the card group
- `className`: extra root class name

Methods:

- `update(items, options)`
- `setItems(items)`
- `getState()`
- `destroy()`

Non-goals:

- Does not calculate SITREP metrics or dashboard aggregates.
- Does not replace detailed grid/table drill-down.
- Does not own navigation; `onSelect` only reports the selected item.

Related demos:

- `demos/demo.stat.cards.html`

### `createIconGrid(container, items, options)` (`js/ui/ui.icon.grid.js`)

Purpose:

- Draggable app/icon launcher grid for PBB Landing, app switchers, and compact shortcut surfaces.
- Supports stable IDs, restored layout order, optional auto-arrange, empty drop slots, drag/drop reorder, keyboard arrow reorder, status dots, badges, shared `ui.icons`, image icons, and chrome-less rendering.
- Host apps own persistence. Store the emitted layout in localStorage, user profile settings, or app-owned backend preferences.

Basic usage:

```js
import { createIconGrid } from "./js/ui/ui.icon.grid.js";

const savedLayout = JSON.parse(localStorage.getItem("pbb.launcher.layout") || "null");

const launcher = createIconGrid(container, [
  { id: "hotline", label: "PBB Hotline", icon: "status.warning", href: "/hotline", status: "warning" },
  { id: "relay", label: "PBB Relay", icon: "data.grid", href: "/relay", status: "online" },
  { id: "support", label: "PBB Support System", image: "/img/support.png", href: "/support" },
], {
  columns: 3,
  slots: 6,
  chrome: false,
  autoArrange: false,
  scrollable: true,
  maxHeight: 360,
  touchDragDelay: 280,
  touchHoldTolerance: 36,
  layout: savedLayout,
  onLayoutChange(layout) {
    localStorage.setItem("pbb.launcher.layout", JSON.stringify(layout));
  },
  onActivate(item) {
    window.location.href = item.href;
  },
});
```

Item fields:

- `id`: stable launcher item id used in saved layouts
- `label`: visible tile label
- `description`: optional accessibility/tooltip detail
- `href`: optional app-owned URL returned in activation metadata
- `icon`: optional `ui.icons` id
- `image` / `imageUrl`: optional bitmap icon URL
- `initial`: optional text fallback when no icon/image is provided
- `badge`: optional small badge text
- `status`: `online`, `warning`, `offline`, `busy`, or `unknown`
- `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `disabled`: disables activation/reorder for the item
- `meta`: app-owned metadata copy

Options:

- `columns`: `auto` or `1` through `8`
- `layout`: restored layout as an id array, `{ id, index }[]`, or `{ id, row, col }[]`
- `slots`: optional minimum slot count; empty slots accept drops
- `autoArrange`: compacts icons after reordering when `true`; set `false` for launcher-style spatial placement with preserved empty slots
- `scrollable`: enables vertical scrolling inside the grid when content exceeds `maxHeight`
- `maxHeight`: CSS size or pixel number used by scrollable grids
- `touchDragDelay`: long-press delay in milliseconds before touch reorder starts, default `280`
- `touchHoldTolerance`: allowed finger drift in pixels while waiting for long-press reorder, default `36`
- `editable`: enables drag/drop and modifier-key keyboard reordering, default `true`
- `keyboardReorder`: enables Ctrl/Meta + Arrow reorder for focused tiles; plain Arrow keys move focus, default `true`
- `chrome`: set `false` when the host card/page owns borders/background
- `activateOnClick`: calls `onActivate` from tile click, default `true`
- `minTileWidth`: auto-column minimum tile width in pixels
- `iconSize`: tile icon box size in pixels
- `emptyText`: empty-state text
- `onLayoutChange(layout, meta)`: save the provided layout in app-owned storage
- `onActivate(item, meta)`: launch or navigate to the app
- `onSelect(item, meta)`: optional selection notification
- `onReorderStart(item, meta)` / `onReorderEnd(item, meta)`: optional reorder lifecycle hooks
- `ariaLabel`: accessible label for the grid
- `className`: extra root class name

Methods:

- `update(items, options)`
- `setItems(items)`
- `setLayout(layout)`
- `getLayout()` -> `{ id, index, row, col }[]`; empty slots are omitted but occupied sparse indices are preserved when `autoArrange:false`
- `getState()`
- `destroy()`

Non-goals:

- Does not persist layout itself.
- Does not own navigation/routing; `onActivate` gives the host app the selected item.
- Does not require app logos to be added to `ui.icons`; host apps can provide image URLs.

Related demos:

- `demos/demo.icon.grid.html`

### `createDeviceSelector(container, data, options)` (`js/ui/ui.device.selector.js`)

Purpose:

- Adapter-driven device selection and test UX for browser media devices and future local-device sources.
- V1 includes browser-media adapters for camera, microphone, and speaker/output selection where the browser supports it.
- Host apps own persistence, call/session orchestration, hardware protocols, printer routing, and local-agent policy.

Basic usage:

```js
import { createDeviceSelector, createMediaDeviceAdapter } from "./js/ui/ui.device.selector.js";

const selector = createDeviceSelector(container, {
  kind: "camera",
  label: "Camera",
  selectedDeviceId: savedCameraId,
}, {
  adapter: createMediaDeviceAdapter({ kind: "videoinput" }),
  onSelectionChange({ selectedDeviceId }) {
    saveCameraId(selectedDeviceId);
  },
});
```

Data:

- `kind`: `camera`, `microphone`, `speaker`, `printer`, `scanner`, `usb`, `bluetooth`, `serial`, `hid`, or `custom`
- `label`: visible selector label
- `description`: optional regular-layout helper text
- `devices`: optional normalized device list for app-provided/manual adapters
- `selectedDeviceId`: current selected device id
- `status`: optional initial state
- `detailText`: optional status detail text

Options:

- `adapter`: optional adapter with `isSupported`, `listDevices`, `requestPermission`, `requestDevice`, `selectDevice`, `testDevice`, and `subscribe` hooks
- `layout`: `regular` or `compact`
- `presentation`: `select` by default using shared `ui.select`; also supports `menu`, `list`, and `native-select`
- `autoRefresh`: defaults to `true` when an adapter is provided
- `context`: optional app-owned context passed to adapter hooks
- callbacks: `onRefresh`, `onPermissionRequest`, `onRequestDevice`, `onSelectionChange`, `onTestStart`, `onTestComplete`, `onError`

Methods:

- `refresh()`
- `requestPermission()`
- `requestDevice()`
- `selectDevice(deviceId)`
- `testSelectedDevice()`
- `update(data, options?)`
- `getState()`
- `destroy()`

Non-goals:

- Does not universally enumerate USB, Bluetooth, or printers from the browser.
- Does not own Realtime call setup, media capture pipelines, persistence policy, or hardware protocols.
- Does not provide a native local-agent bridge; future local-agent support should use the same adapter contract.

Related demos:

- `demos/demo.device.selector.html`

### `createMapControls(container, options)` (`js/ui/ui.map.controls.js`)

Purpose:

- MapLibre-oriented control dock for shared map navigation UI.
- Suitable for Hotline map surfaces where the app owns MapLibre setup, sources, markers, layer meaning, geolocation, and fit-bounds policy.

Factory:

```js
import { createMapControls } from "./js/ui/ui.map.controls.js";

const controls = createMapControls(container, {
  map,
  layers: [
    { id: "incidents", label: "Incidents", checked: true },
    { id: "teams", label: "Teams", checked: true },
    { id: "routes", label: "Routes", checked: false },
  ],
  onLocate({ map }) {},
  onFit({ map }) {},
});
```

MapLibre integration:

- `zoom` calls `map.zoomIn()` / `map.zoomOut()` unless callbacks override the behavior.
- `compass` shows current bearing and resets north with `map.easeTo({ bearing: 0 })`.
- `pitch` presets call `map.easeTo({ pitch })`.
- layer toggles call `map.setLayoutProperty(layerId, "visibility", "visible" | "none")` when the layer exists.

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `map` | `MapLibre map` | `null` | no | Optional MapLibre map instance. |
| `controls` | `Array<string>` | all controls | no | Allowed values: `zoom`, `compass`, `pitch`, `locate`, `fit`, `layers`. |
| `layers` | `Array<{ id, label, checked }>` | `[]` | no | Layer toggle definitions. |
| `pitchPresets` | `Array<{ value, label }>` | `0`, `45`, `60` | no | Pitch preset buttons, clamped to 0-85 degrees. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | no | Lays controls out as a stacked dock or a horizontal toolbar. |
| `placement` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `"top-right"` | no | Placement class hint for host layouts. |
| `compact` | `boolean` | `false` | no | Uses smaller square buttons. |

Callbacks:

| Callback | Payload | Description |
|---|---|---|
| `onLocate` | `{ map }` | App-owned locate/geolocation flow. |
| `onFit` | `{ map }` | App-owned fit-bounds flow. |
| `onLayerToggle` | `{ layerId, checked, map }` | Called after a layer toggle changes. |
| `onPitchChange` | `{ pitch, map }` | Optional override for pitch changes. |
| `onResetNorth` | `{ map }` | Optional override for compass reset. |

Methods:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update(options)` | partial options | `void` | Rebuilds controls with merged options. |
| `syncFromMap()` | none | `void` | Re-reads map bearing/pitch and updates visual state. |
| `getState()` | none | `object` | Returns controls, layers, bearing, pitch, and layer panel state. |
| `destroy()` | none | `void` | Removes DOM and unbinds map listeners. |

Related demos:

- `demos/demo.map.controls.html`

### `createMapLegend(container, options)` (`js/ui/ui.map.legend.js`)

Purpose:

- Map-engine-agnostic legend for operational map surfaces.
- Suitable for alert levels, incident markers, source/target hubs, clusters, route states, boundaries, and data-quality keys.
- Host apps own MapLibre/Leaflet/map rendering, layers, and marker placement.

Basic usage:

```js
import { createMapLegend } from "./js/ui/ui.map.legend.js";

const legend = createMapLegend(container, {
  title: "SITREP Map Legend",
  sections: [
    {
      title: "Alert Level",
      items: [
        { label: "Normal", tone: "success", icon: "alert.normal", count: 4 },
        { label: "Elevated", tone: "warning", swatch: "solid", count: 2 },
        { label: "Critical", tone: "critical", swatch: "outline", count: 1 },
      ],
    },
  ],
});
```

Section fields:

- `id`: stable section id
- `title`: visible section heading
- `description`: optional helper text
- `items`: legend item array

Item fields:

- `id`: stable item id
- `label`: visible item label
- `description`: optional item helper text
- `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `color`: optional CSS color override
- `icon`: optional `ui.icons` id
- `swatch`: `solid`, `outline`, `dashed`, `gradient`, `marker`, or `line`
- `marker`: `pin`, `dot`, `cluster`, `hub`, `hotspot`, or `route`
- `count`: optional count badge
- `disabled`: muted visual state

Options:

- `title`: optional legend heading
- `sections`: section array
- `compact`: hides item descriptions and tightens spacing
- `collapsible`: adds a show/hide header control
- `defaultCollapsed`: initial collapsed state when collapsible
- `showCounts`: controls count badges
- `emptyText`: empty-state copy
- `onToggle`: optional collapsed/expanded callback
- `ariaLabel`: accessible label for the legend
- `className`: extra root class name

Methods:

- `update(options)`
- `setSections(sections)`
- `getState()`
- `destroy()`

Non-goals:

- Does not create map sources, layers, or markers.
- Does not depend on MapLibre globals.
- Does not replace chart legends inside future chart components.

Related demos:

- `demos/demo.map.legend.html`

### `createMapMarker(options)` (`js/ui/ui.map.markers.js`)

Purpose:

- Map-engine-compatible DOM marker factory for operational map surfaces.
- Suitable for incidents, source hubs, target hubs, hotspots, route points, boundary centroids, and marker clusters.
- Host apps own MapLibre/Leaflet/map rendering, marker coordinates, lifecycle, and click handling.

Basic usage:

```js
import { createMapMarker, createMapClusterMarker } from "./js/ui/ui.map.markers.js";

const markerElement = createMapMarker({
  id: "incident-216",
  type: "incident",
  tone: "critical",
  icon: "hazard.fire",
  label: "Building fire",
  count: 3,
  selected: true,
  pulse: true,
});

new maplibregl.Marker({ element: markerElement })
  .setLngLat([123.885, 10.330])
  .addTo(map);

const clusterElement = createMapClusterMarker({
  count: 12,
  tone: "warning",
  label: "12 active incidents",
});
```

Marker fields:

- `id`: optional stable marker id exposed as `data-marker-id`
- `type`: `incident`, `source-hub`, `target-hub`, `hotspot`, `route`, or `boundary-centroid`
- `shape`: optional shape override; defaults by type
- `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `icon`: optional `ui.icons` id
- `label`: accessible label and optional title text
- `count`: optional numeric/text count badge
- `selected`: selected visual state
- `active`: active/current visual state
- `muted`: reduced-emphasis visual state
- `pulse`: animated attention ring
- `size`: `sm`, `md`, or `lg`
- `color`: optional CSS color override
- `meta`: optional app-owned metadata retained on `element.__uiMapMarker`

Cluster fields:

- `count`: required cluster count
- `tone`: optional tone
- `label`: accessible label override
- `size`: `sm`, `md`, or `lg`
- `selected`: selected visual state
- `active`: active/current visual state
- `color`: optional CSS color override

Exports:

- `createMapMarker(options)` returns a plain marker `HTMLElement`
- `createMapClusterMarker(options)` returns a count-oriented cluster `HTMLElement`
- `getMapMarkerClass(options)` returns the normalized class string for app-owned custom marker wrappers

Non-goals:

- Does not create MapLibre marker instances, sources, or layers.
- Does not store coordinates or manage marker lifecycle.
- Does not replace the map legend; use `createMapLegend(...)` for map keys.

Related demos:

- `demos/demo.map.markers.html`

### `createMapDrawingTools(container, options)` (`js/ui/ui.map.drawing.js`)

Purpose:

- Adapter-based drawing toolbar for operational map surfaces.
- Suitable for point, line, polygon, rectangle, and circle drawing workflows where the app owns the map engine and geometry persistence.
- Host apps own MapLibre/Leaflet/map rendering, spatial validation, permissions, storage, and business meaning.

Basic usage:

```js
import { createMapDrawingTools } from "./js/ui/ui.map.drawing.js";

const drawing = createMapDrawingTools(container, {
  modes: ["select", "point", "line", "polygon"],
  activeMode: "select",
  adapter: mapDrawingAdapter,
  onCreate(feature) {
    saveFeature(feature);
  },
});
```

Modes:

- `select`: select/edit existing geometry
- `pan`: optional map navigation mode
- `point`: place a point
- `line`: draw a LineString
- `polygon`: draw a Polygon
- `rectangle`: draw a rectangular Polygon
- `circle`: draw a radius/circle approximation

Actions:

- `finish`: complete current drawing
- `cancel`: abandon current drawing
- `undo`: undo last drawing action
- `redo`: redo last undone action
- `delete`: delete selected feature or vertex
- `clear`: clear drawing set

Options:

- `modes`: visible mode list
- `actions`: visible action list
- `activeMode`: current active mode
- `orientation`: `vertical` or `horizontal`
- `placement`: `map` or `external`
- `size`: `sm`, `md`, or `lg`
- `variant`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `chrome`: set `false` when the host shell owns the frame
- `labels`: `auto`, `always`, or `none`
- `disabled`: disables every control
- `busy`: disables every control and marks busy state
- `features`: GeoJSON feature array
- `selectedFeatureId`: selected feature id
- `measurement`: optional `{ distanceMeters, areaSquareMeters, radiusMeters, label }`
- `adapter`: optional drawing adapter
- `className`: extra root class
- `ariaLabel`: toolbar accessible label
- `emptyText`: empty-state text when no modes/actions render
- `onModeChange`, `onAction`, `onCreate`, `onUpdate`, `onDelete`, `onSelect`: callbacks

Adapter contract:

```js
const adapter = {
  setMode(mode) {},
  getMode() {},
  getFeatures() {},
  setFeatures(features) {},
  clear() {},
  deleteSelected() {},
  undo() {},
  redo() {},
  finish() {},
  cancel() {},
  getCapabilities() {
    return {
      modes: ["select", "point", "line", "polygon"],
      actions: { undo: true, redo: false, delete: true, clear: true },
    };
  },
  on(eventName, callback) {
    return () => {};
  },
};
```

Adapter events:

- `create`: new GeoJSON feature
- `update`: updated GeoJSON feature
- `delete`: deleted feature id or feature
- `select`: selected feature id or feature
- `measure`: measurement summary
- `modechange`: current drawing mode

Methods:

- `setMode(mode)`
- `setFeatures(features)`
- `update(options)`
- `getState()`
- `destroy()`

Non-goals:

- Does not implement a full GIS editor.
- Does not create MapLibre sources, layers, or draw plugin instances.
- Does not persist geometries or enforce permissions.
- Does not require MapLibre globals.

Related demos:

- `demos/demo.map.drawing.html`

### `createChart(container, options)` (`js/ui/ui.charts.js`)

Purpose:

- Dependency-free operational chart rendering for compact PBB dashboards and SITREP summaries.
- Suitable for category comparisons, resource demand, assignment posture, status shares, and small time trends.
- Host apps own data loading, filtering, drill-down panels, and chart placement.

Basic usage:

```js
import { createChart } from "./js/ui/ui.charts.js";

const chart = createChart(container, {
  type: "horizontal-bar",
  title: "Resource Demand",
  valueLabel: "Requested",
  data: [
    { label: "Rescue Boats", value: 8, tone: "info" },
    { label: "Medical Kits", value: 5, tone: "success" },
  ],
});
```

Chart types:

- `bar`: vertical category comparison
- `horizontal-bar`: category comparison with long-label handling
- `stacked-bar`: row/segment status breakdowns
- `donut`: small part-to-whole summary
- `sparkline`: compact trend line

Simple series fields:

- `id`: optional stable id
- `label`: visible/accessibility label
- `value`: numeric value
- `secondaryValue`: optional secondary numeric value
- `secondaryLabel`: optional supporting label
- `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `color`: optional CSS color override
- `icon`: optional app-owned metadata for future composition
- `meta`: optional app-owned metadata preserved in callbacks/state

Stacked series fields:

- `id`: optional stable row id
- `label`: row label
- `segments`: segment array with `label`, `value`, `tone`, `color`, and `meta`
- `meta`: optional app-owned row metadata

Sparkline series fields:

- `id`: optional stable point id
- `x`: source x value or timestamp label
- `y`: numeric y value
- `label`: optional display/accessibility label
- `tone`: optional point tone
- `meta`: optional app-owned metadata

Options:

- `type`: `bar`, `horizontal-bar`, `stacked-bar`, `donut`, or `sparkline`
- `data`: chart data array
- `title`: visible chart heading
- `description`: visible chart helper text
- `ariaLabel`: accessible figure label
- `className`: extra root class
- `valueLabel`: semantic value label
- `secondaryValueLabel`: optional secondary semantic label
- `size`: `sm`, `md`, or `lg`
- `tone`: root tone
- `showLegend`: renders a legend for non-sparkline charts
- `showValues`: renders visible value labels where applicable
- `showAxis`: renders simple axes where applicable
- `maxValue`: optional fixed scale max for bar charts
- `sort`: `input`, `value-desc`, `value-asc`, or `label` for simple series
- `emptyText`: empty-state copy
- `loading`: renders loading state
- `loadingText`: loading-state copy
- `error`: renders error state text when non-empty
- `formatter`: optional value formatter callback
- `onSelect`: optional selectable item/segment callback
- `onHover`: optional hover/focus callback

Convenience factories:

- `createBarChart(container, data, options)`
- `createHorizontalBarChart(container, data, options)`
- `createStackedBarChart(container, data, options)`
- `createDonutChart(container, data, options)`
- `createSparkline(container, data, options)`

Methods:

- `update(options)`
- `setData(data)`
- `getState()`
- `destroy()`

Accessibility:

- The root uses figure semantics with an accessible label.
- Rendered charts include a hidden data summary table.
- Selectable chart items become keyboard focusable when `onSelect` is supplied.
- Values and labels are rendered or exposed through accessible text so meaning is not color-only.

Non-goals:

- Does not replace large analytical charting libraries.
- Does not implement zooming, brushing, complex axes, or 3D charts.
- Does not own data fetching, filtering, or report drill-down behavior.

Related demos:

- `demos/demo.charts.html`

### `createXyChart(container, options)` (`js/ui/ui.chart.xy.js`)

Purpose:

- Generic SVG X/Y chart primitive for axis-based line trends and point markers.
- Suitable for vitals trends, growth/reference chart rendering, response-time trends, queue metrics, telemetry, backlog curves, and score/progress curves.
- Host apps own domain calculations, interpretation, data loading, units, labels, and drill-down surfaces.

Basic usage:

```js
import { createXyChart } from "./js/ui/ui.chart.xy.js";

const chart = createXyChart(container, {
  title: "Response Time Trend",
  xType: "date",
  xLabel: "Date",
  yLabel: "Minutes",
  series: [{
    id: "median",
    label: "Median",
    points: [
      { x: "2026-07-01", y: 12 },
      { x: "2026-07-02", y: 9 },
    ],
  }],
  thresholds: [{ axis: "y", value: 15, label: "Target", tone: "warning" }],
  bands: [{ axis: "y", from: 0, to: 10, label: "Healthy", tone: "success" }],
});
```

Series fields:

- `id`: optional stable series id
- `label`: visible/accessibility series label
- `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or `critical`
- `color`: optional CSS color override
- `points`: point array
- `meta`: optional app-owned series metadata preserved in state

Point fields:

- `id`: optional stable point id
- `x`: numeric, date-like, or category x value
- `y`: numeric y value
- `label`: optional display/accessibility label
- `r`: optional point radius
- `meta`: optional app-owned point metadata preserved in callbacks/state

Options:

- `series`: line series array
- `xType`: `auto`, `number`, `date`, or `category`
- `xLabel`: X-axis semantic label
- `yLabel`: Y-axis semantic label
- `thresholds`: Y-axis reference lines with `value`, optional `label`, `tone`, or `color`
- `bands`: Y-axis shaded ranges with `from`, `to`, optional `label`, `tone`, or `color`
- `showLegend`: renders a series legend
- `showPoints`: renders point markers
- `showGrid`: renders horizontal grid guides
- `xFormatter`: optional X label formatter
- `yFormatter`: optional Y label formatter
- `pointLabel`: optional point accessibility label formatter
- `onSelect`: optional point select callback
- `onHover`: optional point hover/focus callback
- `loading`, `loadingText`, `error`, `emptyText`: standard state rendering

Methods:

- `update(options)`
- `setSeries(series)`
- `getState()`
- `destroy()`

Accessibility:

- The root uses figure semantics with an accessible label.
- The plot exposes an image label.
- Interactive points become keyboard focusable when `onSelect` or `onHover` is supplied.
- Rendered charts include a hidden data summary table.

Non-goals:

- Does not implement clinical calculations, z-score interpretation, or percentile interpretation.
- Does not implement zooming, brushing, pan gestures, or large-data virtualization in V1.
- Does not replace `ui.charts`; `ui.charts` remains the compact summary chart family.

Related demos:

- `demos/demo.chart.xy.html`

### `createKanban(container, lanes, options)` (`js/ui/ui.kanban.js`)

Purpose:

- Lane/card board for dispatch/incident workflow with drag-and-drop card moves.
- Suitable for workflow, incident, and queue movement where lane transitions matter.

Factory:

```js
import { createKanban } from "./js/ui/ui.kanban.js";

const board = createKanban(container, lanes, options);
```

Lane/card shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable lane/card identifier. |
| `title` | `string` | Default lane/card title field. |
| `cards` | `Array<object>` | Card collection for each lane. |
| `meta` | `object / any` | Optional extra card metadata. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `draggable` | `boolean` | `true` | no | Enables drag-and-drop. |
| `className` | `string` | `""` | no | Extra container class. |
| `ariaLabel` | `string` | `""` | no | Accessibility label. |
| `keyboardMoves` | `boolean` | `true` | no | Enables keyboard move interactions. |
| `laneIdKey` | `string` | `"id"` | no | Lane id key override. |
| `laneTitleKey` | `string` | `"title"` | no | Lane title key override. |
| `cardIdKey` | `string` | `"id"` | no | Card id key override. |
| `cardTitleKey` | `string` | `"title"` | no | Card title key override. |
| `cardMetaKey` | `string` | `"meta"` | no | Card metadata key override. |
| `emptyText` | `string` | `"No cards."` | no | Placeholder copy for empty lanes. |
| `showEmptyPlaceholder` | `boolean` | `true` | no | Set to `false` to leave empty lanes visually blank while keeping the lane body as a drop target. |
| `wipLimits` | `object` | `{}` | no | Per-lane WIP limits. |
| `validateMove` | `(payload) => boolean \| { ok: false, reason }` | `null` | no | Move validation hook. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onCardClick` | `(card, laneId)` | `void` | Fires when a card is selected. |
| `onCardMove` | `(payload)` | `void` | Fires after a successful move. |
| `onMoveRejected` | `(payload)` | `void` | Fires when a move is blocked by validation or WIP rules. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextLanes, nextOptions?` | `void` | Re-renders lanes/options. |
| `moveCard` | `cardId, fromLaneId, toLaneId, toIndex?` | `void` | Moves a card programmatically. |
| `getState` | none | `object` | Returns board state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Key override options let projects reuse existing lane/card payloads without reshaping all field names.
- `validateMove` should hold business rules such as lane restrictions or prerequisite states.
- `wipLimits` are presentation-time constraints; keep authoritative workflow validation in app logic as well.
- Use `showEmptyPlaceholder: false` for compact rails or dashboards where an empty lane should remain blank.

Related demos:

- `demos/demo.kanban.html`

### `createStepper(container, steps, options)` (`js/ui/ui.stepper.js`)

Purpose:

- Render workflow steps with current/completed/future states.

Factory:

```js
import { createStepper } from "./js/ui/ui.stepper.js";

const stepper = createStepper(container, steps, options);
```

Recommended step shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable step identifier. |
| `title` | `string` | Visible step title. |
| `subtitle` | `string` | Optional secondary copy. |
| `status` | `"complete" \| "completed" \| "current" \| "future" \| "error" \| string` | Optional explicit status. When `currentStepId` is supplied, it owns the current marker and stale per-step `current` statuses are repainted on update. |
| `disabled` | `boolean` | Disables the step trigger. |
| `icon` | `string` | Optional marker text/icon override. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | no | Stepper orientation. |
| `clickable` | `boolean` | `true` | no | Enables step click navigation. |
| `currentStepId` | `string` | first step/default | no | Active step id. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onStepClick` | `(step, index, state)` | `void` | Fires when a step is selected in clickable mode. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextSteps, nextOptions?` | `void` | Re-renders steps/options. |
| `setCurrentStep` | `stepId` | `void` | Marks a specific step as current. |
| `getState` | none | `object` | Returns stepper state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `currentStepId` should be a stable step id, not an array index, so state survives reordered step lists.
- `update(nextSteps, { currentStepId })` is idempotent: repeated progress updates repaint current/completed/future/error classes without requiring destroy/recreate.
- Use `clickable` only when the surrounding flow genuinely supports direct navigation.
- Prefer `createProgress(...)` instead when the UI only needs a scalar progress meter rather than named workflow steps.

Related demos:

- `demos/demo.stepper.html`

### `createNavigationStack(container, options)` (`js/ui/ui.navigation.stack.js`)

Purpose:

- Provide a reusable stateful drill-in stack for list -> detail -> sublist/detail workflows.
- Keep previous pages mounted while they remain in the stack, preserving scroll, filters, loaded content, and local component state.
- Animate page push/pop transitions without forcing apps to own view-container choreography.

Factory:

```js
import { createNavigationStack } from "./js/ui/ui.navigation.stack.js";

const stack = createNavigationStack(container, {
  transition: "slide",
  initialPages: [
    { id: "sources", title: "Sources", render: renderSourcesPage },
  ],
});
```

Page shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable page id used by `goTo(id)`. |
| `title` | `string` | Accessible page label and state metadata. |
| `content` | `HTMLElement \| string \| Array` | Static content appended into the page body. |
| `render` | `({ page, api }) => HTMLElement \| string \| Array` | Factory called when the page is created. |
| `mount` | `(host, { page, api }) => void` | Imperative mount hook when the app wants to append into the provided host. |
| `className` | `string` | Extra class for the page root. |
| lifecycle hooks | functions | Optional `onBeforeShow`, `onShow`, `onBeforeHide`, `onHide`, and `onDestroy`. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `initialPages` | `Array<page>` | `[]` | no | Initial page stack. The last page becomes current. |
| `transition` | `"slide" \| "fade" \| "none"` | `"slide"` | no | Page transition mode. |
| `duration` | `number` | `180` | no | Transition duration in milliseconds. |
| `easing` | `string` | `"ease"` | no | CSS timing function used for transitions. |
| `chrome` | `boolean` | `true` | no | Removes the outer stack border/background/radius when `false`; page retention and transitions are unchanged. |
| `destroyOnPop` | `boolean` | `true` | no | Destroys popped pages. Pages still in the stack remain mounted. |
| `className` | `string` | `""` | no | Extra class for the stack root. |
| `ariaLabel` | `string` | `"Navigation stack"` | no | Accessible label for the stack region. |
| `onChange` | `function` | `null` | no | Fires after stack changes. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onChange` | `{ action, currentPage, previousPage, state, api }` | `void` | Fires for `push`, `pop`, `replace`, `goTo`, and `reset`. |
| `onPush` | `(page, ctx)` | `void` | Fires after a page is pushed. |
| `onPop` | `(page, ctx)` | `void` | Fires after a page is popped. |
| `onReplace` | `(page, ctx)` | `void` | Fires after the current page is replaced. |
| `onReset` | `(state, ctx)` | `void` | Fires after the stack is reset. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `push` | `page, options?` | page | Adds and shows a new top page. |
| `pop` | `options?` | page \| `null` | Removes the current page and reveals the previous page. |
| `replace` | `page, options?` | page | Replaces the current page. |
| `goTo` | `idOrIndex, options?` | page \| `null` | Shows an existing page and removes pages above it. |
| `reset` | `pages, options?` | state | Rebuilds the stack. |
| `update` | `options` | `void` | Updates transition/root options. |
| `getState` | none | state | Returns `currentIndex`, `currentPage`, `pages`, `depth`, and `transition`. |
| `destroy` | none | `void` | Removes DOM and calls page cleanup hooks. |

Behavior notes:

- `push()` trims any forward pages after a prior `goTo(...)` before adding the new page.
- `pop()` will not remove the root page; it returns `null` at depth 1.
- Page DOM is created when pushed/reset and is retained while the page remains in the stack.
- Popped/replaced pages are cleaned up after their exit animation window.
- Use `transition: "none"` for tests, dense admin tools, or surfaces where motion would distract.

Related demos:

- `demos/demo.navigation.stack.html`

### `createSplitter(container, options)` (`js/ui/ui.splitter.js`)

Purpose:

- Provide a reusable two-pane resizable layout primitive.

Factory:

```js
import { createSplitter } from "./js/ui/ui.splitter.js";

const splitter = createSplitter(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | no | Split direction between pane A and pane B. |
| `initialRatio` | `number` | component default | no | Starting pane ratio. |
| `minRatio` | `number` | component default | no | Minimum allowed ratio. |
| `maxRatio` | `number` | component default | no | Maximum allowed ratio. |
| `paneA` | `HTMLElement \| string \| () => HTMLElement` | `null` | no | Pane A content source. |
| `paneB` | `HTMLElement \| string \| () => HTMLElement` | `null` | no | Pane B content source. |
| `panePadding` | `number \| null` | `null` (CSS: 10px) | no | Nonnegative pixel padding for this splitter's panes; `0` removes spacing, `null` preserves stylesheet padding. |
| `chrome` | `boolean` | `true` | no | `false` removes the root frame/background and fills the host height with no minimum height. |


Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onResize` | `(ratio, state)` | `void` | Fires when the splitter ratio changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Re-renders splitter options/content. |
| `setRatio` | `ratio` | `void` | Sets pane ratio programmatically. |
| `getState` | none | `object` | Returns splitter state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `chrome: false` removes the frame and decorative pane borders only for this splitter. Nested splitters retain their own chrome setting; divider interactions and pane spacing are unchanged.
- For nested splitters, use `panePadding: 0` on the outer splitter and `panePadding: 0, chrome: false` on the inner one. Give the nested host `height: 100%; min-width: 0; min-height: 0`, and give the outer layout a definite height. Put spacing on column content. Use `update({ panePadding: null, chrome: true })` to restore defaults.
- Use `minRatio` / `maxRatio` to prevent unusable pane sizes.
- Pane content can be passed as elements, strings, or factories; keep heavy child components mounted outside if state retention matters.

Related demos:

- `demos/demo.splitter.html`

### `createDataInspector(container, data, options)` (`js/ui/ui.data.inspector.js`)

Purpose:

- Inspect nested objects/arrays with expand/collapse and path copy.

Factory:

```js
import { createDataInspector } from "./js/ui/ui.data.inspector.js";

const inspector = createDataInspector(container, data, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `expandDepth` | `number` | component default | no | Initial expansion depth. |
| `emptyText` | `string` | component default | no | Empty-state copy. |
| `className` | `string` | `""` | no | Extra container class. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onCopyPath` | `(path, value)` | `void` | Fires when a path-copy action is triggered. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders inspected data/options. |
| `getState` | none | `object` | Returns inspector state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Use `expandDepth` conservatively for large payloads to avoid overwhelming the initial render.
- This is for inspection and debugging; prefer dedicated detail UIs for operational editing workflows.

Related demos:

- `demos/demo.inspector.html`

### `createEmptyState(container, data, options)` (`js/ui/ui.empty.state.js`)

Purpose:

- Standardize empty/no-results/error views with optional actions.

Factory:

```js
import { createEmptyState } from "./js/ui/ui.empty.state.js";

const emptyState = createEmptyState(container, data, options);
```

Data shape:

| Property | Type | Description |
|---|---|---|
| `title` | `string` | Primary empty-state heading. |
| `description` | `string` | Secondary explanation text. |
| `iconHtml` | `string` | Optional icon markup. |
| `actions` | `Array<{ id, label, className? }>` | Optional action list. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onActionClick` | `(action, state)` | `void` | Fires when an empty-state action is selected. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders empty-state content/options. |
| `getState` | none | `object` | Returns empty-state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Use this for empty, filtered-empty, and recoverable error surfaces that still benefit from a consistent action block.
- For loading states, prefer `createSkeleton(...)` instead of reusing empty-state messaging.

Related demos:

- `demos/demo.empty.state.html`

### `createSkeleton(container, data, options)` (`js/ui/ui.skeleton.js`)

Purpose:

- Render loading placeholders while data is being fetched/rendered.

Factory:

```js
import { createSkeleton } from "./js/ui/ui.skeleton.js";

const skeleton = createSkeleton(container, data, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `variant` | `"lines" \| "card" \| "grid"` | `"lines"` | no | Skeleton layout preset. |
| `animated` | `boolean` | `true` | no | Enables shimmer/animation. |
| `lines` | `number` | component default | no | Line count for `lines` variant. |
| `rows` | `number` | component default | no | Row count for `grid` variant. |
| `columns` | `number` | component default | no | Column count for `grid` variant. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders skeleton configuration. |
| `getState` | none | `object` | Returns skeleton state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Match the skeleton variant to the real layout so loading and loaded states feel related.
- Use restrained animation in dense dashboards where too many shimmering surfaces become distracting.

Related demos:

- `demos/demo.skeleton.html`

### `createFileInput(container, options)` (`js/ui/ui.file.input.js`)

Purpose:

- Collect selected, dropped, or pasted `File` objects with Helper-owned styling and filtering while the app owns upload, crop, queue, or persistence behavior.

Factory:

```js
import { createFileInput } from "./js/ui/ui.file.input.js";

const picker = createFileInput(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `accept` | `string` | `""` | no | Native input accept filter, also used for paste/drop filtering. |
| `multiple` | `boolean` | `false` | no | Allows multiple selected files. |
| `enableDrop` | `boolean` | `true` | no | Accepts dragged files on the control. |
| `enablePaste` | `boolean` | `true` | no | Accepts pasted files while the control is focused. |
| `preview` | `string` | `"none"` | no | Preview mode: `none`, `image`, `avatar`, or `icon`. |
| `previewUrl` | `string` | `""` | no | Existing preview image URL for avatar/photo controls. |
| `maxFiles` | `number` | `20` | no | Maximum accepted file count when `multiple` is enabled. |
| `maxFileSize` | `number` | `26214400` | no | Maximum bytes per file. |
| `icon` | `string` | `"data.upload"` | no | Shared icon id used by the browse action and icon preview fallback. |
| `onChange` | `(files, meta) => void` | `null` | no | Fires after selected files change. |
| `onError` | `(errors, meta) => void` | `null` | no | Fires for rejected files. |
| `onClear` | `(meta) => void` | `null` | no | Fires when the control is cleared. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | none | `void` | Opens the native file picker. |
| `clear` | `meta?` | `void` | Clears selected files. |
| `getFiles` | none | `File[]` | Returns the selected `File` objects. |
| `getState` | none | `object` | Returns serializable file summaries and current options. |
| `update` | `options` | `void` | Updates control options and rerenders. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Note:

- Use `ui.file.input` for avatars, record icons, and composer attachment intake. Use `ui.file.uploader` when Helper should own upload queue, progress, retry, cancel, or chunk/resume behavior.

Related demos:

- `demos/demo.file.input.html`

### `createFileUploader(container, options)` (`js/ui/ui.file.uploader.js`)

Purpose:

- Handle drag/drop or browse file intake with queue state, validation, and upload lifecycle hooks.

Factory:

```js
import { createFileUploader } from "./js/ui/ui.file.uploader.js";

const uploader = createFileUploader(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `accept` | `string` | `""` | no | Native input `accept` filter. |
| `multiple` | `boolean` | `true` | no | Allows multiple file selection. |
| `maxFiles` | `number` | component default | no | Maximum queued files. |
| `maxFileSize` | `number` | `0` | no | Maximum bytes per file. |
| `allowedTypes` | `string[]` | `[]` | no | Allowed MIME/prefix/extension filters. |
| `ariaLabel` | `string` | `""` | no | Root accessibility label. |
| `dropzoneAriaLabel` | `string` | `""` | no | Dropzone accessibility label. |
| `autoUpload` | `boolean` | `false` | no | Starts upload immediately after intake. |
| `smoothProgress` | `boolean` | `true` | no | Animates progress transitions. |
| `progressAnimationMs` | `number` | `220` | no | Progress animation duration. |
| `useChunkUpload` | `boolean` | `false` | no | Enables chunk/resume mode. |
| `chunkSize` | `number` | `1048576` | no | Chunk size in bytes. |
| `uploadKeyPrefix` | `string` | `"upload"` | no | Prefix for resume-state keys. |
| `dropText` | `string` | component default | no | Dropzone primary text. |
| `emptyText` | `string` | component default | no | Empty-queue copy. |
| `startText` | `string` | component default | no | Start-upload button text. |
| `clearText` | `string` | component default | no | Clear-queue button text. |
| `browseText` | `string` | component default | no | Browse button text. |
| `onUpload` | `(item, controls) => Promise<any>` | `null` | no | Basic async upload adapter. |
| `onChange` | `(state) => void` | `null` | no | Fires on queue state changes. |
| `onError` | `(error, item, state) => void` | `null` | no | Fires on upload/intake errors. |
| `onComplete` | `(state) => void` | `null` | no | Fires when queue completes. |

Chunk/resume hooks:

| Hook | Description |
|---|---|
| `onGetResumeState({ item, uploadKey, state })` | Returns persisted upload progress. |
| `onCreateUploadSession({ item, uploadKey, state, signal })` | Creates remote/local upload session. |
| `onUploadChunk(payload)` | Uploads an individual chunk. |
| `onPersistResumeState({ item, uploadKey, uploadedBytes, totalBytes, chunkIndex, totalChunks, session })` | Persists resume progress. |
| `onFinalizeUpload({ item, uploadKey, session, totalBytes, totalChunks, state, signal })` | Finalizes upload after chunks complete. |
| `onClearResumeState({ item, uploadKey, session })` | Clears stored resume state. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `addFiles` | `files` | `void` | Adds files into the queue. |
| `start` | none | `Promise<void>` | Starts upload flow. |
| `clear` | none | `void` | Clears the queue. |
| `update` | `nextOptions?` | `void` | Updates uploader options. |
| `remove` | `itemId` | `void` | Removes a queued item. |
| `retry` | `itemId` | `Promise<void>` | Retries a failed item. |
| `getState` | none | `object` | Returns queue state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Note:

- `ui.file.uploader` composes `ui.progress` per queued file row for consistent progress visuals and behavior.

Related demos:

- `demos/demo.file.uploader.html`

### `createMediaStrip(container, items, options)` (`js/ui/ui.media.strip.js`)

Purpose:

- Render image/video thumbs and open the shared standalone media viewer.
- Useful as the lightweight browsing surface paired with `createMediaViewer(...)`.

Factory:

```js
import { createMediaStrip } from "./js/ui/ui.media.strip.js";

const strip = createMediaStrip(container, items, options);
```

Recommended item shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable media identifier. |
| `type` | `"image" \| "video"` | Media type. |
| `src` | `string` | Full-size source URL. |
| `thumb` | `string` | Thumbnail URL. |
| `title` | `string` | Optional visible title/label. |
| `processing` | `boolean` | Optional pending-media flag. When `true`, image/video items survive normalization without `srcUrl` and render as non-clickable placeholders. |
| `processingLabel` | `string` | Optional short text shown on a pending placeholder card. |
| `tracks` / `textTracks` / `captionTracks` / `captions` | `array` | Optional video text tracks forwarded to `createMediaViewer(...)`. Track fields are `kind`, `src`/`url`/`path`, `srclang`/`lang`/`language`, `label`, and `default`. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `layout` | `"scroll" \| "wrap"` | `"scroll"` | no | Thumbnail layout mode. |
| `animationMs` | `number` | `300` | no | Transition duration. |
| `autoplay` | `boolean` | `false` | no | Autoplay video thumbs/viewer as supported. |
| `muted` | `boolean` | `false` | no | Starts media muted. |
| `loop` | `boolean` | `false` | no | Loops video playback. |
| `showControls` | `boolean` | `true` | no | Shows media controls where relevant. |
| `viewerAriaLabel` | `string` | `""` | no | Accessibility label passed to the viewer. |
| `viewerFit` | `"contain" \| "cover" \| "original"` | `"contain"` | no | Viewer fit mode. |
| `showViewerHeader` | `boolean` | `true` | no | Shows viewer header. |
| `showViewerFooter` | `boolean` | `true` | no | Shows viewer footer. |
| `showViewerCounter` | `boolean` | `true` | no | Shows viewer counter. |
| `showViewerClose` | `boolean` | `true` | no | Shows viewer close action. |
| `showViewerPrevNext` | `boolean` | `true` | no | Shows viewer prev/next controls. |
| `showViewerToolbar` | `boolean` | `true` | no | Shows viewer toolbar. |
| `showViewerAudiograph` | `boolean` | `false` | no | Shows audiograph for video items. |
| `viewerAudiographStyle` | `string` | `"neon"` | no | Audiograph render style forwarded to the delegated media viewer when `showViewerAudiograph` is enabled. |
| `baseUrl` | `string` | `""` | no | Base URL for relative media paths. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onOpen` | `(item, index)` | `void` | Fires when viewer opens from the strip. |
| `onClose` | `(item, index)` | `void` | Fires when viewer closes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Re-renders strip items/options. |
| `openById` | `id` | `void` | Opens a media item by id. |
| `openByIndex` | `index` | `void` | Opens a media item by index. |
| `getState` | none | `object` | Returns strip state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `ui.media.strip` now delegates full-view behavior to `ui.media.viewer` so zoom/pan/video viewing stays centralized in one component.
- Keep thumbnails lightweight; full-size assets belong in the viewer/player layer.
- Use `baseUrl` when items carry relative asset paths from app APIs.
- Pending image/video items with `processing: true` render a placeholder even without `srcUrl`, do not open the viewer while still processing, and can later resolve in place when the host calls `update(...)` with the same `id` plus real media URLs.
- Video caption/text tracks survive strip normalization and are rendered by the delegated viewer as native `<track>` elements.

Related demos:

- `demos/demo.media.strip.html`

### `createMediaViewer(container, options)` (`js/ui/ui.media.viewer.js`)

Purpose:

- Render a standalone modal/lightbox viewer for image/video items with transform-based zoom/pan.

Factory:

```js
import { createMediaViewer } from "./js/ui/ui.media.viewer.js";

const viewer = createMediaViewer(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `items` | `array` | `[]` | no | Media items available to the viewer. |
| `index` | `number` | `0` | no | Initial active item index. |
| `open` | `boolean` | `false` | no | Starts viewer open when `true`. |
| `fit` | `"contain" \| "cover" \| "original"` | `"contain"` | no | Fit mode for the active media. |
| `zoomStep` | `number` | component default | no | Zoom increment size. |
| `minZoom` | `number` | component default | no | Minimum zoom. |
| `maxZoom` | `number` | component default | no | Maximum zoom. |
| `wheelZoom` | `boolean` | `true` | no | Enables mouse-wheel zoom. |
| `pinchZoom` | `boolean` | `true` | no | Enables two-touch-pointer, midpoint-anchored zoom on the media viewport using `minZoom`/`maxZoom`; configurable through `update`. |
| `panWhenZoomed` | `boolean` | `true` | no | Enables panning while zoomed. |
| `loop` | `boolean` | `false` | no | Loops prev/next navigation. |
| `showHeader` | `boolean` | `true` | no | Shows header chrome. |
| `showFooter` | `boolean` | `true` | no | Shows footer chrome. |
| `showCounter` | `boolean` | `true` | no | Shows active-item counter. |
| `showClose` | `boolean` | `true` | no | Shows close control. |
| `showPrevNext` | `boolean` | `true` | no | Shows prev/next controls. |
| `showToolbar` | `boolean` | `true` | no | Shows zoom/fit toolbar. |
| `closeOnBackdrop` | `boolean` | `true` | no | Allows backdrop close. |
| `closeOnEscape` | `boolean` | `true` | no | Allows `Esc` close. |
| `trapFocus` | `boolean` | `true` | no | Keeps Tab/Shift+Tab focus inside the open viewer. |
| `ariaLabel` | `string` | `""` | no | Accessible viewer label. |
| `autoplayVideo` | `boolean` | `false` | no | Starts video playback automatically. |
| `mutedVideo` | `boolean` | `false` | no | Starts video muted. |
| `loopVideo` | `boolean` | `false` | no | Loops video playback. |
| `showVideoControls` | `boolean` | `true` | no | Shows native/custom video controls. |
| `showAudiograph` | `boolean` | `false` | no | Shows video audiograph when supported. |
| `audiographStyle` | `string` | component default | no | Audiograph render style. |
| `audiographSensitivity` | `number` | component default | no | Audiograph sensitivity multiplier. |
| `onOpen` | `(item, index) => void` | `null` | no | Fires when viewer opens. |
| `onChange` | `(item, index) => void` | `null` | no | Fires when active item changes. |
| `onClose` | `() => void` | `null` | no | Fires when viewer closes. |
| `onZoomChange` | `(state) => void` | `null` | no | Fires on zoom state changes. |

Touch gestures: `pinchZoom: true` suppresses browser pan/pinch only inside the media viewport. Header, toolbar, navigation and the surrounding page keep browser zoom behavior. Pinch works independently of `panWhenZoomed`; that option controls single-pointer panning, including after a pinch. With native video controls enabled, single-pointer gestures on the video remain native (no pan overlay); pinch then lift one finger to pan, or drag exposed viewport space. With controls disabled, direct media dragging is available. Native fullscreen video is browser/OS-owned and outside the inline viewer gesture contract. Physical Android/iOS validation is recommended; automated coverage uses Pointer Events and Chromium mobile touch emulation.

Media item track fields:

- `tracks`, `textTracks`, `captionTracks`, or `captions` may contain video text-track objects.
- Track `kind` accepts `subtitles`, `captions`, `descriptions`, `chapters`, or `metadata`; unknown kinds fall back to `captions`.
- Track `src`, `url`, or `path` is required and is resolved through `baseUrl` like media sources.
- Track language can be supplied as `srclang`, `lang`, or `language`; default is `en`.
- Track `label` / `title` and boolean `default` are rendered onto native `<track>` elements.

Accessibility:

- The open viewer traps Tab/Shift+Tab, restores focus on close, and keeps Escape close behavior when enabled.
- The focusable viewport exposes `role="group"` with an accessible name for Axe-compatible semantics.
- Explicit decorative image `alt: ""` is preserved on the rendered `<img>`; the viewer chrome still keeps the item title/counter for context and controls.

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | `index?` | `void` | Opens the viewer at a given index. |
| `close` | none | `void` | Closes the viewer. |
| `next` | none | `void` | Advances to the next item. |
| `prev` | none | `void` | Moves to the previous item. |
| `setIndex` | `index` | `void` | Sets the active item. |
| `zoomIn` | none | `void` | Increases zoom. |
| `zoomOut` | none | `void` | Decreases zoom. |
| `resetView` | none | `void` | Resets pan/zoom transforms. |
| `setFit` | `fit` | `void` | Updates fit mode. |
| `update` | `nextOptions?` | `void` | Updates viewer options/state. |
| `getState` | none | `object` | Returns viewer state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.media.viewer.html`

### `createPdfViewer(options)` / `createPdfViewer(container, options)` (`js/ui/ui.pdf.viewer.js`)

Purpose:

- Render a Helper-owned inline PDF viewer shell using browser-native PDF support.
- Suitable for signed same-origin PDFs where the app owns authorization, content delivery, validation, immutable hashes, and audit.
- Helper owns the responsive shell, focus return, Escape/backdrop/close controls, loading/error/unsupported states, theme behavior, and lifecycle methods.

Factory:

```js
import { createPdfViewer } from "./js/ui/ui.pdf.viewer.js";

const viewer = createPdfViewer({
  title: "Barangay Preparedness Guide",
  url: signedPdfUrl,
  initialPage: 2,
});

viewer.open();
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `url` | `string` | `""` | no | PDF URL supplied by the app. Prefer signed same-origin URLs. |
| `title` | `string` | `"PDF Viewer"` | no | Header title and PDF object label. |
| `initialPage` | `number \| string \| null` | `null` | no | Optional first page passed through the PDF URL fragment. |
| `open` | `boolean` | `false` | no | Starts viewer open when `true`. |
| `fullscreen` | `boolean` | `true` | no | Fullscreen shell by default; `false` uses a near-fullscreen window. |
| `closeOnEscape` | `boolean` | `true` | no | Allows `Esc` close. |
| `closeOnBackdrop` | `boolean` | `true` | no | Allows backdrop click close. |
| `showHeader` | `boolean` | `true` | no | Shows title/status header. |
| `showCloseButton` | `boolean` | `true` | no | Shows close control. |
| `trapFocus` | `boolean` | `true` | no | Keeps keyboard focus inside the viewer shell while open. |
| `loadingMessage` | `string` | component default | no | Status text while native PDF loading is pending. |
| `readyMessage` | `string` | `""` | no | Status text after the viewer considers the PDF ready. Blank by default to avoid persistent header noise. |
| `readyDelayMs` | `number` | `800` | no | Fallback delay for marking the viewer ready when browser-native PDF rendering does not emit a reliable iframe load signal. |
| `emptyMessage` | `string` | component default | no | Status text when no URL is set. |
| `unsupportedMessage` | `string` | component default | no | Fallback text when native inline PDF display is unavailable. |
| `errorMessage` | `string` | component default | no | Status text when the native iframe emits an error. |
| `onOpen` | `(state) => void` | `null` | no | Fires when viewer opens. |
| `onClose` | `(state) => void` | `null` | no | Fires when viewer closes. |
| `onLoad` | `(state) => void` | `null` | no | Fires when the native iframe emits `load` or the ready fallback completes. |
| `onError` | `(state) => void` | `null` | no | Fires when the native iframe emits `error`. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | `nextOptions?` | `viewer` | Opens the viewer, optionally patching options first. |
| `close` | `meta?` | `viewer` | Closes the viewer and restores focus. |
| `update` | `nextOptions` | `viewer` | Re-renders the viewer with updated options. |
| `getState` | none | `object` | Returns current viewer state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- V1 uses an inline `<iframe>` with browser-native PDF support instead of bundling a PDF renderer.
- Browser-native PDF viewers can render content without a dependable page-level load event, so Helper also uses `readyDelayMs` to leave the loading state after assigning a URL.
- Helper does not render a download action or fallback download link.
- Browser PDF plugins may still expose browser-owned controls; apps should rely on HTTP headers and signed URL policy for access control.

Related demos:

- `demos/demo.pdf.viewer.html`

### Audio UI

Use these together for call sessions, or individually for custom layouts.

- `createAudioPlayer`:
  - transport only (play/pause + clock + seek)
- `createAudioGraph`:
  - standalone graph with styles and mute control
- `createAudioTimeline`:
  - generic synchronized multi-track coordinator for arbitrary audio sources
- `createAudioCallSession`:
  - incident-media adapter with timestamp alignment and backward-compatible role tracks

Recommended integration flow:

1. Use `createAudioTimeline` when the app already has generic tracks and segments.
2. Use `createAudioCallSession` when the source data is an incident payload (`incident.media`, caller/operator names, call duration).
3. Use `onStateChange(state)` to sync external UI if needed.
4. Use `update(nextData, nextOptions?)` when refreshed media data arrives.

### `createDevicePrimer(container, data, options)` / `createDevicePrimerModal(data, options)`

Shared startup preflight helper for browser/device capability checks such as microphone, camera, geolocation, notifications, and audio playback readiness.

Supported V1 check kinds:

- `microphone`
- `camera`
- `geolocation`
- `speechSynthesis`
- `speechRecognition`
- `notifications`
- `audioPlayback`
- `mediaDevices`

Core methods:

- `runAll()`
- `runCheck(id)`
- `retryCheck(id)`
- `update(nextData, nextOptions?)`
- `getState()`
- `destroy()`

Options:

- `mode`
  - default: `"cards"`
  - `"compact"` renders an icon-only readiness strip, suppresses the summary panel, shows the selected check in a detail panel, applies a shimmer treatment while a check is running, and exposes retry/check from the detail panel for failed or blocked checks.

Modal preset notes:

- wraps the core helper inside a helper-owned action modal
- intended for page-load or pre-join readiness flows
- auto-runs by default unless the app explicitly disables it
- auto-closes by default once all checks complete, every required check is ready, and no checks failed; set `autoCloseOnReady: false` when the flow needs a final Continue/inspection step
- project code still owns blocking policy and what happens after success/failure
- `showSummary` is supported for both the inline helper and the modal wrapper
- compact mode suppresses the summary even when `showSummary` is true so the modal stays low-height
- the modal wrapper only renders `Retry Failed` when at least one check is currently retryable

## Notes

- This is a scaffold/prototype for testing flow.
- You can extend this with additional incident component helpers later while keeping the same API pattern.
- For maintainers integrating into any `*.pbb.ph` project, follow `docs/pbb-refactor-playbook.md` before refactoring contracts.

## Roadmap

### Current Stable Line: `v0.21.x`

- Latest documented release: `v0.21.70`
- All library modules now follow monotonic SemVer in release notes:
  - breaking API changes -> `major`
  - new components/features -> `minor`
  - fixes/docs/internal cleanup -> `patch`

### Next Planned Line: `v0.22.x`

- Dedicated accessibility hardening pass across all UI utilities
- Additional data-entry primitives (mask/format helpers, richer validation wrappers)
- Performance refinements for heavy demo pages (timeline/grid/audio)

## Changelog

For full release history, see `CHANGELOG.md`.

### Release Line Index

- `v0.19.x`
  - hierarchy map, real Cebu hierarchy sample generator, hierarchy demo
- `v0.18.x`
  - media viewer, modal action/header consistency, `ui.tree.grid` search, regression harnesses
- `v0.17.x`
  - accessibility hardening across interactive UI components and demos
- `v0.16.x`
  - `uiLoader`, toggle primitives, `ui.tree.grid`, `chrome: false` support
- `v0.15.x`
  - `ui.virtual.list`, `ui.scheduler`, uploader chunk/resume hooks
- `v0.14.x`
  - workflow/layout/data primitives, command-palette expansion, tree expansion
- `v0.13.x`
  - uploader baseline, timeline refinements, `ui.kanban`
- `v0.12.x`
  - `ui.command.palette`, `ui.tree`
- `v0.11.x`
  - `ui.timeline.scrubber`
- `v0.10.x`
  - `ui.timeline`
- `v0.9.x`
  - `ui.datepicker`, `createActionModal(...)`
- `v0.8.x`
  - `ui.toast`, `ui.select`
- `v0.7.x`
  - `ui.modal`, `ui.progress`
- `v0.6.x`
  - `ui.grid` virtualization and dedicated grid demo
- `v0.5.x`
  - navigation/menu refinements
- `v0.4.x`
  - navigation/menu utility layer
- `v0.3.x`
  - `ui.grid` baseline
- `v0.2.x`
  - audio UI layer
- `v0.1.x`
  - initial public prototype




### Incident editor label layout

`incident.types`, `incident.types.details.editor`, and `ui.field.group` accept
`fieldLayout: "horizontal"` (default: `"stacked"`; unknown values fall back to stacked).
The incident editor forwards the option to repeating groups. Direct Field Group
schemas may also use `config.fieldLayout`. Opt in through component options:

```js
const create = await uiLoader.get("incident.types");
const editor = create(host, incidents, {
  editable: true, categories, incidentTypes, removeIncidentType,
  fieldLayout: "horizontal",
});
editor.update(editor.getData(), { fieldLayout: "stacked" });
```

Horizontal mode places each field on its own row, with a 40/60 label/control split
when the local row container is at least 240px wide; narrower containers stack.
This applies inside repeat items and breakdowns, including schemas that normally
place several fields in a row. Group headings stay above their contents. Checkbox
labels keep their native click behavior. Values and validation remain unchanged;
the host still validates before submission/busy state. Refresh the loader, modular
sources/styles and generated UI bundle together (cache revision 0.21.231).

For a narrow workbench containing the complete `incident.types` wrapper, opt into
`fieldLayoutDensity: "compact"` alongside `fieldLayout: "horizontal"`. Compact pairs
use 35/65 columns and a 12px gap when the **usable row** is at least 220px wide,
otherwise stack. This fits the Vehicle Involved preset at 225px after wrapper
padding. Standard density stays 40/60 with a 16px gap and a 240px breakpoint.
Density passes through the complete editor into repeat groups and can be changed
with `update`. Unknown density values use standard. Field Group also accepts
`config.fieldLayoutDensity`. Refresh source, loader and UI bundles together at
revision 0.21.232. Demo selectors include a compact choice.

### Confirmation settlement and follow-up alerts

`uiConfirm` resolves only after its confirmation has closed, unmounted, and restored focus. Its result is still boolean. `onConfirm` returning literal `false` keeps the dialog open; throwing preserves inline error feedback. Return `{ close: true, value: false }` to close after a confirmed rejection without reporting success, or `{ close: true, value: true }` for success. Objects using either reserved settlement key (`close` or `value`) must provide both own properties, with `close: true` and a boolean `value`; malformed results keep the dialog open with an error. Other existing successful return values (including legacy objects without either key) retain their behavior. Pending handlers keep the existing busy and dismissal protections.

```js
let blocker = '';
const confirmed = await uiConfirm('Resolve this incident?', {
  confirmText: 'Resolve',
  onConfirm: async () => {
    const outcome = await requestResolution(); // Application validates the server response.
    if (outcome.confirmedRequirementRejection) {
      blocker = outcome.userFacingReason;
      return { close: true, value: false };
    }
    if (!outcome.confirmedSuccess) throw new Error('Check current status before trying again.');
    return true;
  },
});
if (blocker) await uiAlert(blocker, { title: 'Cannot resolve incident', variant: 'warning' });
if (confirmed) refreshResolvedIncident();
```

Keep confirmed rejection distinct from uncertain outcomes; this API does not retry requests. Cancellation returns `false` without invoking `onConfirm`. Awaiting the confirmation is sufficient to sequence the canonical draggable alert without timers or DOM inspection. Messages render as text. Local handlers remain local instead of being serialized through the workspace bridge; handler-free delegated confirmations settle when the host's complete confirmation has closed.

### Border-only action styling

Use `ui-actions-borderless` on a component ancestor, or on the application document body to include portalled dialogs. It covers canonical `.ui-button`, navbar items, incident buttons/remove/drawer-close actions and Field Group add/remove/move/breakdown actions. Complete confirm/alert/FormModal actions, dispatch/note actions and audio Play/Mute controls use those canonical classes. Use `ui-action-borderless` directly on an application-owned action, or through supported `action.className` / navbar `item.className` APIs. Class scope follows the DOM: delegated workspace dialogs require the opt-in on the host document too.

```html
<body class="ui-actions-borderless">
  <!-- Complete components keep their existing action variants. -->
  <button class="custom-action ui-action-borderless">Resume call</button>
</body>
```

The opt-in sets only action border color to transparent, retaining border width, hit targets, semantic backgrounds/text, opacity and disabled behavior. An explicit 2px focus-visible outline remains; customize its color with `--ui-action-focus-color`. Border color and focus outline intentionally use `!important` to win ordinary component/application normal, hover, active and disabled styles; do not counter them with application `!important` overrides. No generic button/input reset or broad border theme token is involved. Unmarked application actions and structural card/navigation containers remain unchanged; classify them before opting in. Input/select/textarea controls and card outlines are untouched. The existing `ui-button-borderless` transparent variant remains available with its original background and icon-size behavior.

### Modal focus during close

After a close is allowed, the canonical modal moves focus outside its closing subtree before setting `aria-hidden`. It restores a connected, available opener within the remaining foreground modal when applicable; otherwise it focuses that foreground panel or falls back to the document body. Closing a background modal does not steal focus from another active control/dialog. The closing subtree is inert until reopened, preventing focus from returning during the animation. There is no second focus restoration after unmount, so a newly opened dialog retains ownership. A vetoed close and existing busy dismissal guards remain unchanged; `uiConfirm` still settles only after unmount.

### Embedded audio session chrome

`createAudioTimeline` and `createAudioCallSession` accept `chrome: true` (default). Set `chrome: false` when a parent card supplies the frame. It removes borders, radii, backgrounds, shadows and padding from the outer session, player wrapper and track graph shell. Layout gaps, role labels, playback/seek/mute controls, focus indicators and processing/error feedback remain. Canvas styling is unchanged: `transparentBackground` independently controls graph/canvas transparency. Pass the current data to `update(data, {chrome:false})` to toggle; subsequent data-only updates retain the option. Playback and authorization policy are unchanged.

### Attachment-only composer submission

The default composer requires nonblank text. Set `allowAttachmentOnly: true` to also allow an attachment-only message. Pass initial `{attachmentCount: validatedItems.length}` as data, and call `composer.setAttachmentCount(validatedItems.length)` whenever your app-owned queue changes. This setter preserves input focus, draft text and active capture. `update({attachmentCount})` is also supported but follows the usual update/capture-cancellation behavior.

Only count attachments admitted by your application policy (including type, count and size limits). A positive safe integer count permits empty text; zero, negative, fractional and nonfinite counts do not. The composer does not own the queue or validate its contents through this count. `onSend({text})` is unchanged: read your current ordered attachment list there, validate before busy/submission, and retain the draft until confirmed success. `clear()` clears only text; reset the count when the queue is cleared. Server validation and partial/uncertain upload handling remain application responsibilities. Busy, disabled and pending capture states still block Send. Empty text plus no attachments is always rejected; an Emergency Report types-only form is a separate action.

### Audio player and attachment queue reference

The control-only `createAudioPlayer` accepts `compact: true` for a single-row player and `actions: [{id, label, icon, disabled, hidden, onClick}]` for additional buttons after Play. Action callbacks receive `(state, action)`; replace actions with `update({}, {actions})`. The consumer owns media playback and reports position/duration through `update`. Forward seeking uses short interpolation with reduced-motion support; backward seeks and large jumps update immediately. See `demos/demo.audio.player.html` for actual local-media wiring.

`createChatUploadQueue` uses compact players for audio `previewUrl` values and native first-frame video thumbnails unless an image `thumbUrl`/`posterUrl` is supplied. The application owns object URLs and upload transport. Update items with `status`, `progress` (0-100, or null for unknown), `progressLabel`, and `errorText`; progress/status-only updates with stable item IDs retain previews and shared progress instances. Structural updates and destruction release audio playback. See `demos/demo.chat.upload.queue.html` for standalone integration and simulated progress, and `demos/demo.chat.composer.html` for composer integration.

### Compact audio session playback

`createAudioCallSession(container, incident, {compact: true, chrome: false})` forwards `compact` through Audio Timeline to the shared Audio Player. `createAudioTimeline(container, data, {compact: true})` supports the same option. The default is `false`. Compact changes only the playback controls to the existing single-row layout; participant tracks, graphs, mute controls and processing feedback remain. `chrome` independently controls wrapper framing.

Use `await api.update(currentData, {compact: true})` to switch, or `compact: false` to restore full controls. Data-only updates retain the chosen option. Supply the current incident/timeline data: updates retain the existing rebuild behavior (pause/reset playback), not a live playback-preserving layout toggle. Both audio reference demos include a Compact playback toggle.

### Incident Types and Dispatch chrome

`incidentTypes(host, data, {chrome: false})` and `incidentTeamsAssignments(host, data, {chrome: false})` flatten decorative container frames, backgrounds and header separators. The default is `chrome: true`; only explicit `false` disables it. Parent options propagate to all owned editor/viewer rows, including rows added later. The four standalone details/assignment editor/viewer factories accept the same option.

Call `api.update(api.getData(), {chrome: false})` to change it; data-only updates and list replacement retain the setting, and explicit `true` restores default decoration. Focused editor synchronization also applies chrome without discarding draft values. Padding, gaps, input borders, buttons, focus/validation messages, required/error badges, busy feedback and dispatch status indicators remain. Existing field-group/property-viewer label conventions are unchanged; only decorative nested group shells are flattened. Drawers and separate dialogs retain their own chrome. This is not a compact-spacing or borderless-input option.

The UI loader includes `css/incident/incident.chrome.css`; manual modular consumers must load it alongside their existing incident/component styles. No application-scoped CSS workaround is required. See the Incident Types and Team Assignments reference demos for the option contract.
