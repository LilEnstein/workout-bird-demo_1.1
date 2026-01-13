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
  const [debugStatus, setDebugStatus] = useState("LOADING...");

  // --- LOGIC AI (Giữ nguyên như bản ổn định) ---
  const lastAction = useRef<string>("NEUTRAL");
  const lastActionTime = useRef(0);
  const COOLDOWN = 200; 
  const JUMP_THRESHOLD = 0.42; 
  const DIVE_THRESHOLD = 0.58; 

  const onResults = (results: any) => {
    if (!results.poseLandmarks) return;
    const nose = results.poseLandmarks[0];

    if (nose) {
      const now = Date.now();
      let currentAction = "NEUTRAL";

      if (nose.y < JUMP_THRESHOLD) {
        currentAction = "JUMP";
        if (now - lastActionTime.current > COOLDOWN) {
            onJump();
            lastActionTime.current = now;
        }
      } else if (nose.y > DIVE_THRESHOLD) {
        currentAction = "DIVE";
         onDive(); 
      } 

      if (currentAction !== lastAction.current) {
        lastAction.current = currentAction;
        if (currentAction === "JUMP") setDebugStatus("LÊN! 🚀");
        else if (currentAction === "DIVE") setDebugStatus("XUỐNG! ⬇️");
        else setDebugStatus("...");
      }
    }
    drawDebug(results);
  };

  const drawDebug = (results: any) => {
    const canvas = canvasRef.current;
    if (canvas && results.poseLandmarks) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const jumpY = JUMP_THRESHOLD * canvas.height;
        const diveY = DIVE_THRESHOLD * canvas.height;

        // Vẽ vạch
        ctx.beginPath(); ctx.moveTo(0, jumpY); ctx.lineTo(canvas.width, jumpY);
        ctx.strokeStyle = "#00FF00"; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(0, diveY); ctx.lineTo(canvas.width, diveY);
        ctx.strokeStyle = "red"; ctx.stroke();

        // Vẽ mũi
        const nose = results.poseLandmarks[0];
        const noseX = (1 - nose.x) * canvas.width; 
        const noseY = nose.y * canvas.height;
        
        ctx.beginPath(); ctx.arc(noseX, noseY, 8, 0, 2 * Math.PI); // Mũi to hơn xíu (8px) cho dễ nhìn
        ctx.fillStyle = nose.y < JUMP_THRESHOLD ? "#00FF00" : nose.y > DIVE_THRESHOLD ? "red" : "yellow";
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
        
        if (Pose && Camera && webcamRef.current?.video) {
            const pose = new Pose({ locateFile: (file:string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
            pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
            pose.onResults(onResults);
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => { if (webcamRef.current?.video) await pose.send({ image: webcamRef.current.video }); },
                width: 640, height: 480
            });
            camera.start();
        }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModelLoaded]);

  return (
    <div className={`
      /* --- WRAPPER CHUNG --- */
      relative overflow-hidden rounded-lg border-2 border-gray-700 bg-black shadow-lg
      
      /* --- MOBILE: Responsive Layout --- */
      /* Chiếm hết chiều ngang của container cha, tỷ lệ khung hình 4:3 */
      w-full aspect-[4/3]
      
      /* --- PC: Fixed Size --- */
      /* Từ màn hình Medium trở lên thì cố định kích thước chuẩn */
      md:w-[320px] md:h-[240px] md:aspect-auto

      /* --- TRACKING FIX --- */
      /* Ép video + canvas phải lấp đầy khung này */
      [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover
      [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:object-cover
    `}>
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" onLoad={() => setIsModelLoaded(true)} />
        
        {!isModelLoaded && <div className="absolute inset-0 flex items-center justify-center text-white text-sm animate-pulse">Đang tải AI...</div>}
        
        <Webcam ref={webcamRef} className="absolute inset-0" mirrored={true} />
        <canvas ref={canvasRef} className="absolute inset-0" />
        
        <div className="absolute bottom-0 left-0 w-full text-center text-white font-bold bg-black/60 py-1 text-xs md:text-sm">
            {debugStatus}
        </div>
    </div>
  );
};

export default MotionSensor;