import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import ProjectCard from '../components/ProjectCard';
import { launches, projects } from '../data/hub';

const chipClass =
  'inline-flex min-h-[44px] max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-4 text-base font-medium text-white transition-colors hover:bg-white/20 active:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

function LaunchStrip() {
  return (
    <nav aria-label="Launch" className="mx-auto mt-5 flex w-full max-w-lg flex-wrap justify-center gap-2">
      {launches.map((item) =>
        item.external ? (
          <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={chipClass}>
            {item.label}
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <Link key={item.label} to={item.href} className={chipClass}>
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

function HomePage() {
  return (
    <>
      <div className="px-4 pb-16 pt-[max(2rem,env(safe-area-inset-top))] sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Derek Wong</h1>
          <p className="mt-2 text-base text-gray-400 sm:mt-4 sm:text-lg">Keep Going</p>
          <LaunchStrip />
        </div>
        <ul className="mx-auto mt-8 grid max-w-lg list-none gap-3 p-0 sm:mt-14 sm:gap-8 lg:max-w-none lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.title} className="min-w-0">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>

      <footer className="bg-transparent">
        <div className="mx-auto max-w-7xl overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <a
              href="https://github.com/wongd22"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-white"
            >
              <span className="sr-only">GitHub</span>
              <FaGithub size={24} />
            </a>
            <a
              href="https://www.linkedin.com/in/derek-wong-8b0101b8/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-white"
            >
              <span className="sr-only">LinkedIn</span>
              <FaLinkedin size={24} />
            </a>
            <a
              href="https://twitter.com/wongd22"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-white"
            >
              <span className="sr-only">Twitter</span>
              <FaTwitter size={24} />
            </a>
          </div>
          <p className="mt-6 text-center text-base text-gray-400">&copy; 2026 Derek Wong. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

function MyPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <div className="absolute left-0 top-0 -z-10 h-full w-full bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <HomePage />
    </div>
  );
}

export default MyPage;
