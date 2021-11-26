const express = require('express')
const cors = require('cors');
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;

/////Firebase JWT token
//doctor-portal-firebase-adminsdk.json
// const serviceAccount = require('doctor-portal-firebase-adminsdk.json');
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// async function verifyToken(req, res, next) {
//     if (req.headers?.authorization?.startsWith('Bearer ')) {
//         const token = req.headers.authorization.split(' ')[1];

//         try {
//             const decodedUser = await admin.auth().verifyIdToken(token);
//             req.decodedEmail = decodedUser.email;
//         }
//         catch {

//         }

//     }
//     next();
// }
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tuofi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log(uri)



async function run() {
    try {
        await client.connect();
        const database = client.db('doctor_portal');
        const appointmentsCollection = database.collection('appointments');
        const usersCollection = database.collection('users');
        const servicesCollection = client.db("doctor_portal").collection("products");
        const ordersCollection = client.db("doctor_portal").collection("orders");
        const reviewCollection = client.db("doctor_portal").collection("review");

        //add servicesCollection
        app.post("/addServices", async (req, res) => {
            console.log(req.body);
            const result = await servicesCollection.insertOne(req.body);
            res.send(result);
        });

        // get all services
        app.get("/allServices", async (req, res) => {
            const result = await servicesCollection.find({}).toArray();
            res.send(result);
        });

        // single service
        app.get("/singleService/:id", async (req, res) => {
            console.log(req.params.id);
            const result = await servicesCollection
                .find({ _id: ObjectId(req.params.id) })
                .toArray();
            res.send(result[0]);
            console.log(result);
        });

        // insert order and
        app.post("/addOrders", async (req, res) => {
            const result = await ordersCollection.insertOne(req.body);
            res.send(result);
        });

        //  my order
        // app.get("/myOrder/:email", async (req, res) => {
        //     console.log(req.params.email);
        //     const result = await ordersCollection
        //         .find({ email: req.params.email })
        //         .toArray();
        //     res.send(result);
        // });

        // my confirmOrder

        app.get("/myOrders/:email", async (req, res) => {
            // const result = await ordersCollection
            const cusor = ordersCollection.find({ email: req.params.email })
            const result = await cusor.toArray()
            res.json(result);
            //console.log(result)
        });



        // review
        app.post("/addSReview", async (req, res) => {
            const result = await reviewCollection.insertOne(req.body);
            res.send(result);
        });

        app.post("/addUserInfo", async (req, res) => {
            console.log("req.body");
            const result = await usersCollection.insertOne(req.body);
            res.send(result);
            console.log(result);
        });

        /// all order
        app.get("/allOrders", async (req, res) => {
            // console.log("hello");
            const result = await ordersCollection.find({}).toArray();
            res.send(result);
        });

        // status update
        app.put("/statusUpdate/:id", async (req, res) => {
            const filter = { _id: ObjectId(req.params.id) };
            console.log(req.params.id);
            const result = await ordersCollection.updateOne(filter, {
                $set: {
                    status: req.body.status,
                },
            });
            res.send(result);
            console.log(result);
        });

        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();

            const query = { email: email, date: date }

            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })

        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            console.log(result);
            res.json(result)
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //verifyToken
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            // console.log('put', req.headers.authorization);
            //const requester = req.decodedEmail;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
            // if (requester) {
            //     const requesterAccount = await usersCollection.findOne({ email: requester });
            //     if (requesterAccount.role === 'admin') {

            //     }

            // else {
            //     res.status(403).json({ message: 'you do not have access to make admin' })
            // }

        })



    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctors portal!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})