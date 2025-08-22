import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        VitePWA({
			base: '/student-picker/',
            registerType: 'autoUpdate',
            manifest: {
                name: 'دستیار هوشمند معلم',
                short_name: 'دستیار معلم',
                description: 'یک ابزار تحت وب مدرن و هوشمند برای کمک به معلمان در مدیریت کلاس، ثبت دقیق فعالیت‌ها و انتخاب عادلانه دانش‌آموزان.',
                theme_color: '#007bff',
                icons: [
                    {
                        src: 'images/icon-192.png', // The path is relative to the public folder
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'images/icon-512.png', // Make sure you have a 512x512 icon in public/images for full PWA support
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                // This tells the service worker to cache all generated assets, including your web fonts.
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
            }
        })
    ]
});