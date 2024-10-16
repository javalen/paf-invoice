const express = require("express");
const PocketBase = require("pocketbase/cjs");
require("cross-fetch/polyfill");
var moment = require("moment"); // require
const app = express();
app.set("view engine", "ejs");
require("dotenv").config();

const pbUrl = process.env.POCKET_BASE_URL;
const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);
let allClients = [];
const startTime = Date.now();

app.get("/createExceptions", (req, res) => {
  let day = new Date();
  let stamp = day.toLocaleDateString() + " " + day.toLocaleTimeString();
  console.log("Starting the InvoiceBuilder ", pbUrl, stamp);

  startInvoiceBuilder();

  res.json({ facilites: "Building Invoices...", pbUrl, stamp });
});

const startInvoiceBuilder = async () => {
  console.log("Starting the invioce builder......");
  count = 0;
  allClients = await getAllClients();

  const endD = Date.now();
  console.log(
    "Invoice Builder completed",
    endD,
    " taking ",
    endD - startTime,
    "ms"
  );
};

const getAllClients = async () => {
  try {
    const records = await pb.collection("client_invoice").getFullList({
      sort: "-created",
    });
    return records;
  } catch (error) {
    console.log("Error getting all clients");
  }
};

app.listen(3000);
