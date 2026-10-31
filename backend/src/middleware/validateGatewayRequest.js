// OpenAI format payload aur messages array ko bina kisi third-party library ke validate karte hain
function validateGatewayRequest(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: {
        message: "Request body must be a valid JSON object",
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  if (!body.model || typeof body.model !== "string" || body.model.trim().length === 0) {
    return res.status(400).json({
      error: {
        message: "Field 'model' is required and must be a non-empty string",
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({
      error: {
        message: "Field 'messages' is required and must be a non-empty array",
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  if (body.messages.length > 100) {
    return res.status(400).json({
      error: {
        message: "Field 'messages' exceeds maximum allowed limit of 100 items",
        type: "invalid_request_error",
        status: 400
      }
    });
  }

  const allowedRoles = ["user", "assistant", "system", "model"];

  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];

    if (!msg || typeof msg !== "object" || Array.isArray(msg)) {
      return res.status(400).json({
        error: {
          message: `Message at index ${i} must be a valid JSON object`,
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    if (!msg.role || typeof msg.role !== "string" || !allowedRoles.includes(msg.role.toLowerCase())) {
      return res.status(400).json({
        error: {
          message: `Message at index ${i} has invalid 'role'. Allowed roles: ${allowedRoles.join(", ")}`,
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: `Message at index ${i} must have a non-empty 'content' string`,
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    if (msg.content.length > 50000) {
      return res.status(400).json({
        error: {
          message: `Message at index ${i} 'content' exceeds maximum length of 50,000 characters`,
          type: "invalid_request_error",
          status: 400
        }
      });
    }
  }

  if (body.temperature !== undefined) {
    const temp = Number(body.temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return res.status(400).json({
        error: {
          message: "Field 'temperature' must be a number between 0.0 and 2.0",
          type: "invalid_request_error",
          status: 400
        }
      });
    }
  }

  if (body.max_tokens !== undefined) {
    const maxTokens = Number(body.max_tokens);
    if (!Number.isInteger(maxTokens) || maxTokens <= 0) {
      return res.status(400).json({
        error: {
          message: "Field 'max_tokens' must be a positive integer",
          type: "invalid_request_error",
          status: 400
        }
      });
    }
  }

  next();
}

module.exports = validateGatewayRequest;
