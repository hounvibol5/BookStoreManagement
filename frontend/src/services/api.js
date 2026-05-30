import axios from "axios";
import { getStoredToken } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getBooks = (params = {}) =>
  api.get("/books/get_books.php", { params });

export const getBook = (id) =>
  api.get("/books/get_book.php", { params: { id } });

export const addBook = (book) => api.post("/books/add_book.php", book);

export const updateBook = (id, book) =>
  api.put("/books/update_book.php", book, { params: { id } });

export const rateBook = (id, rating) =>
  api.post("/books/rate_book.php", { rating }, { params: { id } });

export const deleteBook = (id) =>
  api.delete("/books/delete_book.php", { params: { id } });

export const getCategories = () => api.get("/categories/get_categories.php");

export const addCategory = (category) =>
  api.post("/categories/add_category.php", category);

export const getCustomers = (params = {}) =>
  api.get("/customers/get_customers.php", { params });

export const getInventory = (params = {}) =>
  api.get("/inventory/get_inventory.php", { params });

export const getOverview = (params = {}) =>
  api.get("/reports/get_overview.php", { params });

export const getDashboardNav = () => api.get("/reports/get_dashboard_nav.php");

export const getReports = (params = {}) =>
  api.get("/reports/get_reports.php", { params });

export const login = (credentials) => api.post("/auth/login.php", credentials);

export const register = (details) => api.post("/auth/register.php", details);

export const updateProfile = (profile) =>
  api.put("/auth/update_profile.php", profile);

export const createOrder = (items) =>
  api.post("/orders/create_order.php", { items });

export const cancelOrder = (id) => api.post("/orders/cancel_order.php", { id });

export const payOrder = (id) => api.post("/orders/pay_order.php", { id });

export const getOrders = (params = {}) =>
  api.get("/orders/get_orders.php", { params });

export const getOrder = (id) =>
  api.get("/orders/get_order.php", { params: { id } });

export default api;
