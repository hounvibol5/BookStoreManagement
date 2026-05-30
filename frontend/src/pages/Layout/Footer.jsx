import { Link } from "react-router-dom";

function SocialIcon({ href, label, title, hoverColorClass, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={title}
      target="_blank"
      rel="noreferrer"
      className={`group flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-current hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#243a5f] ${hoverColorClass}`}
    >
      {children}
    </a>
  );
}

function TikTokIcon() {
  const iconPath =
    "M448,209.9a210.1,210.1,0,0,1-122.8-39.3v178.7A162.6,162.6,0,1,1,185,188.3v89.2a74.6,74.6,0,1,0,52.2,71.2V0h88a121.2,121.2,0,0,0,1.9,22.2h0A122.2,122.2,0,0,0,381,93.1a121.4,121.4,0,0,0,67,20.1Z";

  return (
    <span className="relative block h-5 w-5">
      <svg
        aria-hidden="true"
        viewBox="0 0 448 512"
        className="absolute inset-0 h-5 w-5 opacity-0 transition duration-200 group-hover:translate-x-[-1px] group-hover:translate-y-[1px] group-hover:opacity-100"
      >
        <path d={iconPath} className="fill-[#25F4EE]" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 448 512"
        className="absolute inset-0 h-5 w-5 opacity-0 transition duration-200 group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:opacity-100"
      >
        <path d={iconPath} className="fill-[#FE2C55]" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 448 512"
        className="absolute inset-0 h-5 w-5 text-white transition duration-200 group-hover:text-black"
      >
        <path d={iconPath} className="fill-current" />
      </svg>
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#243a5f]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-4">
            <img
              src="/image/book store.png"
              alt="BookStore logo"
              className="h-14 w-14 rounded-xl bg-white object-contain p-1.5 shadow-md"
            />
            <span className="font-display text-4xl font-bold text-white">
              BookStore
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
            A thoughtful place to discover books across every genre, from
            beloved classics to the newest shelf-worthy releases.
          </p>
        </div>

        <nav aria-label="Store links">
          <h4 className="text-lg font-bold uppercase tracking-widest text-white">
            Explore
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Browse Books", "/books"],
              ["Authors", "/authors"],
              ["About", "/about"],
              ["Cart", "/cart"],
            ].map(([label, path]) => (
              <li key={path}>
                <Link
                  to={path}
                  className="font-semibold text-blue-100 transition hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account links">
          <h4 className="text-lg font-bold uppercase tracking-widest text-white">
            Account
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Login", "/login"],
              ["Create Account", "/register"],
            ].map(([label, path]) => (
              <li key={path}>
                <Link
                  to={path}
                  className="font-semibold text-blue-100 transition hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h4 className="text-lg font-bold uppercase tracking-widest text-white">
            Contact
          </h4>
          <address className="mt-4 space-y-3 text-sm not-italic leading-6 text-blue-100">
            <p>123 Library Lane, Reading, CA</p>
            <a
              href="mailto:hello@bookstore.com"
              className="block font-semibold transition hover:text-white"
            >
              hello@bookstore.com
            </a>
            <a
              href="tel:+15550001234"
              className="block font-semibold transition hover:text-white"
            >
              +1 (555) 000-1234
            </a>
          </address>

          <div className="mt-6 flex items-center gap-3">
            <SocialIcon
              href="https://www.facebook.com"
              label="Visit BookStore on Facebook"
              title="Facebook"
              hoverColorClass="hover:text-[#1877F2]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 512 512"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256c0 127.8 93.6 233.7 216 252.9V330h-65v-74h65v-56.4c0-64.2 38.2-99.6 96.8-99.6 28.1 0 57.4 5 57.4 5v63h-32.3c-31.8 0-41.7 19.8-41.7 40V256h71l-11.4 74h-59.6v178.9C418.4 489.7 512 383.8 512 256Z" />
              </svg>
            </SocialIcon>

            <SocialIcon
              href="https://www.instagram.com"
              label="Visit BookStore on Instagram"
              title="Instagram"
              hoverColorClass="hover:text-[#E4405F]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 448 512"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141Zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7Zm146.4-194.3c0 14.8-12 26.8-26.8 26.8s-26.8-12-26.8-26.8 12-26.8 26.8-26.8 26.8 12 26.8 26.8Zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9S352.4 35.2 316.5 33.4c-37-2.1-147.9-2.1-184.9 0-35.9 1.7-67.7 9.9-93.9 36.2S3.3 127.5 1.5 163.4c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2s34.4-58 36.2-93.9c2.1-37 2.1-147.8 0-184.8ZM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.6-9 132.1Z" />
              </svg>
            </SocialIcon>

            <SocialIcon
              href="https://www.tiktok.com"
              label="Visit BookStore on TikTok"
              title="TikTok"
              hoverColorClass="hover:text-black"
            >
              <TikTokIcon />
            </SocialIcon>

            <SocialIcon
              href="https://www.twitter.com"
              label="Visit BookStore on Twitter"
              title="Twitter"
              hoverColorClass="hover:text-[#1DA1F2]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 512 512"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M459.4 151.7c.3 4.5.3 9 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47 8.4 1 16.8 1.3 25.5 1.3 49.1 0 94.2-16.8 130.3-45.2-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.3-52.2-84.3-103.2v-1.3c13.9 7.8 30 12.6 47 13.3-28.1-18.8-46.5-50.7-46.5-86.9 0-19.1 5.2-36.8 14.2-52.2 51.6 63.5 129.3 105.2 216.3 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30 0 57.1 12.6 76.1 33 23.6-4.5 46.1-13.3 66.3-25.2-7.8 24.3-24.3 44.8-46.1 57.8 21-2.3 41.3-8.1 60.1-16.2-14.3 20.7-32.2 39.1-52.6 53.6Z" />
              </svg>
            </SocialIcon>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 bg-[#1d3152]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-blue-100 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} BookStore Management. All rights
            reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            <a href="mailto:hello@bookstore.com" className="hover:text-white">
              Support
            </a>
            <Link to="/about" className="hover:text-white">
              Our Story
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
