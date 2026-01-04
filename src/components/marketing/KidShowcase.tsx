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
    <section className="py-24 bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-[#E27D60] font-medium">FOR THE KIDS</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6">
              Learning that feels like playing
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Each child gets their own magical portal. They see daily quests, 
              earn moons for their work, collect badges, and even write in 
              their personal journal. It's education wrapped in adventure.
            </p>

            {/* Kid features */}
            <div className="grid grid-cols-2 gap-6">
              {kidFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#9c8fb8]/20 to-[#E27D60]/20 border border-gray-700">
                    <feature.icon size={24} weight="fill" className="text-[#E27D60]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{feature.title}</h4>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#9c8fb8]/30 to-[#E27D60]/30 blur-3xl" />
            
            {/* Mockup card */}
            <div className="relative bg-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl">
                    🚀
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Welcome back, Atlas!</h4>
                    <p className="text-sm text-gray-400">5 quests today</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                  <Moon size={18} weight="fill" className="text-yellow-400" />
                  <span className="font-semibold text-yellow-400">247</span>
                </div>
              </div>

              {/* Quest cards */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-700/50 border border-gray-600 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    📖
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Reading: Chapter 5</p>
                    <p className="text-sm text-gray-400">20 moons reward</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                    Start
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-700/50 border border-gray-600 flex items-center gap-4 opacity-75">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    🧮
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Math: Fractions</p>
                    <p className="text-sm text-gray-400">25 moons reward</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                </div>

                <div className="p-4 rounded-xl bg-gray-700/50 border border-gray-600 flex items-center gap-4 opacity-75">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    🎨
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Art: Nature Sketch</p>
                    <p className="text-sm text-gray-400">15 moons reward</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
