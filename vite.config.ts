import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// μATOM-0902: 빌드 시점 VAPID 키 체크
if (process.env.NODE_ENV === 'production' && !process.env.VITE_FCM_VAPID_KEY) {
  console.warn('\n⚠️  [WARNING] VITE_FCM_VAPID_KEY가 설정되지 않았습니다. 프로덕션 푸시 알림이 작동하지 않습니다.\n');
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
})
