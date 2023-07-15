import { ObjectId } from "mongodb";
import moment from "moment";
import { db } from "../database/mongodb.js";
import { Weather } from "./weatherObject.js";
import { farenheitToCelciusTrigger } from "../triggers/farenheitToCelciusTrigger.js";

export async function getAll() {
  // Get a collection of all the weather readings
  const allWeatherResults = await db.collection("readings").find().toArray();
  // Convert the collection of results into into a model object
  return allWeatherResults.map((weatherResults) => {
    return new Weather(weatherResults);
  });
}

export async function getByPage(page, size) {
  // Calculate page offset
  const offset = page * size;
  // Get the collection of weather readings on a given "page"
  const paginatedWeatherResults = await db
    .collection("readings")
    .find()
    .sort({ _id: 1 })
    .skip(offset)
    .limit(size)
    .toArray();
  return paginatedWeatherResults.map((weatherResults) => {
    return new Weather(weatherResults);
  });
}

export async function getReadingByID(readingID) {
  // Get a weather reading by ID
  const result = await db
    .collection("readings")
    .findOne({ _id: new ObjectId(readingID) });
  // Convert the result into a reading object
  if (result) {
    return Promise.resolve(result);
  } else Promise.reject("No weather reading found");
}

// Get weather readings by device name
export async function getReadingsByDeviceName(deviceName) {
  // Get a collection of all the weather readings for a given device
  const allWeatherResults = await db
    .collection("readings")
    .find({ "Device Name": deviceName })
    .toArray();
  // Convert the collection of results into into a model object
  return allWeatherResults.map((weatherResults) => {
    return new Weather(weatherResults);
  });
}

export async function createReading(reading) {
  farenheitToCelciusTrigger(reading);
  delete reading.id;
  return db
    .collection("readings")
    .insertOne(reading)
    .then((result) => {
      // Remove mongo id
      delete reading._id;
      // insert new id
      return { ...reading, id: result.insertedId.toString() };
    });
}

export async function createMany(readings) {
  return db
    .collection("readings")
    .insertMany(readings)
    .then((result) => {
      for (const reading of readings) {
        reading.id = reading._id.toString();
        delete reading._id;
      }
      return Promise.resolve(readings);
    });
}

export async function updateReading(reading) {
  // Need to convert id back to Mongodb recognised id and delete created object id
  const readingID = new ObjectId(reading.id);
  delete reading.id;
  // Create the update document
  const readingUpdateDocument = {
    $set: reading,
  };
  // Run the update query and return the resulting promise
  return db
    .collection("readings")
    .updateOne({ _id: readingID }, readingUpdateDocument);
}

// Replace reading with new reading by ID
export async function replaceReading(reading) {
  // Need to convert id back to Mongodb recognised id and delete created object id
  const readingID = new ObjectId(reading.id);
  delete reading.id;
  // Create the update document
  const readingUpdateDocument = reading;
  // Run the update query and return the resulting promise
  return db
    .collection("readings")
    .replaceOne({ _id: readingID }, readingUpdateDocument)
    .then((result) => {
      return Promise.resolve(reading);
    });
}

export async function deleteReadingById(readingID) {
  return db.collection("readings").deleteOne({ _id: new ObjectId(readingID) });
}

// Find the maximum precipitation for a given device in the last 5 months
export async function recentMaxPrecip(deviceName) {
  // find five months ago from "2020-12-07T03:34:05.000Z" and convert to a date object
  const fiveMonthsAgo = moment("2020-12-07T03:34:05.000Z")
    .subtract(5, "months")
    .toDate();

  // Find the maximum precipitation for the given device in the last 5 months
  const maxPrecipitationCursor = await db
    .collection("readings")
    .find({
      "Device Name": deviceName,
      Time: { $gte: fiveMonthsAgo },
    })
    .sort({ "Precipitation mm/h": -1 })
    .limit(1);

  const maxPrecipitation = await maxPrecipitationCursor.toArray();

  // Convert the result into a reading object
  return Promise.resolve(maxPrecipitation);
}

// Find a weather reading from dateTime and deviceName parameters and return the reading
export async function getWeatherReadingByDateTime(deviceName, time) {
  // Convert the dateTime into a Date object
  const date = new Date(time);
  // Find the maximum temperature for the given device in the last 5 months
  const readingCursor = await db
    .collection("readings")
    .find({ Time: date, "Device Name": deviceName })
    .limit(1)
    .project({
      "Temperature (°C)": 1,
      "Atmospheric Pressure (kPa)": 1,
      "Solar Radiation (W/m2)": 1,
      "Precipitation mm/h": 1,
    });

  const reading = await readingCursor.toArray();
  console.log(reading);

  // Convert the result into a reading object
  return Promise.resolve(reading);
}

// Find the maximum temperature recorded for all stations for a given start and finish Date/Time range
export async function getMaxTempByDateRange(startDate, endDate) {
  // Convert the start and end dates into Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Get the device names for all the weather stations
  const deviceNames = await db.collection("readings").distinct("Device Name");

  // Find the maximum temperature for the given device in the last 5 months
  const maxTempCursor = await db
    .collection("readings")
    .find({ Time: { $gte: start, $lte: end } })
    .sort({ "Temperature C": -1 })
    .project({
      "Device Name": 1,
      Time: 1,
      "Temperature (°C)": 1,
    })
    .limit(deviceNames.length);

  const maxTemp = await maxTempCursor.toArray();
  console.log(maxTemp);

  // Convert the result into a reading object
  return Promise.resolve(maxTemp);
}

// Get the latest three weather readings per device
export async function getLatestReadingsPerDevice() {
  // Get the device names for all the weather stations
  const deviceNames = await db.collection("readings").distinct("Device Name");

  // Get the latest three readings for each device
  const latestReadings = await Promise.all(
    deviceNames.map(async (deviceName) => {
      const latestReadingsCursor = await db
        .collection("readings")
        .find({ "Device Name": deviceName })
        .sort({ Time: -1 })
        .limit(deviceNames.length - 1);

      const latestReadings = await latestReadingsCursor.toArray();
      return latestReadings;
    })
  );
  // Convert the result into a reading object
  return Promise.resolve(latestReadings);
}

// Update a specific readings precipitation value to a given value
export async function updatePrecipitation(id, precipitation) {
  console.log(precipitation);
  return db
    .collection("readings")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { "Precipitation mm/h": precipitation } }
    );
}
