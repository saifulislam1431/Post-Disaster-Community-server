const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('supplyChainPlatform');
        const userCollection = db.collection('users');
        const allSupplyCollection = db.collection("allSupplyPost");
        const testimonialCollection = db.collection("testimonials");
        const galleryCollection = db.collection("gallery");
        const eventCollection = db.collection("upcomingEvents");
        const statisticsCollection = db.collection("statisticsData");
        const donorsCollection = db.collection("donors");

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await userCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await userCollection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await userCollection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });

        app.get('/api/v1/all-post', async (req, res) => {
            try {
                const result = await allSupplyCollection.find({}).toArray();
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        });
        app.post('/api/v1/add-post', async (req, res) => {
            try {
                const data = req.body;
                const result = await allSupplyCollection.insertOne(data);
                return res.json({
                    success: true,
                    insertedId: result.insertedId,
                    message: 'Post Added successfully!',
                })
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        });

        app.delete('/api/v1/delete-post/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) }
                const result = await allSupplyCollection.deleteOne(filter);
                return res.json({
                    success: true,
                    deletedCount: result.deletedCount,
                    message: 'Deleted successfully!',
                })
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        });

        app.patch('/api/v1/update-post/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const data = req.body;
                const filter = { _id: new ObjectId(id) }
                const doc = {
                    $set: {
                        title: data?.title,
                        description: data?.description,
                        amount: data?.amount,
                        category: data?.category
                    }
                }
                const result = await allSupplyCollection.updateOne(filter, doc);
                return res.json({
                    success: true,
                    modifiedCount: result.modifiedCount,
                    message: 'Update successfully!',
                })
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        });

        app.get('/api/v1/all-testimonial', async (req, res) => {
            try {
                const result = await testimonialCollection.find({}).toArray();
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        })

        app.get('/api/v1/all-work-portfolio', async (req, res) => {
            try {
                const result = await galleryCollection.find({}).toArray();
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        })

        app.get('/api/v1/upcoming-events', async (req, res) => {
            try {
                const result = await eventCollection.find({}).toArray();
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        })

        app.get('/api/v1/single-post-details/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const result = await allSupplyCollection.findOne(filter);
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        })

        app.get('/api/v1/statistics-data', async (req, res) => {
            try {
                const result = await statisticsCollection.find({}).toArray();
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        })

        app.get('/api/v1/donors-data-by-donation', async (req, res) => {
            try {
                const result = await donorsCollection.find({}).sort({ donationAmount: -1 }).toArray();
                return res.send(result)
            } catch {
                return res.status(401).json({ message: 'Something wrong!' });
            }
        })




        // ==============================================================
        // WRITE YOUR CODE HERE
        // ==============================================================


        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});