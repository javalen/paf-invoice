const express = require("express");
const PocketBase = require("pocketbase/cjs");
//const { exceptoins } = require('./exceptions');
require("cross-fetch/polyfill");
const app = express();
app.set("view engine", "ejs");
const MAX_RECORD = 10000;
const users = false;
const allExceptions = false;
const dailyChecks = false;
const dailyCheckRpt = false;
const divUser = false;
const divisions = false;
const exceptions = false;
const facInspectSched = false;
const faciilities = false;
const facCompliance = false;
const facExceptions = false;
const facInspections = false;
const facSafetyDoc = false;
const maintRecords = false;
const maintSchedules = false;
const messages = false;
const notes = false;
const personel = false;
const svcComps = false;
const svcHistory = false;
const subSys = false;
const createInSvcDte = false;
const mapFacility = false;
const mapRole = false;
const mapFacToPerson = false;
const fac_ids = ["185zk3mot68gji6"];
const byId = true;

const pb = new PocketBase("https://predictiveaf-dev.fly.dev/");
const pbTo = new PocketBase("https://predictive-af.fly.dev/");
pb.autoCancellation(false);
pbTo.autoCancellation(false);

app.get("/migrate", (req, res) => {
  console.log("Starting migration");

  if (users) migrateUsers();
  if (allExceptions) migrateAllExceptions();
  if (dailyChecks) migrateDailyChecks();
  if (dailyCheckRpt) migrateDailyCheckRpt();
  if (divUser) migrateDailyDivisionUser();
  if (divisions) migrateDailyDivisions();
  if (exceptions) migrateExceptions();
  if (facInspectSched) migrateFacInspSched();
  if (faciilities) migrateFacilities();
  if (facCompliance) migrateFacCompliance();
  if (facExceptions) migrateFacExceptions();
  if (facInspections) migrateFacInspection();
  if (facSafetyDoc) migrateFacSafetyDoc();
  if (maintRecords) migrateMaintRecords();
  if (maintSchedules) migrateMainSchedules();
  if (messages) migrateMessaages();
  if (notes) migrateNotes();
  if (personel) migratePersonel();
  if (svcComps) migrateSvComps();
  if (svcHistory) migrateSvcHistory();
  if (subSys) migrateSubsys();
  if (createInSvcDte) createInSvcDate();
  if (mapFacility) mapFacilityToSubSys();
  if (mapRole) mapPersonelToRole();
  if (mapFacToPerson) mapPersonelToFacility();
  if (byId) migrateSafetyDocByFacId();
  res.json("Migration working...");
});

const mapPersonelToRole = async () => {
  try {
    console.log("Starting");
    const roles = await pb.collection("roles").getFullList();

    const personel = await pb.collection("personel").getFullList();

    for (const role of roles) {
      const data = {};
      data.in_role = personel.filter((val) => val.role.includes(role.code));
      //console.log("Data", data);
      const record = await pb.collection("roles").update(role.id, data);
    }

    console.log("All Done");
  } catch (error) {
    console.log("Error processing mapFacilityToSubSys", error);
  }
};

const mapPersonelToFacility = async () => {
  try {
    console.log("Starting");
    const facilities = await pb.collection("facility").getFullList();

    const personel = await pb.collection("personel").getFullList();

    for (const person of personel) {
      const data = {};
      data.facility =
        person.fac_id.length > 5
          ? facilities.find((x) => x.id === person.fac_id).id
          : null;
      //console.log("Data", data);
      const record = await pb.collection("personel").update(person.id, data);
    }

    console.log("All Done");
  } catch (error) {
    console.log("Error processing mapPersonelToFacility", error);
  }
};

const mapFacilityToSubSys = async () => {
  try {
    console.log("Starting");
    const facilities = await pb.collection("facility").getFullList();

    const systems = await pb.collection("subsys").getFullList();

    for (const sys of systems) {
      const data = {};
      data.facility = facilities.find((x) => x.id === sys.fac_id).id;
      const record = await pb.collection("subsys").update(sys.id, data);
    }

    console.log("All Done");
  } catch (error) {
    console.log("Error processing mapFacilityToSubSys", error);
  }
};

