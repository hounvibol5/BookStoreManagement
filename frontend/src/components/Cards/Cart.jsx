// src/components/Cart.jsx

const UPLOAD_BASE_URL =
  import.meta.env.VITE_UPLOAD_URL ||
  "http://localhost/BookStore-Management/Backend/uploads";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function getCoverSrc(coverImage) {
  if (!coverImage) return "";
  if (/^(https?:|data:)/i.test(coverImage)) return coverImage;
  if (String(coverImage).startsWith("/")) return coverImage;

  return `${UPLOAD_BASE_URL}/${String(coverImage).replace(/^\/+/, "")}`;
}

function getInitials(title) {
  return String(title || "Book")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getItemPrice(item) {
  const price = Number.parseFloat(item.price);
  return Number.isFinite(price) ? price : 0;
}

function getItemStock(item) {
  const stock = Number(item.stock);
  return Number.isFinite(stock) ? stock : Infinity;
}

export default function Cart({
  cart,
  onRemove,
  onUpdateQty,
  onCheckout,
  checkoutLoading = false,
  checkoutError = "",
}) {
  const totalItemsCount = cart.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );
  const subtotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item) * Number(item.qty || 0),
    0,
  );
  const totalShipping = cart.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );
  const totalBeforeTax = subtotal + totalShipping;
  const taxRate = 0;
  const estTax = totalBeforeTax * taxRate;
  const orderTotal = totalBeforeTax + estTax;
  const purchaseDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 text-muted">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-primary">
          0
        </div>
        <p className="text-xl font-display">Your cart is empty</p>
        <p className="text-sm mt-2">Browse books and add them to your cart</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">
        Review your order
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const coverSrc = getCoverSrc(item.cover_image);
            const stock = getItemStock(item);
            const isMaxQty = item.qty >= stock;

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded p-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex gap-4 flex-1">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={item.title}
                        className="h-24 w-24 rounded bg-gray-50 object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded bg-blue-50 font-display text-xl font-bold text-primary">
                        {getInitials(item.title)}
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500">{item.author}</p>
                      <p className="text-red-700 font-bold text-sm">
                        {currency.format(getItemPrice(item))}
                      </p>

                      <div className="flex items-center gap-2 pt-2 text-xs">
                        <span className="text-gray-600 font-medium">
                          Quantity: {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          disabled={isMaxQty}
                          className="text-blue-600 hover:underline hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                        >
                          Buy More
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          className="text-blue-600 hover:underline hover:text-blue-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 shadow-sm lg:sticky lg:top-6">
          <h3 className="font-bold text-base text-gray-900 mb-3">
            Order Summary
          </h3>

          <div className="space-y-2 text-xs text-gray-600 pb-3 border-b border-gray-200">
            <div className="flex justify-between gap-4">
              <span>Purchase date:</span>
              <span className="text-right">{purchaseDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Items ({totalItemsCount}):</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping & handling:</span>
              <span>{currency.format(totalShipping)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-100 font-medium text-gray-900">
              <span>Total before tax:</span>
              <span>{currency.format(totalBeforeTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated tax:</span>
              <span>{currency.format(estTax)}</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline py-4 text-red-700 font-bold">
            <span className="text-base">Order total:</span>
            <span className="text-xl">{currency.format(orderTotal)}</span>
          </div>

          {checkoutError && (
            <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {checkoutError}
            </p>
          )}

          <button
            type="button"
            onClick={onCheckout}
            disabled={checkoutLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md shadow-sm border border-blue-700 font-medium text-sm transition-colors text-center disabled:cursor-not-allowed disabled:bg-blue-300 disabled:border-blue-300"
          >
            {checkoutLoading ? "Placing order..." : "Place your order"}
          </button>
        </div>
      </div>
    </div>
  );
}
