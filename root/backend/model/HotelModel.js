import mongoose from "mongoose";
const hotelschema = new mongoose.Schema({
    name: { type: String, required: true },
    hotelId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    location: { type: String, required: true },
    logo: { type: String, required: true },
    contactInfo: { type: String, required: true }
})

const HotelModel = mongoose.model('Hotel', hotelschema)
export default HotelModel