function randomDate(start, end, startHour, endHour) {
  try {
    var date = new Date(+start + Math.random() * (end - start));
    console.log("Date", date);
    // var hour = (startHour + Math.random() * (endHour - startHour)) | 0;
    // date.setHours(hour);
    return date.toISOString();
  } catch (error) {
    console.log("Error with date", error);
  }
}

const createInSvcDate = async () => {
  try {
    const records = await pb.collection("exceptions").getFullList();
    console.log("Records[", records.length, "]");
    records.forEach(async (rec) => {
      if (rec.exception_date === "") {
        //console.log("Record", rec);
        const date = randomDate(1704067200000, 1717027200000, "12:00:00");
        const data = new FormData();
        data.append("exception_date", date);
        //console.log("new rec", data);
        setTimeout(async () => {
          const record = await pb.collection("exceptions").update(rec.id, data);
          console.log("Done", record);
        }, 1000);
      }
    });
  } catch (error) {
    console.log("Error", error);
  }
};

const migrateUsers = async () => {
  try {
    const records = await pb.collection("users").getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      data.append("id", rec.id);
      data.append("username", rec.username);
      data.append("email", rec.email);
      data.append("emailVisibility", true);
      data.append("password", "11111");
      data.append("passwordConfirm", "11111");
      data.append("name", rec.name);
      data.append("phone", rec.phone);
      data.append("temp_password", rec.temp_password);
      data.append("lst_login", rec.lst_login);
      data.append("lock_out", rec.lock_out);

      let file = await createFile(rec.avatar, pb.files.getUrl(rec, rec.avatar));

      data.append("avatar", file);
      const record = await pbTo.collection("users").create(data);
    });
  } catch (error) {
    console.log("Error migrating ", db, error);
  }
};

const migrateAllExceptions = async () => {
  const table = "all_exceptions";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      data.append("id", rec.id);
      data.append("code", rec.code);
      data.append("message", rec.message);
      data.append("name", rec.name);
      data.append("description", rec.description);
      data.append("type", rec.type);
      const record = await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateDailyChecks = async () => {
  const table = "daily_check";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        data.append("id", rec.id);
        data.append("system", rec.system);
        data.append("facility", rec.facility);
        data.append("type", rec.type);
        data.append("isException", rec.isException);
        data.append("target_screen", rec.target_screen);
        data.append("check_for", rec.check_for);
        data.append("nick_name", rec.nick_name);
        data.append("icon", rec.icon);
        data.append("icon_color", rec.icon_color);
        console.log("Writing record", index);
        await pbTo.collection(table).create(data);
      }, index * 250);
      console.log(table, " DONE");
    });
  } catch (error) {
    console.log("Error migrating daily_check", error);
  }
};

