 
# Personal Finance Tracker

A basic app to track expenses and income with two accounts (Wallet + Bank).
You can add, edit, delete transactions and see updated balances instantly.

---

## Features

* Add income/expense
* Edit or delete transactions
* Auto-update total balance
* Prevent duplicate submissions
* Clean modal interface
* Connects to a simple REST API

---

## Tech Used

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js, Express, MongoDB

---

## API Routes

**Accounts**

* GET /api/accounts
* POST /api/accounts

**Transactions**

* GET /api/transactions
* POST /api/transactions
* PUT /api/transactions/:id
* DELETE /api/transactions/:id

---

## How to Run

### Backend

```
cd backend
npm install
npm start
```

### Frontend

Just open `index.html` in a browser.

---

## Files

```
index.html
style.css
script.js
```

---

## Notes

* Change API_BASE when deployed
* Make sure MongoDB is running
* Duplicate clicks are blocked (single submit only)


