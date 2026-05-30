// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookCard from "../../components/Cards/BookCard";
import { getBooks } from "../../services/api";
import { fallbackBookCovers } from "../../utils/bookCovers";

const sponsorImages = [
  "/image/hero-sponsor/sp3.webp",
  "/image/hero-sponsor/sp6.jpeg",
  "/image/hero-sponsor/sp4.avif",
  "/image/herobook/bk.jpeg",
  "/image/hero-sponsor/sp13.webp",
];

const heroBookImages = fallbackBookCovers;

const promoCards = [
  {
    title: "New Release.",
    cta: "Shop now",
    image: "/image/bookrose.jpg",
    background: "bg-[#df3434]",
  },
  {
    title: "Pre Order Now.",
    cta: "Shop now",
    image: "/image/bookgreen.jpg",
    background: "bg-[#6fc7ae]",
  },
  {
    title: "Top Rated.",
    cta: "Shop now",
    image: "/image/booksea.jpg",
    background: "bg-[#1f4b89]",
  },
];

const FEATURED_BOOK_LIMIT = 15;

function normalizeBooks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.books)) return data.books;
  return [];
}

function getFeaturedBooks(featured) {
  return featured
    .map((book, index) => ({
      ...book,
      cover_image:
        book.cover_image || heroBookImages[index % heroBookImages.length],
    }))
    .slice(0, FEATURED_BOOK_LIMIT);
}

