import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // We have added this line

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()], // & We have added tailwindcss() here
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'https://api.jackrabbitrecords.net',
                changeOrigin: true,
            },
        },
    },
})