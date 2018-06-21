//Define modules
const express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;

const Pi = require('pi');
const bodyParser = require('body-parser');
const Archiver = require('archiver');

//variable arrayto store jobs
var JOBS = [];

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// first endpoint for job creation
app.post("/pi_job", (req, res) => {
  let success = true;
  res.setHeader('Content-Type', 'application/json');
// ugly error handling
  if (isNaN(req.body.num)) {
    success = false;
    res.send(JSON.stringify({ "success": success,"error": "num value is missing or not a number" }));
  } else {
    //create job in array
    JOBS.push({status: "in_progress",num: req.body.num,value: ""});

    //async call to calculate pi. A default timeout was added to easily test async and job status calls
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

//first endpoint status check. The job_id is tested for being a number and if it is a valid job_id
app.get("/pi_job/:job_id", (req, res) => {
  let success = true;
  let jobid = req.params.job_id;

  res.setHeader('Content-Type', 'application/json');
  if (isNaN(jobid)) {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID must be a number" }));
  } else if (jobid > JOBS.length || jobid < 0) {
    //simple error handle check. Since each job_id is incremental with the array, the total number of jobs is the job length.
    //If this were to change like adding the ability to remove a job, a more robust job_id would need to be used
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID does not exist" }));
  } else {
    res.send(JSON.stringify({ "success": success,"job_id":jobid,"num":JOBS[jobid-1]["num"],"status":JOBS[jobid-1]["status"]}));
  }
});

//Second endpoint. When the url is entered in a browser, it triggers and automatic download of the zipfile
app.get("/download_pi_job/:job_id", (req, res) => {
  let jobid = req.params.job_id;
  res.setHeader('Content-Type', 'application/json');
  if (isNaN(jobid)) {
    success = false
    res.send(JSON.stringify({ "success": success,"error": "Job ID must be a number" }));
  } else if (jobid > JOBS.length || jobid < 0 || JOBS[jobid-1]["status"] != "complete") {
    success = false
    res.status(404).send("Job is either not complete or does not exist. Please check the status at http://localhost:3000/pi_job/"+ jobid);
  } else {
    var filename = "digits_of_pi_" + jobid;
    res.set('Content-Type', 'application/zip');
    res.set('Content-Dispostion', 'attachment; filename=' + filename +'.zip');
    res.attachment(filename + '.zip');
    // Archiver defaults to utf-8 when creating a text file inside the zip file
    var zip = Archiver('zip');
    zip.pipe(res);

    zip.append(JOBS[jobid-1]["value"], {name: filename + ".txt"}).finalize();
  }
});

//starts the express server
app.listen(port, () => {
  console.log(`Listening on localhost:${port}.`);
});
