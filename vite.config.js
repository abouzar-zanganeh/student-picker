import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

// Read package.json to get the version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
    
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'دستیار هوشمند معلم',
                short_name: 'دستیار معلم',
                description: 'یک ابزار تحت وب مدرن و هوشمند برای کمک به معلمان در مدیریت کلاس، ثبت دقیق فعالیت‌ها و انتخاب عادلانه دانش‌آ-آموزان.',
                theme_color: '#007bff',
                icons: [
                    {
                        src: 'images/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'images/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
            }
        })
    ]
});