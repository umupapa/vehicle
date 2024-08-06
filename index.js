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

const fetchDataFromAPI = async () => {
  try {
    const response = await axios.get(process.env.API_URL, { timeout: 600000 });
    const groups = response.data[0];

    // Check if groups.items exists and is an array
    if (groups && groups.items && Array.isArray(groups.items)) {
      for (let i = 0; i < groups.items.length; i++) {
        const item = groups.items[i];
        const online = item.online !== undefined ? item.online : null;
        if (item?.device_data?.traccar) {
          const { id, name, lastValidLatitude, lastValidLongitude } =
            item.device_data.traccar;

          const unit =
            item.device_data.unit !== undefined ? item.device_data.unit : null;
          const office =
            item.device_data.office !== undefined
              ? item.device_data.office
              : null;

          // Delete existing entry before inserting new data
          await pool.query("DELETE FROM vehicles_data1 WHERE id = $1", [id]);

          // Insert new data into vehicles_data1 table
          await pool.query(
            `INSERT INTO vehicles_data1 (
              objectid, id, name, online, latitude, longitude, shape, unit, office)
              VALUES ($1, $2, $3, $4, $5, $6, sde.st_geometry('POINT(' || $7 || ' ' || $8 || ')', 4326), $9, $10)`,
            [
              id,
              id,
              name,
              online,
              lastValidLatitude,
              lastValidLongitude,
              lastValidLongitude,
              lastValidLatitude,
              unit,
              office,
            ]
          );

          console.log(
            `Item ID: ${id}, lastValidLatitude: ${lastValidLatitude}, lastValidLongitude: ${lastValidLongitude}, unit: ${unit}, office: ${office}`
          );
        }
      }
      console.log("Vehicles Data inserted successfully");
    } else {
      console.log("No items found in the response data.");
      console.log("Response keys:", Object.keys(groups));
    }
  } catch (error) {
    console.error("Error fetching or inserting data:", error);
  }
};

fetchDataFromAPI();
