import express from "express";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

const router = express.Router();

/* =====================================================
   CREATE TRANSACTION
   ===================================================== */
router.post("/", async (req, res) => {
  try {
    const { account, type, amount, note, category, date } = req.body;

    // Basic validation
    if (!account || !type || !amount || !category)
      return res.status(400).json({ error: "account, type, amount, and category are required" });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "Amount must be a positive number" });

    if (!["income", "expense"].includes(type))
      return res.status(400).json({ error: "Type must be 'income' or 'expense'" });

    const acc = await Account.findById(account);
    if (!acc) return res.status(404).json({ error: "Account not found" });

    // Create transaction
    const transaction = new Transaction({
      account,
      type,
      amount: parsedAmount,
      note,
      category,
      date: date ? new Date(date) : new Date(),
    });
    await transaction.save();

    // Update account balance
    acc.balance += type === "income" ? parsedAmount : -parsedAmount;
    await acc.save();

    res.status(201).json(transaction);
  } catch (err) {
    console.error("Error creating transaction:", err);
    res.status(400).json({ error: err.message });
  }
});

/* =====================================================
   GET ALL TRANSACTIONS
   ===================================================== */
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().populate("account");
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   UPDATE TRANSACTION
   ===================================================== */
router.put("/:id", async (req, res) => {
  try {
    console.log("Incoming update body:", req.body);

    const { account, type, amount, note, category, date } = req.body;
    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) return res.status(404).json({ error: "Transaction not found" });

    // Revert old transaction impact
    const oldAccount = await Account.findById(oldTransaction.account);
    if (oldAccount) {
      oldAccount.balance += oldTransaction.type === "income"
        ? -oldTransaction.amount
        : oldTransaction.amount;
      await oldAccount.save();
    }

    // Validate new account
    const newAccount = await Account.findById(account || oldTransaction.account);
    if (!newAccount) return res.status(404).json({ error: "Account not found" });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "Amount must be a valid number" });

    const newType = type || oldTransaction.type;

    // Update fields safely
    oldTransaction.account = account || oldTransaction.account;
    oldTransaction.type = newType;
    oldTransaction.amount = parsedAmount || oldTransaction.amount;
    oldTransaction.note = note ?? oldTransaction.note;
    oldTransaction.category = category ?? oldTransaction.category;
    oldTransaction.date = date ? new Date(date) : oldTransaction.date;

    await oldTransaction.save();

    // Apply new impact
    newAccount.balance += newType === "income"
      ? parsedAmount
      : -parsedAmount;
    await newAccount.save();

    res.json(oldTransaction);
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(400).json({ error: err.message });
  }
});

/* =====================================================
   DELETE TRANSACTION
   ===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    // Revert impact before deleting
    const acc = await Account.findById(transaction.account);
    if (acc) {
      acc.balance += transaction.type === "income"
        ? -transaction.amount
        : transaction.amount;
      await acc.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
