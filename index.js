const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require("cors")
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.EDUCATION_COURSE}:${process.env.EDUCATION_PASS}@cluster0.t6zznhm.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run(){
    try{
        const coursesCollection = client.db('eSmart-education').collection('courses')
        const reviewsCollection = client.db('eSmart-education').collection('reviews')
        const eventsCollection = client.db('eSmart-education').collection('events')
        const blogsCollection = client.db('eSmart-education').collection('blogs')
        // courses 
        // ---- get request all of courses data ------
        app.get('/courses', async(req, res) => {
          const result = await coursesCollection.find().toArray()
          res.send(result)
        })

        app.get('/courses/:id', async(req, res) => {
          const id = req.params.id;
          const query = ( {_id: id} );
          const course = await coursesCollection.findOne(query)
          res.send(course)
        })

        // events api call
        app.get('/events', async(req, res) => {
          const result = await eventsCollection.find().toArray()
          res.send(result)
        })
        app.get('/events/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: new ObjectId(id)}
          const events = await eventsCollection.findOne(query)
          res.send(events)
        })

        // blogs api call
        app.get('/blogs', async(req, res) => {
          const result = await blogsCollection.find().toArray()
          res.send(result)
        })

        // reviews 
        // ------ get all reviews for show all data ------ //
        app.get('/reviews', async(req, res) => {
          const result = await reviewsCollection.find().toArray()
          res.send(result)
        })

        
    
  
    }
    finally{}
  }
  run().catch(error => console.error(error))
  
app.get('/', (req, res) => {
    res.send('education server side is running successfully....')
})
app.listen(port, () => {
    console.log('server side is running the port', port)
})


