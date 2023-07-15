# Climate Data RESTful API with MongoDB 🌍

Welcome to the repository for Climate Data RESTful API project, a large-scale API designed to interact and manipulate a vast dataset of raw climate data. This project was developed in collaboration with a fictional educational institution for use in student projects.

As a Software/Web Developer, this project demanded comprehensive data handling skills, as well as user management, focusing primarily on Authentication and Authorization.

## Project Overview 📋

The primary function of this API is to enable interaction with raw climate data collected in areas of QLD via a distributed Internet of Things Sensor network. Two primary collections were defined in MongoDB - 'Weather Data' and 'Users'. 

### Key Features & Functionality 🔑

- **Data Manipulation**: Facilitate the creation, retrieval, updating, and deletion of data points in both the 'Weather Data' and 'Users' collections.
- **User Management**: Provide varying levels of access to different types of users (admin, teacher and student accounts).
- **Efficient Data Handling**: Utilize MongoDB's partitioning capabilities for effective storage and retrieval of data across a distributed setup.
- **Data Constraints**: Indexing, Time-To-Live (TTL) settings, and Triggers have been configured to meet project requirements.
- **Security**: Data encryption, user authentication, and secure connections between the API and the database.

## Technical Stack 💻

This RESTful API was built using Node.js and Express, with MongoDB as the database. The API uses bcryptjs for hashing and validating passwords, cors to manage Cross-Origin Resource Sharing, express-json-validator-middleware for request validation, and moment for date manipulations. Swagger-ui-express and swagger-autogen are used for API documentation, and UUID for generating unique identifiers.

The Climate Data RESTful API with MongoDB project encapsulates a range of abilities and provides a scalable solution for data handling. Explore the project files and feel free to provide feedback. The project is designed to be a part of a continuous learning process, and your input is most welcome!
