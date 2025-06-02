import React from 'react';

const ProjectCard = ({ project }) => {
  return (
    <a
      href={project.link}
      target={project.external ? "_blank" : undefined}
      rel={project.external ? "noopener noreferrer" : undefined}
      className="group relative overflow-hidden"
    >
      <div className="project-card bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-500 transform">
        <div className="text-4xl mb-4 ">
          {project.icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {project.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {project.description}
        </p>
        <div className="mt-4 inline-flex items-center text-xs font-medium text-white">
          Learn More
          <svg className="ml-2 w-3 h-3 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;