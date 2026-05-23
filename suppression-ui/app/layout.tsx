import type { Metadata } from "next";
import { Rubik, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { ThemeProvider } from "@/lib/themeContext";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "EmailCore Command Center",
  description: "Internal email campaign management dashboard — create, deploy, monitor, and optimize email campaigns.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('app-theme');
                  var theme = stored || 'system';
                  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
                    theme = 'system';
                  }
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}

                try {
                  var basePath = "${process.env.NEXT_PUBLIC_BASE_PATH || ""}";
                  if (basePath && window.fetch) {
                    var originalFetch = window.fetch;
                    window.fetch = function(input, init) {
                      if (typeof input === "string" && input.startsWith("/") && !input.startsWith(basePath)) {
                        input = basePath + input;
                      }
                      return originalFetch(input, init);
                    };
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`
          ${rubik.variable}
          ${jetbrainsMono.variable}
          font-sans
          antialiased
          bg-background
          text-foreground
        `}
      >
        {/* Glow Blobs */}
        <div className="glow-blob bg-primary top-[-100px] left-[-100px] w-[400px] h-[400px] animate-drift" />
        <div className="glow-blob bg-cyan bottom-[-100px] right-[-100px] w-[400px] h-[400px] animate-drift delay-[-10s]" />
        
        {/* Grid Background */}
        <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none z-0" />

        <div className="relative z-10 flex h-screen overflow-hidden">
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}