import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@/styles/globals.css";
import { AppProvider } from "@/app/providers/app-provider";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { Shell } from "@/components/layout/shell";
// Deep import on purpose: the settings barrel would pull the whole Settings
// page (and its CSS) into the root layout bundle for every route.
import { DictationProvider } from "@/features/settings/components/dictation/dictation-provider";
export const metadata: Metadata = {
  title: {
    default: "ONE FOR ALL — A little less busywork",
    template: "%s · ONE FOR ALL",
  },
  description:
    "A frontend-only preview of a voice-first assistant. Talk it through, see the plan, keep the final say.",
  robots: { index: false, follow: false },
};

// Apply the stored theme before first paint so returning users never see a
// flash of the default theme. The provider then syncs React state to the DOM.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('one-for-all-theme');document.documentElement.dataset.theme=(t==='obsidian'||t==='aurora')?t:'obsidian'}catch(e){document.documentElement.dataset.theme='obsidian'}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="obsidian" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>
          <AppProvider>
            <DictationProvider>
              <Shell>{children}</Shell>
            </DictationProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
