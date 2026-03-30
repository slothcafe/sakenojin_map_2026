import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const githubPagesBase = '/sakenojin_map_2026/'

// https://vite.dev/config/
export default defineConfig({
    base: githubPagesBase,
    plugins: [vue(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',

            manifest: {
                name: '酒の陣 めぐり帖',
                short_name: '酒の陣 めぐり帖',
                description: '酒の陣 会場ガイドアプリ',
                theme_color: '#1a1f3a',
                background_color: '#1a1f3a',
                display: 'standalone',
                orientation: 'portrait',
                start_url: githubPagesBase,
                scope: githubPagesBase,
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },

            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
            }
        })
    ]
})
