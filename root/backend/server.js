import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './config/mongoDB.js'
import saleRouter from './routes/saleRoutes.js'
import productRouter from './routes/productRoutes.js'
import menuRouter from './routes/menuRoutes.js'
import inventoryRouter from './routes/inventoryRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const PORT = process.env.PORT || 8000
const allowedOrigins = new Set(
    (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
)

// middleware
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true)
        return callback(new Error('Origin is not allowed by CORS'))
    },
    credentials: true,
}))
app.use(express.json({limit:'1mb'}))
app.use(cookieParser())


app.use('/api/auth', userRoutes)
app.use('/api/user',userRoutes)
app.use('/api/sales', saleRouter)
app.use('/api/products',productRouter)
app.use('/api/menu-items', menuRouter)
app.use('/api/inventory', inventoryRouter)

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