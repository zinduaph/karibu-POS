import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/cashier.js';
import Product from '../models/product.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const addProduct = asyncHandler(async (req, res) => {
  const { name, price, category, stockQuantity } = req.body;
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const product = await Product.create({
    name,
    price,
    category,
    stockQuantity,
    restaurantId: user.restaurantId,
  });

  if (user.onboardingStep === 'inventory') {
    user.onboardingStep = 'cashiers';
    await user.save();
  }

  res.status(201).json({ message: 'Product added', product, onboardingStep: user.onboardingStep });
});

export const listProducts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'User not found' });

  const products = await Product.find({ restaurantId: user.restaurantId, isActive: true });
  res.json({ products });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, category, stockQuantity } = req.body;
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const product = await Product.findOneAndUpdate(
    { _id: id, restaurantId: user.restaurantId },
    { ...(name !== undefined && { name }), ...(price !== undefined && { price }), ...(category !== undefined && { category }), ...(stockQuantity !== undefined && { stockQuantity }) },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });

  res.json({ message: 'Product updated', product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const product = await Product.findOneAndUpdate(
    { _id: id, restaurantId: user.restaurantId },
    { isActive: false },
    { new: true }
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });

  res.json({ message: 'Product deleted' });
});
