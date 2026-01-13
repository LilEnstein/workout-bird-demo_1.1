'use client';

import { useRef, useState } from 'react';
import MotionSensor from '@/components/MotionSensor';
import GameCanvas, { GameHandle, ThemeType } from '@/components/GameCanvas';

export default function Home() {
  const gameRef = useRef<GameHandle>(null);
  
  // State quản lý theme
  const [theme, setTheme] = useState<ThemeType>('space');

  // Danh sách theme để render nút chọn
  const themes: { id: ThemeType; name: string; icon: string; color: string }[] = [
    { id: 'space', name: 'Vũ Trụ', icon: '🌌', color: 'bg-indigo-900' },
    { id: 'tet', name: 'Tết', icon: '🧧', color: 'bg-red-600' },
    { id: 'christmas', name: 'Noel', icon: '🎄', color: 'bg-green-700' },
    { id: 'field', name: 'Cánh Đồng', icon: '🌾', color: 'bg-blue-400' },
    { id: 'forest', name: 'Rừng Núi', icon: '🌲', color: 'bg-emerald-800' },
    { id: 'sea', name: 'Biển', icon: '🌊', color: 'bg-blue-600' },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-white">
      
      <h1 className="mb-4 text-2xl font-bold text-yellow-400 md:text-3xl lg:text-4xl">
        Head Flappy Bird (AI)
      </h1>

      {/* --- MENU CHỌN THEME --- */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => {
                setTheme(t.id);
                // Reset game khi đổi theme cho nó fresh
                gameRef.current?.resetGame();
            }}
            className={`
                px-3 py-1.5 rounded-full border border-gray-600 text-xs md:text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1
                ${theme === t.id ? `${t.color} ring-2 ring-white shadow-lg` : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}
            `}
          >
            <span>{t.icon}</span> {t.name}
          </button>
        ))}
      </div>
      
      {/* MAIN CONTAINER */}
      <div className="flex w-full max-w-6xl flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
        
        {/* KHUNG GAME */}
        <div className="flex flex-col items-center order-1"> 
          {/* Truyền theme vào GameCanvas */}
          <GameCanvas ref={gameRef} currentTheme={theme} />
          
          <button 
            onClick={() => gameRef.current?.resetGame()} 
            className="mt-6 w-full md:w-auto rounded-full bg-red-600 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95"
          >
            CHƠI LẠI
          </button>
        </div>

        {/* KHUNG CAMERA */}
        <div className="order-2 flex w-full max-w-md flex-col items-center rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-2xl md:w-auto">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">Camera Điều Khiển</h2>
          <MotionSensor 
            onJump={() => gameRef.current?.birdJump()} 
            onDive={() => gameRef.current?.birdDive()} 
          />
          <div className="mt-4 w-full text-sm text-gray-400">
            <p className="mb-2 text-center">ℹ️ <b>Luật chơi:</b></p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Mũi qua vạch <span className="font-bold text-green-500">XANH</span>: <b>Bay lên</b></li>
              <li>Mũi ở giữa: <b>Rơi tự do</b></li>
              <li>Mũi qua vạch <span className="font-bold text-red-500">ĐỎ</span>: <b>Lao xuống</b></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}