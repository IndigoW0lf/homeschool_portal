interface ThemeCardProps {
  theme: string;
}

const themeColors: Record<string, { bg: string; text: string; icon: string }> = {
  'Foundation Day': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-200',
    icon: '🏛️',
  },
  'Skill Day': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    icon: '🛠️',
  },
  'Expression Day': {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-200',
    icon: '🎨',
  },
};

const defaultTheme = {
  bg: 'bg-gray-100 dark:bg-gray-800',
  text: 'text-gray-800 dark:text-gray-200',
  icon: '📅',
};

export function ThemeCard({ theme }: ThemeCardProps) {
  const themeStyle = themeColors[theme] || defaultTheme;

  return (
    <div className={`${themeStyle.bg} rounded-xl p-4 shadow-sm flex items-center gap-3`}>
      <span className="text-2xl">{themeStyle.icon}</span>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Theme</p>
        <p className={`font-semibold ${themeStyle.text}`}>{theme}</p>
      </div>
    </div>
  );
}
