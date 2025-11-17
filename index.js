const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB credentials
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@first-code.wkjwbyz.mongodb.net/?appName=first-code`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB and setup collections
async function run() {
  try {
    const db = client.db('food_db');
    const FoodCollection = db.collection('foods');
    const requestCollection = db.collection('request_food');
    const usersCollection = db.collection('users');

    console.log("MongoDB connected!");

    // ------------------- ROUTES -------------------

    // Root
    app.get('/', (req, res) => {
      res.send('Food Sharing API is running on Vercel!');
    });

    // ------------------- Users -------------------
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const existingUser = await usersCollection.findOne({ email: newUser.email });
      if (existingUser) return res.send({ message: 'User already exists' });
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // ------------------- Foods -------------------
    // Create food
    app.post('/foods', async (req, res) => {
      const newFood = req.body;
      const result = await FoodCollection.insertOne(newFood);
      res.send(result);
    });

    // Get foods (optionally by donator email)
    app.get('/foods', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) query.donator_email = email;
      const cursor = FoodCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Latest 6 foods
    app.get('/latest-food', async (req, res) => {
      const cursor = FoodCollection.find().sort({
        food_quantity: -1
      }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Single food details
    app.get('/foodsDetails/:id', async (req, res) => {
      const id = req.params.id;
      let query;
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      } else {
        query = { _id: id };
      }
      const result = await FoodCollection.findOne(query);
      res.send(result);
    });

    // Update food
    app.patch('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const updateFood = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: updateFood };
      const result = await FoodCollection.updateOne(query, update);
      res.send(result);
    });

    // Delete food
    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const result = await FoodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ------------------- Requests -------------------
    // Get all requests or by user email
    app.get('/request_food', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) query.user_email = email;
      const cursor = requestCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Create request
    app.post('/request_food', async (req, res) => {
      const newRequest = req.body;
      const result = await requestCollection.insertOne(newRequest);
      res.send(result);
    });

    // Accept request
    app.patch('/request_food/accept/:reqId', async (req, res) => {
      const { reqId } = req.params;
      try {
        await requestCollection.updateOne(
          { _id: new ObjectId(reqId) },
          { $set: { status: 'accepted' } }
        );
        const request = await requestCollection.findOne({ _id: new ObjectId(reqId) });
        await FoodCollection.updateOne(
          { _id: new ObjectId(request.food) },
          { $set: { food_status: 'donated' } }
        );
        res.send({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: error.message });
      }
    });

    // Reject request
    app.patch('/request_food/reject/:reqId', async (req, res) => {
      const { reqId } = req.params;
      try {
        await requestCollection.updateOne(
          { _id: new ObjectId(reqId) },
          { $set: { status: 'rejected' } }
        );
        res.send({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: error.message });
      }
    });

    // Delete request
    app.delete('/request_food/:id', async (req, res) => {
      const id = req.params.id;
      const result = await requestCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Get requests for a specific food
    app.get('/foods/request_food/:foodId', async (req, res) => {
      const foodId = req.params.foodId;
      const cursor = requestCollection.find({ food: foodId });
      const result = await cursor.toArray();
      res.send(result);
    });

  } finally {
    // You can close client here if needed, or keep it open
  }
}

// Run MongoDB setup
run().catch(console.dir);

// Export app for Vercel deployment
module.exports = app;
