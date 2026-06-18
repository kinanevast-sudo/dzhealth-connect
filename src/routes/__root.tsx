import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "../lib/i18n";
import { hydrateLanguageFromCloud } from "../lib/i18n";
import { OfflineScreen } from "../components/OfflineScreen";
import { supabase } from "../integrations/supabase/client";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <p className="mt-3 text-muted-foreground">{t("root.not_found")}</p>
        <Link to="/" className="mt-6 inline-flex rounded-full gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground neon-glow">
          {t("root.back_home")}
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation();
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">{t("root.error_occurred")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("root.error_message")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            {t("root.retry")}
          </button>
          <a href="/" className="rounded-full border border-border bg-surface px-5 py-2 text-sm">{t("root.home")}</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0b1426" },
      { title: "DzHealth — الرعاية الصحية في الجزائر" },
      { name: "description", content: "كل الخدمات الصحية في الجزائر في مكان واحد: أطباء، مستشفيات، صيدليات، متبرعون بالدم." },
      { property: "og:title", content: "DzHealth — الرعاية الصحية في الجزائر" },
      { property: "og:description", content: "كل الخدمات الصحية في الجزائر في مكان واحد: أطباء، مستشفيات، صيدليات، متبرعون بالدم." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "DzHealth — الرعاية الصحية في الجزائر" },
      { name: "twitter:description", content: "كل الخدمات الصحية في الجزائر في مكان واحد: أطباء، مستشفيات، صيدليات، متبرعون بالدم." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qyoP882yo4WcnQiJ8nvzVGVloDF3/social-images/social-1781303843814-1000043229.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qyoP882yo4WcnQiJ8nvzVGVloDF3/social-images/social-1781303843814-1000043229.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-512.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const t = (typeof localStorage !== "undefined" && localStorage.getItem("dzhealth-theme")) || "dark";
    if (t === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
    hydrateLanguageFromCloud();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") hydrateLanguageFromCloud();
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineScreen>
        <div id="app-frame">
          <Outlet />
        </div>
      </OfflineScreen>
      <Toaster position="top-center" theme="dark" richColors />
    </QueryClientProvider>
  );
}