export default function Home({ onAddToCart }) {
  const [featured, setFeatured] = useState([]);
  const [showSponsor, setShowSponsor] = useState(true);
  const [sponsorIndex, setSponsorIndex] = useState(0);
  const [sponsorSecondsLeft, setSponsorSecondsLeft] = useState(15);
  const [activeBookIndex, setActiveBookIndex] = useState(2);
  const featuredBooks = getFeaturedBooks(featured);

  useEffect(() => {
    getBooks({ page: 1 })
      .then((res) => {
        const nextBooks = normalizeBooks(res.data);
        setFeatured(nextBooks.slice(0, FEATURED_BOOK_LIMIT));
      })
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    if (!showSponsor) return undefined;

    const interval = window.setInterval(() => {
      setSponsorIndex((current) => (current + 1) % sponsorImages.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [showSponsor]);

  useEffect(() => {
    if (!showSponsor) return undefined;

    const interval = window.setInterval(() => {
      setSponsorSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setShowSponsor(false);
          return 0;
        }

        return current - 1;
      });
    }, 750);

    return () => window.clearInterval(interval);
  }, [showSponsor]);

  const skipSponsor = () => {
    setSponsorSecondsLeft(0);
    setShowSponsor(false);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveBookIndex(
        (current) =>
          (current - 1 + heroBookImages.length) % heroBookImages.length,
      );
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  const scrollToFeatured = () => {
    const featuredSection = document.getElementById("featured-books");

    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBookRated = (updatedBook) => {
    setFeatured((current) =>
      current.map((book) =>
        String(book.id) === String(updatedBook.id)
          ? { ...book, ...updatedBook }
          : book,
      ),
    );
  };

  return (
    <div>
      {/* hero section */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat hero-bg-animate"
        style={{ backgroundImage: "url('/image/hero-sponsor/hero.jpg')" }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-950/45" />
        
        {/* push up  */}
        {showSponsor && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 px-3 py-6 sm:px-6">
            <div className="relative h-[min(34rem,82vh)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20">
              <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={skipSponsor}
                  className="rounded-full bg-[#243a5f] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-[#1b2d49] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#243a5f]"
                >
                  Skip
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-white drop-shadow">
                  {String(sponsorSecondsLeft).padStart(2, "0")}s
                </span>
              </div>
              <img
                src={sponsorImages[sponsorIndex]}
                alt={`Sponsor ${sponsorIndex + 1}`}
                className="h-full w-full object-cover"
                //   className="h-full w-full object-cover"
                //   className="h-full w-full object-contain >>this original<<// "
                // />
              />
            </div>
          </div>
        )}

        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-24 md:flex-row md:py-32">
          <div className="flex-1">
            <span className="mb-6 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              📚 Welcome to BookStore
            </span>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-white text-3d md:text-6xl">
              Hello, The Heaven
              <br />
              <span className="text-yellow-300">Book Store</span>
            </h1>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-blue-100">
              There is nothing better than to read.
              <br />
              Find the book you're looking for easier to read and enjoy..
              <br />{" "}
              <span className="text-sm text-yellow-300 md:text-base">
                អានសៀវភៅមួយក្បាល សប្បាយចិត្តមួយទំហឹង &gt;&lt;
              </span>
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/about"
                className="rounded-xl border-2 border-white px-8 py-3 font-bold text-white transition-all duration-200 hover:bg-white hover:text-blue-600"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="flex w-full flex-1 justify-center md:justify-end">
            <div className="relative h-72 w-full max-w-[20rem] overflow-hidden sm:h-80 sm:max-w-[34rem] md:h-[24rem] md:max-w-[40rem]">
              {heroBookImages.map((image, index) => {
                const middle = Math.floor(heroBookImages.length / 2);
                const position =
                  ((index - activeBookIndex + heroBookImages.length + middle) %
                    heroBookImages.length) -
                  middle;
                const isActive = position === 0;
                const distance = Math.abs(position);
                const x = `calc(${position} * clamp(3.25rem, 12vw, 4.7rem))`;
                const scale = isActive ? 1.18 : distance === 1 ? 0.92 : 0.78;
                const opacity = distance > 2 ? 0 : 1;
                const rotation = position * 2.5;

                return (
                  <img
                    key={image}
                    src={image}
                    alt=""
                    aria-hidden="true"
                    className="absolute left-1/2 top-[46%] h-44 w-28 rounded-md object-cover shadow-2xl ring-1 ring-white/25 transition-all duration-700 ease-in-out sm:top-1/2 sm:h-64 sm:w-40 md:h-72 md:w-48"
                    style={{
                      opacity,
                      zIndex: heroBookImages.length - distance,
                      transform: `translate(-50%, -50%) translateX(${x}) scale(${scale}) rotate(${rotation}deg)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border px-6 py-4 text-center">
          {[
            ["10,000+", "Books Available", ""],
            ["500+", "Authors", "✍️"],
            ["50,000+", "Happy Readers", "😊"],
          ].map(([num, label, icon]) => (
            <div
              key={label}
              className="flex items-center justify-center gap-3 px-3 text-left"
            >
              {icon ? <div className="text-xl">{icon}</div> : null}
              <div>
                <p className="font-display text-2xl font-bold leading-none text-primary">
                  {num}
                </p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Picture cards section */}
      <section className="mx-auto max-w-7xl px-6 pt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {promoCards.map((card) => (
            <div
              key={card.title}
              className={`flex min-h-[190px] items-center justify-between overflow-hidden rounded-sm px-6 py-5 shadow-sm ${card.background}`}
            >
              <div className="max-w-[34%] text-white">
                <h3 className="font-display text-4xl font-bold leading-[0.95] tracking-tight">
                  {card.title}
                </h3>
                <button
                  type="button"
                  className="mt-6 bg-black/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/25"
                >
                  {card.cta}
                </button>
              </div>
              <div className="flex flex-1 justify-end">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-52 w-auto object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.28)]"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* featured books section */}
      <section id="featured-books" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl font-bold text-dark">
              Featured Books
            </h2>
          </div>
          <Link
            to="/books"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {featuredBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={onAddToCart}
                onBookRated={handleBookRated}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white p-8 text-center text-muted">
            No featured books yet.
          </div>
        )}
      </section>

      {/* Go Bookstore */}
      <section className="mx-auto max-w-7xl  px-6 pb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#243a5f] from-blue-600 to-sky-500 p-10 shadow-xl md:flex-row">
          <div>
            <h3 className="mb-2 font-display text-3xl font-bold text-white">
              Ready to start reading?
            </h3>
            <p className="text-blue-100">
              Join 50,000+ readers discovering new books every day.
            </p>
          </div>
          <Link
            to="/books"
            className="whitespace-nowrap rounded-xl bg-white px-8 py-3 font-bold text-blue-600 shadow-md transition-all hover:bg-yellow-300 hover:text-blue-800"
          >
            Browse All Books
          </Link>
        </div>
      </section>
    </div>
  );
}
