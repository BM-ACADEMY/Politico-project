// src/utils/customToast.js
import { toast } from "react-toastify";

export const showToast = (type = "info", message = "", options = {}) => {
  const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  };

  switch (type) {
    case "success":
      toast.success(message, toastOptions);
      break;
    case "error":
      toast.error(message, toastOptions);
      break;
    case "info":
      toast.info(message, toastOptions);
      break;
    case "warn":
    case "warning":
      toast.warn(message, toastOptions);
      break;
    default:
      toast(message, toastOptions);
      break;
  }
};