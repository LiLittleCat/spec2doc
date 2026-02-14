-- ============================================================
-- SQL Server DDL Test Data — 电商系统 (E-Commerce)
-- Covers: [bracket] identifiers, IDENTITY, NVARCHAR, constraints
-- ============================================================

CREATE DATABASE [ecommerce];
GO

USE [ecommerce];
GO

-- ----------------------------
-- 用户表
-- ----------------------------
CREATE TABLE [dbo].[user] (
  [id] bigint IDENTITY(1,1) NOT NULL,
  [username] nvarchar(64) NOT NULL,
  [email] nvarchar(128) NOT NULL,
  [phone] nvarchar(20) NULL,
  [password_hash] nvarchar(255) NOT NULL,
  [nickname] nvarchar(64) NULL,
  [avatar_url] nvarchar(512) NULL,
  [gender] tinyint DEFAULT 0,
  [birthday] date NULL,
  [status] tinyint NOT NULL DEFAULT 1,
  [last_login_time] datetime2 NULL,
  [last_login_ip] nvarchar(45) NULL,
  [create_time] datetime2 NOT NULL DEFAULT GETDATE(),
  [update_time] datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [PK_user] PRIMARY KEY ([id]),
  CONSTRAINT [UK_user_username] UNIQUE ([username]),
  CONSTRAINT [UK_user_email] UNIQUE ([email])
);

CREATE INDEX [IX_user_phone] ON [dbo].[user] ([phone]);
CREATE INDEX [IX_user_status] ON [dbo].[user] ([status]);

-- ----------------------------
-- 用户收货地址表
-- ----------------------------
CREATE TABLE [dbo].[user_address] (
  [id] bigint IDENTITY(1,1) NOT NULL,
  [user_id] bigint NOT NULL,
  [receiver_name] nvarchar(64) NOT NULL,
  [receiver_phone] nvarchar(20) NOT NULL,
  [province] nvarchar(32) NOT NULL,
  [city] nvarchar(32) NOT NULL,
  [district] nvarchar(32) NOT NULL,
  [detail_address] nvarchar(256) NOT NULL,
  [postal_code] nvarchar(10) NULL,
  [is_default] tinyint NOT NULL DEFAULT 0,
  [create_time] datetime2 NOT NULL DEFAULT GETDATE(),
  [update_time] datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [PK_user_address] PRIMARY KEY ([id]),
  CONSTRAINT [FK_address_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_address_user_id] ON [dbo].[user_address] ([user_id]);

-- ----------------------------
-- 商品分类表
-- ----------------------------
CREATE TABLE [dbo].[category] (
  [id] int IDENTITY(1,1) NOT NULL,
  [parent_id] int DEFAULT 0,
  [name] nvarchar(64) NOT NULL,
  [icon] nvarchar(256) NULL,
  [sort_order] int NOT NULL DEFAULT 0,
  [level] tinyint NOT NULL DEFAULT 1,
  [is_visible] tinyint NOT NULL DEFAULT 1,
  [create_time] datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [PK_category] PRIMARY KEY ([id])
);

CREATE INDEX [IX_category_parent_id] ON [dbo].[category] ([parent_id]);

-- ----------------------------
-- 商品表
-- ----------------------------
CREATE TABLE [dbo].[product] (
  [id] bigint IDENTITY(1,1) NOT NULL,
  [category_id] int NOT NULL,
  [name] nvarchar(128) NOT NULL,
  [subtitle] nvarchar(256) NULL,
  [main_image] nvarchar(512) NOT NULL,
  [price] decimal(10,2) NOT NULL,
  [original_price] decimal(10,2) NULL,
  [stock] int NOT NULL DEFAULT 0,
  [sales] int NOT NULL DEFAULT 0,
  [unit] nvarchar(16) DEFAULT N'件',
  [weight] decimal(8,2) NULL,
  [description] nvarchar(max) NULL,
  [status] tinyint NOT NULL DEFAULT 0,
  [is_hot] tinyint NOT NULL DEFAULT 0,
  [is_new] tinyint NOT NULL DEFAULT 0,
  [create_time] datetime2 NOT NULL DEFAULT GETDATE(),
  [update_time] datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [PK_product] PRIMARY KEY ([id]),
  CONSTRAINT [FK_product_category] FOREIGN KEY ([category_id]) REFERENCES [dbo].[category] ([id])
);

CREATE INDEX [IX_product_category_id] ON [dbo].[product] ([category_id]);
CREATE INDEX [IX_product_status] ON [dbo].[product] ([status]);
CREATE INDEX [IX_product_create_time] ON [dbo].[product] ([create_time]);

-- ----------------------------
-- 订单表
-- ----------------------------
CREATE TABLE [dbo].[order] (
  [id] bigint IDENTITY(1,1) NOT NULL,
  [order_no] nvarchar(32) NOT NULL,
  [user_id] bigint NOT NULL,
  [total_amount] decimal(12,2) NOT NULL,
  [pay_amount] decimal(12,2) NOT NULL,
  [freight_amount] decimal(8,2) NOT NULL DEFAULT 0.00,
  [discount_amount] decimal(8,2) NOT NULL DEFAULT 0.00,
  [status] tinyint NOT NULL DEFAULT 0,
  [pay_type] tinyint NULL,
  [pay_time] datetime2 NULL,
  [delivery_time] datetime2 NULL,
  [receive_time] datetime2 NULL,
  [receiver_name] nvarchar(64) NOT NULL,
  [receiver_phone] nvarchar(20) NOT NULL,
  [receiver_address] nvarchar(256) NOT NULL,
  [remark] nvarchar(512) NULL,
  [create_time] datetime2 NOT NULL DEFAULT GETDATE(),
  [update_time] datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [PK_order] PRIMARY KEY ([id]),
  CONSTRAINT [UK_order_no] UNIQUE ([order_no]),
  CONSTRAINT [FK_order_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user] ([id])
);

CREATE INDEX [IX_order_user_id] ON [dbo].[order] ([user_id]);
CREATE INDEX [IX_order_status] ON [dbo].[order] ([status]);
CREATE INDEX [IX_order_create_time] ON [dbo].[order] ([create_time]);

-- ----------------------------
-- 订单明细表
-- ----------------------------
CREATE TABLE [dbo].[order_item] (
  [id] bigint IDENTITY(1,1) NOT NULL,
  [order_id] bigint NOT NULL,
  [product_id] bigint NOT NULL,
  [product_name] nvarchar(128) NOT NULL,
  [product_image] nvarchar(512) NULL,
  [price] decimal(10,2) NOT NULL,
  [quantity] int NOT NULL,
  [total_price] decimal(12,2) NOT NULL,
  [create_time] datetime2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [PK_order_item] PRIMARY KEY ([id]),
  CONSTRAINT [FK_item_order] FOREIGN KEY ([order_id]) REFERENCES [dbo].[order] ([id]) ON DELETE CASCADE
);

CREATE INDEX [IX_order_item_order_id] ON [dbo].[order_item] ([order_id]);
