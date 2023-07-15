import { Router } from "express";
import { validate } from "../middleware/validator.js";
import auth from "../middleware/auth.js";
import {
  getAll,
  getReadingByID,
  getReadingsByDeviceName,
  updateReading,
  replaceReading,
  deleteReadingById,
  createReading,
  createMany,
  recentMaxPrecip,
  getWeatherReadingByDateTime,
  getMaxTempByDateRange,
  updatePrecipitation,
  getByPage,
  getLatestReadingsPerDevice,
} from "../models/weatherReading-mdbs.js";
import { Weather } from "../models/weatherObject.js";

const weatherController = Router();

// Get all readings endpoint
weatherController.get("/readings", async (req, res) => {
  // #swagger.summary = 'Gets all weather readings'
  /* #swagger.requestBody = {
            description: "Gets all weather readings",
        } */
  const readings = await getAll();
  res.status(200).json({
    status: 200,
    message: "Get all readings",
    readings: readings,
  });
});

const getPaginatedReadingsSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      type: "string",
      pattern: "^[0-9]+$",
      minimum: 0,
    },
  },
};

weatherController.get(
  "/readings/paged/:page",
  validate({ params: getPaginatedReadingsSchema }),
  async (req, res) => {
    // #swagger.summary = 'Gets all weather readings in pages'
    const size = 5;
    const page = parseInt(req.params.page);
    const readings = await getByPage(page, size);
    res.status(200).json({
      status: 200,
      message: "Get paginated readings on page " + page,
      readings: readings,
    });
  }
);

// Get weather readings by ID endpoint
const getReadingsByIdSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

weatherController.get(
  "/readings/:id",
  validate({ params: getReadingsByIdSchema }),
  async (req, res) => {
    const readingID = req.params.id;
    // #swagger.summary = "Get a reading by id"
    /* #swagger.parameters['id'] = {
            description: "ID of the reading to get",
            in: "path",
            required: true,
            type: "string"
        } */
    await getReadingByID(readingID)
      .then((reading) => {
        res.status(200).json({
          status: 200,
          message: "Get reading by ID",
          reading: reading,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to get reading by ID",
        });
      });
  }
);

// Get weather readings by device name endpoint
const getReadingsByDeviceNameSchema = {
  type: "object",
  required: ["deviceName"],
  properties: {
    deviceName: {
      type: "string",
    },
  },
};

weatherController.get(
  "/readings/device/:deviceName",
  validate({ params: getReadingsByDeviceNameSchema }),
  async (req, res) => {
    const deviceName = req.params.deviceName;
    // #swagger.summary = "Get a reading by device name"
    /* #swagger.parameters['deviceName'] = {
            description: "Device name of the reading to get",
            in: "path",
            required: true,
            type: "string"
        } */
    await getReadingsByDeviceName(deviceName)
      .then((reading) => {
        res.status(200).json({
          status: 200,
          message: "Get reading by device name",
          reading: reading,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to get reading by device name",
        });
      });
  }
);

// Create reading endpoint
const postCreateReadingSchema = {
  type: "object",
  required: ["authenticationKey"],
  properties: {
    deviceName: {
      type: "string",
    },
    precipitation: {
      type: "number",
    },
    time: {
      type: "string",
    },
    latitude: {
      type: "number",
    },
    longitude: {
      type: "number",
    },
    temperature: {
      type: "number",
    },
    atmosphericPressure: {
      type: "number",
    },
    windSpeed: {
      type: "number",
    },
    solarRadiation: {
      type: "number",
    },
    vaporPressure: {
      type: "number",
    },
    humidity: {
      type: "number",
    },
    windDirection: {
      type: "number",
    },
  },
};

