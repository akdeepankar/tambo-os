import React from "react";



const Home: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full relative overflow-hidden">
      {/* Gradient background */}
  <div className="absolute inset-0 z-0" style={{background: 'linear-gradient(135deg, #ffffff 60%, #3b82f6 100%)'}} />
      {/* Blurred image background */}
      <img src="/Tambo-Lockup.svg" alt="Tambo Logo" className="absolute inset-0 w-full h-full object-cover z-10 blur-2xl opacity-40" />
      {/* Glass blur overlay */}
  <div className="absolute inset-0 z-20 backdrop-blur-2xl bg-white/60" />
  <h1 className="text-5xl font-bold z-30 text-gray-300 dark:text-white" style={{textShadow: '0 2px 16px rgba(59,130,246,0.12)'}}>🐙 Tambo OS</h1>
    </div>
  );
};

export default Home;
