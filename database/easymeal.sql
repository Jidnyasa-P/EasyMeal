-- EasyMeal Database Setup
-- Run this file in MySQL: mysql -u root -p < easymeal.sql

CREATE DATABASE IF NOT EXISTS easymeal_db;
USE easymeal_db;

-- ========================
-- USERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- MENU ITEMS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category ENUM('meal', 'snack', 'drink') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- ORDERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(20) NOT NULL UNIQUE,
  student_name VARCHAR(100) NOT NULL,
  student_email VARCHAR(150) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('online', 'cod') DEFAULT 'cod',
  status ENUM('pending', 'preparing', 'ready', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================
-- ORDER ITEMS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ========================
-- DUMMY DATA - USERS
-- ========================
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User', 'admin@easymeal.com', '9000000000', 'admin123', 'admin'),
('Aditi Sharma', 'aditi@student.com', '9876543210', 'student123', 'student'),
('Rahul Verma', 'rahul@student.com', '9876543211', 'student123', 'student'),
('Neha Gupta', 'neha@student.com', '9876543212', 'student123', 'student'),
('Arjun Singh', 'arjun@student.com', '9876543213', 'student123', 'student');

-- ========================
-- DUMMY DATA - MENU ITEMS
-- ========================
INSERT INTO menu_items (name, category, price, description, image_url, is_available) VALUES
('Veg Thali', 'meal', 90.00, 'Healthy meal with chapati, rice & curry.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=60', 1),
('Paneer Wrap', 'snack', 70.00, 'Loaded wrap with grilled paneer and veggies.', 'https://images.unsplash.com/photo-1640930405840-a9f4f99f2d77?auto=format&fit=crop&w=700&q=60', 1),
('Cold Coffee', 'drink', 55.00, 'Creamy chilled coffee to refresh your day.', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=700&q=60', 1),
('Campus Burger', 'snack', 80.00, 'Crispy patty with signature cafeteria sauce.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=60', 1),
('Masala Dosa', 'meal', 65.00, 'South Indian favorite served with chutneys.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=60', 1),
('Fresh Lime Soda', 'drink', 40.00, 'Cool sparkling refreshment for warm days.', 'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=700&q=60', 1);

-- ========================
-- DUMMY DATA - ORDERS (5 orders)
-- ========================
INSERT INTO orders (order_code, student_name, student_email, total_amount, payment_method, status) VALUES
('EM1244', 'Aditi Sharma', 'aditi@student.com', 160.00, 'online', 'completed'),
('EM1245', 'Rahul Verma', 'rahul@student.com', 90.00, 'cod', 'preparing'),
('EM1246', 'Neha Gupta', 'neha@student.com', 125.00, 'online', 'ready'),
('EM1247', 'Arjun Singh', 'arjun@student.com', 150.00, 'cod', 'pending'),
('EM1248', 'Aditi Sharma', 'aditi@student.com', 55.00, 'online', 'completed');

-- ========================
-- DUMMY DATA - ORDER ITEMS
-- ========================
-- Order EM1244
INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES
(1, 'Veg Thali', 90.00, 1, 90.00),
(1, 'Cold Coffee', 55.00, 1, 55.00),
(1, 'Fresh Lime Soda', 40.00, 0, 15.00);

-- Order EM1245
INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES
(2, 'Veg Thali', 90.00, 1, 90.00);

-- Order EM1246
INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES
(3, 'Paneer Wrap', 70.00, 1, 70.00),
(3, 'Fresh Lime Soda', 40.00, 1, 40.00),
(3, 'Cold Coffee', 55.00, 0, 15.00);

-- Order EM1247
INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES
(4, 'Campus Burger', 80.00, 1, 80.00),
(4, 'Masala Dosa', 65.00, 1, 65.00);

-- Order EM1248
INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES
(5, 'Cold Coffee', 55.00, 1, 55.00);

-- Fix order item quantities
UPDATE order_items SET quantity=1 WHERE quantity=0;

SELECT 'Database setup complete!' AS message;
SELECT 'Users:' AS info; SELECT id, name, email, role FROM users;
SELECT 'Menu Items:' AS info; SELECT id, name, category, price, is_available FROM menu_items;
SELECT 'Orders:' AS info; SELECT id, order_code, student_name, status, total_amount FROM orders;
