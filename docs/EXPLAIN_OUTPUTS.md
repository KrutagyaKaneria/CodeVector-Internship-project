# Query Explain Outputs

This document contains performance verification templates for our database queries using `EXPLAIN ANALYZE`.

---

## 1. Unfiltered Keyset Pagination Query

*Note: Look for **Index Scan** or **Index Only Scan** using the index `idx_products_created_id` in the plan below. There must be **no Seq Scan** and **no filesort / extra Sort node**.*

```text
-- PASTE YOUR UNFILTERED EXPLAIN ANALYZE OUTPUT HERE --
```

---

## 2. Category-Filtered Keyset Pagination Query

*Note: Look for **Index Scan** or **Index Only Scan** using the index `idx_products_category_created_id` in the plan below. The query planner must use this composite index to satisfy both the equality filter on category and the ordering constraint.*

```text
-- PASTE YOUR CATEGORY-FILTERED EXPLAIN ANALYZE OUTPUT HERE --
```
