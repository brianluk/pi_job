# Digits of pi HTTP API

## Installation
- must have docker installed

1. git clone git@github.com:brianluk/pi_job.git
2. docker build -t bluk/pi_job
3. docker run -p 3000:3000 bluk/pi_job

The application should now be running. Please see the next session to test

## Example Usage
### To Create A Job
curl -X POST \
  http://localhost:3000/pi_job \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d num=12
### To Check Status of a Job
curl -X GET \
  http://localhost:3000/pi_job/1
### To Download results zip file from browser
In browser: http://localhost:3000/download_pi_job/1

## Design
For simplicity sake, the endpoints were all created in a single nodejs application. The simplified design allows the application to not have to rely on storing the state data. The data for jobs is stored locally in the node application. I will address a better design later on in the Future section.

### Assumptions
- Data is stored in memory and is only persistent as long as the container and application are running
- Requests for job creation are handled async
- Zip files are created and streamed in memory and does not require local storage
- Port is set to 3000 on both the container and application level
- Container image is based on node 10 from docker hub
- I added a timeout in the code so that an extra 10000ms is added to each pi calculation making it easier to test async
- Pi calculated with pi module from npm
- Error handling is basic (and ugly) if then else statements
- The Archiver module automatically encodes text files in UTF-8
- No unit tests

### Use Cases
* Create a job
  1. add a new object to job array via array push
  2. job id is assumed to be the array order + 1
  3. eeturn response
  4. use Promise with timeout to run PI
  5. update object (in array) with changed status and value of pi

* Check status of a job
  1. check to see if job exists
  2. check object for status of job
  3. return response

* Download results of a job
  1. check to see if job exists and is complete
  2. get value of pi from job object
  3. in memory and stream of generated zip file containing a text document with the pi value

### Container 1 - PI Job API
Purpose: Create and get status of job

#### Create Job
Method:  POST\
Inputs:  num - integer for the number of digits of PI to be calculated\
Outputs: success - boolean if job creation was successful\
         job_id - assigned id used for status check and result download\
         error - (optional) error message if success == false

#### Check Status
Method:  GET\
Inputs:  job_id - id response from job creation\
Outputs: success - boolean if job id exists\
	 job_id - return provided job id\
	 num - return num value from job creation\
	 status - status of job\
	 error - (optional) error message if success == false

### Container 2 - Download Results API
#### Download Results
Method:  GET\
Inputs:	 job_id - id of job results to retrieve\
Outputs: digits_of_poi_jobid.zip - file containing digits_of_pi_jobid.txt, a UTF-8 encoded text file containing results\
	 error - http code 404 if job does not exist

## Future extensibility

Here I will discuss various changes that could be made to the application to be ready for CI/CD as well as a production ready environment.

### Coupling
The current application was designed to be highly coupled in a single monolithic application. This design was driven to simplify data handling and storage.

A more production ready environment would look like:
* Split application into 3 units
  1. pi_job API to create and check status
  2. download_pi_job to handle creation and distribution of results
  3. data system (like a database) to handle persistent storage

The benefits of this design allows each API to be independent allowing for a loosely coupled structure that enables better scalability, reliability and resilience.

Each section below will be based on this decoupled "microservice" architecture.

### Scalability & Stress Testing
Once the application is decoupled, that enables us to scale each component on its own. For instance, these could be placed in some sort of auto scaling system that detects usage based on a measure (cpu usage, response time, etc) and adds additional servers into the pool. Because of the stateless loose coupled application layout, the system can be easily horizontally scaled.

Because of the simple nature of the application, stress testing can be accomplished by using the apache ab tool for testing the endpoints. As well we would want to implement a timing tool especially on the download api for zip file generation speed.

### Containerization
Though docker is already being used for this build, we could extend this further using container orchestration (ECS, kubernetes). As well if we were to decouple the app, we could use something like docker compose to help orchestrate the whole application across it's various microservices

### Blue-green Deploys
With each component decoupled, this makes blue green deploys simple with something like spinnaker. Each application group could then be spun up and switched on demand.

### Monitoring
New Relic would be an ideal choice for both infrastructure and application monitoring. The infrastructure side would allow for metrics into both the automated scalability of the application but also the statistics for the containers. The application monitoring aspect would help debug application performance.

Other modern monitoring applications like Datadog could be used as well though it would like the application aspect.

### Caching
There are several possible caching strategies.
* response caching for job status. An in-memory caching application like redis or memcache could be used to speed the lookup for each jobs status. However the cache would need to be updated when the pi calculation is complete as well

* static file hosting. Rather than generating the text and zip file on demand and returning the results, each file could be generated before hand. Delivery of static files could then be pushed to a CDN allowing for faster retrieval. However this method only benefits if the job file is expected to be accessed multiple times. As such, results could also be stored in redis/memcache
