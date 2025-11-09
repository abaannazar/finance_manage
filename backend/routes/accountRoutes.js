import express from 'express';
import Account from '../models/Account.js';

const router = express.Router();


router.post('/setup', async (req, res) => {
  try {
    const existing = await Account.find();
    if (existing.length === 0) {
      await Account.insertMany([
        { name: "Cash Wallet", balance: 0 },
        { name: "Bank Account", balance: 0 }
      ]);
    }
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updated = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
