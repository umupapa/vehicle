require("dotenv").config();
const { Pool } = require("pg");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// console.log(pool);

const fetchDataFromAPI = async () => {
  try {
    const response = await axios.get(process.env.API_URL, { timeout: 600000 });
    const groups = response.data;

    for (let i = 0; i < groups.items.length; i++) {
      const item = groups.items[i];
      if (item?.device_data?.traccar) {
        const { id, name, lastValidLatitude, lastValidLongitude } =
          item.device_data.traccar;
        pool.query(
          `INSERT INTO vehicles_data (
              id, name, latitude, longitude, shape)
              VALUES ($1, $2, $3, $4, $5)`,
          [id, name, lastValidLatitude, lastValidLongitude, "circle"]
        );
        console.log(
          `Item ID: ${id}, lastValidLatitude: ${lastValidLatitude}, lastValidLongitude: ${lastValidLongitude}`
        );
      }
    }

    console.log("Vehicles Data inserted successfully");
  } catch (error) {
    console.error("Error fetching or inserting data:", error);
  }
};

fetchDataFromAPI();
