function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      type: "not_found_error",
      status: 404
    }
  });
}

function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: {
        message: "Malformed JSON payload in request body",
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: {
        message: messages.join("; "),
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: {
        message: `Invalid resource identifier: ${err.value}`,
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  const status = Number.isInteger(err.status) ? err.status : (Number.isInteger(err.statusCode) ? err.statusCode : 500);
  const type = err.type || (status >= 500 ? "server_error" : "invalid_request_error");
  const message = status >= 500
    ? (err.isOperational ? err.message : "An internal server error occurred")
    : (err.message || "Request failed");

  if (status >= 500) {
    console.error(`[Internal Error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  return res.status(status).json({
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
