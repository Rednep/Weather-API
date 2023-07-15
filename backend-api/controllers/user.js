import { Router } from "express";
import { User } from "../models/user.js";
import { validate } from "../middleware/validator.js";
import bcrypt from "bcryptjs";
import { v4 as uuid4 } from "uuid";
import auth from "../middleware/auth.js";
import {
  getAll,
  getByID,
  getByEmail,
  getByAuthenticationKey,
  createUser,
  updateUser,
  deleteByID,
  getOldestLogin,
  deleteInactiveUsers,
  deleteManyByIDs,
  updateAccessLevel,
} from "../models/user-mdbs.js";
import { ObjectId } from "mongodb";

const userController = Router();

// User login endpoint
const postUserLoginSchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: {
      // pattern: "^[a-zA-Z0-9]+@[a-zA-Z0-9]+.[a-zA-Z0-9]+$",
      type: "string",
    },
    password: {
      type: "string",
    },
  },
};

userController.post(
  "/users/login",
  [validate({ body: postUserLoginSchema })],
  (req, res) => {
    // #swagger.summary = "Logs in the user"
    /* #swagger.requestBody = {
            description: "Logs in the user",
            content: {
                'application/json': {
                    schema: {
                        email: 'string',
                        password: 'string',
                    },
                    example: {
                        email: 'example@email.com',
                        password: 'password',
                    }
                }
            }
        } */
    const loginData = req.body;

    getByEmail(loginData.email)
      .then((user) => {
        // Compare users email and password with the databases
        if (bcrypt.compareSync(loginData.password, user.password)) {
          // Generate the authenication key for the logged in user
          user.authenticationKey = uuid4().toString();

          // Store the users updated login info back into the database
          updateUser(user).then((result) => {
            // Send the authentication key back to the user
            res.status(200).json({
              status: 200,
              message: "user logged in",
              authenticationKey: user.authenticationKey,
            });
          });
        } else {
          // If the password doesn't match then send back error
          res.status(400).json({
            status: 400,
            message: "Invalid credentials",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Login failed",
        });
      });
  }
);

// User logout endpoint
const postUserLogoutSchema = {
  type: "object",
  required: ["authenticationKey"],
  properties: {
    authenticationKey: {
      type: "string",
    },
  },
};

userController.post(
  "/users/logout",
  validate({ body: postUserLogoutSchema }),
  (req, res) => {
    // #swagger.summary = "Logs out the user"
    /* #swagger.requestBody = {
            description: "Logs out the user",
            content: {
                'application/json': {
                    schema: {
                       authenticationKey: '88f76721-ff89-46f2-ac3a-c0c8a24d5625',
                    },
                    example: {
                        authenticationKey: '88f76721-ff89-46f2-ac3a-c0c8a24d5625',
                    }
                }
            }
        } */
    const authenticationKey = req.body.authenticationKey;
    getByAuthenticationKey(authenticationKey)
      .then((user) => {
        user.authenticationKey = null;
        updateUser(user).then((user) => {
          res.status(200).json({
            status: 200,
            message: "User logged out",
          });
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to logout user",
        });
      });
  }
);

const getAllUsersSchema = {
  type: "object",
  required: ["authenticationKey"],
  properties: {
    authenticationKey: {
      type: "string",
    },
  },
};

// Get all users endpoint
userController.get(
  "/users/:authenticationKey",
  [validate({ params: getAllUsersSchema }), auth(["admin"])],
  async (req, res) => {
    // #swagger.summary = "Get all users"
    /* #swagger.description: "Gets all the users",
            
        } */

    const users = await getAll();
    res.status(200).json({
      status: 200,
      message: "user list",
      users: users,
    });
  }
);

// Get user by ID endpoint
const getUserByIdSchema = {
  type: "object",
  required: ["id", "authenticationKey"],
  properties: {
    id: {
      type: "string",
    },
    authenticationKey: {
      type: "string",
    },
  },
};

userController.get(
  "/users/:id/:authenticationKey",
  [auth(["admin"]), validate({ params: getUserByIdSchema })],
  (req, res) => {
    // #swagger.summary = "Get a user by id"
    /* #swagger.requestBody = {
            description: "Gets a user by id",
        } */

    const userID = req.params.id;
    getByID(userID)
      .then((user) => {
        res.status(200).json({
          status: 200,
          message: "Get user by ID",
          user: user,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to get user by ID",
        });
      });
  }
);

// Get user by authentication key endpoint
const getUserByAuthenticationKeySchema = {
  type: "object",
  required: ["authenticationKey"],
  properties: {
    authenticationKey: {
      type: "string",
    },
  },
};

userController.get(
  "/users/get-by/:authenticationKey",
  validate({ params: getUserByAuthenticationKeySchema }),
  (req, res) => {
    const userAuthKey = req.params.authenticationKey;
    // #swagger.summary = "Get a user by authentication key"
    /* #swagger.requestBody = {
            description: "Gets a user by their authenticaion key",
        } */
    getByAuthenticationKey(userAuthKey)
      .then((user) => {
        res.status(200).json({
          status: 200,
          message: "Get user by Authentication Key",
          user: user,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to get user by authentication key",
        });
      });
  }
);

// Create user endpoint
const postCreateUserSchema = {
  type: "object",
  required: ["email", "password", "role", "firstName", "lastName"],
  properties: {
    email: {
      type: "string",
    },
    password: {
      type: "string",
    },
    role: {
      type: "string",
    },
    firstName: {
      type: "string",
    },
    lastName: {
      type: "string",
    },
  },
};

userController.post(
  "/users",
  [auth(["admin"]), validate({ body: postCreateUserSchema })],
  (req, res) => {
    // #swagger.summary = "Create a user"
    /* #swagger.requestBody = {
            description: "Creates a user",
            content: {
                'application/json': {
                    schema: {
                        email: 'string',
                        password: 'string',
                        role: 'string',
                        firstName: 'string',
                        lastName: 'string,',
                        authenticationKey: 'string'
                    },
                    example: {
                        email: 'student@email.com',
                        password: 'abc123',
                        role: 'student',
                        firstName: 'test',
                        lastName: 'test',
                        authenticationKey: 'authKey',
                    }
                }
            }
        } */

    // Get the user data from the request body
    const userData = req.body;
    // Hash the password if it isn't already
    if (!userData.password.startsWith("$2a")) {
      userData.password = bcrypt.hashSync(userData.password);
    }
    // Convert the user data into the User model object
    const user = User(
      null,
      userData.email,
      userData.password,
      userData.role,
      userData.firstName,
      userData.lastName,
      null
    );
    createUser(user)
      .then((user) => {
        res.status(200).json({
          status: 200,
          message: "User created",
          user: user,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Create user failed",
        });
      });
  }
);

// Update user endpoint
const patchUpdateUserSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
    email: {
      type: "string",
    },
    password: {
      type: "string",
    },
    role: {
      type: "string",
    },
    firstName: {
      type: "string",
    },
    lastName: {
      type: "string",
    },
  },
};

