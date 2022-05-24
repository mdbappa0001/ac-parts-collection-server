const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w6ifa.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('ac_collection').collection('services')
        const bookingCollection = client.db('ac_collection').collection('bookings')

        app.get('/service', async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
     });


     app.post('/booking', async(req, res) =>{
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
     })


    }
    finally{

    }
}

run().catch(console.dir);

app.get("/", (req, res)=>{
    res.send('Hello AC Collection')
})

app.listen(port, ()=>{
    console.log(`AC Collection listening on port ${port}`);
})
