import { getByAuthenticationKey } from "../models/user-mdbs.js";

export default function auth(allowed_roles) {
  return function (req, res, next) {
    // Check the body and the query string for an authentication key
    const authenticationKey =
      req.body.authenticationKey ??
      req.query.authenticationKey ??
      req.params.authenticationKey;

    // Check that an auth key was actually included in the body
    if (authenticationKey) {
      // Look up the user by the auth key
      getByAuthenticationKey(authenticationKey)
        .then((user) => {
          // If the matching user has the required role
          if (allowed_roles.includes(user.role)) {
            // Allow them to pass (next())
            next();
          } else {
            // Send back an access forbidden response
            res.status(403).json({
              status: 403,
              message: "Access forbidden",
            });
          }
        })
        .catch((error) => {
          // No user found - invalid or expired key?
          res.status(401).json({
            status: 401,
            message: "Authentication key invalid or expired",
          });
        });
    } else {
      res.status(401).json({
        status: 401,
        message: "Authentication key missing from request",
      });
    }
  };
}
