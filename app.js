const el = {
  title: document.getElementById("title"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  addTransactionBtn: document.getElementById("addTransactionBtn"),
  formMessage: document.getElementById("formMessage"),

  exportBtn: document.getElementById("exportBtn"),
  clearBtn: document.getElementById("clearBtn"),

  totalBalance: document.getElementById("totalBalance"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpenses: document.getElementById("totalExpenses"),
  savingsRate: document.getElementById("savingsRate"),

  balanceCard: document.getElementById("balanceCard"),
  incomeCard: document.getElementById("incomeCard"),
  expenseCard: document.getElementById("expenseCard"),
  transactionCount: document.getElementById("transactionCount"),

  monthIncome: document.getElementById("monthIncome"),
  monthExpenses: document.getElementById("monthExpenses"),
  topCategory: document.getElementById("topCategory"),
  biggestExpense: document.getElementById("biggestExpense"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
  monthlySnapshot: document.getElementById("monthlySnapshot"),

  searchInput: document.getElementById("searchInput"),
  filterType: document.getElementById("filterType"),
  filterCategory: document.getElementById("filterCategory"),
  transactionList: document.getElementById("transactionList")
};

const STORAGE_KEY = "financeflowpro_transactions";
let transactions = loadTransactions();

function money(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function setMessage(text = "", type = "") {
  el.formMessage.className = "message";
  if (type) el.formMessage.classList.add(type);
  el.formMessage.textContent = text;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validateForm() {
  const title = el.title.value.trim();
  const type = el.type.value;
  const amount = Number(el.amount.value);
  const category = el.category.value;
  const date = el.date.value;

  if (!title) throw new Error("Transaction title is required.");
  if (!["income", "expense"].includes(type)) throw new Error("Choose a valid transaction type.");
  if (!amount || amount <= 0) throw new Error("Enter a valid amount greater than 0.");
  if (!category) throw new Error("Choose a category.");
  if (!date) throw new Error("Choose a date.");

  return {
    id: crypto.randomUUID(),
    title,
    type,
    amount,
    category,
    date,
    createdAt: new Date().toISOString()
  };
}

function resetForm() {
  el.title.value = "";
  el.type.value = "income";
  el.amount.value = "";
  el.category.value = "Salary";
  el.date.value = getToday();
}

function addTransaction() {
  try {
    const transaction = validateForm();
    transactions.unshift(transaction);
    saveTransactions();
    resetForm();
    updateUI();
    setMessage("Transaction added successfully.", "success");
  } catch (error) {
    setMessage(error.message || "Unable to add transaction.", "error");
  }
}

function deleteTransaction(id) {
  transactions = transactions.filter((item) => item.id !== id);
  saveTransactions();
  updateUI();
}

function getFilteredTransactions() {
  const query = el.searchInput.value.trim().toLowerCase();
  const typeFilter = el.filterType.value;
  const categoryFilter = el.filterCategory.value;

  return transactions.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query);

    const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
    const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;

    return matchesQuery && matchesType && matchesCategory;
  });
}

function renderTransactions() {
  const list = getFilteredTransactions();
  el.transactionList.innerHTML = "";

  if (!list.length) {
    el.transactionList.innerHTML = `
      <div class="empty-state">
        No transactions found. Add your first income or expense to get started.
      </div>
    `;
    return;
  }

  list.forEach((item) => {
    const row = document.createElement("div");
    row.className = "transaction-item";

    row.innerHTML = `
      <div class="transaction-main">
        <div class="transaction-title">${escapeHtml(item.title)}</div>
        <div class="transaction-meta">
          ${escapeHtml(item.category)} • ${escapeHtml(item.date)} • ${escapeHtml(item.type)}
        </div>
      </div>

      <div class="transaction-amount ${item.type}">
        ${item.type === "income" ? "+" : "-"}${money(item.amount)}
      </div>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "danger-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.style.width = "auto";
    deleteBtn.style.minWidth = "90px";
    deleteBtn.onclick = () => deleteTransaction(item.id);

    row.appendChild(deleteBtn);
    el.transactionList.appendChild(row);
  });
}

function updateTotals() {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = income - expenses;
  const savings = income > 0 ? Math.round((balance / income) * 100) : 0;

  el.totalBalance.textContent = money(balance);
  el.totalIncome.textContent = money(income);
  el.totalExpenses.textContent = money(expenses);
  el.savingsRate.textContent = `${savings}%`;

  el.balanceCard.textContent = money(balance);
  el.incomeCard.textContent = money(income);
  el.expenseCard.textContent = money(expenses);
  el.transactionCount.textContent = String(transactions.length);
}

function getCurrentMonthTransactions() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return transactions.filter((item) => {
    const d = new Date(item.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

function updateInsights() {
  const currentMonth = getCurrentMonthTransactions();

  const monthIncome = currentMonth
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthExpenses = currentMonth
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expensesOnly = transactions.filter((item) => item.type === "expense");

  const biggestExpenseItem = expensesOnly.reduce(
    (max, item) => (Number(item.amount) > Number(max.amount || 0) ? item : max),
    {}
  );

  const categoryTotals = {};
  expensesOnly.forEach((item) => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
  });

  let topCategoryName = "N/A";
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([category, total]) => {
    if (total > topCategoryAmount) {
      topCategoryAmount = total;
      topCategoryName = category;
    }
  });

  el.monthIncome.textContent = money(monthIncome);
  el.monthExpenses.textContent = money(monthExpenses);
  el.topCategory.textContent = topCategoryName === "N/A" ? "N/A" : `${topCategoryName}`;
  el.biggestExpense.textContent = biggestExpenseItem.amount ? money(biggestExpenseItem.amount) : "£0.00";

  renderCategoryBreakdown(categoryTotals);
  renderMonthlySnapshot(currentMonth, monthIncome, monthExpenses);
}

function renderCategoryBreakdown(categoryTotals) {
  el.categoryBreakdown.innerHTML = "";

  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    el.categoryBreakdown.innerHTML = `
      <div class="empty-state">No category expense data yet.</div>
    `;
    return;
  }

  entries.forEach(([category, total]) => {
    const row = document.createElement("div");
    row.className = "breakdown-item";
    row.innerHTML = `
      <div class="breakdown-label">${escapeHtml(category)}</div>
      <div class="breakdown-value">${money(total)}</div>
    `;
    el.categoryBreakdown.appendChild(row);
  });
}

function renderMonthlySnapshot(currentMonth, monthIncome, monthExpenses) {
  el.monthlySnapshot.innerHTML = "";

  const balance = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Math.round((balance / monthIncome) * 100) : 0;

  const items = [
    ["Transactions This Month", currentMonth.length],
    ["Monthly Income", money(monthIncome)],
    ["Monthly Expenses", money(monthExpenses)],
    ["Monthly Balance", money(balance)],
    ["Monthly Savings Rate", `${savingsRate}%`]
  ];

  items.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "breakdown-item";
    row.innerHTML = `
      <div class="breakdown-label">${escapeHtml(label)}</div>
      <div class="breakdown-value">${escapeHtml(value)}</div>
    `;
    el.monthlySnapshot.appendChild(row);
  });
}

function updateUI() {
  updateTotals();
  updateInsights();
  renderTransactions();
}

function exportCSV() {
  if (!transactions.length) {
    setMessage("No transactions to export.", "error");
    return;
  }

  const headers = ["Title", "Type", "Amount", "Category", "Date", "Created At"];
  const rows = transactions.map((item) => [
    item.title,
    item.type,
    item.amount,
    item.category,
    item.date,
    item.createdAt
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "financeflow-transactions.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  setMessage("CSV exported successfully.", "success");
}

function clearAllTransactions() {
  if (!transactions.length) {
    setMessage("There are no transactions to clear.", "error");
    return;
  }

  const confirmed = window.confirm("Are you sure you want to delete all transactions?");
  if (!confirmed) return;

  transactions = [];
  saveTransactions();
  updateUI();
  setMessage("All transactions cleared.", "success");
}

el.addTransactionBtn.onclick = addTransaction;
el.exportBtn.onclick = exportCSV;
el.clearBtn.onclick = clearAllTransactions;

el.searchInput.oninput = updateUI;
el.filterType.onchange = updateUI;
el.filterCategory.onchange = updateUI;

el.date.value = getToday();
updateUI();