weatherController.post(
  "/readings",
  [auth(["admin", "teacher"]), validate({ body: postCreateReadingSchema })],
  (req, res) => {
    // #swagger.summary = "Create a reading document"
    /* #swagger.requestBody = {
            description: "Creates a weather document",
            content: {
                'application/json': {
                    schema: {
                        authenticationKey: 'string',
                        "Device Name": "Brisbane_Sensor",
                        "Precipitation mm/h": 0.085,
                        "Time": "2021-05-07T03:44:04.000+00:00",
                        "Latitude": 152.77891,
                        "Longitude": -26.95064,
                        "Temperature (°C)": 23.07,
                        "Atmospheric Pressure (kPa)": 128.02,
                        "Max Wind Speed (m/s)": 3.77,
                        "Solar Radiation (W/m2)": 290.5,
                        "Vapor Pressure (kPa)": 1.72,
                        "Humidity (%)": 71.9,
                        "Wind Direction (°)": 163.3,
                    },
                    example: {
                        authenticationKey: '12345',
                        "Device Name": "Brisbane_Sensor",
                        "Precipitation mm/h": 0.085,
                        "Time": "2021-05-07T03:44:04.000+00:00",
                        "Latitude": 152.77891,
                        "Longitude": -26.95064,
                        "Temperature (°C)": 23.07,
                        "Atmospheric Pressure (kPa)": 128.02,
                        "Max Wind Speed (m/s)": 3.77,
                        "Solar Radiation (W/m2)": 290.5,
                        "Vapor Pressure (kPa)": 1.72,
                        "Humidity (%)": 71.9,
                        "Wind Direction (°)": 163.3,
                    }
                }
            }
        } */
    // Get the weather reading from the request body
    const reading = req.body;

    createReading(reading)
      .then((reading) => {
        res.status(200).json({
          status: 200,
          message: "Create weather reading document",
          reading: reading,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Create reading failed",
        });
      });
  }
);

const createManyReadingsSchema = {
  type: "object",
  required: ["authenticationKey", "readings"],
  properties: {
    authenticationKey: {
      type: "string",
    },
    readings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          deviceName: {
            type: "string",
          },
          precipitation: {
            type: "number",
          },
          time: {
            type: "string",
          },
          latitude: {
            type: "number",
          },
          longitude: {
            type: "number",
          },
          temperature: {
            type: "number",
          },
          atmosphericPressure: {
            type: "number",
          },
          windSpeed: {
            type: "number",
          },
          solarRadiation: {
            type: "number",
          },
          vaporPressure: {
            type: "number",
          },
          humidity: {
            type: "number",
          },
          windDirection: {
            type: "number",
          },
        },
      },
    },
  },
};

weatherController.post(
  "/readings/many",
  [auth(["admin", "teacher"]), validate({ body: createManyReadingsSchema })],
  (req, res) => {
    // #swagger.summary = 'Creates many readings'
    /* #swagger.requestBody = {
          description: "Adds new readings from an array of documents",
          content: {
              'application/json': {
                  schema: {
                    authenticationKey: 'string',
                      readings: 'array',
                  },
                  example: {
                    authenticationKey: '12345',
                    readings: [
                      {
                              "Device Name": "Brisbane_Sensor",
                              "Precipitation mm/h": 0.085,
                              "Time": "2021-05-07T03:44:04.000+00:00",
                              "Latitude": 152.77891,
                              "Longitude": -26.95064,
                              "Temperature (°C)": 23.07,
                              "Atmospheric Pressure (kPa)": 128.02,
                              "Max Wind Speed (m/s)": 3.77,
                              "Solar Radiation (W/m2)": 290.5,
                              "Vapor Pressure (kPa)": 1.72,
                              "Humidity (%)": 71.9,
                              "Wind Direction (°)": 163.3,
                          },
                          {
                              "Device Name": "Brisbane_Sensor",
                              "Precipitation mm/h": 0.085,
                              "Time": "2021-05-07T03:44:04.000+00:00",
                              "Latitude": 152.77891,
                              "Longitude": -26.95064,
                              "Temperature (°C)": 23.07,
                              "Atmospheric Pressure (kPa)": 128.02,
                              "Max Wind Speed (m/s)": 3.77,
                              "Solar Radiation (W/m2)": 290.5,
                              "Vapor Pressure (kPa)": 1.72,
                              "Humidity (%)": 71.9,
                              "Wind Direction (°)": 163.3,
                          },
                          {
                              "Device Name": "Brisbane_Sensor",
                              "Precipitation mm/h": 0.085,
                              "Time": "2021-05-07T03:44:04.000+00:00",
                              "Latitude": 152.77891,
                              "Longitude": -26.95064,
                              "Temperature (°C)": 23.07,
                              "Atmospheric Pressure (kPa)": 128.02,
                              "Max Wind Speed (m/s)": 3.77,
                              "Solar Radiation (W/m2)": 290.5,
                              "Vapor Pressure (kPa)": 1.72,
                              "Humidity (%)": 71.9,
                              "Wind Direction (°)": 163.3,
                          },
                          {
                              "Device Name": "Brisbane_Sensor",
                              "Precipitation mm/h": 0.085,
                              "Time": "2021-05-07T03:44:04.000+00:00",
                              "Latitude": 152.77891,
                              "Longitude": -26.95064,
                              "Temperature (°C)": 23.07,
                              "Atmospheric Pressure (kPa)": 128.02,
                              "Max Wind Speed (m/s)": 3.77,
                              "Solar Radiation (W/m2)": 290.5,
                              "Vapor Pressure (kPa)": 1.72,
                              "Humidity (%)": 71.9,
                              "Wind Direction (°)": 163.3,
                        },
                        {
                              "Device Name": "Brisbane_Sensor",
                              "Precipitation mm/h": 0.085,
                              "Time": "2021-05-07T03:44:04.000+00:00",
                              "Latitude": 152.77891,
                              "Longitude": -26.95064,
                              "Temperature (°C)": 23.07,
                              "Atmospheric Pressure (kPa)": 128.02,
                              "Max Wind Speed (m/s)": 3.77,
                              "Solar Radiation (W/m2)": 290.5,
                              "Vapor Pressure (kPa)": 1.72,
                              "Humidity (%)": 71.9,
                              "Wind Direction (°)": 163.3,
                        }
                      ],
                    }
                  }
                }
              } */
    // Get the list of reading data out of the request
    const readings = req.body.readings;

    // Use the create model function to insert this animal into the DB
    createMany(readings)
      .then((readings) => {
        res.status(200).json({
          status: 200,
          message: "Created readings",
          readings: readings,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to create readings",
        });
      });
  }
);

