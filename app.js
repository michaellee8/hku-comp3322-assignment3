var express = require("express");
var app = express();

var monk = require("monk");
var db = monk("localhost:27017/webmailsys");

const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const month = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

// allow retrieval of static files and make db accessible to router
app.use(express.static("public"), function(req, res, next) {
  req.db = db;
  next();
});

app.use(express.json());

app.get("/retrieveemaillist", async (req, res) => {
  let { page, mailbox } = req.query;
  if (!page) {
    page = 1;
  }
  if (!mailbox) {
    mailbox = "inbox";
  }
  const { db } = req;
  const emails = await db
    .get("emailList")
    .find({ mailbox }, { sort: { _id: -1 }, limit: 10, skip: 10 * (page - 1) });

  res.json(
    emails.map(({ _id, title, time, sender, recipient }) => ({
      id: _id,
      title,
      time,
      name: mailbox === "Sent" ? recipient : sender
    }))
  );
});

app.get("/getemail", async (req, res) => {
  let { id } = req.query;
  if (!id) {
    res.sendStatus(400);
    return;
  }
  const { db } = req;
  const email = await db.get("emailList").findOne({ _id: id });
  if (!email) {
    res.sendStatus(404);
    return;
  }
  res.json(email);
});

app.post("/changemailbox", async (req, res) => {
  const { ids, mailbox } = req.body;
  const { db } = req;
  await db
    .get("emailList")
    .update({ _id: { $in: ids } }, { $set: { mailbox } }, { multi: true });
  res.sendStatus(200);
});

app.post("/sendemail", async (req, res) => {
  const { to, subject, content } = req.body;
  const { db } = req;
  const date = new Date();
  await db.get("emailList").insert({
    sender: "sender@cs.hku.hk",
    recipient: to,
    title: subject,
    time: `${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")} ${weekday[date.getDay()]} ${
      month[date.getMonth()]
    } ${date
      .getDate()
      .toString()
      .padStart(2, "0")} ${date.getFullYear()}`,
    content: content,
    mailbox: "Sent"
  });
  res.sendStatus(200);
});

var server = app.listen(8081, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Web Mail System is listening at http://%s:%s", host, port);
});
