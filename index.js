const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
console.log(process.env);

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB credentials
// username: Food_Sharing
// password: rIYda57TDQXBf8MC

// const uri = "mongodb+srv://Food_Sharing:rIYda57TDQXBf8MC@first-code.wkjwbyz.mongodb.net/?appName=first-code";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@first-code.wkjwbyz.mongodb.net/?appName=first-code`;

// Mongo client setup
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const db = client.db('food_db');
        const FoodCollection = db.collection('foods');
        const requestCollection = db.collection('request_food');
        const usersCollection = db.collection('users');


        ///////  users api //////////
        app.post('/users', async (req, res) => {
            const newUsers = req.body;
            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                res.send({ message: 'user already exits' })
            }
            else {
                const result = await usersCollection.insertOne(newUsers);
                res.send(result);
            }
        })

        // post create data 
        // product api
        /////////////////// create food ///////////////////////////////
        app.post('/foods', async (req, res) => {
            const newFood = req.body;
            const result = await FoodCollection.insertOne(newFood);
            res.send(result);
        })

        // nijer food pawae jonnu 
        app.get('/foods', async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.donator_email = email;
            }
            const cursor = FoodCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })


        // kicu poriman food dekhanor jonnu  
        app.get('/latest-food', async (req, res) => {
            const cursor = FoodCollection.find().sort({
                expire_date: -1
            }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        // single food details dekhanor jonnu 
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


        // create kora food update korar jonnu 
        app.patch('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const updateFood = req.body;

            const query = { _id: new ObjectId(id) };

            const update = { $set: updateFood };

            const result = await FoodCollection.updateOne(query, update);
            res.send(result);
        });





        // create kora food delete korar jonnu 
        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await FoodCollection.deleteOne(query);
            res.send(result);
        })

        //////////  Request  //////
        // nijer request gula paite 
        app.get('/request_food', async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.user_email = email;
            }
            const cursor = requestCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })


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


        app.get('/request_food', async (req, res) => {
            const cursor = requestCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // create post 
        app.post('/request_food', async (req, res) => {
            const newRequest = req.body;
            const result = await requestCollection.insertOne(newRequest);
            res.send(result);
        })

        app.get('/foods/request_food/:foodId', async (req, res) => {
            const foodId = req.params.foodId;
            const query = { food: foodId }
            const cursor = requestCollection.find(query)
            const result = await cursor.toArray()
            res.send(result);
        })


        // delete request
        app.delete('/request_food/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestCollection.deleteOne(query);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Food sharing :${port}`)
})