userController.patch(
  "/users",
  [auth(["admin"]), validate({ body: patchUpdateUserSchema })],
  (req, res) => {
    // #swagger.summary = "Update a user by id"
    /* #swagger.requestBody = {
            description: "Updates a user by id",
            content: {
                'application/json': {
                    schema: {
                        id: 'string',
                        email: 'string',
                        password: 'string',
                        role: 'string',
                        firstName: 'string',
                        lastName: 'string,',
                        authenticationKey: 'string'
                    },
                    example: {
                        id: '640ea49386348c3384bb4419',
                        email: 'student@email.com',
                        password: 'abc123',
                        role: 'student',
                        firstName: 'test',
                        lastName: 'test',
                        authenticationKey: 'authKey',
                    }
                }
            }
        } */

    // Get user data from request body
    const userData = req.body;
    // Hash the users password if it hasn't been already
    if (!userData.password.startsWith("$2a")) {
      userData.password = bcrypt.hashSync(userData.password);
    }

    // Convert the user data into a User model object
    const user = User(
      userData.id,
      userData.email,
      userData.password,
      userData.role,
      userData.firstName,
      userData.lastName,
      null
    );
    // Update the user using model function and add to database
    updateUser(user)
      .then((user) => {
        res.status(200).json({
          status: 200,
          message: "User updated successfully",
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "User update failed",
        });
      });
  }
);

// Delete user endpoint
const deleteUserByIDSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

userController.delete(
  "/users/:id",
  [auth(["admin"]), validate({ params: deleteUserByIDSchema })],
  (req, res) => {
    // #swagger.summary = "Delete a user by id"
    /* #swagger.requestBody = {
            description: "Deletes a single user",
            content: {
                'application/json': {
                    schema: {
                        authenticationKey: 'string'
                    },
                    example: {
                        authenticationKey: 'authKey',
                    }
                }
            }
        } */

    const userID = req.params.id;
    deleteByID(userID)
      .then((user) => {
        res.status(200).json({
          status: 200,
          message: "Deleted user by ID",
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to delete user by ID",
        });
      });
  }
);

