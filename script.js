document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const transactionForm = document.getElementById('transactionForm');
    const transactionType = document.getElementById('transactionType');
    const transactionCategory = document.getElementById('transactionCategory');
    const transactionAmount = document.getElementById('transactionAmount');
    const transactionDate = document.getElementById('transactionDate');
    const transactionDescription = document.getElementById('transactionDescription');
    
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const filterMonth = document.getElementById('filterMonth');
    
    const currentBalance = document.getElementById('currentBalance');
    const totalIncome = document.getElementById('totalIncome');
    const totalExpenses = document.getElementById('totalExpenses');
    
    const transactionsContainer = document.getElementById('transactionsContainer');
    
    // Chart instances
    let categoryChart, monthlyChart;
    
    // Categories for Indonesian context
    const categories = {
        income: ['Gaji', 'Freelance', 'Investasi', 'Hadiah', 'Usaha Sampingan', 'Bonus', 'Lainnya'],
        expense: ['Makanan', 'Transportasi', 'Perumahan', 'Hiburan', 'Kesehatan', 'Pendidikan', 
                  'Belanja', 'Tagihan', 'Pulsa/Internet', 'Donasi', 'Liburan', 'Lainnya']
    };
    
    // App state
    let transactions = JSON.parse(localStorage.getItem('financeTransactions')) || [];
    let unit = 'IDR';
    
    // Initialize the app
    function init() {
        transactionDate.valueAsDate = new Date();
        updateCategoryOptions();
        updateFilterOptions();
        addEventListeners();
        renderTransactions();
        updateSummary();
        renderCharts();
    }
    
    // Add event listeners
    function addEventListeners() {
        transactionForm.addEventListener('submit', handleAddTransaction);
        transactionType.addEventListener('change', updateCategoryOptions);
        
        filterType.addEventListener('change', function() {
            renderTransactions();
            updateFilterOptions();
        });
        
        filterCategory.addEventListener('change', renderTransactions);
        filterMonth.addEventListener('change', renderTransactions);
    }
    
    // Format Rupiah
    function formatRupiah(amount) {
        return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    // Format date to Indonesian format
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }
    
    // Handle form submission
    function handleAddTransaction(e) {
        e.preventDefault();
        
        // Validate amount
        if (transactionAmount.value < 100) {
            alert('Minimum transaksi adalah Rp100');
            return;
        }
        
        const transaction = {
            id: Date.now(),
            type: transactionType.value,
            category: transactionCategory.value,
            amount: parseInt(transactionAmount.value),
            date: transactionDate.value,
            description: transactionDescription.value.trim() || null,
            createdAt: new Date().toISOString()
        };
        
        // Add to transactions array
        transactions.unshift(transaction);
        
        // Save to localStorage
        saveTransactions();
        
        transactionForm.reset();
        transactionDate.valueAsDate = new Date();
        
        if (transactionType.value === 'income') {
            transactionCategory.value = 'Gaji';
        } else {
            transactionCategory.value = 'Makanan';
        }
        
        // Update UI
        renderTransactions();
        updateSummary();
        renderCharts();
        updateFilterOptions();
    }
    
    // Update category options based on transaction type
    function updateCategoryOptions() {
        transactionCategory.innerHTML = '';
        
        const type = transactionType.value;
        categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            transactionCategory.appendChild(option);
        });
        
        // Set default category
        if (type === 'income') {
            transactionCategory.value = 'Gaji';
        } else {
            transactionCategory.value = 'Makanan';
        }
    }
    
    // Update filter dropdown options
    function updateFilterOptions() {
        // Update category filter
        filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';
        
        const type = filterType.value;
        if (type === 'all') {
            // Combine all categories
            const allCategories = [...categories.income, ...categories.expense];
            allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                filterCategory.appendChild(option);
            });
        } else {
            // Show only relevant categories
            categories[type].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                filterCategory.appendChild(option);
            });
        }
        
        // Update month filter
        filterMonth.innerHTML = '<option value="all">Semua Waktu</option>';
        
        // Get unique months from transactions
        const months = new Set();
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthYear);
        });
        
        // Convert to array and sort
        const sortedMonths = Array.from(months).sort();
        
        // Add options
        sortedMonths.forEach(monthYear => {
            const [year, month] = monthYear.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            
            const option = document.createElement('option');
            option.value = monthYear;
            option.textContent = monthName;
            filterMonth.appendChild(option);
        });
    }
    
    // Render transactions based on filters
    function renderTransactions() {
        transactionsContainer.innerHTML = '';
        
        const typeFilter = filterType.value;
        const categoryFilter = filterCategory.value;
        const monthFilter = filterMonth.value;
        
        // Filter transactions
        let filteredTransactions = transactions;
        
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }
        
        if (monthFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                return transactionMonth === monthFilter;
            });
        }
        
        // Display transactions
        if (filteredTransactions.length === 0) {
            transactionsContainer.innerHTML = '<div class="no-transactions">Tidak ada transaksi yang ditemukan</div>';
            return;
        }
        
        filteredTransactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.className = `transaction transaction-${transaction.type}`;
            
            transactionElement.innerHTML = `
                <div class="transaction-details">
                    <div class="transaction-category">${transaction.category}</div>
                    ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}-amount">
                    ${transaction.type === 'income' ? '+' : '-'}${formatRupiah(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="delete-btn" data-id="${transaction.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            transactionsContainer.appendChild(transactionElement);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTransaction(id);
            });
        });
    }
    
    // Delete a transaction
    function deleteTransaction(id) {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            renderTransactions();
            updateSummary();
            renderCharts();
            updateFilterOptions();
        }
    }
    
    // Update summary cards
    function updateSummary() {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expenses;
        
        totalIncome.textContent = formatRupiah(income);
        totalExpenses.textContent = formatRupiah(expenses);
        currentBalance.textContent = formatRupiah(balance);
        
        // Update balance color
        currentBalance.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
    }
    
    // Render charts
    function renderCharts() {
        renderCategoryChart();
        renderMonthlyChart();
    }
    
    // Render category chart
    function renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Filter expenses only
        const expenses = transactions.filter(t => t.type === 'expense');
        
        // Group by category
        const categoryData = {};
        categories.expense.forEach(category => {
            categoryData[category] = 0;
        });
        
        expenses.forEach(transaction => {
            categoryData[transaction.category] += transaction.amount;
        });
        
        // Prepare data for chart
        const labels = [];
        const data = [];
        const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8AC249', '#EA5F89', '#00BFFF', '#A0522D',
            '#7FFFD4', '#FFA07A'
        ];
        
        Object.entries(categoryData).forEach(([category, amount], index) => {
            if (amount > 0) {
                labels.push(category);
                data.push(amount);
            }
        });
        
        // Destroy previous chart if exists
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        // Create new chart
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${formatRupiah(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
    
    // Render monthly chart
    function renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // Group by month
        const monthlyData = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    label: monthName,
                    income: 0,
                    expense: 0
                };
            }
            
            monthlyData[monthYear][transaction.type] += transaction.amount;
        });
        
        // Sort by date
        const sortedMonths = Object.keys(monthlyData).sort();
        
        // Prepare data for chart
        const labels = sortedMonths.map(month => monthlyData[month].label);
        const incomeData = sortedMonths.map(month => monthlyData[month].income);
        const expenseData = sortedMonths.map(month => monthlyData[month].expense);
        
        // Destroy previous chart if exists
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        // Create new chart
        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: incomeData,
                        backgroundColor: 'rgba(25, 135, 84, 0.7)',
                        borderColor: 'rgba(25, 135, 84, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Pengeluaran',
                        data: expenseData,
                        backgroundColor: 'rgba(220, 67, 54, 0.7)',
                        borderColor: 'rgba(220, 67, 54, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatRupiah(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatRupiah(context.raw)}`;
                            },
                            footer: function(context) {
                                const income = context[0].raw;
                                const expense = context[1]?.raw || 0;
                                const balance = income - expense;
                                return `Saldo: ${formatRupiah(balance)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 20
                        }
                    }
                }
            }
        });
    }
    
    // Save transactions to localStorage
    function saveTransactions() {
        localStorage.setItem('financeTransactions', JSON.stringify(transactions));
    }
    
    init();
});