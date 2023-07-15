import express from "express";
import cors from "cors";

// Create express application
const port = 8081;
const app = express();

// Endable cross-origin resource sharing (CORS)
//
// CORS allows us to set what front-end URLs are allowed
// to access this API.
app.use(
  cors({
    // Allow all origins
    origin: true,
  })
);

// Enable JSON request parsing middleware
//
// Must be done before endpoints are defined.
app.use(express.json());

// Import and enable swagger documentation pages
import docsRouter from "./middleware/swagger-doc.js";
app.use(docsRouter);
// Import and use controllers
import userController from "./controllers/user.js";
app.use(userController);
import weatherController from "./controllers/weather.js";
app.use(weatherController);

// Import and use validation error handling middleware
import { validateErrorMiddleware } from "./middleware/validator.js";
app.use(validateErrorMiddleware);
// Start listening for API requests
app.listen(port, () => {
  console.log(`Express started on http://localhost:${port}`);
});
