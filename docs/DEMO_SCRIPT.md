# Live Demo Script (Total: Under 5 Minutes)

This script outlines a structured demo demonstrating the advantages, correctness, and speed of our keyset pagination system.

---

### Step 1: Conceptual Offset Pagination Failure (Time: 1:00 min)
* **Goal**: Explain how offset pagination yields duplicate or skipped rows under concurrent writes.
* **Explanation**: Show this conceptual SQL example:
  ```sql
  -- Page 1:
  SELECT * FROM products ORDER BY created_at DESC LIMIT 5 OFFSET 0;
  
  -- [Concurrent Insert happens here: A new product is created]
  
  -- Page 2:
  SELECT * FROM products ORDER BY created_at DESC LIMIT 5 OFFSET 5;
  ```
  *Visual explanation*: Because a new row was inserted at the top of the list, the last element from Page 1 gets pushed down into Page 2. Thus, the client receives the exact same product twice (duplicated reads). Keyset pagination avoids this entirely.

---

### Step 2: Keyset Pagination Stability Demonstration (Time: 1:15 min)
* **Goal**: Demonstrate how keyset pagination handles concurrent writes without duplicates or omissions.
* **Action**: Run the integration tests:
  ```bash
  npm run test:integration
  ```
* **Key Observations**:
  * Point out that `Test A` performs a full walk of a category (16,600+ items) with `limit=500`.
  * Mid-pagination (after the 3rd page), a `POST /api/products` request inserts a brand-new product.
  * Verify that the newly inserted product is safely ignored by the paging walk because it sorts above the active cursor boundary, ensuring the client receives exactly the correct list of pre-existing items without duplicates or skips.

---

### Step 3: Handling Timestamp-Collision Clusters (Time: 1:15 min)
* **Goal**: Prove pagination is safe even when multiple rows share the exact same timestamp.
* **Explanation**: 
  * Show that in our repository implementation (`src/repositories/productRepository.js`), we use a tuple comparison:
    ```sql
    WHERE (created_at, id) < ($1, $2)
    ```
  * During the database seeding phase (`src/scripts/seed.js`), we deliberately created a cluster of **500 rows sharing the exact same timestamp**.
  * By running the repository test:
    ```bash
    npm run test
    ```
  * Show that the test successfully walks the entire database (including this collision cluster) and asserts that **zero duplicates** are generated, and **no products are skipped**.

---

### Step 4: Index Usage & Performance Verification (Time: 1:00 min)
* **Goal**: Demonstrate that keyset pagination queries execute in under 1 millisecond.
* **Action**: Open the PostgreSQL terminal or run an EXPLAIN query in your script:
  ```sql
  EXPLAIN ANALYZE
  SELECT id, name, category, price, created_at, updated_at
  FROM products
  WHERE (created_at, id) < ('2026-06-24 05:00:00+00', 93674)
  ORDER BY created_at DESC, id DESC
  LIMIT 500;
  ```
* **Key Observations**:
  * Point out the query uses `Index Scan using idx_products_created_id`.
  * Highlight the **Planning Time** (~1.5ms) and **Execution Time** (<1ms), proving that the database does not perform costly sequential table scans or sorting operations.

---

### Step 5: Visual Browser Demo (Bonus) (Time: 1:30 min)
* **Goal**: Visually demonstrate real-time keyset stability and live mutation safety.
* **Action**:
  1. Open [http://localhost:3000/](http://localhost:3000/) in a browser.
  2. Select the `Electronics` category from the dropdown to load the initial list.
  3. Click **Load More** twice to load the first few pages. Keep note of the topmost item.
  4. In the **Admin Operations** sidebar, submit a new product:
     - **Name**: `Live Demo Gadget`
     - **Category**: `Electronics`
     - **Price**: `199.99`
  5. Check the **Debug Console**: note the successful `POST /api/products` request log.
  6. Click **Load More** to continue paginating.
  7. **Observation**: The newly inserted product (sorted at the top because it has the newest timestamp) **does not appear** in subsequent pages, and no pre-existing items are skipped.
  8. Copy the **ID** of any visible product from the browser list.
  9. In the **Admin Operations** sidebar under **Update Product Price**, enter the ID and a new price (e.g. `250.00`). Submit the PATCH request.
  10. **Observation**: The updated card flashes green and displays the new price. Continue clicking **Load More**. Since the sort attributes `(created_at, id)` are untouched, the product **remains in its exact position** with **zero duplicates or gaps**.

