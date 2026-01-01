import React from 'react';

const Hero = () => {
  return (
    <div className="relative text-center py-40 sm:py-56 px-4">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tighter">
            Derek Wong
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300">
            Keep Going
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
            <a
                href="https://lookerstudio.google.com/s/lPZJlenfGRI"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-lg rounded-full w-14 h-14 flex items-center justify-center text-2xl hover:bg-white/20 transition-all border border-white/20 shadow-lg"
            >
                <span>💰</span>
            </a>
            <a
                href="https://ship.spaceshipapp.com/orders/unfulfilled"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-lg rounded-full w-14 h-14 flex items-center justify-center text-2xl hover:bg-white/20 transition-all border border-white/20 shadow-lg"
            >
                <span>🚀</span>
            </a>
            <a
                href="https://www.notion.so/clinical-owl/Products-462ec30476a24f9ab3276078cbca66e9?pvs=4"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-lg rounded-full w-14 h-14 flex items-center justify-center text-2xl hover:bg-white/20 transition-all border border-white/20 shadow-lg"
            >
                <span>🦉</span>
            </a>
        </div>
    </div>
  );
};

export default Hero;
