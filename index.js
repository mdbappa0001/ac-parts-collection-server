const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('bson');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w6ifa.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('ac_collection').collection('services')
        const bookingCollection = client.db('ac_collection').collection('bookings')
        const userCollection = client.db('ac_collection').collection('users');
        const paymentCollection = client.db('ac_collection').collection('payments');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        //POST
        app.post('/service', async(req, res)=>{
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })

        app.delete('/service/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectID(id)};
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });



        // app.delete('/server/:email',  async (req, res) => {
        //     const email = req.params.email;
        //     const filter = { email: email };
        //     const result = await serviceCollection.deleteOne(filter);
        //     res.send(result);
        //   });

        // //DELETE
        // app.delete('/service/:id', async(req, res)=>{
        //     const id = req.params.id;
        //     const query = {_id: ObjectId(id)};
        //     const result = await serviceCollection.deleteOne(query);
        //     res.send(result);
        // });


        app.get('/user', async(req, res)=>{
            const users = await userCollection.find().toArray();
            res.send(users);
        });


        app.get('/admin/:email', async(req,res)=>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
        });


        app.put('/user/admin/:email',verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
                const filter = { email: email };
                const updateDoc = {
                    $set: {role: 'admin'},
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else{
                res.status(403).send({message: 'forbidden'});
            }
        });


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });


        app.get('/bookings', async(req, res) =>{
            const query = {};
            const cursor = bookingCollection.find(query);
            const bookings = await cursor.toArray();
            res.send(bookings) 
        });


        app.get('/booking/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })


        app.get('/booking', async (req, res) => {
            const user = req.query.user;
            console.log(user);
            const query = { user: user };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })


        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })


    }
    finally {

    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send('Hello AC Collection')
})

app.listen(port, () => {
    console.log(`AC Collection listening on port ${port}`);
})
