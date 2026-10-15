import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './config/mongoDB.js'
import saleRouter from './routes/saleRoutes.js'
import productRouter from './routes/productRoutes.js'

const app = express()
const PORT = process.env.PORT || 8000

// middleware
app.use(cors())
app.use(express.json({limit:'1mb'}))



app.use('/api/sales', saleRouter)
app.use('/api/products',productRouter)

app.get('/', (req,res) => {
    res.send('app is working')
})

const startServer = async () => {
    await connectDB()
    app.listen(PORT, () => {
        console.log(`app is running on port ${PORT}`)
    })
}

startServer().catch(error => {
    console.error('Unable to start server:', error.message)
    process.exitCode = 1
})