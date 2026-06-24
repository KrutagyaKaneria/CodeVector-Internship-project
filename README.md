# Product Keyset Pagination Backend Service

A high-performance Node.js, Express, and PostgreSQL (Neon) REST API designed to browse ~200,000 products efficiently. Built with keyset pagination, collision-safe cursor structures, custom query validators, and concurrency-tested endpoints.

---

## 📖 Documentation

* [Architecture Design (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md) - Deep dive into design decisions, B-Tree index ordering, UUID vs. BIGSERIAL trade-offs, and keyset pagination boundaries.
* [Explain Outputs (`docs/EXPLAIN_OUTPUTS.md`)](docs/EXPLAIN_OUTPUTS.md) - Query verification plans showing 1ms execution times via composite index scans.
* [Live Demo Script (`docs/DEMO_SCRIPT.md`)](docs/DEMO_SCRIPT.md) - A time-boxed, 5-minute guide to demoing offsets vs. keysets, collision clusters, and database indexing live.

---

## 🚀 Setup & Installation

### 1. Configure Environment
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Fill in the `DATABASE_URL` with your Neon PostgreSQL connection string.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Database Migrations
Create tables, composite indexes, and timestamp triggers:
```bash
npm run migrate
```

### 4. Seed Database (200,000 Rows)
Generates fake catalog data and a deliberate timestamp collision cluster of 500 rows:
```bash
npm run seed
```

### 5. Run Server
Start the development server with live reload:
```bash
npm run dev
```

---

## 🧪 Testing

### Run Repository Tests
Verifies standard repository routines and collision cluster traversal:
```bash
npm run test
```

### Run Concurrency Integration Tests
Checks for pagination stability, duplicate prevention, and consistency under concurrent insertions/updates:
```bash
npm run test:integration
```
