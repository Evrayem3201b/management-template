
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import {
  TanStackRouterDevtoolsPanel,
} from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { AppSidebar } from "#/components/app-sidebar";
import { Providers } from "#/components/providers";
import {
  SidebarInset,
  SidebarProvider,
} from "#/components/ui/sidebar";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Siyana" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>

      <body className="min-h-screen font-sans antialiased">
        <SidebarProvider>
          <Providers>
            <AppSidebar />

            <SidebarInset className="min-w-0">
              <Header />
              <main className="min-w-0 flex-1">{children}</main>
              <Footer />
            </SidebarInset>
          </Providers>

          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
              {
                name: "TanStack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </SidebarProvider>

        <Scripts />
      </body>
    </html>
  );
}
