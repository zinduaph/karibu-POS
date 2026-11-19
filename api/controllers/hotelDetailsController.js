import asyncHandler from '../utils/asyncHandler.js';
import Restaurant from '../models/resturant.js';

function formatHotelDetails(restaurant) {
  return {
    name: restaurant.name,
    location: restaurant.location || '',
    customerCareNumber: restaurant.contactInfo || '',
    hotelEmail: restaurant.hotelEmail || '',
  };
}

export const getHotelDetails = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  return res.json({ success: true, hotelDetails: formatHotelDetails(restaurant) });
});

export const updateHotelDetails = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  const { name, location, customerCareNumber, hotelEmail } = req.body;
  restaurant.name = name;
  restaurant.location = location;
  restaurant.contactInfo = customerCareNumber;
  restaurant.hotelEmail = hotelEmail;
  await restaurant.save();

  return res.json({ success: true, hotelDetails: formatHotelDetails(restaurant) });
});
