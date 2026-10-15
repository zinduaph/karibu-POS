import mongoose from "mongoose"


const modelSchema = new mongoose.Schema({
    name: {type:String, required:true},
    hotelId: {type:mongoose.Schema.Types.ObjectId, ref:"Hotel", required:true},
    price: {type:Number, required:true},
    categorie:{type:String, enum:{food,drink}, default:food},
    image:{type:Array, default:[]},

})
const ProductModel = mongoose.model("Product", modelSchema)
export default ProductModel