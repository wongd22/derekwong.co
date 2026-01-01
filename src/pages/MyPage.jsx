import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import Place from './Place';
import Shopping from './Shopping';
import ProjectCard from '../components/ProjectCard';

const projects = [
  {
    title: "Personal Expense",
    description: "Input expense.",
    icon: "💰",
    link: "https://forms.gle/KQuSFhzTKtXgf98k8",
    external: true
  },
  {
    title: "Well On Expense",
    description: "Input expense.",
    icon: "💰",
    link: "https://forms.gle/5J55inBAGSwi6wrD8",
    external: true
  },
  {
    title: "Spaceship",
    description: "Track unfulfilled orders.",
    icon: "🚀",
    link: "https://ship.spaceshipapp.com/orders/unfulfilled",
    external: true
  },
  {
    title: "Clinical Owl Products",
    description: "View product details in Notion.",
    icon: "🦉",
    link: "http://www.notion.so/clinical-owl/Products-462ec30476a24f9ab3276078cbca66e9?pvs=4",
    external: true
  },
  {
    title: "Shopping List",
    description: "To Buy List",
    icon: "🛒",
    link: "/shopping"
  },
  {
    title: "Place Calculator",
    description: "Easily calculate PLACE",
    icon: "🔢",
    link: "/place"
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
      {/* Projects Section */}
      <div className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">My Tools</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                A collection of apps and websites I've built.
            </p>
        </div>
        <div className="mt-16 max-w-lg mx-auto grid gap-8 lg:grid-cols-3 lg:max-w-none">
          {projects.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-transparent">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="flex justify-center space-x-6">
              <a href="https://github.com/wongd22" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <span className="sr-only">GitHub</span>
                  <FaGithub size={24} />
              </a>
              <a href="https://www.linkedin.com/in/derek-wong-8b0101b8/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <FaLinkedin size={24} />
              </a>
              <a href="https://twitter.com/wongd22" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <FaTwitter size={24} />
              </a>
          </div>
          <p className="mt-8 text-center text-base text-gray-400">&copy; 2024 Derek Wong. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

function MyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 -z-10" />
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/place" element={<Place />} />
            <Route path="/shopping" element={<Shopping />} />
        </Routes>
    </div>
  );
}

export default MyPage;
