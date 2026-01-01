import React from 'react';

const ProjectCard = ({ project }) => {
  return (
    <a
      href={project.link}
      target={project.external ? "_blank" : undefined}
      rel={project.external ? "noopener noreferrer" : undefined}
      className="group relative block overflow-hidden bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
    >
      <div className="p-6 sm:p-8">
        <div className="text-4xl mb-4">
          {project.icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {project.title}
        </h3>
        <p className="text-gray-300 text-sm">
          {project.description}
        </p>
        <div className="mt-6 inline-flex items-center text-xs font-semibold text-white/80">
          <span>{project.external ? 'Visit Site' : 'Open App'}</span>
          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
