import "styles/globals.css"
import type { Metadata } from "next"

import { TamaguiProviderWrapper } from "lib/tamagui"

export const metadata: Metadata = {
  title: "Needed | Find Trusted Local Pros Near You Fast",
  description: "Need local services fast? Tell us what you need and when. Needed sends your request to up to 3 trusted pros near you who can contact you within minutes. Free to use.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme');var preferred=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var theme=(stored==='dark'||stored==='light')?stored:preferred;document.documentElement.classList.add(theme);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <div id="app-root">
          <TamaguiProviderWrapper>{children}</TamaguiProviderWrapper>
        </div>
      </body>
    </html>
  )
}
