import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import communityData from '@/content/community.json'
import { AuthProvider } from '@/context/AuthContext'
import { FlagsProvider } from '@/context/FlagsContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { SettingsProvider } from '@/context/SettingsContext'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: communityData.name,
  description: communityData.description,
}

// Applied before React hydrates, so dark-mode users don't see a white flash.
const themeNoFlash = `
(function(){try{
  var c = localStorage.getItem('alma-theme') || 'system';
  var dark = c === 'dark' || (c === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var r = document.documentElement;
  r.dataset.theme = dark ? 'dark' : 'light';
  if (dark) r.classList.add('dark');
}catch(e){}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlash }} />
      </head>
      <body className="font-body bg-surface-secondary text-body antialiased">
        <ThemeProvider>
          <AuthProvider>
            <FlagsProvider>
              <SettingsProvider>
                {children}
              </SettingsProvider>
            </FlagsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