// Put weather reading document by id
const putUpdateReadingSchema = {
  type: "object",
  required: [
    "authenticationKey",
    "Device Name",
    "Precipitation mm/h",
    "Time",
    "Latitude",
    "Longitude",
    "Temperature (°C)",
    "Atmospheric Pressure (kPa)",
    "Max Wind Speed (m/s)",
    "Solar Radiation (W/m2)",
    "Vapor Pressure (kPa)",
    "Humidity (%)",
    "Wind Direction (°)",
  ],
  properties: {
    deviceName: {
      type: "string",
    },
    precipitation: {
      type: "number",
    },
    time: {
      type: "string",
    },
    latitude: {
      type: "number",
    },
    longitude: {
      type: "number",
    },
    temperature: {
      type: "number",
    },
    atmosphericPressure: {
      type: "number",
    },
    windSpeed: {
      type: "number",
    },
    solarRadiation: {
      type: "number",
    },
    vaporPressure: {
      type: "number",
    },
    humidity: {
      type: "number",
    },
    windDirection: {
      type: "number",
    },
  },
};

// Put weather reading document by request body id endpoint
weatherController.put(
  "/readings/:id",
  [auth(["admin", "teacher"]), validate({ body: putUpdateReadingSchema })],
  (req, res) => {
    // #swagger.summary = "Update a reading document by id"
    /* #swagger.parameters['id'] = {
            in: 'path',
            description: 'The id of the reading to update',
            required: true,
            type: 'string'
        } */
    /* #swagger.requestBody = {
            description: "Updates a weather document by id",
            content: {
                'application/json': {
                    schema: {
                        authenticationKey: 'string',
                        deviceName: 'string',
                        precipitation: 'number',
                        time: 'string',
                        latitude: 'number',
                        longitude: 'number,',
                        temperature: 'number',
                        atmosphericPressure: 'number',
                        windSpeed: 'number',
                        solarRadiation: 'number',
                        vaporPressure: 'number',
                        humidity: 'number',
                        windDirection: 'number',
                    },
                    example: {
                        authenticationKey: '12345',
                        "Device Name": "Brisbane_Sensor",
                        "Precipitation mm/h": 0.085,
                        "Time": "2021-05-07T03:44:04.000+00:00",
                        "Latitude": 152.77891,
                        "Longitude": -26.95064,
                        "Temperature (°C)": 23.07,
                        "Atmospheric Pressure (kPa)": 128.02,
                        "Max Wind Speed (m/s)": 3.77,
                        "Solar Radiation (W/m2)": 290.5,
                        "Vapor Pressure (kPa)": 1.72,
                        "Humidity (%)": 71.9,
                        "Wind Direction (°)": 163.3,
                    }
                }
            }
        } */
    // Get the list of reading data out of the request
    const reading = req.body;

    return replaceReading(reading).then((updatedReading) => {
      if (updatedReading) {
        res.status(200).json({
          status: 200,
          message: "Updated reading",
          reading: updatedReading,
        });
      } else {
        res
          .status(200)
          .json({
            status: 200,
            message:
              "Weather reading document updated but no changes were made",
          })

          .catch((error) => {
            console.log(error);
            res.status(500).json({
              status: 500,
              message: "Failed to update reading",
            });
          });
      }
    });
  }
);

