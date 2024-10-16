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
let allPlans = [];
let paidModules = [];
const startTime = Date.now();

app.get("/buildInvoices", (req, res) => {
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
  allPlans = await getAllPlans();
  paidModules = await getPaidModules();
  console.log("retrieved ", allClients.length, " clients");

  for (const client of allClients) {
    console.log("Client", client.name);
    // Get the plan for each client
    const plan = getClientPlan(client.id);

    // Get the paid modules for each client
    const clientModules = getClientModules(client.id);
    const now = new Date();
    const from = new Date();
    from.setDate(1);
    from.setMonth(from.getMonth() - 1);
    const to = new Date();
    to.setDate(0);
    //to.setMonth(to.getMonth() - 1);
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + 14);
    console.log(
      "Client",
      client.name,
      "Plan",
      plan.name,
      "Modules",
      clientModules
    );
    const total = getTotals(plan, clientModules.pm);
    try {
      const data = {
        name: `Paf-${
          client.name
        }-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`,
        date_from: new Date(from),
        date_to: new Date(to),
        invoice_number: new Date().getTime(),
        due_date: dueDate,
        issue_date: now,
        paid_modules: JSON.stringify(clientModules),
        client_name: client.name,
        status: "Billed",
        client_id: client.id,
        plan: plan.id,
        sub_total: `$${total}.00`,
        total: `$${total}.00`,
        plan_price: `$${plan.cost}.00`,
      };

      const record = await pb.collection("client_invoice").create(data);
    } catch (error) {
      console.log("Error Creating invoice", error);
    }
  }

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
    const records = await pb.collection("client").getFullList({
      sort: "-created",
    });
    return records;
  } catch (error) {
    console.log("Error getting all clients", error);
  }
};

const getAllPlans = async () => {
  try {
    const records = await pb.collection("plans").getFullList({
      sort: "-created",
    });
    return records;
  } catch (error) {
    console.log("Error retrieving plans", error);
  }
};

const getPaidModules = async () => {
  try {
    const records = await pb.collection("modules").getFullList({
      sort: "-created",
    });
    return records;
  } catch (error) {
    console.log("Error retrieving plans", error);
  }
};

const getClientPlan = (id) => {
  for (const plan of allPlans) {
    if (plan.clients.includes(id)) return plan;
  }
};

const getClientModules = (id) => {
  let clientModules = [];
  for (const module of paidModules) {
    if (module.clients.includes(id)) {
      clientModules.push(module);
    }
  }

  let jsonArr = [];
  for (mod of clientModules) {
    jsonArr.push({ cost: mod.price, name: mod.name });
  }
  return { pm: jsonArr };
};

const getTotals = (plan, modules) => {
  let total = plan.cost;

  for (mod of modules) {
    total += mod.cost;
  }
  return total;
};

app.listen(3000);
