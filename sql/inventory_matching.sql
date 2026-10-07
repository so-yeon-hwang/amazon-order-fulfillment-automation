/*
===============================================================================
Amazon Order Fulfillment Automation
Inventory Matching Query
===============================================================================

Purpose:
    Match processed Amazon orders with available inventory across multiple
    retail store locations.

Workflow:
    1. Retrieve active inventory items and available quantities.
    2. Match the parsed Amazon SKU base to the inventory item identifier.
    3. Match SKU specifications (such as color and size) against inventory
       attributes.
    4. Verify that each store has sufficient quantity to fulfill the order.
    5. Return eligible fulfillment locations for each order.

Note:
    Table and field names in this portfolio version have been generalized.
    The repository contains no proprietary company data or credentials.
===============================================================================
*/


-- ============================================================================
-- STEP 1: Build the available inventory dataset
-- ============================================================================

WITH inventory AS (

    SELECT
        i.item_id,
        i.item_code,
        i.local_upc,
        i.department_code,
        i.vendor_code,
        i.description1,
        i.description2,
        i.description4,
        i.attribute,
        i.size_code,
        p.price,
        q.store_no,
        q.quantity_available

    FROM inventory_items i

    JOIN inventory_prices p
        ON p.item_id = i.item_id

    JOIN inventory_quantities q
        ON q.item_id = i.item_id

    WHERE i.active = 1
      AND p.price_level = 1

      -- Certain locations may not participate in
      -- e-commerce order fulfillment.
      AND q.is_fulfillment_location = 1
),


-- ============================================================================
-- STEP 2: Match Amazon orders with inventory
-- ============================================================================

eligible_inventory AS (

    SELECT
        amz.order_id,
        amz.buyer_name,
        amz.sku,

        inv.item_code,
        inv.attribute,
        inv.size_code,

        amz.quantity AS requested_quantity,

        amz.spec1,
        amz.spec2,

        inv.store_no,
        inv.quantity_available

    FROM amazon_orders amz

    LEFT JOIN inventory inv

        -- SKU_BASE was generated during the Python parsing step.
        -- It represents the core product identifier used for matching.
        ON TO_CHAR(amz.sku_base) = inv.item_code

    WHERE

        -- --------------------------------------------------------------------
        -- Match the first SKU specification.
        --
        -- Depending on the inventory record, a specification may appear in
        -- the attribute, size, or description field.
        -- --------------------------------------------------------------------

        (
            amz.spec1 IS NULL

            OR UPPER(REPLACE(inv.attribute, ' ', '')) =
               UPPER(REPLACE(amz.spec1, ' ', ''))

            OR UPPER(REPLACE(inv.size_code, ' ', '')) =
               UPPER(REPLACE(amz.spec1, ' ', ''))

            OR UPPER(REPLACE(inv.description4, ' ', ''))
               LIKE '%' ||
                    UPPER(REPLACE(amz.spec1, ' ', '')) ||
                    '%'
        )


        -- --------------------------------------------------------------------
        -- Match the second SKU specification.
        -- --------------------------------------------------------------------

        AND
        (
            amz.spec2 IS NULL

            OR UPPER(REPLACE(inv.attribute, ' ', '')) =
               UPPER(REPLACE(amz.spec2, ' ', ''))

            OR UPPER(REPLACE(inv.size_code, ' ', '')) =
               UPPER(REPLACE(amz.spec2, ' ', ''))

            OR UPPER(REPLACE(inv.description4, ' ', ''))
               LIKE '%' ||
                    UPPER(REPLACE(amz.spec2, ' ', '')) ||
                    '%'
        )


        -- --------------------------------------------------------------------
        -- A store is eligible only when its available inventory can satisfy
        -- the quantity requested by the customer.
        -- --------------------------------------------------------------------

        AND inv.quantity_available >= amz.quantity
)


-- ============================================================================
-- STEP 3: Return eligible fulfillment locations
-- ============================================================================

SELECT
    order_id,
    buyer_name,
    sku,
    item_code,
    attribute,
    size_code,
    requested_quantity,
    spec1,
    spec2,
    store_no,
    quantity_available

FROM eligible_inventory

ORDER BY
    order_id,
    quantity_available DESC;