// Patch update reading document endpoint
const patchUpdateReadingSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
    deviceName: {
      type: "string",
    },
    precipitation: {
      type: "number",
    },
    time: {
      type: "string",
    },
    latitude: {
      type: "number",
    },
    longitude: {
      type: "number",
    },
    temperature: {
      type: "number",
    },
    atmosphericPressure: {
      type: "number",
    },
    windSpeed: {
      type: "number",
    },
    solarRadiation: {
      type: "number",
    },
    vaporPressure: {
      type: "number",
    },
    humidity: {
      type: "number",
    },
    windDirection: {
      type: "number",
    },
  },
};

weatherController.patch(
  "/readings",
  [auth(["admin", "teacher"]), validate({ body: patchUpdateReadingSchema })],
  (req, res) => {
    // #swagger.summary = "Update a reading document by id"
    /* #swagger.requestBody = {
            description: "Updates a weather document by id",
            content: {
                'application/json': {
                    schema: {
                        authenticationKey: 'string',
                        id: 'string',
                        deviceName: 'string',
                        precipitation: 'number',
                        time: 'string',
                        latitude: 'number',
                        longitude: 'number,',
                        temperature: 'number',
                        atmosphericPressure: 'number',
                        windSpeed: 'number',
                        solarRadiation: 'number',
                        vaporPressure: 'number',
                        humidity: 'number',
                        windDirection: 'number',
                    },
                    example: {
                        authenticationKey: '12345',
                        id: 'string',
                        "Device Name": "Brisbane_Sensor",
                        "Precipitation mm/h": 0.085,
                        "Time": "2021-05-07T03:44:04.000+00:00",
                        "Latitude": 152.77891,
                        "Longitude": -26.95064,
                        "Temperature (°C)": 23.07,
                        "Atmospheric Pressure (kPa)": 128.02,
                        "Max Wind Speed (m/s)": 3.77,
                        "Solar Radiation (W/m2)": 290.5,
                        "Vapor Pressure (kPa)": 1.72,
                        "Humidity (%)": 71.9,
                        "Wind Direction (°)": 163.3,
                    }
                }
            }
        } */
    // Get weather reading from request body
    const reading = req.body;

    return updateReading(reading).then((updatedReading) => {
      if (updatedReading.modifiedCount > 0) {
        res.status(200).json({
          status: 200,
          message: "Updated weather reading document",
          reading: updatedReading,
        });
      } else {
        res
          .status(200)
          .json({
            status: 200,
            message:
              "Weather reading document updated but no changes were made",
          })
          .catch((error) => {
            res.status(500).json({
              status: 500,
              message: "Failed to update reading",
            });
          });
      }
    });
  }
);

// Delete reading endpoint
const deleteReadingByIDSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

weatherController.delete(
  "/readings/:id",
  [auth(["admin"]), validate({ params: deleteReadingByIDSchema })],
  (req, res) => {
    // #swagger.summary = "Delete a reading document by id"
    /* #swagger.requestBody = {
            description: "Deletes a weather document",
            content: {
                'application/json': {
                    schema: {
                        authenticationKey: 'string',
                    },
                    example: {
                        authenticationKey: '12345',
                    }
                }
            }
        } */
    const readingID = req.params.id;
    deleteReadingById(readingID)
      .then((reading) => {
        res.status(200).json({
          status: 200,
          message: "Weather reading document deleted",
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to delete reading by ID",
        });
      });
  }
);

const getMaxPrecipBySensorSchema = {
  type: "object",
  properties: {
    deviceName: {
      type: "string",
    },
  },
};

