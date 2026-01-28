import { Moon, Trophy, Scroll, Palette } from '@phosphor-icons/react/dist/ssr';

const kidFeatures = [
  {
    icon: Scroll,
    title: 'Daily Quests',
    description: 'Assignments feel like adventures',
  },
  {
    icon: Moon,
    title: 'Earn Moons',
    description: 'Complete work, collect rewards',
  },
  {
    icon: Trophy,
    title: 'Collect Badges',
    description: 'Celebrate every achievement',
  },
  {
    icon: Palette,
    title: 'Personalize',
    description: 'Their colors, their portal',
  },
];

export function KidShowcase() {
  return (
    <section className="py-24 bg-[var(--night-900)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-[var(--cosmic-rust-400)] font-medium">FOR THE KIDS</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mt-3 mb-6">
              Learning that feels like playing
            </h2>
            <p className="text-xl text-[var(--slate-300)] mb-10">
              Each child gets their own magical portal. They see daily quests, 
              earn moons for their work, collect badges, and even write in 
              their personal journal. It&apos;s education wrapped in adventure.
            </p>

            {/* Kid features */}
            <div className="grid grid-cols-2 gap-6">
              {kidFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-gradient-nebula border border-[var(--night-600)]">
                    <feature.icon size={24} weight="fill" className="text-[var(--cosmic-rust-400)]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--foreground)]">{feature.title}</h4>
                    <p className="text-sm text-[var(--slate-400)]">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--nebula-purple)]/30 to-[var(--cosmic-rust-500)]/30 blur-3xl" />
            
            {/* Mockup card */}
            <div className="relative bg-[var(--night-700)] rounded-3xl border border-[var(--night-600)] p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--celestial-400)] to-[var(--nebula-teal)] flex items-center justify-center text-2xl">
                    🚀
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">Welcome back, Atlas!</h4>
                    <p className="text-sm text-[var(--slate-400)]">5 quests today</p>
                  </div>
                </div>
                <div className="moon-counter">
                  <Moon size={18} weight="fill" />
                  <span className="font-semibold">247</span>
                </div>
              </div>

              {/* Quest cards */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--night-600)]/50 border border-[var(--night-500)] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--celestial-400)]/20 flex items-center justify-center">
                    📖
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">Reading: Chapter 5</p>
                    <p className="text-sm text-[var(--slate-400)]">20 moons reward</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[var(--success)]/20 text-[var(--success)] text-sm font-medium">
                    Start
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--night-600)]/50 border border-[var(--night-500)] flex items-center gap-4 opacity-75">
                  <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
                    🧮
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">Math: Fractions</p>
                    <p className="text-sm text-[var(--slate-400)]">25 moons reward</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--slate-400)]" />
                </div>

                <div className="p-4 rounded-xl bg-[var(--night-600)]/50 border border-[var(--night-500)] flex items-center gap-4 opacity-75">
                  <div className="w-10 h-10 rounded-lg bg-[var(--nebula-purple)]/20 flex items-center justify-center">
                    🎨
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">Art: Nature Sketch</p>
                    <p className="text-sm text-[var(--slate-400)]">15 moons reward</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--slate-400)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
