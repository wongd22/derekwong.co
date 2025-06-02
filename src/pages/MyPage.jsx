import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import Place from './Place';
import Shopping from './Shopping';
import Hero from '../components/Hero';
import ProjectCard from '../components/ProjectCard';

const projects = [
  {
    title: "Shopping",
    description: "To Buy List",
    icon: "🛒",
    link: "/mypage/shopping"
  },
  {
    title: "Place Calculator",
    description: "Easily calculate PLACE",
    icon: "🔢",
    link: "/mypage/place"
  },
  {
    title: "Trading Journal",
    description: "Track your trades",
    icon: "📈",
    link: "https://trading.derekwong.net",
    external: true
  },
  {
    title: "Scorelab",
    description: "Democratize basketball statistic",
    icon: "🏀 ",
    link: "https://www.scorelab.tech",
    external: true
  },
  {
    title: "Clinical Owl",
    description: "Make Medical Easier",
    icon: "📝",
    link: "https://www.clinicalowl.io",
    external: true
  }
];

function HomePage() {
  return (
    <>
      <Hero />

      {/* Projects Section */}
      <div className="py-20 px-2">
        <h2 className="text-4xl font-bold text-center mb-16">My Tools</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-400">
        <div className="flex justify-center space-x-8 mb-8">
          <a href="#" className="hover:text-white transition-colors">
            <FaGithub size={24} />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <FaLinkedin size={24} />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <FaTwitter size={24} />
          </a>
        </div>
        <p>© 2024 Derek Wong. All rights reserved.</p>
      </footer>
    </>
  );
}

function MyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/place" element={<Place />} />
        <Route path="/shopping" element={<Shopping />} />
      </Routes>
    </div>
  );
}

export default MyPage;