const migrateDailyCheckRpt = async () => {
  const table = "daily_check_rpt";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      data.append("id", rec.id);
      data.append("user_name", rec.user_name);
      data.append("user_id", rec.user_id);
      data.append("check_passed", rec.check_passed);
      data.append("type", rec.type);
      data.append("type_id", rec.type_id);
      data.append("type_name", rec.type_name);

      await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateDailyDivisionUser = async () => {
  const table = "division_user";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      data.append("id", rec.id);
      data.append("division_id", rec.division_id);
      data.append("user_id", rec.user_id);

      await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateDailyDivisions = async () => {
  const table = "divisions";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      data.append("id", rec.id);
      data.append("name", rec.name);
      data.append("state", rec.state);

      await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateExceptions = async () => {
  const table = "exceptions";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        data.append("id", rec.id);
        data.append("code", rec.code);
        data.append("message", rec.message);
        data.append("screen", rec.screen);
        data.append("type", rec.type);
        data.append("fac_id", rec.fac_id);
        data.append("priority", rec.priority);
        data.append("icon", rec.icon);
        data.append("active", rec.active);
        data.append("system_id", rec.system_id);
        data.append("sys_name", rec.sys_name);
        data.append("payload", rec.payload);
        data.append("icon_color", rec.icon_color);
        data.append("due_today", rec.due_today);
        console.log("Writing record", index);
        await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating exceptions", error);
  }
};

const migrateFacInspSched = async () => {
  const table = "fac_inspection_sched";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        data.append("id", rec.id);
        data.append("inspector_id", rec.inspector_id);
        data.append("inspector_name", rec.inspector_name);
        data.append("fac_id", rec.fac_id);
        data.append("checks", JSON.stringify(rec.checks));
        data.append("fac_id", rec.fac_id);
        data.append("frequency", rec.frequency);
        console.log("Writing record", index);
        await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating fac_inspection_sched", error);
  }
};

const migrateFacilities = async () => {
  const table = "facility";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      console.log("Processing ", rec.name, rec.id);
      if (byId && fac_ids.includes(rec.id)) {
        console.log("Adding ", rec.name);
        const data = new FormData();
        setTimeout(async () => {
          data.append("id", rec.id);
          data.append("name", rec.name);
          data.append("address", rec.address);
          data.append("city", rec.city);
          data.append("state", rec.state);
          data.append("zipcode", rec.zipcode);
          data.append("acct_mgr", rec.acct_mgr);
          data.append("fac_type", rec.fac_type);
          data.append("num_of_units", rec.num_of_units);
          data.append("status", rec.status);
          data.append("added_by_id", rec.added_by_id);
          data.append("division", rec.division);
          data.append("division_name", rec.division_name);
          data.append("description", rec.description);
          data.append("hide", rec.hide);

          var itemsProcessed = 0;
          await rec.image.forEach(async (i) => {
            const file = await createFile(i, pb.files.getUrl(rec, i));
            data.append("image", file);
            console.log("data", data);

            itemsProcessed++;
            if (itemsProcessed === rec.image.length) {
              createOnDone(table, data);
            }
          });
        }, index * 1000);
      }
      //else {
      //   const data = new FormData();
      //   setTimeout(async () => {
      //     data.append("id", rec.id);
      //     data.append("name", rec.name);
      //     data.append("address", rec.address);
      //     data.append("city", rec.city);
      //     data.append("state", rec.state);
      //     data.append("zipcode", rec.zipcode);
      //     data.append("acct_mgr", rec.acct_mgr);
      //     data.append("fac_type", rec.fac_type);
      //     data.append("num_of_units", rec.num_of_units);
      //     data.append("status", rec.status);
      //     data.append("added_by_id", rec.added_by_id);
      //     data.append("division", rec.division);
      //     data.append("division_name", rec.division_name);
      //     data.append("description", rec.description);
      //     data.append("hide", rec.hide);

      //     var itemsProcessed = 0;
      //     await rec.image.forEach(async (i) => {
      //       const file = await createFile(i, pb.files.getUrl(rec, i));
      //       data.append("image", file);
      //       console.log("data", data);

      //       itemsProcessed++;
      //       if (itemsProcessed === rec.image.length) {
      //         createOnDone(table, data);
      //       }
      //     });
      //   }, index * 1000);
      // }
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating facility", error);
  }
};

const migrateFacCompliance = async () => {
  const table = "facility_compliance";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      console.log("Record", rec);
      data.append("id", rec.id);
      data.append("fac_id", rec.fac_id);
      data.append("type", rec.type);
      data.append("effective_date", rec.effective_date);
      data.append("expire_date", rec.expire_date);
      data.append("expires_soon", rec.expires_soon);
      data.append("expired", rec.expired);
      data.append("contact_name", rec.contact_name);
      data.append("contact_number", rec.contact_number);

      if (rec.file) {
        let file = await createFile(rec.file, pb.files.getUrl(rec, rec.file));

        data.append("file", file);
      }

      const record = await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", db, error);
  }
};

const migrateFacExceptions = async () => {
  const table = "facility_exceptions";
  console.log("Migrating facility_exceptions");
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      console.log("Record", rec);
      data.append("id", rec.id);
      data.append("facility_id", rec.facility_id);
      data.append("checked_exceptions", JSON.stringify(rec.checked_exceptions));

      const record = await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", db, error);
  }
};

