# ONE FOR ALL visual system

Current direction: a charcoal workbench with the user's sculpture recording as the central visual. The latest user revision removes the technology pattern entirely: the canvas is plain space black across every route. See [CHANGE_REPORT.md](CHANGE_REPORT.md), [THEME_REFRESH.md](THEME_REFRESH.md) and [VIDEO_ASSET.md](VIDEO_ASSET.md) for the current revision, assets and verification.

| Token | Value / application |
| --- | --- |
| Canvas | #030407; solid space black, no background image |
| Surface | #090C12; subtle dark forms, readers and task panels |
| Text | #F0F3F5; headings / body emphasis |
| Muted | #B7C0C9; explanatory text |
| Mint | #96DCC8; primary action and visible focus |
| Button ink | #102A25; dark text on mint actions |
| Warning | #F1CE91; wait, concern, review |
| Danger | #F2A8AE; refusal / destructive explanation |
| Line | #3A4249; grouping separators |

Manrope variable: headings, 15/18/24/30px with deliberate weights. DM Sans variable: reading and UI, 12–16px; small nonessential annotations 10–12px. Both fonts are self-hosted packages. Mobile input text is 16px. Prose measure targets 65–75 characters. Tabular data remains semantic with horizontally scrollable tables; essential controls stay outside tables.

Spacing uses 4/8px rhythm with 18/20/24px contextual gutters. Inputs use 6–7px radii, larger panels 10–12px, statuses pills. Desktop sidebar 232px, full-width workbench with 1.7:1 voice/browser split; tablet collapses workspace; mobile uses a modal nav drawer plus five quick links and safe-area clearance. Controls use visible focus rings, semantic disabled states and icons plus text for warnings/status.

The previous CSS orb has been removed. The current `VoiceVideo` component displays a still poster while idle and starts the prepared, muted recording directly inside the orb click or an F1/F2 keypress, without a state round-trip. The hero clip is preloaded ahead of the gesture so the first frame appears immediately, plays at 1.2× (20% faster than the source), and keeps looping until F1/F2 is pressed again (or the visible pause control), even after it scrolls out of view; hidden tabs pause it. The source is a verified seamless loop (identical boundary frame), so the motion has no visible end or restart. It is visual playback, not a microphone, waveform or speech-state signal. Reduced-motion users start with a still poster and retain explicit playback controls. The 4K asset is an upscale of the compressed recording; no recovered-detail or native-4K claim is made. Local video processing uses `imageio-ffmpeg==0.8.1` in the project `.venv`.

Buttons, input, textarea, badges, tabs, switch, checkbox and Dialog are actual shadcn/ui components installed by CLI. Radix Dialog provides focus trapping, Escape and focus restoration. Backend panels are scrollable with stable close controls and all nine documentation fields. Lists/tables use rows rather than identical decorative cards.

Historical foundation: frontend-design guided the first workbench direction, and ui-ux-pro-max returned a flat teal productivity recommendation plus relevant Next.js/modal guidance. `design-system/one-for-all/MASTER.md` preserves that earlier recommendation; it is not the current palette. The user's later dark-background and supplied-video request overrides the earlier light theme. The current tokens and behavior are documented above and in `THEME_REFRESH.md`; current verification belongs in `CHANGE_REPORT.md`.
