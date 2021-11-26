const express = require('express')
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET)
//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.owgtc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// console.log(uri)

async function run() {
    try {
        await client.connect();
        const database = client.db('glam_and_glow');
        const productsCollection = database.collection('products');
        const allOrdersCollection = database.collection('all_orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');



        console.log('database connected')

        

       //GET ALL PRODUCTS
        app.get('/products' , async(req,res)=>{
           const cursor = productsCollection.find({});
           const products = await cursor.toArray();
           res.send(products);
        });

      

       //Get selected API
       app.get('/selectedProduct/:id' , async(req,res)=>{
           console.log(req.params.id)
           const query = {_id:ObjectId(req.params.id)};
        //    console.log(query)
       const result =  await productsCollection.find(query).toArray();
       res.send(result)
       });

       //Get MY ALL ORDERS API
    app.get('/myAllOrders/:email', async (req,res)=>{
        
        const result = await allOrdersCollection.find({email:req.params.email}).toArray();
       
        res.send(result);
  
      });

      //ADMIN API
      app.get('/users/:email', async(req,res)=>{
          const email = req.params.email;
            // console.log(email)
          const query = {email:email};
        //   console.log(query)
          const user = await usersCollection.findOne(query);
          console.log(user)
          let isAdmin = false;
          if(user?.role === 'admin'){
            isAdmin=true;
            console.log(1)
          }
         
          res.json({admin : isAdmin});
      })

      //MANAGE ALL ORDERS API
      app.get('/manageAllOrders', async(req,res)=>{
          const cursor = await allOrdersCollection.find({}).toArray();
          res.send(cursor);
      });

      //DISPLAY REVIEW API
      app.get('/displayReview', async(req,res)=>{
          const cursor = await reviewsCollection.find({}).toArray();
          res.send(cursor)
      });

      //PAYMENT GET ID API
      app.get('/orders/:id', async(req,res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)};
          const result = await allOrdersCollection.findOne(query);
          res.send(result);
      })

      

        //POST API
        app.post('/products', async (req, res) => {
           const product = req.body;
           console.log(product);
           const result = await productsCollection.insertOne(product);
           console.log(result);
             res.json(result)
        });

        //Placing Order POST API
        app.post('/placingorder', async(req,res)=>{
            
            const cursor = await allOrdersCollection.insertOne(req.body);
            res.send(cursor);
        });

        //USERS POST API
        app.post('/users', async(req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        //Reviews Api
        app.post('/review', async(req,res)=>{
            const result = await reviewsCollection.insertOne(req.body);
            res.send(result);
        });

        //PAYMENT METHOD API
        app.post('/create-payment-intent', async(req,res)=>{
            const paymentInfo = req.body;
            const amount = paymentInfo.price*100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency : 'usd',
                amount: amount,
                payment_method_types : ['card']
            });
            res.json({clientSecret : paymentIntent.client_secret})
        })

        //PUT ADMIN API
        app.put('/users/admin', async(req,res)=>{
            const user = req.body;
            // console.log('put', user);
            const  filter = {email: user.email};
            const updateDoc = {$set: {role: 'admin'}};
            const result = await usersCollection.updateOne(filter,updateDoc);
            res.json(result);
        });

        //UPDATE STATUS
        app.put('/updatingStatus/:id', async(req,res)=>{
            const query = {_id:ObjectId(req.params.id)};
            const updateDoc = {$set: {status: 'shipped'}};
            const result = await allOrdersCollection.updateOne(query,updateDoc);
            res.send(result);
        });

        //UPDATE PAYMENT METHOD
        app.put('/orders/:id', async(req,res)=>{
            const id = req.params.id;
            const payment = req.body;
            const filter = {_id:ObjectId(id)};
            const updateDoc ={
                $set:{
                    payment : payment
                }
               
            };
            const result = await allOrdersCollection.updateOne(filter, updateDoc);
            res.json(result)
        })

        //DELETE API
        app.delete('/delete/:id', async(req,res)=>{
            console.log(req.params.id)
            const result = await allOrdersCollection.deleteOne({_id:ObjectId(req.params.id)});
            res.send(result);
        });

        //REMOVE PRODUCT API
        app.delete('/removeProduct/:id', async(req,res)=>{
                const result = await productsCollection.deleteOne({_id:ObjectId(req.params.id)});
                res.send(result)
        })

    }
    finally {
        //await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('welcome to glam-and-glow site')
})

app.listen(port, () => {
    console.log('server is running on', port)
})