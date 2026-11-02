import mongoose from "mongoose";
const hotelschema = new mongoose.Schema({
    name: { type: String, required: true },
    hotelId: {type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true},
    location: { type: String, required: true },
    customerCareNumber: { type: String, required: true },
    hotelEmail: { type: String, default:'' }
})

const HotelModel = mongoose.model('Hotel', hotelschema)
export default HotelModel