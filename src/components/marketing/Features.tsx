import { 
  CalendarCheck, 
  ChartLineUp, 
  Users, 
  Moon, 
  Sparkle,
  BookOpen 
} from '@phosphor-icons/react/dist/ssr';

const features = [
  {
    icon: CalendarCheck,
    title: 'Lesson Planning',
    description: 'Organize your curriculum with lessons, daily playlists, and a visual calendar. Never wonder "what are we doing today?" again.',
    color: 'from-[var(--celestial-400)] to-[var(--nebula-teal)]',
  },
  {
    icon: ChartLineUp,
    title: 'Progress Tracking',
    description: 'See assignments completed, streaks maintained, and growth over time. Beautiful insights without the spreadsheet headaches.',
    color: 'from-[var(--success)] to-[var(--success-dark)]',
  },
  {
    icon: Users,
    title: 'Kid Portals',
    description: 'Each child gets their own personalized dashboard with daily quests, their favorite colors, and age-appropriate views.',
    color: 'from-[var(--nebula-purple)] to-[var(--nebula-pink)]',
  },
  {
    icon: Moon,
    title: 'Moon Rewards',
    description: 'Kids earn moons for completing work, then spend them in the shop. Motivation that feels like play, not pressure.',
    color: 'from-[var(--ember-gold-400)] to-[var(--cosmic-rust-400)]',
  },
  {
    icon: Sparkle,
    title: 'Luna AI Assistant',
    description: 'Your helpful planning companion. Get lesson ideas, adapt activities for different ages, and brainstorm together.',
    color: 'from-[var(--nebula-purple)] to-[var(--cosmic-rust-500)]',
  },
  {
    icon: BookOpen,
    title: 'Family Collaboration',
    description: 'Invite co-parents, grandparents, or tutors to share the load. Everyone stays on the same page.',
    color: 'from-[var(--nebula-pink)] to-[var(--cosmic-rust-500)]',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[var(--night-800)]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--cosmic-rust-400)] font-medium">FEATURES</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mt-3 mb-4">
            Everything you need to homeschool joyfully
          </h2>
          <p className="text-xl text-[var(--slate-300)] max-w-2xl mx-auto">
            From planning to tracking to keeping kids engaged—Lunara Quest handles it all.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-[var(--night-700)]/50 border border-[var(--night-600)] hover:border-[var(--celestial-400)]/50 hover:bg-[var(--night-700)] transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} weight="fill" className="text-[var(--foreground)]" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--slate-300)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
