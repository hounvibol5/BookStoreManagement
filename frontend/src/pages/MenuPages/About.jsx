import { Link } from "react-router-dom";

const storyCards = [
  {
    image: "/image/about/vogue-style.jpg",
    alt: "Vogue style fashion book",
    className: "hidden opacity-45 lg:block -rotate-[10deg]",
  },
  {
    image: "/image/about/atomic-habits.jpg",
    alt: "Atomic Habits and journals on white sheets",
    className: "rotate-[-5deg]",
  },
  {
    image: "/image/about/letting-go.jpg",
    alt: "The art of letting go book on satin fabric",
    className: "rotate-[-2deg]",
  },
  {
    image: "/image/about/sun-flowers.jpg",
    alt: "The sun and her flowers book beside tea",
    className: "rotate-[2deg]",
  },
  {
    image: "/image/about/happy-wall.jpg",
    alt: "Quote painted on a cafe wall",
    className: "rotate-[5deg]",
  },
  {
    image: "/image/about/totoro-book.jpg",
    alt: "My Neighbor Totoro book in a bookstore",
    className: "hidden opacity-45 lg:block rotate-[10deg]",
  },
];

const pillars = [
  {
    title: "Thoughtful Curation",
    text: "Every shelf is organized around real reader moods, from study sessions to weekend escapes.",
  },
  {
    title: "Easy Discovery",
    text: "Browse, compare, and return to books that match your taste without feeling overwhelmed.",
  },
  {
    title: "Reader Care",
    text: "We keep orders, recommendations, and store details handled with a warm human touch.",
  },
];

const features = [
  {
    title: "Local Reading Picks",
    text: "Fresh recommendations chosen for curious readers, students, gift givers, and everyday book lovers.",
    image: "/image/hero-sponsor/sp3.webp",
    className: "md:col-span-2 text-white",
    overlay: true,
  },
  {
    title: "Book Requests",
    text: "Ask for the title you need and we will help you find the right edition.",
    image: "/image/36afeb33216403d3a18bc813e8bb372d.jpg",
    className: "text-white",
    overlay: true,
  },
  {
    title: "Cozy Shelf Lists",
    text: "Plan your next reads, save favorites, and keep your literary ideas close.",
    image: "/image/cozy-shelf-lists.jpg",
    className: "text-white",
    overlay: true,
  },
  {
    title: "Community Finds",
    text: "Discover books loved by the people behind The Haven.",
    image: "/image/team-dining.jpg",
    className: "md:col-span-2 bg-[#5f7656] text-white",
  },
];

export default function About() {
  return (
    <div className="bg-white px-4 py-8 text-[#111111] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl bg-[#fff8ee] shadow-[0_26px_80px_rgba(88,72,55,0.12)]">
        <section id="story" className="overflow-hidden px-5 py-7 sm:px-10 lg:px-20">
          <div className="mx-auto mt-16 max-w-4xl text-center">
            <h1 className="text-5xl font-black leading-[0.95] tracking-normal sm:text-7xl">
              <span className="block font-display font-semibold text-[#19537b]">
                About us
              </span>
            </h1>
            <div className="mx-auto mt-7 max-w-3xl space-y-5 text-base leading-8 text-[#73695d]">
              <p>
                Welcome to The Heaven book store, an independent bookstore
                built by readers, for readers.
              </p>
              <p>
                We believe that independent bookstores are the heart of a
                creative community. That&apos;s why we ditch the mass-market
                algorithms in favor of thoughtful, human curation. From bold
                new voices and indie releases to the classics you love, our
                shelves are constantly evolving to spark curiosity and inspire
                personal growth.
              </p>
              <p>
                Whether you&apos;re browsing our online shelves or visiting us
                in person, we are here to connect you with books that linger in
                your mind long after the final chapter.
              </p>
              <p className="font-bold text-[#19537b]">
                Find your next obsession.
              </p>
            </div>
            <Link
              to="/books"
              className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#111111] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3b3026]"
            >
              Start reading
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
                -
              </span>
            </Link>
          </div>

          <div className="relative left-1/2 mt-8 flex w-[118vw] -translate-x-1/2 items-end justify-center gap-3 sm:gap-4">
            {storyCards.map((card, index) => (
              <div
                key={card.alt}
                className="about-card-float shrink-0"
                style={{ animationDelay: `${index * 0.22}s` }}
              >
                <img
                  src={card.image}
                  alt={card.alt}
                  className={`h-52 w-32 rounded-[1.6rem] object-cover shadow-[0_18px_42px_rgba(35,28,20,0.18)] sm:h-64 sm:w-44 lg:h-72 lg:w-52 ${card.className}`}
                />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl divide-y divide-[#d9cdbc] text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="px-7 py-7">
                <h2 className="text-lg font-black">{pillar.title}</h2>
                <p className="mt-3 text-xs leading-6 text-[#73695d]">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="px-5 py-24 sm:px-10 lg:px-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Everything a Reader Needs to Find Something Good
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#73695d]">
              From curated shelves to easy browsing, our bookstore is built to
              keep readers inspired, organized, and happily returning.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={`relative flex min-h-72 overflow-hidden rounded-[1.6rem] p-7 ${feature.className}`}
              >
                {feature.image && (
                  <img
                    src={feature.image}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover ${
                      feature.overlay ? "" : "object-right"
                    }`}
                  />
                )}
                {feature.image && feature.overlay && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                )}
                {feature.image && !feature.overlay && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5f7656] via-[#5f7656]/80 to-transparent" />
                )}
                <div className="relative z-10 mt-auto max-w-sm">
                  <h3 className="text-2xl font-black">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 opacity-80">
                    {feature.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="team" className="px-5 pb-20 sm:px-10 lg:px-28">
          <div className="overflow-hidden rounded-[1.8rem] bg-[#111111] text-white md:grid md:grid-cols-[0.95fr_1.05fr]">
            <img
              src="/image/image.png"
              alt="The bookstore team gathered together"
              className="h-80 w-full object-cover md:h-full"
            />
            <div className="p-8 sm:p-12">
              <h2 className="text-4xl font-black leading-tight">
                My teams
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/70">
                We are a collective of creators, strategists, and
                problem-solvers who believe that the best ideas happen at the
                intersection of collaboration and passion. We don&apos;t just work
                together—we push boundaries, challenge each other, and combine
                our unique strengths to bring your vision to life.
              </p>
              <Link
                to="/books"
                className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#efe6d7]"
              >
                Explore books
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
