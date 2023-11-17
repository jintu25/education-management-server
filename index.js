const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors = require("cors")
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
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

      app.get('/courses', async(req, res) => {
        const result = await coursesCollection.find().toArray()
        res.send(result)
      })
  }
  finally{}
}
run().catch(error => console.error(error))


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})