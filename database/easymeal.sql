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
  status ENUM('pending', 'ready') DEFAULT 'pending',
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
-- USERS
-- ========================
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User',     'admin@easymeal.com',   '9000000000', 'admin123',   'admin'),
('Aditi Sharma',   'aditi@student.com',    '9876543210', 'student123', 'student'),
('Rahul Verma',    'rahul@student.com',    '9876543211', 'student123', 'student'),
('Neha Gupta',     'neha@student.com',     '9876543212', 'student123', 'student'),
('Arjun Singh',    'arjun@student.com',    '9876543213', 'student123', 'student'),
('Priya Nair',     'priya@student.com',    '9876543214', 'student123', 'student'),
('Karthik Rajan',  'karthik@student.com',  '9876543215', 'student123', 'student'),
('Sneha Pillai',   'sneha@student.com',    '9876543216', 'student123', 'student'),
('Rohan Mehta',    'rohan@student.com',    '9876543217', 'student123', 'student'),
('Divya Iyer',     'divya@student.com',    '9876543218', 'student123', 'student'),
('Amit Patel',     'amit@student.com',     '9876543219', 'student123', 'student');

-- ========================
-- 50 MENU ITEMS
-- ========================
INSERT INTO menu_items (name, category, price, description, image_url, is_available) VALUES
-- MEALS (20 items)
('Veg Thali',         'meal', 90.00,  'Chapati, rice, dal, sabzi & salad.',         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=60', 1),
('Chicken Biryani',   'meal', 130.00, 'Fragrant basmati rice with spiced chicken.',  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=60', 1),
('Masala Dosa',       'meal', 65.00,  'Crispy dosa with potato masala & chutneys.', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=60', 1),
('Rajma Chawal',      'meal', 80.00,  'Red kidney beans curry with steamed rice.',  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=60', 1),
('Paneer Butter Masala','meal',110.00,'Cottage cheese in rich tomato-butter gravy.','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=60', 1),
('Chole Bhature',     'meal', 85.00,  'Spiced chickpeas with fluffy fried bread.',  'https://images.unsplash.com/photo-1626132647523-66b5b3728ae9?auto=format&fit=crop&w=700&q=60', 1),
('Egg Fried Rice',    'meal', 75.00,  'Wok-tossed rice with scrambled eggs & vegs.','https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=60', 1),
('Veg Pulao',         'meal', 70.00,  'Fragrant rice cooked with mixed vegetables.','https://images.unsplash.com/photo-1645177628172-a94c1f96diag?auto=format&fit=crop&w=700&q=60', 1),
('Dal Makhani',       'meal', 95.00,  'Slow-cooked black lentils in creamy gravy.','https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=60', 1),
('Mutton Curry',      'meal', 150.00, 'Tender mutton in a spiced onion gravy.',    'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=700&q=60', 1),
('Idli Sambar',       'meal', 55.00,  '4 fluffy idlis with sambar & coconut chutney.','https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=60', 1),
('Pav Bhaji',         'meal', 75.00,  'Spiced mashed veggies served with buttered pav.','https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=700&q=60', 1),
('Fish Curry Rice',   'meal', 140.00, 'Coastal spiced fish curry with boiled rice.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=700&q=60', 1),
('Kadai Paneer',      'meal', 105.00, 'Paneer cooked with capsicum & bold spices.','https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=700&q=60', 1),
('Poha',              'meal', 45.00,  'Flattened rice tempered with mustard & curry leaves.','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=60', 1),
('Upma',              'meal', 40.00,  'Savory semolina porridge with veggies.',    'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=700&q=60', 1),
('Egg Curry Rice',    'meal', 90.00,  'Hard-boiled eggs in spiced tomato gravy.',  'https://images.unsplash.com/photo-1527515637462-cff94ead201b?auto=format&fit=crop&w=700&q=60', 1),
('Veg Manchurian',    'meal', 80.00,  'Crispy veggie balls in Indo-Chinese sauce.','https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=700&q=60', 1),
('Aloo Paratha',      'meal', 60.00,  'Stuffed potato flatbread with butter & curd.','https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=700&q=60', 1),
('Chicken Fried Rice','meal', 115.00, 'Wok-tossed rice with chicken & vegetables.','https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=60', 1),

-- SNACKS (17 items)
('Paneer Wrap',       'snack', 70.00, 'Grilled paneer with veggies in a wrap.',    'https://images.unsplash.com/photo-1640930405840-a9f4f99f2d77?auto=format&fit=crop&w=700&q=60', 1),
('Campus Burger',     'snack', 80.00, 'Crispy patty with cafeteria sauce & lettuce.','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=60', 1),
('Veg Sandwich',      'snack', 50.00, 'Toasted bread with cucumber, tomato & cheese.','https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=60', 1),
('Samosa (2 pcs)',    'snack', 30.00, 'Crispy pastry filled with spiced potato.',  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=60', 1),
('Masala Fries',      'snack', 55.00, 'Golden fries tossed with spiced masala.',   'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=60', 1),
('Bread Pakora',      'snack', 35.00, 'Bread stuffed with potato, dipped in batter.','https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=60', 1),
('Spring Rolls (3)',  'snack', 60.00, 'Crispy rolls filled with stir-fried veggies.','https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&w=700&q=60', 1),
('Chicken Wrap',      'snack', 90.00, 'Grilled chicken strips with sauce in wrap.','https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=60', 1),
('Veg Pizza Slice',   'snack', 65.00, 'Cheesy veggie pizza slice baked fresh.',    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=60', 1),
('Nachos & Salsa',    'snack', 70.00, 'Corn chips with spicy salsa dip.',          'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=700&q=60', 1),
('Kachori (2 pcs)',   'snack', 35.00, 'Flaky pastry filled with spiced lentil.',   'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=700&q=60', 1),
('Dhokla',            'snack', 40.00, 'Steamed gram flour cake with mustard tempering.','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=60', 1),
('Aloo Tikki (2)',    'snack', 45.00, 'Crispy spiced potato patties, pan-fried.',  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=60', 1),
('Cheese Toast',      'snack', 55.00, 'Thick toast loaded with melted cheese.',    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=60', 1),
('Mini Uttapam',      'snack', 50.00, 'Small rice pancakes topped with onion & tomato.','https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=60', 1),
('Egg Roll',          'snack', 65.00, 'Egg & onion stir-fried, wrapped in paratha.','https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=60', 1),
('Peanut Chaat',      'snack', 30.00, 'Boiled peanuts tossed with spices & lemon.','https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=700&q=60', 1),

-- DRINKS (13 items)
('Cold Coffee',       'drink', 55.00, 'Chilled creamy blended coffee.',            'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=700&q=60', 1),
('Fresh Lime Soda',   'drink', 40.00, 'Sparkling lime refresher.',                 'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?auto=format&fit=crop&w=700&q=60', 1),
('Mango Lassi',       'drink', 60.00, 'Thick yogurt drink with ripe mango pulp.',  'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?auto=format&fit=crop&w=700&q=60', 1),
('Masala Chai',       'drink', 25.00, 'Spiced Indian milk tea.',                   'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=700&q=60', 1),
('Watermelon Juice',  'drink', 50.00, 'Fresh squeezed chilled watermelon juice.',  'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=700&q=60', 1),
('Buttermilk',        'drink', 30.00, 'Chilled spiced chaas with curry leaves.',   'https://images.unsplash.com/photo-1625865408909-f1f4f1c93b4b?auto=format&fit=crop&w=700&q=60', 1),
('Orange Juice',      'drink', 55.00, 'Freshly squeezed orange juice.',            'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=700&q=60', 1),
('Rose Milk',         'drink', 45.00, 'Chilled milk flavored with rose syrup.',    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=700&q=60', 1),
('Banana Shake',      'drink', 60.00, 'Thick banana milkshake, lightly sweetened.','https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=700&q=60', 1),
('Coconut Water',     'drink', 35.00, 'Fresh tender coconut water, naturally sweet.','https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=60', 1),
('Green Tea',         'drink', 30.00, 'Hot brewed green tea with antioxidants.',   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=60', 1),
('Strawberry Smoothie','drink',65.00, 'Blended strawberries with yogurt & honey.', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=700&q=60', 1),
('Hot Chocolate',     'drink', 50.00, 'Rich creamy hot chocolate drink.',          'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=700&q=60', 1);

-- ========================
-- 200 ORDERS  (190 ready, 10 pending)
-- Students spread across existing users
-- ========================
INSERT INTO orders (order_code, student_name, student_email, total_amount, payment_method, status) VALUES
('EM1001','Aditi Sharma','aditi@student.com',245.00,'online','ready'),
('EM1002','Rahul Verma','rahul@student.com',130.00,'cod','ready'),
('EM1003','Neha Gupta','neha@student.com',195.00,'online','ready'),
('EM1004','Arjun Singh','arjun@student.com',80.00,'cod','ready'),
('EM1005','Priya Nair','priya@student.com',165.00,'online','ready'),
('EM1006','Karthik Rajan','karthik@student.com',90.00,'cod','ready'),
('EM1007','Sneha Pillai','sneha@student.com',220.00,'online','ready'),
('EM1008','Rohan Mehta','rohan@student.com',75.00,'cod','ready'),
('EM1009','Divya Iyer','divya@student.com',150.00,'online','ready'),
('EM1010','Amit Patel','amit@student.com',110.00,'cod','ready'),
('EM1011','Aditi Sharma','aditi@student.com',55.00,'online','ready'),
('EM1012','Rahul Verma','rahul@student.com',185.00,'cod','ready'),
('EM1013','Neha Gupta','neha@student.com',95.00,'online','ready'),
('EM1014','Arjun Singh','arjun@student.com',260.00,'cod','ready'),
('EM1015','Priya Nair','priya@student.com',130.00,'online','ready'),
('EM1016','Karthik Rajan','karthik@student.com',70.00,'cod','ready'),
('EM1017','Sneha Pillai','sneha@student.com',200.00,'online','ready'),
('EM1018','Rohan Mehta','rohan@student.com',115.00,'cod','ready'),
('EM1019','Divya Iyer','divya@student.com',85.00,'online','ready'),
('EM1020','Amit Patel','amit@student.com',145.00,'cod','ready'),
('EM1021','Aditi Sharma','aditi@student.com',300.00,'online','ready'),
('EM1022','Rahul Verma','rahul@student.com',60.00,'cod','ready'),
('EM1023','Neha Gupta','neha@student.com',175.00,'online','ready'),
('EM1024','Arjun Singh','arjun@student.com',90.00,'cod','ready'),
('EM1025','Priya Nair','priya@student.com',120.00,'online','ready'),
('EM1026','Karthik Rajan','karthik@student.com',210.00,'cod','ready'),
('EM1027','Sneha Pillai','sneha@student.com',55.00,'online','ready'),
('EM1028','Rohan Mehta','rohan@student.com',165.00,'cod','ready'),
('EM1029','Divya Iyer','divya@student.com',100.00,'online','ready'),
('EM1030','Amit Patel','amit@student.com',230.00,'cod','ready'),
('EM1031','Aditi Sharma','aditi@student.com',75.00,'online','ready'),
('EM1032','Rahul Verma','rahul@student.com',140.00,'cod','ready'),
('EM1033','Neha Gupta','neha@student.com',195.00,'online','ready'),
('EM1034','Arjun Singh','arjun@student.com',80.00,'cod','ready'),
('EM1035','Priya Nair','priya@student.com',125.00,'online','ready'),
('EM1036','Karthik Rajan','karthik@student.com',170.00,'cod','ready'),
('EM1037','Sneha Pillai','sneha@student.com',90.00,'online','ready'),
('EM1038','Rohan Mehta','rohan@student.com',245.00,'cod','ready'),
('EM1039','Divya Iyer','divya@student.com',60.00,'online','ready'),
('EM1040','Amit Patel','amit@student.com',185.00,'cod','ready'),
('EM1041','Aditi Sharma','aditi@student.com',110.00,'online','ready'),
('EM1042','Rahul Verma','rahul@student.com',75.00,'cod','ready'),
('EM1043','Neha Gupta','neha@student.com',220.00,'online','ready'),
('EM1044','Arjun Singh','arjun@student.com',95.00,'cod','ready'),
('EM1045','Priya Nair','priya@student.com',155.00,'online','ready'),
('EM1046','Karthik Rajan','karthik@student.com',130.00,'cod','ready'),
('EM1047','Sneha Pillai','sneha@student.com',85.00,'online','ready'),
('EM1048','Rohan Mehta','rohan@student.com',200.00,'cod','ready'),
('EM1049','Divya Iyer','divya@student.com',115.00,'online','ready'),
('EM1050','Amit Patel','amit@student.com',70.00,'cod','ready'),
('EM1051','Aditi Sharma','aditi@student.com',260.00,'online','ready'),
('EM1052','Rahul Verma','rahul@student.com',90.00,'cod','ready'),
('EM1053','Neha Gupta','neha@student.com',145.00,'online','ready'),
('EM1054','Arjun Singh','arjun@student.com',175.00,'cod','ready'),
('EM1055','Priya Nair','priya@student.com',55.00,'online','ready'),
('EM1056','Karthik Rajan','karthik@student.com',190.00,'cod','ready'),
('EM1057','Sneha Pillai','sneha@student.com',105.00,'online','ready'),
('EM1058','Rohan Mehta','rohan@student.com',80.00,'cod','ready'),
('EM1059','Divya Iyer','divya@student.com',235.00,'online','ready'),
('EM1060','Amit Patel','amit@student.com',120.00,'cod','ready'),
('EM1061','Aditi Sharma','aditi@student.com',65.00,'online','ready'),
('EM1062','Rahul Verma','rahul@student.com',210.00,'cod','ready'),
('EM1063','Neha Gupta','neha@student.com',95.00,'online','ready'),
('EM1064','Arjun Singh','arjun@student.com',150.00,'cod','ready'),
('EM1065','Priya Nair','priya@student.com',185.00,'online','ready'),
('EM1066','Karthik Rajan','karthik@student.com',75.00,'cod','ready'),
('EM1067','Sneha Pillai','sneha@student.com',130.00,'online','ready'),
('EM1068','Rohan Mehta','rohan@student.com',250.00,'cod','ready'),
('EM1069','Divya Iyer','divya@student.com',90.00,'online','ready'),
('EM1070','Amit Patel','amit@student.com',165.00,'cod','ready'),
('EM1071','Aditi Sharma','aditi@student.com',110.00,'online','ready'),
('EM1072','Rahul Verma','rahul@student.com',85.00,'cod','ready'),
('EM1073','Neha Gupta','neha@student.com',200.00,'online','ready'),
('EM1074','Arjun Singh','arjun@student.com',140.00,'cod','ready'),
('EM1075','Priya Nair','priya@student.com',55.00,'online','ready'),
('EM1076','Karthik Rajan','karthik@student.com',175.00,'cod','ready'),
('EM1077','Sneha Pillai','sneha@student.com',100.00,'online','ready'),
('EM1078','Rohan Mehta','rohan@student.com',225.00,'cod','ready'),
('EM1079','Divya Iyer','divya@student.com',70.00,'online','ready'),
('EM1080','Amit Patel','amit@student.com',155.00,'cod','ready'),
('EM1081','Aditi Sharma','aditi@student.com',280.00,'online','ready'),
('EM1082','Rahul Verma','rahul@student.com',95.00,'cod','ready'),
('EM1083','Neha Gupta','neha@student.com',120.00,'online','ready'),
('EM1084','Arjun Singh','arjun@student.com',190.00,'cod','ready'),
('EM1085','Priya Nair','priya@student.com',75.00,'online','ready'),
('EM1086','Karthik Rajan','karthik@student.com',215.00,'cod','ready'),
('EM1087','Sneha Pillai','sneha@student.com',60.00,'online','ready'),
('EM1088','Rohan Mehta','rohan@student.com',145.00,'cod','ready'),
('EM1089','Divya Iyer','divya@student.com',110.00,'online','ready'),
('EM1090','Amit Patel','amit@student.com',85.00,'cod','ready'),
('EM1091','Aditi Sharma','aditi@student.com',230.00,'online','ready'),
('EM1092','Rahul Verma','rahul@student.com',115.00,'cod','ready'),
('EM1093','Neha Gupta','neha@student.com',160.00,'online','ready'),
('EM1094','Arjun Singh','arjun@student.com',55.00,'cod','ready'),
('EM1095','Priya Nair','priya@student.com',195.00,'online','ready'),
('EM1096','Karthik Rajan','karthik@student.com',90.00,'cod','ready'),
('EM1097','Sneha Pillai','sneha@student.com',135.00,'online','ready'),
('EM1098','Rohan Mehta','rohan@student.com',175.00,'cod','ready'),
('EM1099','Divya Iyer','divya@student.com',100.00,'online','ready'),
('EM1100','Amit Patel','amit@student.com',240.00,'cod','ready'),
('EM1101','Aditi Sharma','aditi@student.com',80.00,'online','ready'),
('EM1102','Rahul Verma','rahul@student.com',150.00,'cod','ready'),
('EM1103','Neha Gupta','neha@student.com',210.00,'online','ready'),
('EM1104','Arjun Singh','arjun@student.com',65.00,'cod','ready'),
('EM1105','Priya Nair','priya@student.com',125.00,'online','ready'),
('EM1106','Karthik Rajan','karthik@student.com',185.00,'cod','ready'),
('EM1107','Sneha Pillai','sneha@student.com',95.00,'online','ready'),
('EM1108','Rohan Mehta','rohan@student.com',270.00,'cod','ready'),
('EM1109','Divya Iyer','divya@student.com',75.00,'online','ready'),
('EM1110','Amit Patel','amit@student.com',140.00,'cod','ready'),
('EM1111','Aditi Sharma','aditi@student.com',200.00,'online','ready'),
('EM1112','Rahul Verma','rahul@student.com',85.00,'cod','ready'),
('EM1113','Neha Gupta','neha@student.com',165.00,'online','ready'),
('EM1114','Arjun Singh','arjun@student.com',110.00,'cod','ready'),
('EM1115','Priya Nair','priya@student.com',55.00,'online','ready'),
('EM1116','Karthik Rajan','karthik@student.com',245.00,'cod','ready'),
('EM1117','Sneha Pillai','sneha@student.com',120.00,'online','ready'),
('EM1118','Rohan Mehta','rohan@student.com',90.00,'cod','ready'),
('EM1119','Divya Iyer','divya@student.com',175.00,'online','ready'),
('EM1120','Amit Patel','amit@student.com',130.00,'cod','ready'),
('EM1121','Aditi Sharma','aditi@student.com',60.00,'online','ready'),
('EM1122','Rahul Verma','rahul@student.com',220.00,'cod','ready'),
('EM1123','Neha Gupta','neha@student.com',95.00,'online','ready'),
('EM1124','Arjun Singh','arjun@student.com',155.00,'cod','ready'),
('EM1125','Priya Nair','priya@student.com',185.00,'online','ready'),
('EM1126','Karthik Rajan','karthik@student.com',70.00,'cod','ready'),
('EM1127','Sneha Pillai','sneha@student.com',145.00,'online','ready'),
('EM1128','Rohan Mehta','rohan@student.com',235.00,'cod','ready'),
('EM1129','Divya Iyer','divya@student.com',80.00,'online','ready'),
('EM1130','Amit Patel','amit@student.com',160.00,'cod','ready'),
('EM1131','Aditi Sharma','aditi@student.com',105.00,'online','ready'),
('EM1132','Rahul Verma','rahul@student.com',190.00,'cod','ready'),
('EM1133','Neha Gupta','neha@student.com',75.00,'online','ready'),
('EM1134','Arjun Singh','arjun@student.com',210.00,'cod','ready'),
('EM1135','Priya Nair','priya@student.com',115.00,'online','ready'),
('EM1136','Karthik Rajan','karthik@student.com',260.00,'cod','ready'),
('EM1137','Sneha Pillai','sneha@student.com',90.00,'online','ready'),
('EM1138','Rohan Mehta','rohan@student.com',135.00,'cod','ready'),
('EM1139','Divya Iyer','divya@student.com',195.00,'online','ready'),
('EM1140','Amit Patel','amit@student.com',55.00,'cod','ready'),
('EM1141','Aditi Sharma','aditi@student.com',170.00,'online','ready'),
('EM1142','Rahul Verma','rahul@student.com',125.00,'cod','ready'),
('EM1143','Neha Gupta','neha@student.com',85.00,'online','ready'),
('EM1144','Arjun Singh','arjun@student.com',240.00,'cod','ready'),
('EM1145','Priya Nair','priya@student.com',100.00,'online','ready'),
('EM1146','Karthik Rajan','karthik@student.com',155.00,'cod','ready'),
('EM1147','Sneha Pillai','sneha@student.com',215.00,'online','ready'),
('EM1148','Rohan Mehta','rohan@student.com',70.00,'cod','ready'),
('EM1149','Divya Iyer','divya@student.com',185.00,'online','ready'),
('EM1150','Amit Patel','amit@student.com',110.00,'cod','ready'),
('EM1151','Aditi Sharma','aditi@student.com',65.00,'online','ready'),
('EM1152','Rahul Verma','rahul@student.com',200.00,'cod','ready'),
('EM1153','Neha Gupta','neha@student.com',140.00,'online','ready'),
('EM1154','Arjun Singh','arjun@student.com',90.00,'cod','ready'),
('EM1155','Priya Nair','priya@student.com',255.00,'online','ready'),
('EM1156','Karthik Rajan','karthik@student.com',75.00,'cod','ready'),
('EM1157','Sneha Pillai','sneha@student.com',165.00,'online','ready'),
('EM1158','Rohan Mehta','rohan@student.com',120.00,'cod','ready'),
('EM1159','Divya Iyer','divya@student.com',85.00,'online','ready'),
('EM1160','Amit Patel','amit@student.com',205.00,'cod','ready'),
('EM1161','Aditi Sharma','aditi@student.com',95.00,'online','ready'),
('EM1162','Rahul Verma','rahul@student.com',175.00,'cod','ready'),
('EM1163','Neha Gupta','neha@student.com',55.00,'online','ready'),
('EM1164','Arjun Singh','arjun@student.com',225.00,'cod','ready'),
('EM1165','Priya Nair','priya@student.com',105.00,'online','ready'),
('EM1166','Karthik Rajan','karthik@student.com',145.00,'cod','ready'),
('EM1167','Sneha Pillai','sneha@student.com',190.00,'online','ready'),
('EM1168','Rohan Mehta','rohan@student.com',80.00,'cod','ready'),
('EM1169','Divya Iyer','divya@student.com',130.00,'online','ready'),
('EM1170','Amit Patel','amit@student.com',265.00,'cod','ready'),
('EM1171','Aditi Sharma','aditi@student.com',60.00,'online','ready'),
('EM1172','Rahul Verma','rahul@student.com',155.00,'cod','ready'),
('EM1173','Neha Gupta','neha@student.com',210.00,'online','ready'),
('EM1174','Arjun Singh','arjun@student.com',95.00,'cod','ready'),
('EM1175','Priya Nair','priya@student.com',170.00,'online','ready'),
('EM1176','Karthik Rajan','karthik@student.com',115.00,'cod','ready'),
('EM1177','Sneha Pillai','sneha@student.com',85.00,'online','ready'),
('EM1178','Rohan Mehta','rohan@student.com',245.00,'cod','ready'),
('EM1179','Divya Iyer','divya@student.com',70.00,'online','ready'),
('EM1180','Amit Patel','amit@student.com',135.00,'cod','ready'),
('EM1181','Aditi Sharma','aditi@student.com',195.00,'online','ready'),
('EM1182','Rahul Verma','rahul@student.com',110.00,'cod','ready'),
('EM1183','Neha Gupta','neha@student.com',160.00,'online','ready'),
('EM1184','Arjun Singh','arjun@student.com',75.00,'cod','ready'),
('EM1185','Priya Nair','priya@student.com',230.00,'online','ready'),
('EM1186','Karthik Rajan','karthik@student.com',90.00,'cod','ready'),
('EM1187','Sneha Pillai','sneha@student.com',125.00,'online','ready'),
('EM1188','Rohan Mehta','rohan@student.com',185.00,'cod','ready'),
('EM1189','Divya Iyer','divya@student.com',55.00,'online','ready'),
('EM1190','Amit Patel','amit@student.com',215.00,'cod','ready'),
-- 10 PENDING
('EM1191','Aditi Sharma','aditi@student.com',150.00,'online','pending'),
('EM1192','Rahul Verma','rahul@student.com',90.00,'cod','pending'),
('EM1193','Neha Gupta','neha@student.com',175.00,'online','pending'),
('EM1194','Arjun Singh','arjun@student.com',65.00,'cod','pending'),
('EM1195','Priya Nair','priya@student.com',200.00,'online','pending'),
('EM1196','Karthik Rajan','karthik@student.com',85.00,'cod','pending'),
('EM1197','Sneha Pillai','sneha@student.com',130.00,'online','pending'),
('EM1198','Rohan Mehta','rohan@student.com',115.00,'cod','pending'),
('EM1199','Divya Iyer','divya@student.com',95.00,'online','pending'),
('EM1200','Amit Patel','amit@student.com',160.00,'cod','pending');

-- ========================
-- ORDER ITEMS (one line per order — keeps script lean)
-- ========================
INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Veg Thali', 90.00, 1, 90.00 FROM orders o WHERE o.order_code BETWEEN 'EM1001' AND 'EM1050';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Cold Coffee', 55.00, 1, 55.00 FROM orders o WHERE o.order_code BETWEEN 'EM1001' AND 'EM1050';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Paneer Wrap', 70.00, 1, 70.00 FROM orders o WHERE o.order_code BETWEEN 'EM1051' AND 'EM1110';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Masala Chai', 25.00, 1, 25.00 FROM orders o WHERE o.order_code BETWEEN 'EM1051' AND 'EM1110';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Chicken Biryani', 130.00, 1, 130.00 FROM orders o WHERE o.order_code BETWEEN 'EM1111' AND 'EM1160';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Mango Lassi', 60.00, 1, 60.00 FROM orders o WHERE o.order_code BETWEEN 'EM1111' AND 'EM1160';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Campus Burger', 80.00, 1, 80.00 FROM orders o WHERE o.order_code BETWEEN 'EM1161' AND 'EM1200';

INSERT INTO order_items (order_id, item_name, price, quantity, subtotal)
SELECT o.id, 'Fresh Lime Soda', 40.00, 1, 40.00 FROM orders o WHERE o.order_code BETWEEN 'EM1161' AND 'EM1200';

SELECT 'Database setup complete!' AS message;
SELECT CONCAT('Users: ', COUNT(*)) AS info FROM users;
SELECT CONCAT('Menu Items: ', COUNT(*)) AS info FROM menu_items;
SELECT CONCAT('Total Orders: ', COUNT(*)) AS info FROM orders;
SELECT CONCAT('Pending: ', SUM(status='pending'), ' | Ready: ', SUM(status='ready')) AS status_summary FROM orders;
