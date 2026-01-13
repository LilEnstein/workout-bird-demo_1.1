'use client';

import { useRef } from 'react';
import MotionSensor from '@/components/MotionSensor';
import GameCanvas, { GameHandle } from '@/components/GameCanvas';

export default function Home() {
  const gameRef = useRef<GameHandle>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">Head Flappy Bird (Pro Mode)</h1>
      
      <div className="flex flex-col md:flex-row gap-10 items-start">
        <div className="flex flex-col items-center">
          <GameCanvas ref={gameRef} />
          <button onClick={() => gameRef.current?.resetGame()} className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full font-bold text-white shadow-lg">CHƠI LẠI</button>
        </div>

        <div className="flex flex-col items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold mb-3 text-blue-400">Camera Điều Khiển</h2>
          
          <MotionSensor 
            onJump={() => gameRef.current?.birdJump()} 
            onDive={() => gameRef.current?.birdDive()} 
          />
          
          <div className="mt-4 text-sm text-gray-400 text-center max-w-[250px]">
            <p>ℹ️ <b>Luật chơi mới:</b></p>
            <ul className="text-left list-disc pl-4 space-y-1">
              <li>Mũi qua vạch <span className="text-green-500">XANH</span>: <b>Bay lên</b></li>
              <li>Mũi ở giữa: <b>Rơi tự do</b></li>
              <li>Mũi qua vạch <span className="text-red-500">ĐỎ</span>: <b>Lao xuống nhanh</b></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}