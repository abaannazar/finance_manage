// ============ CONFIG ============
const API_BASE = "http://localhost:5000/api"; // change this when deployed

// ============ DOM ELEMENTS ============
const addBtn = document.querySelector(".header button");
const main = document.querySelector("main");
const totalBalanceEl = document.querySelector("#totalBalance span");
const walletBalanceEl = document.querySelector("#cashBalance span");
const bankBalanceEl = document.querySelector("#bankBalance span");
const transactionList = document.querySelector("#transactionList");

let accounts = [];
let transactions = [];

// ============ INIT ============
window.addEventListener("DOMContentLoaded", async () => {
  await refreshData();
});

// ============ LOADERS ============
async function refreshData() {
  await fetchAccounts();
  await fetchTransactions();
  updateBalances();
  renderTransactions();
}

async function fetchAccounts() {
  try {
    const res = await fetch(`${API_BASE}/accounts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    accounts = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching accounts:", err);
    accounts = [];
  }
}

async function fetchTransactions() {
  try {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    transactions = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching transactions:", err);
    transactions = [];
  }
}

// ============ BALANCE UPDATES ============
function updateBalances() {
  const wallet = accounts.find(a => a.name?.toLowerCase().includes("wallet"));
  const bank = accounts.find(a => a.name?.toLowerCase().includes("bank"));

  const walletBal = wallet?.balance || 0;
  const bankBal = bank?.balance || 0;
  const total = walletBal + bankBal;

  walletBalanceEl.textContent = walletBal.toFixed(2);
  bankBalanceEl.textContent = bankBal.toFixed(2);
  totalBalanceEl.textContent = total.toFixed(2);
}

// ============ TRANSACTIONS RENDER ============
function renderTransactions() {
  transactionList.innerHTML = "";

  if (!transactions.length) {
    transactionList.innerHTML = "<p>No transactions yet.</p>";
    return;
  }

  transactions.slice().reverse().forEach((t) => {
    const li = document.createElement("li");
    li.classList.add("transaction-item");

    const category = t.category || "Uncategorized";
    const note = t.note || "";
    const date = t.date ? new Date(t.date).toLocaleDateString() : "No date";
    const amount = typeof t.amount === "number" ? t.amount : 0;
    const type = t.type || "expense";

    li.innerHTML = `
      <div>
        <strong>${category}</strong> ${note}<br>
        <small>${date}</small>
      </div>
      <div class="transaction-actions">
        <span class="${type === "expense" ? "text-red" : "text-green"}">
          ${type === "expense" ? "-" : "+"}AED ${amount.toFixed(2)}
        </span>
        <button class="edit-btn" data-id="${t._id}"><i class="fa fa-edit"></i></button>
        <button class="delete-btn" data-id="${t._id}"><i class="fa fa-trash"></i></button>
      </div>
    `;

    transactionList.appendChild(li);
  });

  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => openModal("edit", btn.dataset.id))
  );
  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", () => deleteTransaction(btn.dataset.id))
  );
}

// ============ ADD / EDIT MODAL ============
addBtn.addEventListener("click", () => openModal("add"));

function openModal(mode, id = null) {
  const transaction = mode === "edit" ? transactions.find((t) => t._id === id) : null;

  const modal = document.createElement("div");
  modal.classList.add("modal-overlay");

  modal.innerHTML = `
    <div class="modal">
      <h2>${mode === "edit" ? "Edit Transaction" : "Add Transaction"}</h2>
      <form id="transactionForm">
        <label>Type</label>
        <select name="type" required>
          <option value="expense" ${transaction?.type === "expense" ? "selected" : ""}>Expense</option>
          <option value="income" ${transaction?.type === "income" ? "selected" : ""}>Income</option>
        </select>

        <label>Account</label>
        <select name="account" required>
          ${accounts
            .map(
              (acc) =>
                `<option value="${acc._id}" ${
                  transaction?.account === acc._id ? "selected" : ""
                }>${acc.name}</option>`
            )
            .join("")}
        </select>

        <label>Amount</label>
        <input type="number" name="amount" step="0.01" min="0.01" value="${transaction?.amount || ""}" required>

        <label>Category</label>
        <input type="text" name="category" value="${transaction?.category || ""}" required>

        <label>Note</label>
        <input type="text" name="note" value="${transaction?.note || ""}">

        <label>Date</label>
        <input type="date" name="date" value="${
          transaction ? new Date(transaction.date).toISOString().split("T")[0] : ""
        }" required>

        <div class="modal-buttons">
          <button type="button" id="cancelBtn">Cancel</button>
          <button type="submit" id="saveBtn">${mode === "edit" ? "Update" : "Add"} Transaction</button>
        </div>
      </form>
    </div>
  `;

  main.appendChild(modal);

  modal.querySelector("#cancelBtn").addEventListener("click", () => modal.remove());

  const form = modal.querySelector("#transactionForm");
  const saveBtn = modal.querySelector("#saveBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // prevent double clicks
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const formData = Object.fromEntries(new FormData(form).entries());
    formData.amount = parseFloat(formData.amount);

    try {
      const res = await fetch(
        mode === "edit"
          ? `${API_BASE}/transactions/${id}`
          : `${API_BASE}/transactions`,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) throw new Error("Failed to save transaction");

      await refreshData();

      modal.remove(); // close after one submission
    } catch (err) {
      console.error(err);
      alert("Error saving transaction. Check console.");

      saveBtn.disabled = false;
      saveBtn.textContent = mode === "edit" ? "Update Transaction" : "Add Transaction";
    }
  });
}

// ============ DELETE TRANSACTION ============
async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete transaction");

    await refreshData();
  } catch (err) {
    console.error(err);
    alert("Error deleting transaction.");
  }
}
