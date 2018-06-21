
const express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;

const Pi = require('pi');
const bodyParser = require('body-parser');
const Archiver = require('archiver');

//variable to store jobs
var JOBS = [];

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.post("/pi_job", (req, res) => {
  let success = true;
  res.setHeader('Content-Type', 'application/json');

  if (isNaN(req.body.num)) {
    success = false;
    res.send(JSON.stringify({ "success": success,"error": "num value is missing or not a number" }));
  } else {
    JOBS.push({status: "in_progress",num: req.body.num,value: ""});
    let calc_pi = (jobid) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          JOBS[jobid-1]["value"] = Pi(req.body.num);
          resolve(jobid);
        }, 10000);
      });
    };
    calc_pi(JOBS.length).then((res) => {
      JOBS[res-1]["status"] = "complete";
    });
    res.send(JSON.stringify({ "success": success,"job_id": JOBS.length }));
  }
});

app.get("/pi_job/:job_id", (req, res) => {
  let success = true;
  let jobid = req.params.job_id;

  res.setHeader('Content-Type', 'application/json');
  if (isNaN(jobid)) {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID must be a number" }));
  } else if (jobid > JOBS.length || jobid < 0) {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID does not exist" }));
  } else {
    res.send(JSON.stringify({ "success": success,"job_id":jobid,"num":JOBS[jobid-1]["num"],"status":JOBS[jobid-1]["status"]}));
  }
});

app.get("/download_pi_job/:job_id", (req, res) => {
  let jobid = req.params.job_id;
  res.setHeader('Content-Type', 'application/json');
  if (isNaN(jobid)) {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID must be a number" }));
  } else if (jobid > JOBS.length || jobid < 0) {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID does not exist" }));
  } else if (JOBS[jobid-1]["status"] != "complete") {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job is still in progress" }));
  } else {
    var filename = "digits_of_pi_" + jobid;
    res.set('Content-Type', 'application/zip');
    res.set('Content-Dispostion', 'attachment; filename=' + filename +'.zip');
    res.attachment(filename + '.zip');

    var zip = Archiver('zip');
    zip.pipe(res);

    zip.append(JOBS[jobid-1]["value"], {name: filename + ".txt"}).finalize();
  }
});

app.listen(port, () => {
  console.log(`Listening on localhost:${port}.`);
});
