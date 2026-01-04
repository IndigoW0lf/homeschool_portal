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
    <section className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#9c8fb8] font-medium">TESTIMONIALS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            Loved by homeschool families
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700/50"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} weight="fill" className="text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{testimonial.avatar}</span>
                <div>
                  <p className="font-medium text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
