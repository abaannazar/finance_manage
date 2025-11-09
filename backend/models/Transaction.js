import express from "express";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

const router = express.Router();

async function applyImpact(accountId, type, amount, reverse = false) {
  const account = await Account.findById(accountId);
  if (!account) throw new Error("Account not found");

  let impact = type === "income" ? amount : -amount;

  if (reverse) impact = -impact;

  account.balance += impact;
  await account.save();
}

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { account, type, amount, category, note, date } = req.body;

    if (!account || !type || !amount || !category)
      return res.status(400).json({ error: "Missing required fields" });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    if (!["income", "expense"].includes(type))
      return res.status(400).json({ error: "Invalid transaction type" });

    const newTx = new Transaction({
      account,
      type,
      amount: parsedAmount,
      category,
      note,
      date: date ? new Date(date) : new Date()
    });

    await newTx.save();

    await applyImpact(account, type, parsedAmount);

    res.status(201).json(newTx);
  } catch (err) {
    console.error("Error creating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { account, type, amount, category, note, date } = req.body;

    const oldTx = await Transaction.findById(req.params.id);
    if (!oldTx) return res.status(404).json({ error: "Transaction not found" });

    await applyImpact(oldTx.account, oldTx.type, oldTx.amount, true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    if (!["income", "expense"].includes(type))
      return res.status(400).json({ error: "Invalid type" });

    const newAccountId = account || oldTx.account;

    oldTx.account = newAccountId;
    oldTx.type = type;
    oldTx.amount = parsedAmount;

    if (typeof category === "string" && category.trim() !== "") {
      oldTx.category = category.trim();
    }

    if (note !== undefined) oldTx.note = note;

    if (date && !isNaN(new Date(date).getTime())) {
      oldTx.date = new Date(date);
    }

    await oldTx.save();

    await applyImpact(newAccountId, type, parsedAmount);

    res.json(oldTx);
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    await applyImpact(tx.account, tx.type, tx.amount, true);

    await tx.deleteOne();

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
