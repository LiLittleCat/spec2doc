import { describe, expect, it } from "vitest";
import { parseDDL } from "./ddlParser";

describe("parseDDL", () => {
  it("should parse all columns from MySQL DDL with parameterized types", () => {
    const ddl = `CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) NOT NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NOT NULL,
  status TINYINT DEFAULT 1 COMMENT '状态',
  amount DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';`;

    const result = parseDDL(ddl);
    expect(result.tables).toHaveLength(1);
    const table = result.tables[0];
    expect(table.name).toBe("users");
    expect(table.columns.length).toBeGreaterThanOrEqual(7);
    const colNames = table.columns.map((c) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("username");
    expect(colNames).toContain("email");
    expect(colNames).toContain("password_hash");
    expect(colNames).toContain("status");
    expect(colNames).toContain("amount");
    expect(colNames).toContain("created_at");
  });

  it("should parse PostgreSQL DDL with COMMENT ON", () => {
    const ddl = `CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) DEFAULT 0.00,
  status SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.order_no IS '订单号';
COMMENT ON COLUMN orders.user_id IS '用户ID';`;

    const result = parseDDL(ddl);
    expect(result.tables).toHaveLength(1);
    const table = result.tables[0];
    expect(table.name).toBe("orders");
    expect(table.comment).toBe("订单表");
    expect(table.columns.length).toBeGreaterThanOrEqual(6);
    const colNames = table.columns.map((c) => c.name);
    expect(colNames).toContain("order_no");
    expect(colNames).toContain("amount");
    // Check COMMENT ON COLUMN applied
    const orderNoCol = table.columns.find((c) => c.name === "order_no");
    expect(orderNoCol?.comment).toBe("订单号");
  });

  it("should parse multiple tables", () => {
    const ddl = `CREATE TABLE users (
  id INT NOT NULL,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE orders (
  id INT NOT NULL,
  user_id INT NOT NULL,
  total DECIMAL(10,2)
);`;

    const result = parseDDL(ddl);
    expect(result.tables).toHaveLength(2);
    expect(result.tables[0].name).toBe("users");
    expect(result.tables[0].columns).toHaveLength(2);
    expect(result.tables[1].name).toBe("orders");
    expect(result.tables[1].columns).toHaveLength(3);
  });

  it("should parse DDL that falls back to regex (non-MySQL syntax)", () => {
    // PostgreSQL SERIAL triggers library parser failure → regex fallback
    const ddl = `CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

    const result = parseDDL(ddl);
    expect(result.tables).toHaveLength(1);
    const table = result.tables[0];
    expect(table.name).toBe("products");
    // This is the key assertion — previously only 'id' was parsed due to regex bug
    expect(table.columns.length).toBeGreaterThanOrEqual(6);
    const colNames = table.columns.map((c) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("name");
    expect(colNames).toContain("price");
    expect(colNames).toContain("description");
    expect(colNames).toContain("category_id");
    expect(colNames).toContain("created_at");
  });

  it("should parse SQL Server style DDL with brackets", () => {
    const ddl = `CREATE TABLE [dbo].[employees] (
  [id] INT NOT NULL,
  [name] NVARCHAR(100) NOT NULL,
  [salary] DECIMAL(12,2) DEFAULT 0,
  [department_id] INT,
  CONSTRAINT [PK_employees] PRIMARY KEY ([id])
);`;

    const result = parseDDL(ddl);
    expect(result.tables).toHaveLength(1);
    const table = result.tables[0];
    expect(table.name).toBe("employees");
    expect(table.columns).toHaveLength(4);
    const colNames = table.columns.map((c) => c.name);
    expect(colNames).toEqual(["id", "name", "salary", "department_id"]);
    // Check PK from constraint
    const idCol = table.columns.find((c) => c.name === "id");
    expect(idCol?.isPrimary).toBe(true);
  });

  it("should throw on empty DDL", () => {
    expect(() => parseDDL("")).toThrow("DDL 内容为空");
    expect(() => parseDDL("   ")).toThrow("DDL 内容为空");
  });
});
