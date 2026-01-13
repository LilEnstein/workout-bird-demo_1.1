'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Script from 'next/script';

interface MotionSensorProps {
  onJump: () => void;
  onDive: () => void;
}

const MotionSensor: React.FC<MotionSensorProps> = ({ onJump, onDive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // Dùng state này để hiện chữ debug, nhưng ta sẽ hạn chế set nó liên tục
  const [debugStatus, setDebugStatus] = useState("LOADING...");

  // Dùng Ref để lưu trạng thái quá khứ -> Tránh re-render cam
  const lastAction = useRef<string>("NEUTRAL");
  const lastActionTime = useRef(0);
  const COOLDOWN = 200; // Giới hạn tốc độ spam lệnh (ms)

  // --- CẤU HÌNH ĐỘ NHẠY (ĐÃ TINH CHỈNH CHO NGƯỜI NGỒI MÁY TÍNH) ---
  // 0.0 (Đỉnh) .................... 1.0 (Đáy)
  // Ngồi bình thường mũi sẽ ở khoảng 0.5
  
  // 1. Chỉ cần nhích mũi lên qua mức 0.42 là NHẢY (Không cần ngửa cao)
  const JUMP_THRESHOLD = 0.42; 
  
  // 2. Chỉ cần cúi mũi xuống qua mức 0.58 là LAO (Không cần cúi thấp)
  const DIVE_THRESHOLD = 0.58; 

  const onResults = (results: any) => {
    if (!results.poseLandmarks) return;
    const nose = results.poseLandmarks[0];

    if (nose) {
      const now = Date.now();
      let currentAction = "NEUTRAL";

      // 1. LOGIC PHÁT HIỆN
      if (nose.y < JUMP_THRESHOLD) {
        currentAction = "JUMP";
        // Chỉ gọi hàm onJump nếu đã hết thời gian chờ (cooldown)
        if (now - lastActionTime.current > COOLDOWN) {
            onJump();
            lastActionTime.current = now;
        }
      } 
      else if (nose.y > DIVE_THRESHOLD) {
        currentAction = "DIVE";
         // Dive thì cho phép spam nhanh hơn để cảm giác mượt
         onDive(); 
      } 

      // 2. CẬP NHẬT UI (Chỉ cập nhật khi trạng thái THAY ĐỔI để tránh nháy)
      if (currentAction !== lastAction.current) {
        lastAction.current = currentAction;
        // Map trạng thái sang tiếng Việt/Emoji cho dễ nhìn
        if (currentAction === "JUMP") setDebugStatus("LÊN! 🚀");
        else if (currentAction === "DIVE") setDebugStatus("XUỐNG! ⬇️");
        else setDebugStatus("...");
      }
    }
    
    // Vẽ debug (Tách ra để code gọn)
    drawDebug(results);
  };

  const drawDebug = (results: any) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (canvas && video && results.poseLandmarks) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set kích thước canvas khớp với video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Tính vị trí vạch kẻ theo Pixel
        const jumpY = JUMP_THRESHOLD * canvas.height;
        const diveY = DIVE_THRESHOLD * canvas.height;

        // Vạch JUMP (Xanh lá)
        ctx.beginPath();
        ctx.moveTo(0, jumpY);
        ctx.lineTo(canvas.width, jumpY);
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#00FF00";
        ctx.fillText("VÙNG LÊN (UP)", 10, jumpY - 5);

        // Vạch DIVE (Đỏ)
        ctx.beginPath();
        ctx.moveTo(0, diveY);
        ctx.lineTo(canvas.width, diveY);
        ctx.strokeStyle = "red";
        ctx.stroke();
        ctx.fillStyle = "red";
        ctx.fillText("VÙNG XUỐNG (DOWN)", 10, diveY + 15);

        // Vẽ cái mũi
        const nose = results.poseLandmarks[0];
        const noseX = nose.x * canvas.width;
        const noseY = nose.y * canvas.height;
        
        ctx.beginPath();
        ctx.arc(noseX, noseY, 10, 0, 2 * Math.PI);
        // Đổi màu mũi theo trạng thái
        if (nose.y < JUMP_THRESHOLD) ctx.fillStyle = "#00FF00"; // Xanh
        else if (nose.y > DIVE_THRESHOLD) ctx.fillStyle = "red"; // Đỏ
        else ctx.fillStyle = "yellow"; // Vàng (Bình thường)
        ctx.fill();
      }
    }
  };

  useEffect(() => {
     if (isModelLoaded && typeof window !== 'undefined') {
        // @ts-ignore
        const Pose = window.Pose;
        // @ts-ignore
        const Camera = window.Camera;
        if (!Pose || !Camera) return;

        const pose = new Pose({ locateFile: (file:string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
        
        // Tắt smoothLandmarks để phản hồi nhanh hơn, giảm modelComplexity xuống 0 (Lite) cho nhẹ máy
        pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        pose.onResults(onResults);

        if (webcamRef.current?.video) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => { 
                    if (webcamRef.current?.video) await pose.send({ image: webcamRef.current.video }); 
                },
                width: 640, height: 480
            });
            camera.start();
        }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModelLoaded]); // Chỉ chạy 1 lần khi model load xong -> HẾT NHÁY

  // ... (Phần code logic phía trên giữ nguyên không đổi)

  return (
    // THAY ĐỔI LỚN Ở DÒNG CLASSNAME NÀY:
    <div className="
      relative 
      overflow-hidden rounded-lg border-2 border-gray-700 bg-black shadow-lg
      
      /* --- GIAO DIỆN MOBILE (Mặc định) --- */
      /* Nằm đè lên góc phải (Floating), kích thước nhỏ */
      absolute top-4 right-4 z-50
      w-[100px] h-[75px]
      
      /* --- GIAO DIỆN PC/TABLET (Màn hình > 768px) --- */
      /* Quay về nằm yên (static), kích thước to rõ ràng */
      md:static md:w-[320px] md:h-[240px]
    ">
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" onLoad={() => setIsModelLoaded(true)} />
        
        {!isModelLoaded && <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] md:text-xs">Loading...</div>}
        
        <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full opacity-60 object-cover" mirrored={true} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        
        {/* Chữ trạng thái cũng cần nhỏ lại trên mobile */}
        <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 text-white text-[8px] md:text-xs font-bold bg-black/50 p-0.5 md:p-1 rounded">
            {debugStatus}
        </div>
    </div>
  );
};

export default MotionSensor;