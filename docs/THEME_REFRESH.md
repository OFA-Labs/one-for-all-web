# ONE FOR ALL - black-and-white theme

The current direction uses a pitch-black canvas and white accents across the whole website. Blue-green controls, colored navigation, and status colors have been replaced with white and neutral grays. The History calendar uses the same dark palette. No decorative pattern or gradient is used.

| Role | Color |
| --- | --- |
| Whole-page canvas and navigation | `#000000` |
| Panels, dialogs and forms | `#0a0a0a` |
| Raised neutral surface | `#121212` |
| Input surface | `#080808` |
| Main text and interactive accents | `#ffffff` |
| Secondary text | `#bdbdbd` |
| Primary-button ink | `#000000` |
| Borders | `#404040` |

Sidebar, header, footer, mobile navigation and the navigation dialog share the black canvas. Cards, browser previews, dialogs, authentication, Reader and History use subtle neutral surfaces for contrast. Status labels and icons continue to describe warnings, errors and successful sample states without relying on color.

The opening orb is one-tenth of its previous width and height, centered precisely in the viewport. Its visual is `min(7.8vmin, 64px)`, or `min(8.6vmin, 64px)` below 700px, with a minimum 44px button target. The white “Tap to speak” label sits underneath without changing the orb's center.

The sculpture video remains square with `object-fit: cover`, `mix-blend-mode: screen`, and `filter: grayscale(1)`. Playback remains controlled by the component: tapping opens the workspace and plays the animation; explicit controls and F1/F2 retain their existing behavior. No microphone integration was changed.
