# Architecture Documentation

This document explains the architectural decisions, design choices, and limitations of the keyset pagination system built for the products catalog.

---

## 1. Keyset Pagination vs. OFFSET Pagination

In a catalog of ~200,000 products, performance and consistency are critical. We chose **Keyset Pagination** (also known as the "seek method") over traditional **OFFSET Pagination** for two main reasons:

### Performance at Scale
* **OFFSET Pagination**: To fetch page 400 using `LIMIT 500 OFFSET 200000`, PostgreSQL must scan and discard 200,000 rows from disk/memory before returning the next 500. As the offset increases, performance degrades linearly ($O(N)$), leading to high CPU/memory consumption and slow response times.
* **Keyset Pagination**: By utilizing the values of the last row from the previous page as a cursor, the query seeks directly to the start of the next page using indexes ($O(\log N)$). Performance remains constant regardless of how deep the user paginates.

### Data Consistency (Drift & Duplicates)
* **OFFSET Pagination**: Under active writes, if a new product is inserted at the beginning of the list while a user is paginating, all subsequent rows shift downward. The user will see duplicate items on the next page. Conversely, if a row is deleted, subsequent items shift upward, causing the user to miss items.
* **Keyset Pagination**: Since the pagination boundary is pinned to a specific cursor value, new inserts at the beginning of the list do not affect the cursor's query scope. Traversal remains completely stable with zero duplicates or missed items.

---

## 2. BIGSERIAL vs. UUID for Primary Keys

We selected **BIGSERIAL** (64-bit auto-incrementing integer) over **UUID** (128-bit universally unique identifier) for the following reasons:

1. **Storage Efficiency**: A `BIGSERIAL` takes 8 bytes, whereas a `UUID` takes 16 bytes. At scale, this reduces the size of both the primary key columns and the corresponding indexes.
2. **Index Locality**: `BIGSERIAL` values are sequentially increasing. When new rows are inserted, indexes are appended to. In contrast, random UUIDs (like UUID v4) cause index fragmentation and frequent page splits in B-Tree indexes, degrading write throughput.
3. **Natural Tie-Breaker**: For keyset pagination, we sort by `(created_at DESC, id DESC)`. Since `id` is sequentially generated, it provides a stable, strictly increasing/decreasing tie-breaker for rows that share the exact same `created_at` timestamp.

---

## 3. Composite Index Design & Column Order

We created two composite indexes to optimize pagination performance:
* `idx_products_created_id ON products (created_at DESC, id DESC)`
* `idx_products_category_created_id ON products (category, created_at DESC, id DESC)`

### Why Column Order Matters
B-Tree composite indexes match queries from left to right:
1. **`idx_products_created_id`**: Used when requesting unfiltered paginated results. PostgreSQL scans the index directly matching the `(created_at, id) < ($1, $2)` tuple condition. Since the index columns exactly match the `ORDER BY` clause, PostgreSQL avoids a costly `filesort` operation.
2. **`idx_products_category_created_id`**: Used when filtering by a specific category. The equality filter (`category = $1`) must come first in the index. Once the category is resolved, PostgreSQL can traverse the ordered `created_at DESC, id DESC` columns. If `category` were placed at the end of the index, the index could not be used to efficiently filter by category and sort at the same time.

---

## 4. Known Limitation: The "Behind-the-Cursor" Insert

A known, named limitation of live (non-snapshotted) keyset pagination is the **Behind-the-Cursor Insert**:

* **The Scenario**: Suppose a user is currently on Page 5. The cursor points to a product created 1 hour ago. While the user is browsing, a new product is inserted into the database, but its `created_at` timestamp is manually backdated to 2 hours ago.
* **The Result**: Because this product's sort key `(created_at, id)` places it "above" (older than) the active cursor boundary, it falls behind the user's current cursor position. The user will **miss** this product during the current pagination session.
* **Why it is Accepted**: Keyset pagination reflects a stable slice of a live database stream from the point of the cursor onward. To capture backdated writes, a system would require either periodic page refreshes, snapshot isolation (session-pinned database snapshots), or an offset-based pagination system (which introduces performance and duplication trade-offs). For e-commerce catalogs, missing a backdated insertion during an active pagination run is highly acceptable compared to returning duplicate items.
