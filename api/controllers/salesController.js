import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Sale from '../models/sales.js';

export const addSale = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { orderId, productName, price, quantity, items } = req.body;

  const saleItems = items === undefined
    ? [{ name: productName, price: Number(price), quantity: Number(quantity) }]
    : items.map((item) => ({
        name: typeof item?.name === 'string' ? item.name.trim() : '',
        category: typeof item?.category === 'string' ? item.category : undefined,
        price: Number(item?.price),
        quantity: Number(item?.quantity),
      }));

  if (saleItems.length === 0 || saleItems.some((item) =>
    !item.name ||
    !Number.isFinite(item.price) || item.price <= 0 ||
    !Number.isInteger(item.quantity) || item.quantity <= 0
  )) {
    return res.status(400).json({ message: 'Please provide valid sale items, prices, and quantities' });
  }

  const totalAmount = Math.round(saleItems.reduce((total, item) => total + item.price * item.quantity, 0));
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

export const cashPayment = asyncHandler(async (req, res) => {
  const { orderId, amountReceived } = req.body;
  const numericAmountReceived = Number(amountReceived);
  if (!Number.isFinite(numericAmountReceived) || numericAmountReceived <= 0) {
    return res.status(400).json({ message: 'Invalid amount received' });
  }

  const sale = await Sale.findOne({ orderId, restaurantId: req.user.restaurantId });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (!['pending', 'failed'].includes(sale.paymentStatus)) {
    return res.status(400).json({ message: 'This sale is already paid' });
  }
  if (numericAmountReceived < sale.totalAmount) {
    return res.status(400).json({ message: 'Amount received is less than the sale total' });
  }

  sale.paymentStatus = 'completed';
  sale.paymentMethod = 'cash';
  sale.amountReceived = numericAmountReceived;
  sale.change = numericAmountReceived - sale.totalAmount;
  await sale.save();

  return res.json({ message: 'Cash payment completed successfully', sale });
});

export const recordTillPayment = asyncHandler(async (req, res) => {
  const { orderId, receiptLast4 } = req.body ?? {};
  if (typeof receiptLast4 !== 'string' || !/^[A-Z0-9]{4}$/i.test(receiptLast4)) {
    return res.status(400).json({ message: 'Enter the last four characters of the M-Pesa receipt' });
  }

  const sale = await Sale.findOne({ orderId, restaurantId: req.user.restaurantId });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (!['pending', 'failed'].includes(sale.paymentStatus)) {
    return res.status(400).json({ message: 'This sale is already paid' });
  }

  sale.paymentStatus = 'completed';
  sale.paymentMethod = 'mpesa_till';
  sale.mpesaReceiptLast4 = receiptLast4.toUpperCase();
  await sale.save();

  return res.json({ message: 'M-Pesa Till payment recorded successfully', sale });
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
