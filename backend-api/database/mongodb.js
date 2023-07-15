import { MongoClient } from "mongodb";

const connectionString = "connectionString";

const client = new MongoClient(connectionString);

export const db = client.db("weather-api");
