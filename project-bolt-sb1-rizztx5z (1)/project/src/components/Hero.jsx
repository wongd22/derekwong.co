import React from 'react';

const Hero = () => {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1533029030467-904d7bbd602b?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Hero background"
          className="w-full h-full object-cover opacity-80"
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
            href="https://docs.google.com/forms/d/e/1FAIpQLScNT8j00PmJn32MWjYO6AL-d0JCjvPQRhNQds9q9MqLrl-d3g/viewform?usp=sf_link"
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
            href="https://forms.gle/DHfPv65i4kG7dbBLA"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            🏆
          </a>
          <a
            href="https://www.notion.so/Restaurant-bookmark-17a4deb1905180f2b9ddc00407448a56"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            🍔
          </a>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfG-jKMwJlpDUK47QGIyIaJxgJc74Avx_c6ACp2UKyd51tryQ/viewform?usp=pp_url&entry.549116440=Air&entry.1737958482=Yes&entry.1900711821=PM&entry.1154055986=Clinical+Owl+Limited&entry.52176025=Clinical+Owl+Limited&entry.2094240235=Hong+Kong&entry.1160294418=Tsuen+Wan+District&entry.1167055322=Tsuen+Wan+District&entry.561125814=Tsuen+Wan&entry.232368741=0&entry.1796256672=Block+A,+4/F.,+Kong+Nam+Industrial+Building,+603-609+Castle+Peak+Road,+Tsuen+Wan,+N.T.,+Hong+Kong&entry.1817835035='%2B852-91782314&entry.922400616=PP&entry.904525454=7.5&entry.1923126886=22.5&entry.1551925167=20.5&entry.1400980927=1&entry.1377870369=General&entry.1772655465=Flashcards&entry.2101260712=Flashcards&entry.1921056487=1"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            NSS (1)
          </a>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScWT0xnmqvzDd8foj4PtJy5NtYpXpzPWorPYIaJk4Wwj51dAQ/viewform?usp=pp_url&entry.260216209=COWL&entry.921267906=NL.KD&entry.1669552982=XXXXXXXX&entry.1768611087=FC002&entry.1863982148=1&entry.1074048422=PCS&entry.811386961=1&entry.1263891585=PCS&entry.584638905=HK"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            NSS (2)
          </a>
          <a
            href="http://www.notion.so/clinical-owl/Products-462ec30476a24f9ab3276078cbca66e9?pvs=4"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            🦉 Products
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;