// Endpoint to get the maximum precipitation recorded in the last 5 months for a specific sensor
weatherController.get(
  "/max-precipitation/device/:deviceName",
  validate({ params: getMaxPrecipBySensorSchema }),
  async (req, res) => {
    // #swagger.summary = 'Get the max precipitation over the last 5 months for a specific device'
    /* #swagger.requestBody = {
      description: "Get the max precipitation over the last 5 months for a specific device",
    } */
    const deviceName = req.params.deviceName;
    await recentMaxPrecip(deviceName)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Maximum precipitation recorded in the last 5 months for sensor ${deviceName}`,
          result: result,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to get max precipitation",
        });
      });
  }
);

const getTempAtmPressRadPrecipSchema = {
  type: "object",
  properties: {
    deviceName: {
      type: "string",
    },
    time: {
      type: "string",
    },
  },
};

// Endpoint to find and return the temperature, atmospheric pressure, radiation, and precipitation for a specific sensor at a specific date and time
weatherController.get(
  "/readings/device/:deviceName/time/:time",
  validate({ params: getTempAtmPressRadPrecipSchema }),
  async (req, res) => {
    // #swagger.summary = 'Get the temperature, atmospheric pressure, radiation, and precipitation for a specific sensor at a specific date and time'
    /* #swagger.parameters['deviceName'] = {
      description: 'The name of the device',
      type: 'string',
    } */
    /* #swagger.parameters['time'] = {
      description: 'The date and time of the reading',
      type: 'string',
    } */
    const deviceName = req.params.deviceName;
    const time = req.params.time;
    await getWeatherReadingByDateTime(deviceName, time)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Temperature, atmospheric pressure, radiation, and precipitation for sensor ${deviceName} at ${time}`,
          result: result,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message:
            "Failed to get temperature, atmospheric pressure, radiation, and precipitation",
        });
      });
  }
);

// Find the maximum Temp(C) recorded for all stations for a given Date / Time range (start and finish date) returning the Sensor Name, reading date / time and the Temperature value
const getMaxTempByDateRangeSchema = {
  type: "object",
  required: ["startDate", "endDate"],
  properties: {
    startDate: {
      type: "string",
    },
    endDate: {
      type: "string",
    },
  },
};

weatherController.get(
  "/max-temp/:startDate/:endDate",
  validate({ params: getMaxTempByDateRangeSchema }),
  (req, res) => {
    // #swagger.summary = 'Get the maximum temperature recorded for all stations for a given date range'
    /* #swagger.requestBody = {
      description: "Get the maximum temperature recorded for all stations for a given date range",
      content: {
        'application/json': {
        }
      }
    } */
    const startDate = req.params.startDate;
    const endDate = req.params.endDate;

    getMaxTempByDateRange(startDate, endDate)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Maximum temperature recorded for all stations for a given date range`,
          result: result,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to get max temperature",
        });
      });
  }
);

// Get the latest three weather readings per device endpoint
weatherController.get("/latest-readings", (req, res) => {
  // #swagger.summary = 'Get the latest three weather readings per device'
  /* #swagger.requestBody = {
    description: "Get the latest three weather readings per device",
    content: {
      'application/json': {
      }
    }
  } */
  getLatestReadingsPerDevice()
    .then((result) => {
      res.status(200).json({
        status: 200,
        message: "Latest three weather readings per device",
        result: result,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Failed to get latest readings",
      });
    });
});

// Update a specific readings precipitation value to a given value
const updatePrecipitationSchema = {
  type: "object",
  required: ["id", "Precipitation mm/h", "authenticationKey"],
  properties: {
    id: {
      type: "string",
    },
    "Precipitation mm/h": {
      type: "number",
    },
    authenticationKey: {
      type: "string",
    },
  },
};

weatherController.patch(
  "/updatePrecipitation",
  [auth(["admin"]), validate({ body: updatePrecipitationSchema })],
  async (req, res) => {
    // #swagger.summary = "Update a specific readings precipitation value to a given value"
    /* #swagger.requestBody = {
      description: "Updates a specific readings precipitation value to a given value",
      content: {
        'application/json': {
          schema: {
            id: 'string',
            "Precipitation mm/h": 'number',
            authenticationKey: 'string'
          },
          example: {
            id: '63f7081c830c4626a8eac308',
            "Precipitation mm/h": 0.085,
            authenticationKey: '0ec6cd91-ad1c-4c60-9e51-cc1b32a11f6a',
          }
        }
      }
    } */
    const id = req.body.id;
    console.log(id);
    const Precipitation = req.body["Precipitation mm/h"];
    console.log(Precipitation);
    return updatePrecipitation(id, Precipitation)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: "Updated precipitation",
          reading: result,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to update precipitation",
        });
      });
  }
);

export default weatherController;
