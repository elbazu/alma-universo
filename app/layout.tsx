import type { Metadata } from 'next'
import './globals.css'
import communityData from '@/content/community.json'
import { AuthProvider } from '@/context/AuthContext'
import { FlagsProvider } from '@/context/FlagsContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { CommunityDataProvider } from '@/context/CommunityDataContext'
import { CommunitySettingsProvider } from '@/context/CommunitySettingsContext'
import { ProfileProvider } from '@/context/ProfileContext'
import { LanguageProvider } from '@/context/LanguageContext'

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
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlash }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Cinzel:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-surface-secondary text-body antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ProfileProvider>
                <FlagsProvider>
                  <CommunityDataProvider>
                    <SettingsProvider>
                      <CommunitySettingsProvider>
                        {children}
                      </CommunitySettingsProvider>
                    </SettingsProvider>
                  </CommunityDataProvider>
                </FlagsProvider>
              </ProfileProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
