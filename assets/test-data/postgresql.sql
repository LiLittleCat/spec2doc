-- ============================================================
-- PostgreSQL DDL Test Data — 电商系统 (E-Commerce)
-- Covers: COMMENT ON, ALTER TABLE PK/FK, indexes, serial types
-- ============================================================

CREATE DATABASE ecommerce;

-- ----------------------------
-- 用户表
-- ----------------------------
CREATE TABLE "user" (
  "id" bigserial NOT NULL,
  "username" varchar(64) NOT NULL,
  "email" varchar(128) NOT NULL,
  "phone" varchar(20),
  "password_hash" varchar(255) NOT NULL,
  "nickname" varchar(64),
  "avatar_url" varchar(512),
  "gender" smallint DEFAULT 0,
  "birthday" date,
  "status" smallint NOT NULL DEFAULT 1,
  "last_login_time" timestamp,
  "last_login_ip" varchar(45),
  "create_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "update_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "uk_user_username" ON "user" ("username");
CREATE UNIQUE INDEX "uk_user_email" ON "user" ("email");
CREATE INDEX "idx_user_phone" ON "user" ("phone");
CREATE INDEX "idx_user_status" ON "user" ("status");

COMMENT ON TABLE "user" IS '用户表';
COMMENT ON COLUMN "user"."id" IS '用户ID';
COMMENT ON COLUMN "user"."username" IS '用户名';
COMMENT ON COLUMN "user"."email" IS '邮箱地址';
COMMENT ON COLUMN "user"."phone" IS '手机号码';
COMMENT ON COLUMN "user"."password_hash" IS '密码哈希';
COMMENT ON COLUMN "user"."nickname" IS '昵称';
COMMENT ON COLUMN "user"."avatar_url" IS '头像URL';
COMMENT ON COLUMN "user"."gender" IS '性别 0未知 1男 2女';
COMMENT ON COLUMN "user"."birthday" IS '出生日期';
COMMENT ON COLUMN "user"."status" IS '状态 0禁用 1正常 2冻结';
COMMENT ON COLUMN "user"."last_login_time" IS '最后登录时间';
COMMENT ON COLUMN "user"."last_login_ip" IS '最后登录IP';
COMMENT ON COLUMN "user"."create_time" IS '创建时间';
COMMENT ON COLUMN "user"."update_time" IS '更新时间';

-- ----------------------------
-- 用户收货地址表
-- ----------------------------
CREATE TABLE "user_address" (
  "id" bigserial NOT NULL,
  "user_id" bigint NOT NULL,
  "receiver_name" varchar(64) NOT NULL,
  "receiver_phone" varchar(20) NOT NULL,
  "province" varchar(32) NOT NULL,
  "city" varchar(32) NOT NULL,
  "district" varchar(32) NOT NULL,
  "detail_address" varchar(256) NOT NULL,
  "postal_code" varchar(10),
  "is_default" smallint NOT NULL DEFAULT 0,
  "create_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "update_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "user_address" ADD CONSTRAINT "user_address_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_address_user_id" ON "user_address" ("user_id");

COMMENT ON TABLE "user_address" IS '用户收货地址表';
COMMENT ON COLUMN "user_address"."id" IS '地址ID';
COMMENT ON COLUMN "user_address"."user_id" IS '用户ID';
COMMENT ON COLUMN "user_address"."receiver_name" IS '收货人姓名';
COMMENT ON COLUMN "user_address"."receiver_phone" IS '收货人电话';
COMMENT ON COLUMN "user_address"."province" IS '省份';
COMMENT ON COLUMN "user_address"."city" IS '城市';
COMMENT ON COLUMN "user_address"."district" IS '区/县';
COMMENT ON COLUMN "user_address"."detail_address" IS '详细地址';
COMMENT ON COLUMN "user_address"."postal_code" IS '邮政编码';
COMMENT ON COLUMN "user_address"."is_default" IS '是否默认地址 0否 1是';
COMMENT ON COLUMN "user_address"."create_time" IS '创建时间';
COMMENT ON COLUMN "user_address"."update_time" IS '更新时间';

-- ----------------------------
-- 商品分类表
-- ----------------------------
CREATE TABLE "category" (
  "id" serial NOT NULL,
  "parent_id" int DEFAULT 0,
  "name" varchar(64) NOT NULL,
  "icon" varchar(256),
  "sort_order" int NOT NULL DEFAULT 0,
  "level" smallint NOT NULL DEFAULT 1,
  "is_visible" smallint NOT NULL DEFAULT 1,
  "create_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "category" ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_category_parent_id" ON "category" ("parent_id");

COMMENT ON TABLE "category" IS '商品分类表';
COMMENT ON COLUMN "category"."id" IS '分类ID';
COMMENT ON COLUMN "category"."parent_id" IS '父分类ID，0为顶级分类';
COMMENT ON COLUMN "category"."name" IS '分类名称';
COMMENT ON COLUMN "category"."icon" IS '分类图标URL';
COMMENT ON COLUMN "category"."sort_order" IS '排序值，越小越靠前';
COMMENT ON COLUMN "category"."level" IS '层级 1一级 2二级 3三级';
COMMENT ON COLUMN "category"."is_visible" IS '是否显示 0隐藏 1显示';
COMMENT ON COLUMN "category"."create_time" IS '创建时间';

-- ----------------------------
-- 商品表
-- ----------------------------
CREATE TABLE "product" (
  "id" bigserial NOT NULL,
  "category_id" int NOT NULL,
  "name" varchar(128) NOT NULL,
  "subtitle" varchar(256),
  "main_image" varchar(512) NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "original_price" numeric(10,2),
  "stock" int NOT NULL DEFAULT 0,
  "sales" int NOT NULL DEFAULT 0,
  "unit" varchar(16) DEFAULT '件',
  "weight" numeric(8,2),
  "description" text,
  "status" smallint NOT NULL DEFAULT 0,
  "is_hot" smallint NOT NULL DEFAULT 0,
  "is_new" smallint NOT NULL DEFAULT 0,
  "create_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "update_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "product" ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_product_category_id" ON "product" ("category_id");
CREATE INDEX "idx_product_status" ON "product" ("status");
CREATE INDEX "idx_product_create_time" ON "product" ("create_time");

COMMENT ON TABLE "product" IS '商品表';
COMMENT ON COLUMN "product"."id" IS '商品ID';
COMMENT ON COLUMN "product"."category_id" IS '分类ID';
COMMENT ON COLUMN "product"."name" IS '商品名称';
COMMENT ON COLUMN "product"."subtitle" IS '商品副标题';
COMMENT ON COLUMN "product"."main_image" IS '主图URL';
COMMENT ON COLUMN "product"."price" IS '商品价格';
COMMENT ON COLUMN "product"."original_price" IS '原价';
COMMENT ON COLUMN "product"."stock" IS '库存数量';
COMMENT ON COLUMN "product"."sales" IS '销量';
COMMENT ON COLUMN "product"."unit" IS '计量单位';
COMMENT ON COLUMN "product"."weight" IS '重量(kg)';
COMMENT ON COLUMN "product"."description" IS '商品详情(富文本)';
COMMENT ON COLUMN "product"."status" IS '状态 0下架 1上架 2预售';
COMMENT ON COLUMN "product"."is_hot" IS '是否热门 0否 1是';
COMMENT ON COLUMN "product"."is_new" IS '是否新品 0否 1是';
COMMENT ON COLUMN "product"."create_time" IS '创建时间';
COMMENT ON COLUMN "product"."update_time" IS '更新时间';

-- ----------------------------
-- 订单表
-- ----------------------------
CREATE TABLE "order" (
  "id" bigserial NOT NULL,
  "order_no" varchar(32) NOT NULL,
  "user_id" bigint NOT NULL,
  "total_amount" numeric(12,2) NOT NULL,
  "pay_amount" numeric(12,2) NOT NULL,
  "freight_amount" numeric(8,2) NOT NULL DEFAULT 0.00,
  "discount_amount" numeric(8,2) NOT NULL DEFAULT 0.00,
  "status" smallint NOT NULL DEFAULT 0,
  "pay_type" smallint,
  "pay_time" timestamp,
  "delivery_time" timestamp,
  "receive_time" timestamp,
  "receiver_name" varchar(64) NOT NULL,
  "receiver_phone" varchar(20) NOT NULL,
  "receiver_address" varchar(256) NOT NULL,
  "remark" varchar(512),
  "create_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "update_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "order" ADD CONSTRAINT "order_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "uk_order_no" ON "order" ("order_no");
CREATE INDEX "idx_order_user_id" ON "order" ("user_id");
CREATE INDEX "idx_order_status" ON "order" ("status");
CREATE INDEX "idx_order_create_time" ON "order" ("create_time");

COMMENT ON TABLE "order" IS '订单表';
COMMENT ON COLUMN "order"."id" IS '订单ID';
COMMENT ON COLUMN "order"."order_no" IS '订单编号';
COMMENT ON COLUMN "order"."user_id" IS '用户ID';
COMMENT ON COLUMN "order"."total_amount" IS '订单总金额';
COMMENT ON COLUMN "order"."pay_amount" IS '实付金额';
COMMENT ON COLUMN "order"."freight_amount" IS '运费';
COMMENT ON COLUMN "order"."discount_amount" IS '优惠金额';
COMMENT ON COLUMN "order"."status" IS '订单状态 0待付款 1待发货 2已发货 3已完成 4已取消 5退款中';
COMMENT ON COLUMN "order"."pay_type" IS '支付方式 1微信 2支付宝 3银行卡';
COMMENT ON COLUMN "order"."pay_time" IS '支付时间';
COMMENT ON COLUMN "order"."delivery_time" IS '发货时间';
COMMENT ON COLUMN "order"."receive_time" IS '收货时间';
COMMENT ON COLUMN "order"."receiver_name" IS '收货人';
COMMENT ON COLUMN "order"."receiver_phone" IS '收货人电话';
COMMENT ON COLUMN "order"."receiver_address" IS '收货地址';
COMMENT ON COLUMN "order"."remark" IS '订单备注';
COMMENT ON COLUMN "order"."create_time" IS '创建时间';
COMMENT ON COLUMN "order"."update_time" IS '更新时间';

-- ----------------------------
-- 订单明细表
-- ----------------------------
CREATE TABLE "order_item" (
  "id" bigserial NOT NULL,
  "order_id" bigint NOT NULL,
  "product_id" bigint NOT NULL,
  "product_name" varchar(128) NOT NULL,
  "product_image" varchar(512),
  "price" numeric(10,2) NOT NULL,
  "quantity" int NOT NULL,
  "total_price" numeric(12,2) NOT NULL,
  "create_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "order_item" ADD CONSTRAINT "order_item_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_order_item_order_id" ON "order_item" ("order_id");

COMMENT ON TABLE "order_item" IS '订单明细表';
COMMENT ON COLUMN "order_item"."id" IS '明细ID';
COMMENT ON COLUMN "order_item"."order_id" IS '订单ID';
COMMENT ON COLUMN "order_item"."product_id" IS '商品ID';
COMMENT ON COLUMN "order_item"."product_name" IS '商品名称(冗余)';
COMMENT ON COLUMN "order_item"."product_image" IS '商品图片(冗余)';
COMMENT ON COLUMN "order_item"."price" IS '商品单价';
COMMENT ON COLUMN "order_item"."quantity" IS '购买数量';
COMMENT ON COLUMN "order_item"."total_price" IS '小计金额';
COMMENT ON COLUMN "order_item"."create_time" IS '创建时间';
