-- ============================================
-- GroceryShop Database Schema
-- Run this file once to set up all tables
-- ============================================

CREATE DATABASE IF NOT EXISTS groceryshop;
USE groceryshop;

CREATE TABLE IF NOT EXISTS tbl_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tbl_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  image VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tbl_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) DEFAULT NULL,
  unit VARCHAR(50),
  stock INT DEFAULT 0,
  image VARCHAR(255),
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES tbl_categories(id)
);

CREATE TABLE IF NOT EXISTS tbl_cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES tbl_users(id),
  FOREIGN KEY (product_id) REFERENCES tbl_products(id)
);

CREATE TABLE IF NOT EXISTS tbl_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  delivery_charge DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('razorpay', 'cod') DEFAULT 'razorpay',
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  order_status ENUM('placed','confirmed','processing','out_for_delivery','delivered','cancelled') DEFAULT 'placed',
  delivery_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES tbl_users(id)
);

CREATE TABLE IF NOT EXISTS tbl_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES tbl_orders(id),
  FOREIGN KEY (product_id) REFERENCES tbl_products(id)
);

CREATE TABLE IF NOT EXISTS tbl_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount DECIMAL(10,2),
  status ENUM('created','captured','failed') DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES tbl_orders(id)
);

CREATE TABLE IF NOT EXISTS tbl_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('flat','percent') DEFAULT 'flat',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_uses INT DEFAULT 100,
  used_count INT DEFAULT 0,
  expires_at DATE,
  is_active TINYINT(1) DEFAULT 1
);

-- Seed: Default Admin (password: Admin@123)
INSERT IGNORE INTO tbl_users (name, email, password, role)
VALUES ('Admin','admin@groceryshop.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin');

-- Seed: Categories
INSERT IGNORE INTO tbl_categories (name, slug) VALUES
('Fruits & Vegetables','fruits-vegetables'),
('Dairy & Eggs','dairy-eggs'),
('Bakery & Bread','bakery-bread'),
('Beverages','beverages'),
('Snacks & Dry Fruits','snacks-dry-fruits'),
('Cooking Essentials','cooking-essentials');