// Get all users from last login first endpoint
userController.get("/usersLastLogin", (req, res) => {
  // #swagger.summary = "Get all users from last login first"
  getOldestLogin()
    .then((users) => {
      res.status(200).json({
        status: 200,
        message: "users retrieved by oldest login first",
        users: users,
      });
    })
    .catch((error) => {
      res.status(500).json({
        status: 500,
        message: "Failed to retrieve users by oldest login first",
      });
    });
});

const deleteInactiveUserSchema = {
  type: "object",
  required: ["authenticationKey"],
  properties: {
    authenticationKey: {
      type: "string",
    },
  },
};

userController.delete(
  "/users",
  [auth(["admin"]), validate({ body: deleteInactiveUserSchema })],
  (req, res) => {
    // #swagger.summary = "Delete users that haven't logged in for more than 30 days"
    /* #swagger.requestBody = {
            description: "Authenticaion key required to delete many",
            content: {
                'application/json': {
                  schema: {
                    },
                    example: {
                        authenticationKey: '88f76721-ff89-46f2-ac3a-c0c8a24d5625',
                    }
                }
            }
        } */
    deleteInactiveUsers()
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Deleted ${result.deletedCount} inactive users`,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to delete inactive users",
        });
      });
  }
);

// Delete many users by id endpoint
const deleteManyUsersSchema = {
  type: "object",
  required: ["ids", "authenticationKey"],
  properties: {
    ids: {
      type: "array",
      items: {
        type: "string",
      },
    },
    authenticationKey: {
      type: "string",
    },
  },
};

userController.delete(
  "/deleteUsers",
  [auth(["admin"]), validate({ body: deleteManyUsersSchema })],
  (req, res) => {
    // #swagger.summary = "Delete many users by id"
    /* #swagger.requestBody = {
      description: "Deletes many users by id",
      content: {
        'application/json': {
          schema: {
            ids: ['string'],
            authenticationKey: 'string'
          },
          example: {
            authenticationKey: '0ec6cd91-ad1c-4c60-9e51-cc1b32a11f6a',
            ids: ['640ea49386348c3384bb4419', '640ea49386348c3384bb4419'],
          },
        },
      },
    } */
    const ids = req.body.ids;
    deleteManyByIDs(ids)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Deleted ${result.deletedCount} users`,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to delete users",
        });
      });
  }
);

// Update access level for at least two users in the same query, based on a date range in which the users were created endpoint
const updateAccessLevelSchema = {
  type: "object",
  required: ["role", "authenticationKey", "startDate", "endDate"],
  properties: {
    role: {
      type: "string",
    },
    authenticationKey: {
      type: "string",
    },
    startDate: {
      type: "string",
    },
    endDate: {
      type: "string",
    },
  },
};

userController.patch(
  "/updateAccessLevel",
  validate({ body: updateAccessLevelSchema }),
  (req, res) => {
    // #swagger.summary = "Update access level for at least two users in the same query, based on a date range in which the users were created"
    /* #swagger.requestBody = {
      description: "Updates access level for at least two users in the same query, based on a date range in which the users were created",
      content: {
        'application/json': {
          schema: {
            role: 'string',
            authenticationKey: 'string',
            startDate: 'string',
            endDate: 'string'
          },
          example: {
            role: 'admin',
            authenticationKey: '4f7ecabb-dbc8-4f9f-9749-f4cfba6fa68e',
            startDate: '27/01/2023',
            endDate: '29/01/2023',
          },
        },
      },
    } */

    // Get the ObjectId timestamp of the users and console.log it
    // const ReqStartDate = new Date(req.body.startDate);
    // const localStartDateString = ReqStartDate.toLocaleString();
    // const slicedStartDate = localStartDateString.slice(
    //   0,
    //   localStartDateString.indexOf(",")
    // );
    const startDate = req.body.startDate;

    // const ReqEndDate = new Date(req.body.endDate);
    // const localEndDateString = ReqEndDate.toLocaleString();
    // const slicedEndDate = localEndDateString.slice(
    //   0,
    //   localEndDateString.indexOf(",")
    // );
    const endDate = req.body.endDate;

    const role = req.body.role;

    updateAccessLevel(startDate, endDate, role)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: "Updated access level",
          result: result,
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(404).json({
          status: 404,
          message: "Students cannot be updated to admin",
        });
      });
  }
);

export default userController;
