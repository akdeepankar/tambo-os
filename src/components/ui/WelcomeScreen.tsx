import React, { useEffect, useState } from "react";
import Image from "next/image";

const WelcomeScreen: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 3000);
  const start = Date.now();
    const duration = 3000;
    const update = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed < duration) requestAnimationFrame(update);
    };
    update();
    return () => {
      clearTimeout(timer);
      setProgress(0);
    };
  }, [onFinish]);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center">
      {/* Gradient background */}
      <div className="absolute inset-0 z-0" style={{background: 'linear-gradient(135deg, #ffffff 60%, #3b82f6 100%)'}} />
      {/* Blurred image background */}
  <Image src="/Tambo-Lockup.svg" alt="Tambo Logo" fill className="absolute inset-0 w-full h-full object-cover z-10 blur-2xl opacity-40" />
      {/* Glass blur overlay */}
      <div className="absolute inset-0 z-20 backdrop-blur-2xl bg-white/60" />
      {/* Centered content */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full">
        <h1 className="text-5xl font-bold text-center text-gray-300 dark:text-white mb-8" style={{textShadow: '0 2px 16px rgba(59,130,246,0.12)'}}>🐙 Tambo OS</h1>
        <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow mt-2">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
