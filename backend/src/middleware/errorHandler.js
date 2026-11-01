
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      type: "not_found_error",
      status: 404
    }
  });
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Something went wrong";
  let type = err.type || "server_error";

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400) {
    status = 400;
    message = "Invalid JSON request body";
    type = "invalid_request_error";
  }

  // MongoDB validation error
  else if (err.name === "ValidationError" || err.name === "CastError") {
    status = 400;
    message = err.message;
    type = "invalid_request_error";
  }

  // Hide internal server errors
  if (status >= 500) {
    console.error(err);
    message = "Internal server error";
  }

  res.status(status).json({
    error: {
      message,
      type,
      status
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
