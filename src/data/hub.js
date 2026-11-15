// Daily launcher. Always shown — not a checklist, and not hidden on weekends.
export const launches = [
  {
    label: 'Trading ritual',
    href: '/trading-rituals',
    external: false,
  },
  {
    label: "How's your day",
    href: 'https://app.notion.com/p/scorelab2025/Journal-2854deb190518067a6e4d2299d6195c7',
    external: true,
  },
  {
    label: 'Scorelab Admin',
    href: 'https://admin.scorelab.tech/login',
    external: true,
  },
];

export const projects = [
  {
    title: 'Log an expense',
    description: 'Personal or Well On. Opens a form.',
    icon: '💰',
    actions: [
      {
        label: 'Personal',
        link: 'https://forms.gle/KQuSFhzTKtXgf98k8',
        external: true,
      },
      {
        label: 'Well On',
        link: 'https://forms.gle/5J55inBAGSwi6wrD8',
        external: true,
      },
    ],
  },
  {
    title: 'Spending',
    description: "This month's check.",
    icon: '📒',
    link: '/spending',
  },
  {
    title: 'Capture',
    description: 'Save a thing in two seconds, before it disappears.',
    icon: '📥',
    link: '/shopping',
  },
  {
    title: 'Trading Rituals',
    description: 'Golden Rule',
    icon: '🚀',
    link: '/trading-rituals',
  },
  {
    title: 'Scorelab Admin',
    description: 'Democratize basketball statistic',
    icon: '🏀',
    link: 'https://admin.scorelab.tech/login',
    external: true,
  },
  {
    title: 'Home chores',
    description: 'Household chores in TickTick.',
    icon: '🏠',
    link: 'https://ticktick.com/webapp/#p/6af00d888f0899596f105bb4/tasks',
    external: true,
    cta: 'Open in TickTick',
  },
  {
    title: 'Place Calculator',
    description: 'Easily calculate PLACE',
    icon: '🔢',
    link: '/place',
  },
];
