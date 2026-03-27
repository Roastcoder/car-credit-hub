-- Account Department Database Schema
-- This file contains all the necessary tables for the account department functionality

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    parent_account_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id)
);

-- General Ledger
CREATE TABLE general_ledger (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_date DATE NOT NULL,
    account_id INT NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(50),
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) DEFAULT 0.00,
    transaction_type VARCHAR(50),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Accounts Receivable
CREATE TABLE accounts_receivable (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    status ENUM('Draft', 'Sent', 'Overdue', 'Paid', 'Cancelled') DEFAULT 'Draft',
    description TEXT,
    loan_id INT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Accounts Payable
CREATE TABLE accounts_payable (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_email VARCHAR(255),
    vendor_phone VARCHAR(20),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    status ENUM('Draft', 'Pending', 'Approved', 'Paid', 'Cancelled') DEFAULT 'Draft',
    category VARCHAR(100),
    description TEXT,
    created_by INT NOT NULL,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_type ENUM('Receivable', 'Payable') NOT NULL,
    reference_id INT NOT NULL, -- Links to accounts_receivable or accounts_payable
    payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card') NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    bank_account VARCHAR(100),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Budget Management
CREATE TABLE budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    budget_name VARCHAR(255) NOT NULL,
    budget_year YEAR NOT NULL,
    budget_period ENUM('Monthly', 'Quarterly', 'Yearly') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget DECIMAL(15,2) NOT NULL,
    status ENUM('Draft', 'Active', 'Completed', 'Cancelled') DEFAULT 'Draft',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Budget Line Items
CREATE TABLE budget_line_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    budget_id INT NOT NULL,
    account_id INT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0.00,
    variance DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

-- Expense Tracking
CREATE TABLE expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    receipt_number VARCHAR(50),
    vendor_name VARCHAR(255),
    payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Credit Card') NOT NULL,
    account_id INT NOT NULL,
    employee_id INT NOT NULL,
    status ENUM('Draft', 'Submitted', 'Approved', 'Reimbursed', 'Rejected') DEFAULT 'Draft',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Tax Management
CREATE TABLE tax_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tax_type ENUM('GST', 'TDS', 'Income Tax', 'Professional Tax', 'Other') NOT NULL,
    tax_period VARCHAR(20) NOT NULL, -- e.g., 'Q1-2024', 'FY-2024'
    due_date DATE NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('Pending', 'Filed', 'Paid', 'Overdue') DEFAULT 'Pending',
    filing_date DATE NULL,
    payment_date DATE NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Cash Flow Tracking
CREATE TABLE cash_flow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    flow_date DATE NOT NULL,
    flow_type ENUM('Inflow', 'Outflow') NOT NULL,
    category ENUM('Operating', 'Investing', 'Financing') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    account_id INT NOT NULL,
    reference_type VARCHAR(50), -- 'loan', 'expense', 'receivable', etc.
    reference_id INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit Trail
CREATE TABLE audit_trail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Financial Reports Configuration
CREATE TABLE report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_name VARCHAR(255) NOT NULL,
    report_type ENUM('Profit_Loss', 'Balance_Sheet', 'Cash_Flow', 'Trial_Balance', 'Custom') NOT NULL,
    template_config JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
-- Assets
('1000', 'Cash', 'Asset'),
('1100', 'Bank Account', 'Asset'),
('1200', 'Accounts Receivable', 'Asset'),
('1300', 'Office Equipment', 'Asset'),
('1400', 'Computer Equipment', 'Asset'),

-- Liabilities
('2000', 'Accounts Payable', 'Liability'),
('2100', 'Accrued Expenses', 'Liability'),
('2200', 'Loans Payable', 'Liability'),

-- Equity
('3000', 'Owner Equity', 'Equity'),
('3100', 'Retained Earnings', 'Equity'),

-- Revenue
('4000', 'Loan Processing Fees', 'Revenue'),
('4100', 'Commission Income', 'Revenue'),
('4200', 'Interest Income', 'Revenue'),

-- Expenses
('5000', 'Salaries & Benefits', 'Expense'),
('5100', 'Office Rent', 'Expense'),
('5200', 'Utilities', 'Expense'),
('5300', 'Marketing Expenses', 'Expense'),
('5400', 'Professional Services', 'Expense'),
('5500', 'Office Supplies', 'Expense'),
('5600', 'Travel Expenses', 'Expense'),
('5700', 'Insurance', 'Expense'),
('5800', 'Depreciation', 'Expense'),
('5900', 'Other Expenses', 'Expense');

-- Create indexes for better performance
CREATE INDEX idx_general_ledger_date ON general_ledger(transaction_date);
CREATE INDEX idx_general_ledger_account ON general_ledger(account_id);
CREATE INDEX idx_receivables_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_receivables_status ON accounts_receivable(status);
CREATE INDEX idx_payables_due_date ON accounts_payable(due_date);
CREATE INDEX idx_payables_status ON accounts_payable(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_cash_flow_date ON cash_flow(flow_date);
CREATE INDEX idx_audit_trail_table_record ON audit_trail(table_name, record_id);