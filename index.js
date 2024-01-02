const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_PAYMENT_SECRET_KEY);
var jwt = require("jsonwebtoken");
// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JSON_SECRET_KEY, (error, decoded) => {
    if (error) {
      return res.status(403).send({ error: true, message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.EDUCATION_COURSE}:${process.env.EDUCATION_PASS}@cluster0.t6zznhm.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const coursesCollection = client
      .db("eSmart-education")
      .collection("courses");
    const reviewsCollection = client
      .db("eSmart-education")
      .collection("reviews");
    const eventsCollection = client.db("eSmart-education").collection("events");
    const blogsCollection = client.db("eSmart-education").collection("blogs");
    const usersCollection = client.db("eSmart-education").collection("users");
    const paymentsCollection = client
      .db("eSmart-education")
      .collection("payments");

    // json web token JWT=>
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JSON_SECRET_KEY, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // verifyModerator middleware create
    const verifyModerator = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "moderator") {
        return res.status(403).send({ message: "forbidden access.." });
      }
      next();
      // try {
      //   const decodedEmail = req.decoded.email;
      //   console.log("decodedEmail", decodedEmail);
      //   const query = { email: decodedEmail };
      //   // Assuming you are using MongoDB and usersCollection is a collection object
      //   const user = await usersCollection.findOne(query);
      //   if (user?.role !== "moderator") {
      //     return res
      //       .status(401)
      //       .send({ error: true, message: "Unauthorized access" });
      //   }
      //   next();
      // } catch (error) {
      //   console.error(error);
      //   res.status(500).send({ error: true, message: "Internal Server Error" });
      // }
    };

    // courses
    // ---- get request all of courses data ------
    app.get("/courses", async (req, res) => {
      const result = await coursesCollection.find().toArray();
      res.send(result);
    });

    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const course = await coursesCollection.findOne(query);
      res.send(course);
    });

    // admin route update:
    app.get("/users/moderator/:email", async (req, res) => {
      const email = req.params.email;

      // if (email !== req.decoded.email) {
      //   res.send({ moderator: false });
      // }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { moderator: user?.role === "moderator" };
      res.send(result);
    });

    // update user to moderator
    app.patch("/users/moderator/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      /* Set the upsert option to insert a document if no documents match
          the filter */
      const updateDoc = {
        $set: {
          role: "moderator",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // users api call
    // users post api
    // users get request for call users for show in client side
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.delete("/users/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // user post request for create user save in database
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.status(401).json({ message: "User already exists" });
        }
        const result = await usersCollection.insertOne(user);
        // Sending the inserted document as a response
        res
          .status(201)
          .json({ message: "User created successfully", user: result.ops[0] });
      } catch (error) {
        // Properly handle errors, log them, and send an appropriate response
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // specific user collect for see on the userProfile pages

    // events api call
    app.get("/events", async (req, res) => {
      const result = await eventsCollection.find().toArray();
      res.send(result);
    });
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const events = await eventsCollection.findOne(query);
      res.send(events);
    });

    // blogs api call
    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });

    // reviews
    // ------ get all reviews for show all data ------ //
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // payment gateway
    // create payment intent

    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      console.log("price", price);
      const amount = price * 100;
      console.log("amount", amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payment", verifyJWT, async (req, res) => {
      try {
        const payment = req.body;
        const insertedResult = await paymentsCollection.insertOne(payment);
        res.send(insertedResult);
      } catch (error) {
        console.error("Error inserting payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // payment confirm student get
    app.get("/payment", async (req, res) => {
      const result = await paymentsCollection.find().toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));


app.get("/", (req, res) => {
  res.send("education server side is running successfully....");
});
app.listen(port, () => {
  console.log("server side is running the port", port);
});
