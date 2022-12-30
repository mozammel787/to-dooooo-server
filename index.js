const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// middle wares
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('Server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5otzcjs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_kye, function (err, decode) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decode = decode;
        next()
    })
}

async function run() {
    try {
        const taskCollection = client.db('task').collection('list')
        const CommentCollection = client.db('task').collection('comment')

        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_kye, { expiresIn: '7d' })
            return res.send({ geniusToken: token })

        })


        app.post('/add-task', async (req, res) => {
            const task = req.body
            const result = await taskCollection.insertOne(task)
            res.send(result)
        })
        app.get('/my-task', verifyJWT, async (req, res) => {
            const decoded = req.decode
            // console.log(req);
            if (decoded.email !== req.query.email) {
                return res.status(403).send({
                    message: 'unauthorized access'
                })

            }
            let query = {
            }
            const email = req.query.email
            if (email) {
                query = {
                    completed: false,
                    email: email
                }
            }
            const task = taskCollection.find(query).sort({ "time": -1 })
            const data = await task.toArray()
            res.send(data)
        })
        app.delete('/task-delete/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await taskCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/task-complete/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    completed: true,
                }
            }
            const result = await taskCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/complete-task', verifyJWT, async (req, res) => {
            const decoded = req.decode
            // console.log(req);
            if (decoded.email !== req.query.email) {
                return res.status(403).send({
                    message: 'unauthorized access'
                })

            }
            let query = {

            }
            const email = req.query.email
            if (email) {
                query = {
                    email: email,
                    completed: true
                }
            }
            const task = taskCollection.find(query).sort({ "time": -1 })
            const data = await task.toArray()
            res.send(data)
        })
        app.put('/task-incomplete/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    completed: false,
                }
            }
            const result = await taskCollection.updateOne(filter, updatedDoc, options)
            res.send(result)            
        })
        app.post('/add-comment', async (req, res) => {
            const task = req.body
            const result = await CommentCollection.insertOne(task)
            res.send(result)
        })
        app.get('/comment', async (req, res) => {
            const id = req.query.id
            let query = {
                taskID: id,
            }
            const task = CommentCollection.find(query).sort({ "time": -1 })
            const data = await task.toArray()
            res.send(data)
        })
        app.put('/edit/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const user = req.body.task;
            const option = { upsert: true };
            const updateUser = {
                $set: {
                    title: user.title,
                    details: user.details,
                    time: user.time,
                    date: user.date,
                    img: user.img
                }
            }
            const result = await taskCollection.updateOne(filter, updateUser, option)
            console.log(result);
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(err => { console.error(err) })

app.listen(port, () => {
    console.log(`server port is ${port}`);
})