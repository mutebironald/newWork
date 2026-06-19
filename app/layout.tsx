import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewWork — AI-Native Workforce Activation",
  description:
    "Create, distribute, verify, measure, and report real economic opportunities for underserved workers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var basePath = "${process.env.NEXT_PUBLIC_BASE_PATH || ''}";
                if (basePath && typeof window !== 'undefined') {
                  var originalFetch = window.fetch;
                  window.fetch = function(input, init) {
                    if (typeof input === 'string' && input.startsWith('/api/')) {
                      return originalFetch(basePath + input, init);
                    }
                    return originalFetch(input, init);
                  };
                }
              })();
            `
          }}
        />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
