import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Sale from '../models/sales.js';
import MenuItem from '../models/menuItem.js';
import Inventory from '../models/inventory.js';

export const addSale = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { orderId, productName, price, quantity, items } = req.body;

  let saleItems;
  if (items === undefined) {
    saleItems = [{ name: productName, price: Number(price), quantity: Number(quantity) }];
  } else {
    if (!Array.isArray(items) || items.length === 0 || items.some((item) => !mongoose.isValidObjectId(item?.menuItemId))) {
      return res.status(400).json({ message: 'Each sale item must reference a valid menu item' });
    }

    const menuItems = await MenuItem.find({
      _id: { $in: items.map((item) => item.menuItemId) },
      restaurantId,
      isAvailable: true,
    }).lean();
    const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));
    saleItems = items.map((item) => {
      const menuItem = menuItemsById.get(item.menuItemId.toString());
      if (!menuItem) return null;
      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        category: menuItem.category,
        price: menuItem.price,
        quantity: Number(item.quantity),
        recipe: menuItem.trackInventory ? menuItem.recipe : [],
      };
    });
    if (saleItems.some((item) => !item)) {
      return res.status(400).json({ message: 'A sale item is unavailable or does not belong to this restaurant' });
    }
    if (saleItems.some((item) =>
      item.recipe?.some((recipeItem) =>
        !mongoose.isValidObjectId(recipeItem.ingredientId) ||
        !Number.isFinite(recipeItem.quantity) ||
        recipeItem.quantity <= 0
      ) || (menuItemsById.get(item.menuItemId.toString()).trackInventory && item.recipe.length === 0)
    )) {
      return res.status(409).json({ message: 'A tracked menu item has an invalid or empty recipe' });
    }
  }

  if (saleItems.length === 0 || saleItems.some((item) =>
    !item.name ||
    !Number.isFinite(item.price) || item.price <= 0 ||
    !Number.isInteger(item.quantity) || item.quantity <= 0
  )) {
    return res.status(400).json({ message: 'Please provide valid sale items, prices, and quantities' });
  }

  const subtotalAmount = Math.round(saleItems.reduce((total, item) => total + item.price * item.quantity, 0));
  const vatRate = req.body.vatEnabled === true ? 0.16 : 0;
  const vatAmount = Math.round(subtotalAmount * vatRate);
  const totalAmount = subtotalAmount + vatAmount;
  if (!Number.isSafeInteger(totalAmount) || totalAmount < 1) {
    return res.status(400).json({ message: 'Sale total must be at least KES 1' });
  }

  const saleId = new mongoose.Types.ObjectId();
  const finalOrderId = orderId || saleId;

  const sale = await Sale.create({
    _id: saleId,
    orderId: finalOrderId,
    restaurantId,
    productName: items === undefined ? productName.trim() : saleItems.map((item) => `${item.name} x ${item.quantity}`).join(', '),
    price: items === undefined ? Number(price) : totalAmount,
    quantity: items === undefined ? Number(quantity) : 1,
    items: saleItems,
    subtotalAmount,
    vatRate,
    vatAmount,
    totalAmount,
    paymentStatus: 'pending',
    paymentMethod: 'pending',
  });

  return res.status(201).json({ message: 'Sale added successfully', sale });
});

export const getAllSalesByHotel = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { page = 1, limit = 10, status } = req.query;
  const numericPage = Math.max(1, Number(page) || 1);
  const numericLimit = Math.min(100, Math.max(1, Number(limit) || 10));

  const saleFilter = { restaurantId };
  if (status && ['pending', 'completed', 'failed'].includes(status)) {
    saleFilter.paymentStatus = status;
  }

  const [sales, totalSales] = await Promise.all([
    Sale.find(saleFilter).sort({ createdAt: -1 }).skip((numericPage - 1) * numericLimit).limit(numericLimit),
    Sale.countDocuments(saleFilter),
  ]);

  return res.json({
    sales,
    totalPages: Math.ceil(totalSales / numericLimit),
    currentPage: numericPage,
    totalSales,
  });
});

