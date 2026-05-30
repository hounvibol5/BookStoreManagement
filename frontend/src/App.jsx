// src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./pages/Layout/Navbar";
import Footer from "./pages/Layout/Footer";
import Home from "./pages/MenuPages/Home";
import Books from "./pages/MenuPages/Books";
import BookDetails from "./pages/MenuPages/BookDetails";
import Overview from "./pages/MenuPages/ManagementDashboard/Overview";
import AddBook from "./pages/MenuPages/ManagementDashboard/AddBook";
import EditBook from "./pages/MenuPages/ManagementDashboard/EditBook";
import CartPage from "./pages/MenuPages/CartPage";
import About from "./pages/MenuPages/About";
import Author from "./pages/MenuPages/Author";
import AuthorDetails from "./pages/MenuPages/AuthorDetails";
import Login from "./pages/MenuPages/Login";
import Register from "./pages/MenuPages/Register";
import Profile from "./pages/MenuPages/Profile";
import Order from "./pages/MenuPages/ManagementDashboard/Order";
import Customer from "./pages/MenuPages/ManagementDashboard/Customer";
import Inventory from "./pages/MenuPages/ManagementDashboard/Inventory";
import Reports from "./pages/MenuPages/ManagementDashboard/Reports";

function getAvailableStock(book) {
  const stock = Number(book?.stock);
  return Number.isFinite(stock) ? stock : Infinity;
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-[#111111] text-white shadow-[0_14px_35px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:bg-[#3b3026] focus:outline-none focus:ring-4 focus:ring-[#8b5e34]/25 ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

function Notification({ notification }) {
  if (!notification) return null;

  const isError = notification.type === "error";

  return (
    <div
      className="fixed right-4 top-24 z-50 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-white px-4 py-3 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
            isError ? "bg-red-600" : "bg-emerald-600"
          }`}
          aria-hidden="true"
        >
          {isError ? "!" : "✓"}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-dark">{notification.title}</p>
          {notification.message && (
            <p className="mt-0.5 text-sm text-muted">{notification.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [notification]);

  const showNotification = (nextNotification) => {
    setNotification({ id: Date.now(), ...nextNotification });
  };

  const addToCart = (book) => {
    const stock = getAvailableStock(book);
    const title = book?.title || "This book";

    if (stock <= 0) {
      showNotification({
        type: "error",
        title: "Out of stock",
        message: `${title} is not available right now.`,
      });
      return;
    }

    const existing = cart.find((item) => item.id === book.id);

    if (existing) {
      if (existing.qty >= stock) {
        showNotification({
          type: "error",
          title: "Stock limit reached",
          message: `Only ${stock} ${
            stock === 1 ? "copy" : "copies"
          } of ${title} ${stock === 1 ? "is" : "are"} available.`,
        });
        return;
      }

      const nextQty = Math.min(existing.qty + 1, stock);

      setCart((prev) =>
        prev.map((item) =>
          item.id === book.id ? { ...item, qty: nextQty } : item,
        ),
      );
      showNotification({
        type: "success",
        title: "Added to cart",
        message: `${title} quantity is now ${nextQty}.`,
      });
      return;
    }

    setCart((prev) => [...prev, { ...book, qty: 1 }]);
    showNotification({
      type: "success",
      title: "Added to cart",
      message: `${title} was added to your cart.`,
    });
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((item) => item.id !== id));

  const clearCart = () => setCart([]);

  const updateQty = (id, qty) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }

    setCart((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item];

        const nextQty = Math.min(qty, getAvailableStock(item));
        return nextQty < 1 ? [] : [{ ...item, qty: nextQty }];
      }),
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar cartCount={cartCount} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home onAddToCart={addToCart} />} />
            <Route path="/books" element={<Books onAddToCart={addToCart} />} />
            <Route
              path="/books/:id"
              element={<BookDetails onAddToCart={addToCart} />}
            />
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/dashboard/overview" element={<Overview />} />
            <Route path="/dashboard/books" element={<AddBook />} />
            <Route path="/dashboard/orders" element={<Order />} />
            <Route path="/dashboard/customers" element={<Customer />} />
            <Route path="/dashboard/inventory" element={<Inventory />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/customers" element={<Customer />} />
            <Route path="/edit-book/:id" element={<EditBook />} />
            <Route
              path="/cart"
              element={
                <CartPage
                  cart={cart}
                  onRemove={removeFromCart}
                  onUpdateQty={updateQty}
                  onClearCart={clearCart}
                />
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/authors" element={<Author />} />
            <Route
              path="/authors/:authorName"
              element={<AuthorDetails onAddToCart={addToCart} />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTopButton />
        <Notification notification={notification} />
      </div>
    </BrowserRouter>
  );
}