const migrateFacInspection = async () => {
  const table = "facility_inspection";
  console.log("Migration ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        data.append("id", rec.id);
        data.append("fac_id", rec.fac_id);
        data.append("user_id", rec.user_id);
        data.append("user_name", rec.user_name);
        data.append("text", rec.text);
        data.append("req_checks", JSON.stringify(rec.req_checks));
        data.append("not_checked", JSON.stringify(rec.not_checked));
        data.append("status", rec.status);

        if (rec.images.length > 0) {
          var itemsProcessed = 0;
          await rec.images.forEach(async (i) => {
            const file = await createFile(i, pb.files.getUrl(rec, i));
            data.append("images", file);

            itemsProcessed++;
            if (itemsProcessed === rec.image.length) {
              createOnDone(table, data);
            }
          });
        } else {
          await pbTo.collection("facility_inspection").create(data);
          console.log("Done.....");
        }
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating facility_inspection", error);
  }
};

const migrateFacSafetyDoc = async () => {
  const table = "facility_safety_doc";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      console.log("Record", rec);
      data.append("id", rec.id);
      data.append("fac_id", rec.fac_id);
      data.append("type", rec.type);
      data.append("effective_date", rec.effective_date);
      data.append("expire_date", rec.expire_date);
      data.append("expires_soon", rec.expires_soon);
      data.append("expired", rec.expired);
      data.append("contact_name", rec.contact_name);
      data.append("contact_number", rec.contact_number);

      if (rec.file) {
        let file = await createFile(rec.file, pb.files.getUrl(rec, rec.file));

        data.append("file", file);
      }

      const record = await pbTo.collection(table).create(data);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateMaintRecords = async () => {
  const table = "maint_record";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        console.log("Record", rec);
        data.append("id", rec.id);
        data.append("subsys_id", rec.subsys_id);
        data.append("technician", rec.technician);
        data.append("desc", rec.desc);
        data.append("status", rec.status);
        data.append("technician_id", rec.technician_id);
        data.append("required_checks", JSON.stringify(rec.required_checks));
        data.append("not_checked", JSON.stringify(rec.not_checked));
        data.append("location", JSON.stringify(rec.location));

        if (rec.image) {
          let file = await createFile(
            rec.image,
            pb.files.getUrl(rec, rec.image)
          );

          data.append("image", file);
        }

        const record = await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateMainSchedules = async () => {
  const table = "maint_sched";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        console.log("Record", rec);
        data.append("id", rec.id);
        data.append("frequency", rec.frequency);
        data.append("subsys_id", rec.subsys_id);
        data.append("due_date", rec.due_date);
        data.append("checks", JSON.stringify(rec.checks));
        data.append("user_id", rec.user_id);
        data.append("user_name", rec.user_name);

        const record = await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateMessaages = async () => {
  const table = "message";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        //console.log("Record", rec);
        data.append("id", rec.id);
        data.append("to_id", rec.to_id);
        data.append("from_id", rec.from_id);
        data.append("subject", rec.subject);
        data.append("message", rec.message);
        data.append("isRead", rec.isRead);
        data.append("archived", rec.archived);
        data.append("from_name", rec.from_name);
        data.append("to_name", rec.to_name);
        data.append("parent_id", rec.parent_id);
        data.append("hasReplies", rec.hasReplies);
        data.append("type", rec.type);

        if (rec.attachments.length > 0) {
          var itemsProcessed = 0;
          await rec.attachments.forEach(async (i) => {
            const file = await createFile(i, pb.files.getUrl(rec, i));
            data.append("attachments", file);

            itemsProcessed++;
            if (itemsProcessed === rec.attachments.length) {
              createOnDone(table, data);
            }
          });
        } else {
          console.log("No attachments");
          const record = await pbTo.collection(table).create(data);
        }
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateNotes = async () => {
  const table = "notes";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        console.log("Record", rec);
        data.append("id", rec.id);
        data.append("author", rec.author);
        data.append("text", rec.text);
        data.append("title", rec.title);
        data.append("priority", rec.priority);
        data.append("private", rec.private);
        data.append("author_id", rec.author_id);
        data.append("note_for", rec.note_for);
        data.append("note_for_id", rec.note_for_id);

        if (rec.image) {
          let file = await createFile(
            rec.image,
            pb.files.getUrl(rec, rec.image)
          );

          data.append("image", file);
        }

        const record = await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migratePersonel = async () => {
  const table = "personel";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        console.log("Record", rec);
        data.append("id", rec.id);
        data.append("fac_id", rec.fac_id);
        data.append("user_id", rec.user_id);
        data.append("full_name", rec.full_name);
        data.append("role", rec.role);
        data.append("user", rec.user);

        const record = await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateSvComps = async () => {
  const table = "service_company";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        console.log("Record", rec);
        data.append("id", rec.id);
        data.append("name", rec.name);
        data.append("address", rec.address);
        data.append("phone", rec.phone);
        data.append("service_type", rec.service_type);
        data.append("division_id", rec.division_id);
        data.append("city", rec.city);
        data.append("state", rec.state);
        data.append("zip", rec.zip);

        const record = await pbTo.collection(table).create(data);
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateSvcHistory = async () => {
  const table = "service_history";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      sort: "-created",
    });

    records.forEach(async (rec, index) => {
      setTimeout(async () => {
        const data = new FormData();
        data.append("id", rec.id);
        data.append("service_type", rec.service_type);
        data.append("servicer", rec.servicer);
        data.append("warranty", rec.warranty);
        data.append("cost", rec.cost);
        data.append("technician_name", rec.technician_name);
        data.append("desc", rec.desc);
        data.append("system_id", rec.system_id);
        data.append("servicer_id", rec.servicer_id);
        data.append("warranty_id", rec.warranty_id);
        data.append("fac_id", rec.fac_id);

        if (rec.images.length > 0) {
          var itemsProcessed = 0;
          await rec.images.forEach(async (i) => {
            const file = await createFile(i, pb.files.getUrl(rec, i));
            data.append("images", file);

            itemsProcessed++;
            if (itemsProcessed === rec.images.length) {
              createOnDone(table, data);
            }
          });
        } else {
          const record = await pbTo.collection(table).create(data);
        }
      }, index * 250);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateSubsys = async () => {
  const table = "subsys";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      filter: `fac_id="185zk3mot68gji6"`,
    });

    records.forEach(async (rec, index) => {
      if (rec.id == "n89xyc9ap85did6") {
        //setTimeout(async () => {
        const data = new FormData();
        data.append("id", rec.id);
        data.append("fac_id", rec.fac_id);
        data.append("sub_sys_type", rec.sub_sys_type);
        data.append("condition", rec.condition);
        data.append("make", rec.make);
        data.append("model", rec.model);
        data.append("location", rec.location);
        data.append("desc", rec.desc);
        data.append("sys_type", rec.sys_type);
        data.append("added_by_id", rec.added_by_id);
        data.append("name", rec.name);
        data.append("sn", rec.sn);
        data.append("daily_check", rec.daily_check);

        if (rec.image.length > 0) {
          var itemsProcessed = 0;
          await rec.image.forEach(async (i) => {
            const file = await createFile(i, pb.files.getUrl(rec, i));
            data.append("image", file);

            itemsProcessed++;
            if (itemsProcessed === rec.image.length) {
              const done = await createOnDone(table, data);
              console.log(done);
            }
          });
        } else {
          const record = await pbTo.collection(table).create(data);
          console.log(record);
        }

        console.log(index, " processed");
        //}, index * 1000);
      }
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateSubsysSchedulesById = async () => {
  const table = "subsys";
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      filter: `fac_id="185zk3mot68gji6"`,
    });

    records.forEach(async (rec, index) => {
      if (index > 59 && index < 76) {
        try {
          const record = await pb
            .collection("maint_sched")
            .getFirstListItem(`subsys_id="${rec.id}"`);

          console.log("Writing record", record);
          //if (record) {
          const data = new FormData();
          //console.log("Record", record);
          data.append("id", record.id);
          data.append("frequency", record.frequency);
          data.append("subsys_id", record.subsys_id);
          data.append("due_date", record.due_date);
          data.append("checks", JSON.stringify(record.checks));
          data.append("user_id", record.user_id);
          data.append("user_name", record.user_name);

          const sched = await pbTo.collection("maint_sched").create(data);
          console.log("result", sched);
          //}
        } catch (error) {
          console.log("No schedule for ", rec.name);
        }
      }
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateSubsysRecordsById = async () => {
  const table = "subsys";
  let count = 0;
  console.log("Migrating ", table);
  try {
    const records = await pb.collection(table).getFullList({
      filter: `fac_id="185zk3mot68gji6"`,
    });

    records.forEach(async (rec, index) => {
      if (index > 59 && index < 76) {
        try {
          const record = await pb
            .collection("maint_record")
            .getFirstListItem(`subsys_id="${rec.id}"`);
          const mrecords = await pb.collection("maint_record").getFullList({
            filter: `subsys_id="${rec.id}"`,
          });

          for (const mrec of mrecords) {
            //console.log("Writing record", record);

            const data = new FormData();
            try {
              //console.log("MaintRecord", 1);
              data.append("id", mrec.id);
              data.append("subsys_id", mrec.subsys_id);
              data.append("technician", mrec.technician);
              data.append("desc", mrec.desc);
              data.append("status", mrec.status);
              data.append("technician_id", mrec.technician_id);
              //console.log("MaintRecord", 2);
              data.append(
                "required_checks",
                JSON.stringify(mrec.required_checks)
              );
              data.append("not_checked", JSON.stringify(mrec.not_checked));
              data.append("location", JSON.stringify(mrec.location));
              //console.log("MaintRecord", 3);
              if (mrec.image) {
                let file = await createFile(
                  mrec.image,
                  pb.files.getUrl(mrec, mrec.image)
                );

                data.append("image", file);
              }
            } catch (error) {
              console.log("Error creating data", error);
            }

            //console.log("MaintRecord", 4);
            try {
              const result = await pbTo.collection("maint_record").create(data);
              console.log("Result:", result.id, count);
              count++;
            } catch (error) {
              console.log("Error writing maint record", error);
            }
          }
        } catch (error) {
          console.log("No schedule for ", rec.name);
        }
      }
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateComplianceByFacId = async () => {
  const table = "subsys";
  let count = 0;
  console.log("Migrating ", table);
  try {
    const records = await pb.collection("facility_compliance").getFullList({
      filter: `fac_id="185zk3mot68gji6"`,
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      //console.log("Record", rec);
      data.append("id", rec.id);
      data.append("fac_id", rec.fac_id);
      data.append("type", rec.type);
      data.append("effective_date", rec.effective_date);
      data.append("expire_date", rec.expire_date);
      data.append("expires_soon", rec.expires_soon);
      data.append("expired", rec.expired);
      data.append("contact_name", rec.contact_name);
      data.append("contact_number", rec.contact_number);

      if (rec.file) {
        let file = await createFile(rec.file, pb.files.getUrl(rec, rec.file));

        data.append("file", file);
      }

      const record = await pbTo.collection("facility_compliance").create(data);
      console.log("Result", record.id, index);
    });
    console.log(table, " DONE");
  } catch (error) {
    console.log("Error migrating ", table, error);
  }
};

const migrateSafetyDocByFacId = async () => {
  let count = 0;
  console.log("Migrating ", "facility_safety_doc");
  try {
    const records = await pb.collection("facility_safety_doc").getFullList({
      filter: `fac_id="185zk3mot68gji6"`,
    });

    records.forEach(async (rec, index) => {
      const data = new FormData();
      //console.log("Record", rec);
      data.append("id", rec.id);
      data.append("fac_id", rec.fac_id);
      data.append("type", rec.type);
      data.append("effective_date", rec.effective_date);
      data.append("expire_date", rec.expire_date);
      data.append("expires_soon", rec.expires_soon);
      data.append("expired", rec.expired);
      data.append("contact_name", rec.contact_name);
      data.append("contact_number", rec.contact_number);

      if (rec.file) {
        let file = await createFile(rec.file, pb.files.getUrl(rec, rec.file));
        data.append("file", file);
      }

      const record = await pbTo.collection("facility_safety_doc").create(data);
      console.log("Result", record.id, index);
    });
    console.log("facility_safety_doc DONE");
  } catch (error) {
    console.log("Error migrating ", error);
  }
};
const createOnDone = async (table, data) => {
  console.log("Writing record", data);
  try {
    await pbTo.collection(table).create(data);
  } catch (error) {
    console.log("Error creating data for ", table, error);
  }
};

async function createFile(name, url) {
  try {
    let response = await fetch(url);
    let data = await response.blob();
    let metadata = {
      type: "image/jpeg",
    };
    const file = new File([data], name, metadata);
    //console.log("file", file);
    return file;
  } catch (error) {
    console.log("Error Creating file for", name, error);
    return null;
  }
}

app.listen(3000);
