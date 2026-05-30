// src/pages/CartPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cart from "../../components/Cards/Cart";
import Order from "./ManagementDashboard/Order";
import { createOrder } from "../../services/api";
import { getStoredToken } from "../../utils/authStorage";

export default function CartPage({ cart, onRemove, onUpdateQty, onClearCart }) {
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [showOrders, setShowOrders] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  const openOrders = () => {
    if (!getStoredToken()) {
      navigate("/login");
      return;
    }

    setOrderMessage("");
    setShowOrders(true);
  };

  const handleCheckout = async () => {
    if (!getStoredToken()) {
      navigate("/login");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const items = cart.map((item) => ({
        book_id: item.id,
        quantity: item.qty,
      }));

      const res = await createOrder(items);
      onClearCart?.();
      setOrderMessage(`Order #${res.data.id} was created successfully.`);
      setShowOrders(true);
    } catch (err) {
      setCheckoutError(err.response?.data?.error || "Failed to create order");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (showOrders) {
    return (
      <Order
        initialMessage={orderMessage}
        backPath="/cart"
        backLabel="Back"
        onBack={() => setShowOrders(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex justify-end">
        <Link
          to="/cart"
          onClick={(event) => {
            event.preventDefault();
            openOrders();
          }}
          className="btn-outline inline-flex items-center justify-center"
        >
          Orders
        </Link>
      </div>
      <Cart
        cart={cart}
        onRemove={onRemove}
        onUpdateQty={onUpdateQty}
        onCheckout={handleCheckout}
        checkoutLoading={checkoutLoading}
        checkoutError={checkoutError}
      />
    </div>
  );
}
