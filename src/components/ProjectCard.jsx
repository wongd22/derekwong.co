import React from 'react';

const shell =
  'group relative block h-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg';

function Cue({ external, label }) {
  return (
    <div className="mt-5 inline-flex items-center text-sm font-semibold text-white/80">
      <span>{label}</span>
      <svg
        aria-hidden="true"
        className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {external ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        )}
      </svg>
    </div>
  );
}

const actionClass =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-base font-semibold text-black active:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const ProjectCard = ({ project }) => {
  const body = (
    <div className="p-5 sm:p-8">
      <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl" aria-hidden="true">
        {project.icon}
      </div>
      <h2 className="mb-2 text-xl font-bold text-white">{project.title}</h2>
      <p className="text-base leading-snug text-gray-300">{project.description}</p>
      {project.actions ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {project.actions.map((action) => (
            <a
              key={action.label}
              href={action.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${action.label} expense, opens in a new tab`}
              className={actionClass}
            >
              {action.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      ) : (
        <Cue external={Boolean(project.external)} label={project.cta || (project.external ? 'Visit Site' : 'Open App')} />
      )}
    </div>
  );

  if (project.actions) {
    return <article className={shell}>{body}</article>;
  }

  return (
    <a
      href={project.link}
      target={project.external ? '_blank' : undefined}
      rel={project.external ? 'noopener noreferrer' : undefined}
      className={`${shell} transition-colors hover:bg-white/20 active:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
    >
      {body}
    </a>
  );
};

export default ProjectCard;
