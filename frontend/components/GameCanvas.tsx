'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

// Định nghĩa các loại Theme
export type ThemeType = 'space' | 'tet' | 'christmas' | 'field' | 'forest' | 'sea';

export interface GameHandle {
  birdJump: () => void;
  birdDive: () => void;
  resetGame: () => void;
}

interface GameCanvasProps {
  currentTheme: ThemeType; // Nhận theme từ bên ngoài
}

const GameCanvas = forwardRef<GameHandle, GameCanvasProps>(({ currentTheme }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // --- CẤU HÌNH GAME ---
  const birdY = useRef(200);
  const birdVelocity = useRef(0);
  const birdGravity = 0.4;
  const jumpStrength = -6;
  const diveStrength = 4;
  
  const pipes = useRef<{ x: number; gapTop: number; passed: boolean }[]>([]);
  const pipeWidth = 60;
  const pipeGap = 160;
  const pipeSpeed = 2.5;

  const gameLoopRef = useRef<number | null>(null);
  const isRunning = useRef(true);
  const scoreRef = useRef(0);

  // --- HÀM VẼ THEO THEME ---

  const getThemeColors = (theme: ThemeType) => {
    switch (theme) {
      case 'tet': // Tết: Đỏ/Vàng
        return { pipeBody: '#FFD700', pipeBorder: '#FF0000', pipeOutline: '#FF4500' }; // Ống vàng viền đỏ
      case 'christmas': // Giáng sinh: Đỏ/Trắng
        return { pipeBody: '#FFFFFF', pipeBorder: '#FF0000', pipeOutline: '#006400' }; // Ống trắng sọc đỏ
      case 'field': // Cánh đồng
        return { pipeBody: '#76c893', pipeBorder: '#34a0a4', pipeOutline: '#1a759f' };
      case 'forest': // Rừng núi
        return { pipeBody: '#588157', pipeBorder: '#3a5a40', pipeOutline: '#344e41' };
      case 'sea': // Biển
        return { pipeBody: '#0077b6', pipeBorder: '#023e8a', pipeOutline: '#03045e' };
      case 'space': // Vũ trụ
      default:
        return { pipeBody: '#228B22', pipeBorder: '#006400', pipeOutline: '#00FF00' };
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: ThemeType) => {
    let gradient;
    switch (theme) {
      case 'tet': // Nền Đỏ may mắn + Hoa mai vàng
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#ff9a9e"); gradient.addColorStop(1, "#fecfef");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Vẽ chấm hoa mai
        ctx.fillStyle = "#FFD700";
        for(let i=0; i<10; i++) ctx.fillRect(Math.random()*width, Math.random()*height, 4, 4);
        break;

      case 'christmas': // Nền Xanh đêm tuyết
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#000428"); gradient.addColorStop(1, "#004e92");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Vẽ tuyết rơi
        ctx.fillStyle = "#FFF";
        for(let i=0; i<15; i++) ctx.fillRect(Math.random()*width, Math.random()*height, 3, 3);
        break;

      case 'field': // Nền trời xanh mây trắng
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#87CEEB"); gradient.addColorStop(1, "#E0F7FA");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;

      case 'forest': // Nền rừng chiều tà
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#134E5E"); gradient.addColorStop(1, "#71B280");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;
      
      case 'sea': // Nền biển sâu
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#006994"); gradient.addColorStop(1, "#001e36");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Bong bóng
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        for(let i=0; i<5; i++) { ctx.beginPath(); ctx.arc(Math.random()*width, Math.random()*height, 5, 0, Math.PI*2); ctx.stroke(); }
        break;

      case 'space': // Vũ trụ
      default:
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#0f0c29"); gradient.addColorStop(0.5, "#302b63"); gradient.addColorStop(1, "#24243e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Sao
        ctx.fillStyle = "#FFF";
        for(let i=0; i<10; i++) ctx.fillRect(Math.random()*width, Math.random()*height, 2, 2);
        break;
    }
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isTop: boolean, theme: ThemeType) => {
    const colors = getThemeColors(theme);
    
    // Gradient cho ống
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, colors.pipeBorder);
    grad.addColorStop(0.5, colors.pipeBody);
    grad.addColorStop(1, colors.pipeBorder);
    
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Nắp ống
    ctx.fillStyle = colors.pipeOutline;
    const capHeight = 20;
    if (isTop) ctx.fillRect(x - 2, y + h - capHeight, w + 4, capHeight);
    else ctx.fillRect(x - 2, y, w + 4, capHeight);

    // Viền
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, y: number) => {
    const x = 50;
    // ... (Code vẽ chim giữ nguyên như cũ hoặc tùy biến) ...
    // Để code ngắn gọn, anh giữ nguyên logic vẽ chim cũ, em có thể paste lại đoạn drawBird cũ vào đây
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFFF00";
    const gradient = ctx.createRadialGradient(x, y, 5, x, y, 15);
    gradient.addColorStop(0, "#FFF"); gradient.addColorStop(1, "#FFD700");
    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(x + 5, y - 3, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); // Kính
    ctx.restore();
  };

  // --- GAME LOOP ---
  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isRunning.current) {
      birdVelocity.current += birdGravity;
      birdY.current += birdVelocity.current;

      if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < canvas.width - 250) {
        const minH = 50; const maxH = canvas.height - pipeGap - minH;
        const gapTop = Math.random() * (maxH - minH) + minH;
        pipes.current.push({ x: canvas.width, gapTop, passed: false });
      }

      pipes.current.forEach(pipe => {
        pipe.x -= pipeSpeed;
        if (!pipe.passed && pipe.x + pipeWidth < 50) {
            scoreRef.current += 1; setScore(scoreRef.current); pipe.passed = true;
        }
        // Logic va chạm
        const birdL=35, birdR=65, birdT=birdY.current-15, birdB=birdY.current+15;
        const pipeL=pipe.x, pipeR=pipe.x+pipeWidth;
        if (birdR > pipeL && birdL < pipeR) {
            if (birdT < pipe.gapTop || birdB > pipe.gapTop + pipeGap) gameOver();
        }
      });

      if (pipes.current.length > 0 && pipes.current[0].x < -pipeWidth) pipes.current.shift();
      if (birdY.current > canvas.height - 15 || birdY.current < 15) gameOver();
    }

    // VẼ TẤT CẢ
    drawBackground(ctx, canvas.width, canvas.height, currentTheme); // Truyền theme vào
    pipes.current.forEach(p => {
        drawPipe(ctx, p.x, 0, pipeWidth, p.gapTop, true, currentTheme);
        drawPipe(ctx, p.x, p.gapTop + pipeGap, pipeWidth, canvas.height - (p.gapTop + pipeGap), false, currentTheme);
    });
    drawBird(ctx, birdY.current);

    gameLoopRef.current = requestAnimationFrame(loop);
  };

  const gameOver = () => {
    isRunning.current = false; setIsGameOver(true);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  };

  useImperativeHandle(ref, () => ({
    birdJump: () => { if (isRunning.current) birdVelocity.current = jumpStrength; },
    birdDive: () => { if (isRunning.current) birdVelocity.current = diveStrength; },
    resetGame: () => {
      birdY.current = 200; birdVelocity.current = 0; pipes.current = [];
      scoreRef.current = 0; setScore(0);
      isRunning.current = true; setIsGameOver(false);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      loop();
    }
  }));

  useEffect(() => {
    loop();
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme]); // Re-run khi đổi theme

  return (
    <div className="relative rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl">
      <canvas ref={canvasRef} width={400} height={500} className="block w-full md:w-[400px]" />
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <span className="text-4xl text-white drop-shadow-md font-bold font-mono">{score}</span>
      </div>
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
            <h2 className="text-3xl text-red-500 mb-2 font-bold">GAME OVER</h2>
            <p className="text-4xl text-yellow-400 mb-4 font-bold">{score}</p>
        </div>
      )}
    </div>
  );
});

GameCanvas.displayName = "GameCanvas";
export default GameCanvas;