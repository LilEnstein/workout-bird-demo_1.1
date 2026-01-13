import type { Metadata } from "next";
// 1. Import font từ Google
import { Inter, Press_Start_2P } from "next/font/google"; 
import "./globals.css";

// Cấu hình font mặc định (Inter)
const inter = Inter({ subsets: ["latin"] });

// 2. Cấu hình Font Pixel (Retro)
const pressStart2P = Press_Start_2P({
  weight: "400",          // Font này chỉ có weight 400
  subsets: ["latin"],
  variable: "--font-pixel", // Đặt tên biến CSS để lát dùng trong Tailwind
});

export const metadata: Metadata = {
  title: "Head Flappy Bird (AI)",
  description: "Trò chơi điều khiển bằng đầu sử dụng AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Nhúng biến font vào body để dùng toàn app */}
      <body className={`${inter.className} ${pressStart2P.variable}`}>
        {children}
      </body>
    </html>
  );
}