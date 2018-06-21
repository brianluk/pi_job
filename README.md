# Digits of pi HTTP API

## Design

The application design for this task will be split into 3 parts, 2 API's and the PI calculator. 
1. Job API
2. Download API
3. PI Calculator

### Assumptions
Each API is stateless

Each API is loosely coupled. 

Each application has built in unit testing

Data is handled by the PI calculator including processing and storage of results

A database will not be used to store job information. A text file will handle job data storing each row as job id, num where the last line will have the latest job id and incremented by 1 for new ids

As well the PI calculator will create a text file with jobid.num.txt and store the results as it is processing. In process file will have .lock appened to it as a status indicator

### Use Cases
* Create a job
  1. create job id autoincremented from previous job
  2. add job to used job_id list
  3. async run pi calculator providing num and job_id as input
  4. return response

* Check status of a job
  1. check to see if job exists
  2. define status of job
  3. return response

* Download results of a job
  1. check to see if job exists and is complete
  2. zip results
  3. return results

### Container 1 - PI Job API
Purpose: Create and get status of job

#### Create Job
Method:  POST
Inputs:  num - integer for the number of digits of PI to be calculated
Outputs: success - boolean if job creation was successful
         job_id - assigned id used for status check and result download
         error - (optional) error message if success == false

#### Check Status
Method:  GET
Inputs:  job_id - id response from job creation
Outputs: success - boolean if job id exists
	 job_id - return provided job id
	 num - return num value from job creation
	 status - status of job
	 error - (optional) error message if success == false

### Container 2 - Download Results API

#### Download Results
Method:  GET
Inputs:	 job_id - id of job results to retrieve
Outputs: digits_of_poi_jobid.zip - file containing digits_of_pi_jobid.txt, a UTF-8 encoded text file containing results
	 error - http code 404 if job does not exist

## Installation

## Setup

## Example Usage

## Future extensibility

### Scalability

### Containerization

### Blue-green Deploys

### Stress Testing

### Monitoring

### Caching
