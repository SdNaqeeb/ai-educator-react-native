export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return (
          data.message || data.error || "Bad request. Please check your input."
        );
      case 401:
        return "Authentication failed. Please log in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 422:
        return data.message || "Validation error. Please check your input.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      case 502:
        return "Bad gateway. Please try again later.";
      case 503:
        return "Service unavailable. Please try again later.";
      default:
        return (
          data.message ||
          data.error ||
          `Server error (${status}). Please try again.`
        );
    }
  } else if (error.request) {
    // Network error
    return "Network error. Please check your internet connection.";
  } else {
    // Other error
    return error.message || "An unexpected error occurred.";
  }
};

export const handleApiError = (error, showAlert = true) => {
  const message = getErrorMessage(error);
  console.error("API Error:", error);

  if (showAlert) {
    // In React Native, we'll use Alert instead of browser alert
    // This will be imported in components that use it
    return message;
  }

  return message;
};

export const logError = (error, context = "") => {
  console.error(`Error ${context}:`, {
    message: error.message,
    stack: error.stack,
    response: error.response?.data,
    status: error.response?.status,
  });
};
