import { ObjectId } from "mongodb";
import { db } from "../database/mongodb.js";
import { User } from "./user.js";
import moment from "moment";
import { updateAccessTrigger } from "../triggers/update-access-level-trigger.js";

// username: Database-user | Password: Ew2smkUGrJZOMsJJ

export async function getAll() {
  // Get the collection of all users
  const allUserResults = await db.collection("users").find().toArray();
  // Convert the collection of results into a list of User objects
  return allUserResults.map((userResult) =>
    User(
      userResult._id.toString(),
      userResult.email,
      userResult.password,
      userResult.role,
      userResult.firstName,
      userResult.lastName,
      userResult.lastLogin,
      userResult.authenticationKey
    )
  );
}

export async function getByID(userID) {
  // Get one user by ID
  let userResult = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userID) });

  // Convert the result into a User object
  if (userResult) {
    return Promise.resolve(
      User(
        userResult._id.toString(),
        userResult.email,
        userResult.password,
        userResult.role,
        userResult.firstName,
        userResult.lastName,
        userResult.lastLogin,
        null
      )
    );
  } else {
    return Promise.reject("No user found");
  }
}

export async function getByEmail(email) {
  const now = new Date();
  await db
    .collection("users")
    .updateOne({ email }, { $set: { lastLogin: now } });
  // Get one matching user
  let userResult = await db.collection("users").findOne({ email });
  // Update the lastLoginDate field in the user document

  // Convert the result into a User object
  if (userResult) {
    return Promise.resolve(
      User(
        userResult._id.toString(),
        userResult.email,
        userResult.password,
        userResult.role,
        userResult.firstName,
        userResult.lastName,
        userResult.lastLogin,
        userResult.authenticationKey
      )
    );
  } else {
    return Promise.reject("no user found");
  }
}

export async function getByAuthenticationKey(authenticationKey) {
  // Get a matching user by authentication key
  let userResult = await db.collection("users").findOne({ authenticationKey });

  // Convert the results into a user object
  if (userResult) {
    return Promise.resolve(
      User(
        userResult._id.toString(),
        userResult.email,
        userResult.password,
        userResult.role,
        userResult.firstName,
        userResult.lastName,
        userResult.lastLogin,
        userResult.authenticationKey
      )
    );
  } else {
    return Promise.reject("No user found");
  }
}

export async function createUser(user) {
  // Delete user ID as one should not exist
  delete user.id;
  // Create a field called createdDate to store only the date the user was created and not the time
  // const date = new Date();
  // const localDateString = date.toLocaleString();
  // const slicedDate = localDateString.slice(0, localDateString.indexOf(","));
  user.createdDate = new Date();
  // Insert a new user object
  return db
    .collection("users")
    .insertOne(user)
    .then((result) => {
      delete user._id;
      return { ...user, id: result.insertedId.toString() };
    });
}

export async function updateUser(user) {
  // Need to convert id back to Mongodb recognised id and delete created object id
  const userID = new ObjectId(user.id);
  delete user.id;
  // Create the update document
  const userUpdateDocument = {
    $set: user,
  };
  // Run the update query and return the resulting promise
  return db.collection("users").updateOne({ _id: userID }, userUpdateDocument);
}

export async function deleteByID(userID) {
  return db.collection("users").deleteOne({ _id: new ObjectId(userID) });
}

// Get a list of users from oldest login to newest login utilising an index
export async function getOldestLogin() {
  return db.collection("users").find().sort({ lastLogin: 1 }).toArray();
}

// Delete all users that have not logged in for 30 days
export async function deleteInactiveUsers() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db.collection("users").deleteMany({
    lastLogin: { $lt: thirtyDaysAgo },
  });
}

// Delete many users by object ID
export async function deleteManyByIDs(ids) {
  return db.collection("users").deleteMany({
    _id: { $in: ids.map((id) => new ObjectId(id)) },
  });
}

// Update access level for at least two users in the same query, based on a date range in which the users were created
export async function updateAccessLevel(startDate, endDate, role) {
  const start = moment(startDate, "DD/MM/YYYY").toDate();
  const end = moment(endDate, "DD/MM/YYYY").toDate();
  // Get the value of the role field from the document between the startDate and endDate
  const documentRole = await db
    .collection("users")
    .find({ createdDate: { $gte: start, $lte: end } })
    .toArray();
  console.log(documentRole);

  // updateAccessTrigger to prevent students from being updated to admin
  const userRoleArray = await updateAccessTrigger(documentRole);
  console.log(`userRoleArray: ${userRoleArray}`);
  // if updateAccessTrigger returns true, run the updateMany query
  if (userRoleArray === true) {
    return Promise.resolve(
      db
        .collection("users")
        .updateMany(
          { createdDate: { $gte: start, $lte: end } },
          { $set: { role } }
        )
    );
  } else {
    return Promise.reject("Students cannot be updated to admin");
  }
}
