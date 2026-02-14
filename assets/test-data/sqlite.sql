-- ============================================================
-- SQLite DDL Test Data — 电商系统 (E-Commerce)
-- Covers: AUTOINCREMENT, implicit types, foreign keys, indexes
-- ============================================================

-- ----------------------------
-- 用户表
-- ----------------------------
CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  gender INTEGER DEFAULT 0,
  birthday TEXT,
  status INTEGER NOT NULL DEFAULT 1,
  last_login_time TEXT,
  last_login_ip TEXT,
  create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  update_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX uk_user_username ON user (username);
CREATE UNIQUE INDEX uk_user_email ON user (email);
CREATE INDEX idx_user_phone ON user (phone);
CREATE INDEX idx_user_status ON user (status);

-- ----------------------------
-- 用户收货地址表
-- ----------------------------
CREATE TABLE user_address (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  detail_address TEXT NOT NULL,
  postal_code TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  update_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_address_user_id ON user_address (user_id);

-- ----------------------------
-- 商品分类表
-- ----------------------------
CREATE TABLE category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  is_visible INTEGER NOT NULL DEFAULT 1,
  create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_category_parent_id ON category (parent_id);

-- ----------------------------
-- 商品表
-- ----------------------------
CREATE TABLE product (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES category(id),
  name TEXT NOT NULL,
  subtitle TEXT,
  main_image TEXT NOT NULL,
  price REAL NOT NULL,
  original_price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '件',
  weight REAL,
  description TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  is_hot INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  update_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_product_category_id ON product (category_id);
CREATE INDEX idx_product_status ON product (status);
CREATE INDEX idx_product_create_time ON product (create_time);

-- ----------------------------
-- 订单表
-- ----------------------------
CREATE TABLE "order" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES user(id),
  total_amount REAL NOT NULL,
  pay_amount REAL NOT NULL,
  freight_amount REAL NOT NULL DEFAULT 0.00,
  discount_amount REAL NOT NULL DEFAULT 0.00,
  status INTEGER NOT NULL DEFAULT 0,
  pay_type INTEGER,
  pay_time TEXT,
  delivery_time TEXT,
  receive_time TEXT,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  remark TEXT,
  create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  update_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX uk_order_no ON "order" (order_no);
CREATE INDEX idx_order_user_id ON "order" (user_id);
CREATE INDEX idx_order_status ON "order" (status);
CREATE INDEX idx_order_create_time ON "order" (create_time);

-- ----------------------------
-- 订单明细表
-- ----------------------------
CREATE TABLE order_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  total_price REAL NOT NULL,
  create_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_order_item_order_id ON order_item (order_id);
