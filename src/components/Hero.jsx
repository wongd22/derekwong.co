import React from 'react';

const Hero = () => {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1533029030467-904d7bbd602b?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Hero background"
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      
      <div className="relative z-10 text-center px-4">
        <h1 className="hero-text text-6xl md:text-7xl font-bold mb-8 tracking-tight max-w-4xl mx-auto py-2">
          Derek Wong
        </h1>
        <p className="text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
          Keep Going
        </p>
        
        <div className="mt-12 flex flex-wrap justify-center gap-4" >
          <a
            href="https://lookerstudio.google.com/s/lPZJlenfGRI"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            💰
          </a>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfQXJuBOakxD4jZPOlROeHDBE2Qi8kvwT_mbplfjHhjjJDeoA/viewform?usp=sf_link"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            🏠
          </a>
          
           <a
            href="https://ship.spaceshipapp.com/orders/unfulfilled"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            🚀
          </a>
          
          <a
            href="http://www.notion.so/clinical-owl/Products-462ec30476a24f9ab3276078cbca66e9?pvs=4"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            🦉
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;