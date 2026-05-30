import { forwardRef } from "react";

const variants = {
  primary: "btn-primary",
  outline: "btn-outline",
  ghost: "text-muted hover:text-primary hover:bg-blue-50 font-semibold transition-all duration-200",
  danger:
    "bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition-all duration-200",
};

const sizes = {
  sm: "px-4 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-3 text-base rounded-xl",
};

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Button = forwardRef(
  (
    {
      children,
      className = "",
      disabled = false,
      fullWidth = false,
      isLoading = false,
      size = "md",
      type = "button",
      variant = "primary",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={joinClasses(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap",
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? "Loading..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
