const UPLOAD_BASE_URL =
  import.meta.env.VITE_UPLOAD_URL ||
  "http://localhost/BookStore-Management/Backend/uploads";

export const fallbackBookCovers = [
  "/image/herobook/bk.jpeg",
  "/image/herobook/bk1.png",
  "/image/herobook/bk2.webp",
  "/image/herobook/bk3.jpg",
  "/image/herobook/bk4.png",
  "/image/herobook/fek.jpg",
  "/image/herobook/fek1.jpg",
  "/image/herobook/fek2.jpg",
  "/image/herobook/fek3.jpg",
  "/image/herobook/fek4.jpg",
  "/image/herobook/fek5.png",
  "/image/herobook/fek6.png",
  "/image/herobook/fek7.jpg",
  "/image/herobook/fek8.jpg",
  "/image/herobook/fek9.jpg",
  "/image/herobook/fek10.webp",
];

function hashString(value) {
  return Array.from(String(value || "book")).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
}

export function getCoverSrc(coverImage) {
  if (!coverImage) return "";
  if (/^(https?:|data:)/i.test(coverImage)) return coverImage;
  if (String(coverImage).startsWith("/")) return coverImage;

  return `${UPLOAD_BASE_URL}/${String(coverImage).replace(/^\/+/, "")}`;
}

export function getFallbackCoverSrc(book) {
  const source = `${book?.id || ""}-${book?.title || ""}-${book?.author || ""}`;
  const index = hashString(source) % fallbackBookCovers.length;

  return fallbackBookCovers[index];
}

export function getBookCoverSrc(book) {
  return getCoverSrc(book?.cover_image) || getFallbackCoverSrc(book);
}
