'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

export interface GameHandle {
  birdJump: () => void;
  birdDive: () => void; // Thêm hàm này
  resetGame: () => void;
}

const GameCanvas = forwardRef<GameHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // --- PHYSICS CONFIG ---
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -8;
  const DIVE_STRENGTH = 8; // Lực lao xuống
  const PIPE_SPEED = 4;
  const PIPE_SPAWN_RATE = 100;
  const BIRD_SIZE = 20;

  const gameState = useRef({
    birdY: 200,
    velocity: 0,
    pipes: [] as { x: number; y: number; width: number; height: number; passed: boolean }[],
    frameCount: 0,
    isPlaying: false
  });

  const spawnPipe = (canvasWidth: number, canvasHeight: number) => {
    const gap = 140; 
    const minPipeHeight = 50;
    const maxPipeHeight = canvasHeight - gap - minPipeHeight;
    const pipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
    return { x: canvasWidth, y: 0, width: 50, height: pipeHeight, passed: false };
  };

  useImperativeHandle(ref, () => ({
    birdJump: () => {
      if (isGameOver) return;
      
      if (!gameState.current.isPlaying) {
        // Start Game
        gameState.current.isPlaying = true;
        setIsGameStarted(true);
        // Tạo luôn ống đầu tiên cho trực quan
        if (canvasRef.current) {
            const p = spawnPipe(canvasRef.current.width, canvasRef.current.height);
            p.x = 400; 
            gameState.current.pipes.push(p);
        }
      }
      
      // Logic nhảy: Gán vận tốc ngược chiều trọng lực
      gameState.current.velocity = JUMP_STRENGTH;
    },

    birdDive: () => {
      // Logic lao xuống: Chỉ hoạt động khi đang chơi
      if (gameState.current.isPlaying && !isGameOver) {
         // Chỉ lao xuống nếu đang bay lên hoặc rơi chậm (để tạo lực đẩy dứt khoát)
         gameState.current.velocity = DIVE_STRENGTH;
      }
    },

    resetGame: () => {
        gameState.current = {
            birdY: 200,
            velocity: 0,
            pipes: [],
            frameCount: 0,
            isPlaying: false
        };
        setScore(0);
        setIsGameOver(false);
        setIsGameStarted(false);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      // 1. Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#70c5ce";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isGameOver) {
        drawEverything(ctx, canvas);
        ctx.fillStyle = "red";
        ctx.font = "bold 30px Arial";
        ctx.fillText("GAME OVER", 60, 240);
        return;
      }

      // 2. Physics Update
      if (gameState.current.isPlaying) {
        updatePhysics(canvas);
      } else {
        // Màn hình chờ
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("Hất đầu lên để Start!", 60, 240);
        const hoverY = 200 + Math.sin(Date.now() / 300) * 5;
        ctx.fillStyle = "yellow";
        ctx.fillRect(50, hoverY, BIRD_SIZE, BIRD_SIZE);
      }

      // 3. Draw
      if (gameState.current.isPlaying) {
          drawEverything(ctx, canvas);
      }

      animationFrameId = window.requestAnimationFrame(loop);
    };

    loop();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isGameOver]);

  const updatePhysics = (canvas: HTMLCanvasElement) => {
    const state = gameState.current;

    // Vật lý: Vận tốc cộng dồn trọng lực
    state.velocity += GRAVITY;
    state.birdY += state.velocity;

    // Chạm đất/trần
    if (state.birdY + BIRD_SIZE > canvas.height || state.birdY < 0) {
        setIsGameOver(true);
        state.isPlaying = false;
    }

    // Pipes Logic
    state.frameCount++;
    if (state.frameCount % PIPE_SPAWN_RATE === 0) {
      state.pipes.push(spawnPipe(canvas.width, canvas.height));
    }

    state.pipes.forEach(pipe => {
      pipe.x -= PIPE_SPEED;
      // Hitbox logic (giữ nguyên như cũ)
      const birdLeft = 50; 
      const birdRight = 50 + BIRD_SIZE;
      const birdTop = state.birdY;
      const birdBottom = state.birdY + BIRD_SIZE;
      const gap = 140;

      if ((birdRight > pipe.x && birdLeft < pipe.x + pipe.width) && 
          (birdTop < pipe.height || birdBottom > pipe.height + gap)) {
        setIsGameOver(true);
      }

      if (!pipe.passed && birdLeft > pipe.x + pipe.width) {
        pipe.passed = true;
        setScore(prev => prev + 1);
      }
    });

    if (state.pipes.length > 5) state.pipes.shift();
  };

  const drawEverything = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameState.current;
    // (Giữ nguyên logic vẽ như bài trước)
    ctx.fillStyle = "#22c55e";
    state.pipes.forEach(pipe => {
      const gap = 140;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.height);
      ctx.fillRect(pipe.x, pipe.height + gap, pipe.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.height);
      ctx.strokeRect(pipe.x, pipe.height + gap, pipe.width, canvas.height);
    });

    ctx.fillStyle = "yellow";
    ctx.fillRect(50, state.birdY, BIRD_SIZE, BIRD_SIZE);
    
    // Vẽ mắt để thấy độ chúi của chim (Optional: xoay chim theo velocity thì đẹp hơn)
    ctx.fillStyle = "black";
    ctx.fillRect(50 + 14, state.birdY + 4, 4, 4);
    ctx.fillStyle = "orange";
    ctx.fillRect(50 + 16, state.birdY + 10, 6, 4);
  };

  return (
    <div className="relative">
       <canvas ref={canvasRef} width={320} height={480} className="border-4 border-black rounded shadow-2xl bg-sky-300" />
       <div className="absolute top-4 w-full text-center"><span className="text-5xl font-black text-white stroke-black drop-shadow-md">{score}</span></div>
    </div>
  );
});

GameCanvas.displayName = "GameCanvas";
export default GameCanvas;