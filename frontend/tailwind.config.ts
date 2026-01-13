import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Quét class trong các thư mục này để generate CSS
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // --- CẤU HÌNH FONT PIXEL TẠI ĐÂY ---
      fontFamily: {
        // 'pixel' là tên class em sẽ dùng (font-pixel)
        // 'var(--font-pixel)' là biến em đã khai báo bên layout.tsx
        pixel: ['var(--font-pixel)', 'monospace'], 
      },
    },
  },
  plugins: [],
};
export default config;