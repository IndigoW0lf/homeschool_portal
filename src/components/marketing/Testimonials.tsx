import { Star } from '@phosphor-icons/react/dist/ssr';

const testimonials = [
  {
    quote: "Lunara Quest has completely transformed our homeschool. The kids actually ASK to do their work so they can earn moons!",
    author: "Sarah M.",
    role: "Homeschool mom of 3",
    avatar: "👩‍🦰",
  },
  {
    quote: "Finally, a homeschool app that gets it. Planning is easy, my kids are engaged, and I'm not drowning in spreadsheets.",
    author: "Michael T.",
    role: "Homeschool dad",
    avatar: "👨",
  },
  {
    quote: "My daughter loves her portal. She checks it every morning to see her 'quests' and she's so proud of her badge collection.",
    author: "Jessica K.",
    role: "Mom of a 2nd grader",
    avatar: "👩",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-[var(--night-800)]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--celestial-400)] font-medium">TESTIMONIALS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mt-3 mb-4">
            Loved by homeschool families
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="p-8 rounded-2xl bg-gradient-to-br from-[var(--night-700)] to-[var(--night-700)]/50 border border-[var(--night-600)]"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} weight="fill" className="text-[var(--ember-gold-400)]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[var(--slate-200)] text-lg leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{testimonial.avatar}</span>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{testimonial.author}</p>
                  <p className="text-sm text-[var(--slate-400)]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
