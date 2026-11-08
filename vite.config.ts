import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative assets work both at the domain root and under /the-go-room/.
  base: './',
  plugins: [
    react(),
    {
      name: 'release-notices',
      generateBundle() {
        for (const [source, fileName] of [
          ['LICENSE', 'LICENSE.txt'],
          ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
        ]) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: readFileSync(new URL(source, import.meta.url), 'utf8'),
          })
        }
      },
    },
  ],
  build: {
    license: { fileName: 'third-party-licenses.md' },
    rolldownOptions: {
      output: {
        postBanner: '/* Licenses: LICENSE.txt, THIRD_PARTY_NOTICES.md and third-party-licenses.md in the site root. */',
      },
    },
  },
})
