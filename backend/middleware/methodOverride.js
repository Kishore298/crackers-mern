/**
 * Helper to handle HTTP method overrides via request body.
 * Essential for shared hosting (like MilesWeb) where PUT/DELETE/PATCH are blocked.
 * 
 * @param {Object} handlers - Mapping of methods to controller functions { PUT: updateX, DELETE: deleteX }
 * @returns {Function} Express middleware
 */
const handleMethodOverride = (handlers) => (req, res, next) => {
  const method = req.body._method;

  if (method && handlers[method]) {
    return handlers[method](req, res, next);
  }

  // If no method override or no handler for that method, proceed or error
  if (!method) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: `Invalid or unsupported method override: ${method}`,
  });
};

module.exports = { handleMethodOverride };
