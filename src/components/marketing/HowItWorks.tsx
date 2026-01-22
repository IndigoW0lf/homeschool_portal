import { 
  NumberCircleOne, 
  NumberCircleTwo, 
  NumberCircleThree,
  ArrowRight
} from '@phosphor-icons/react/dist/ssr';

const steps = [
  {
    number: NumberCircleOne,
    title: 'Create Your Family',
    description: 'Sign up in 30 seconds. Add your kids and customize their profiles with avatars, colors, and grade levels.',
  },
  {
    number: NumberCircleTwo,
    title: 'Plan Your Lessons',
    description: 'Add lessons to your library or let Luna help you brainstorm. Schedule them on the calendar for each kid.',
  },
  {
    number: NumberCircleThree,
    title: 'Watch Them Thrive',
    description: 'Kids check their portal for daily quests, earn moons, collect badges, and you track it all effortlessly.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-[var(--night-800)] to-[var(--night-900)]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--celestial-400)] font-medium">HOW IT WORKS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            Get started in minutes
          </h2>
          <p className="text-xl text-[var(--slate-300)] max-w-2xl mx-auto">
            No complex setup. No learning curve. Just simple, joyful homeschooling.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-[var(--celestial-400)] to-[var(--cosmic-rust-400)] opacity-30" />
              )}
              
              <div className="relative z-10 text-center p-8">
                {/* Number */}
                <div className="inline-flex mb-6">
                  <step.number size={64} weight="fill" className="text-[var(--celestial-400)]" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-[var(--slate-300)] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow on mobile */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <ArrowRight size={24} className="text-[var(--night-600)] rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
