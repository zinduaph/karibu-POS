import mongoose from "mongoose";


const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log('mongodb connected')
    })

    await mongoose.connect(`${process.env.MONGODB_URI}/phone-pos`)
}

export default connectDB;