async function completeSale(orderId, restaurantId, payment) {
  const session = await mongoose.startSession();
  let completedSale;

  try {
    await session.withTransaction(async () => {
      completedSale = null;
      const sale = await Sale.findOne({
        orderId,
        restaurantId,
        paymentStatus: { $in: ['pending', 'failed'] },
      }).session(session);
      if (!sale) return;
      if (payment.amountReceived !== undefined && payment.amountReceived < sale.totalAmount) {
        const error = new Error('Amount received is less than the sale total');
        error.code = 'INSUFFICIENT_PAYMENT';
        throw error;
      }
      if (payment.amountReceived !== undefined) {
        payment.change = payment.amountReceived - sale.totalAmount;
      }

      const requiredStock = new Map();
      for (const item of sale.items) {
        for (const recipeItem of item.recipe ?? []) {
          const ingredientId = recipeItem.ingredientId.toString();
          requiredStock.set(
            ingredientId,
            (requiredStock.get(ingredientId) ?? 0) + recipeItem.quantity * item.quantity,
          );
        }
      }

      if (requiredStock.size > 0) {
        const updates = [...requiredStock]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([ingredientId, quantity]) => ({
            updateOne: {
              filter: { restaurantId, ingredientId, quantity: { $gte: quantity } },
              update: { $inc: { quantity: -quantity } },
            },
          }));
        const result = await Inventory.bulkWrite(updates, { session });
        if (result.matchedCount !== updates.length) {
          const error = new Error('Insufficient ingredient stock to complete this sale');
          error.code = 'INSUFFICIENT_STOCK';
          throw error;
        }
      }

      Object.assign(sale, payment, { paymentStatus: 'completed' });
      await sale.save({ session });
      completedSale = sale;
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_STOCK') {
      return { status: 409, message: error.message };
    }
    if (error.code === 'INSUFFICIENT_PAYMENT') {
      return { status: 400, message: error.message };
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (completedSale) return { sale: completedSale };

  const existingSale = await Sale.findOne({ orderId, restaurantId }).select('paymentStatus');
  if (!existingSale) return { status: 404, message: 'Sale not found' };
  return { status: 409, message: 'This sale is already paid' };
}

export const cashPayment = asyncHandler(async (req, res) => {
  const { orderId, amountReceived } = req.body;
  const numericAmountReceived = Number(amountReceived);
  if (!Number.isFinite(numericAmountReceived) || numericAmountReceived <= 0) {
    return res.status(400).json({ message: 'Invalid amount received' });
  }

  const result = await completeSale(orderId, req.user.restaurantId, {
    paymentMethod: 'cash',
    amountReceived: numericAmountReceived,
  });
  if (result.status) return res.status(result.status).json({ message: result.message });

  return res.json({ message: 'Cash payment completed successfully', sale: result.sale });
});

export const recordTillPayment = asyncHandler(async (req, res) => {
  const { orderId, receiptLast4 } = req.body ?? {};
  if (typeof receiptLast4 !== 'string' || !/^[A-Z0-9]{4}$/i.test(receiptLast4)) {
    return res.status(400).json({ message: 'Enter the last four characters of the M-Pesa receipt' });
  }

  const result = await completeSale(orderId, req.user.restaurantId, {
    paymentMethod: 'mpesa_till',
    mpesaReceiptLast4: receiptLast4.toUpperCase(),
  });
  if (result.status) return res.status(result.status).json({ message: result.message });

  return res.json({ message: 'M-Pesa Till payment recorded successfully', sale: result.sale });
});

export const startMpesaPayment = asyncHandler(async (req, res) => {
  const { orderId, phoneNumber } = req.body ?? {};
  let payerPhone;
  try {
    payerPhone = String(phoneNumber).replace(/\D/g, '');
    if (!/^254\d{9}$/.test(payerPhone) && !/^07\d{8}$/.test(payerPhone)) {
      throw new Error('Invalid Kenyan phone number');
    }
    if (payerPhone.startsWith('0')) payerPhone = `254${payerPhone.slice(1)}`;
  } catch {
    return res.status(400).json({ message: 'Invalid Kenyan phone number' });
  }

  const sale = await Sale.findOne({ orderId, restaurantId: req.user.restaurantId });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (!['pending', 'failed'].includes(sale.paymentStatus)) {
    return res.status(400).json({ message: 'This sale is already paid' });
  }

  sale.paymentMethod = 'mpesa';
  sale.paymentStatus = 'pending';
  sale.payerPhone = payerPhone;
  sale.checkoutRequestId = undefined;
  sale.merchantRequestId = undefined;
  await sale.save();

  return res.status(202).json({
    success: true,
    message: 'M-Pesa prompt recorded. Approve it on the customer phone.',
    sale,
  });
});

export const getSaleById = asyncHandler(async (req, res) => {
  const { saleId } = req.params;
  const sale = await Sale.findOne({ _id: saleId, restaurantId: req.user.restaurantId });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  return res.json({ sale });
});

export const mpesaCallback = asyncHandler(async (req, res) => {
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received' });
});
