require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const authLogger = require("./logger.js");

const syncRoutes = require("./routes/sync");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(authLogger);

app.use("/sync", syncRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error(err));
