# Amazon Order Fulfillment Automation
**Data Scientist Internship Project | Wakefield's Inc. | Summer 2026**

> An end-to-end retail data automation workflow that connects Amazon unshipped orders with multi-location inventory data to identify eligible fulfillment locations.

> <img width="2171" height="724" alt="image" src="https://github.com/user-attachments/assets/521bf0e1-c7fe-41b9-a6a9-b9fe05780ec0" />


**Python · Pandas · Oracle SQL · JavaScript · Excel**

---

## Project Overview

This project was developed during my Data Scientist Internship to improve the daily Amazon order fulfillment workflow for a multi-location retail business.

The Internet Sales Team needed to determine which retail locations had sufficient inventory to fulfill each Amazon order. This required comparing daily unshipped Amazon orders against inventory data distributed across multiple store locations.

The project created an integrated workflow that:

- extracts unshipped order data from Amazon,
- preprocesses and standardizes product SKUs,
- matches orders against inventory records using Oracle SQL,
- verifies available inventory against requested quantities, and
- consolidates eligible store locations into a final Excel fulfillment report.

The resulting workflow reduced repetitive manual inventory lookup and provided the Internet Sales Team with a single operational view for daily order fulfillment.

---

## Business Problem

Amazon provides information about **what needs to be shipped**, while the internal inventory database provides information about **where inventory is available**.

The operational challenge was connecting these two data sources.

For every unshipped order, the team needed to answer:

> **Which store has the correct product and enough inventory to fulfill this order?**

Previously, this required significant manual SKU and inventory lookup across store locations.

This project automated most of that matching process.

---

## Workflow

```text
Amazon Unshipped Orders
        │
        ▼
┌─────────────────────────────┐
│  1. JavaScript Extraction   │
│  Extract order information  │
│  from Amazon Seller Central │
└─────────────┬───────────────┘
              │
              ▼
          Raw CSV
              │
              ▼
┌─────────────────────────────┐
│  2. Python / Pandas         │
│  Clean and parse SKUs       │
│  into matching attributes   │
└─────────────┬───────────────┘
              │
              ▼
      Processed Order Data
              │
              ▼
┌─────────────────────────────┐
│  3. Oracle SQL              │
│  Match orders against       │
│  multi-store inventory      │
└─────────────┬───────────────┘
              │
              ▼
    Eligible Store Inventory
              │
              ▼
┌─────────────────────────────┐
│  4. Excel                   │
│  Consolidate store + qty    │
│  into operational report    │
└─────────────┬───────────────┘
              │
              ▼
   Daily Fulfillment Sheet
```

---

## 1. Amazon Order Data Extraction

Amazon unshipped order data was collected from Amazon Seller Central.

A JavaScript extraction script was used in the browser console to collect the order information displayed on the unshipped orders page and export it into CSV format.

Example fields included:

| Field | Description |
|---|---|
| `order_id` | Amazon order identifier |
| `buyer_name` | Customer name |
| `product_name` | Ordered product |
| `asin` | Amazon Standard Identification Number |
| `sku` | Product SKU used for inventory matching |
| `quantity` | Number of units requested |
| `item_subtotal` | Order item subtotal |
| `ship_by_date` | Required shipping date |
| `deliver_by_date` | Expected delivery date |
| `comment` | Additional order information |

The SKU and quantity fields are particularly important because they are used in later stages to identify the correct inventory item and determine whether a store has sufficient stock.

> **Portfolio Note:** All sample order data included in this repository is synthetic and does not contain customer or company-confidential information.

---

## 2. SKU Parsing and Preprocessing with Python

Amazon SKUs contained both a base product identifier and additional product specifications.

Python and Pandas were used to standardize the SKU and separate these components into fields that could be compared against the inventory database.

For example:

```text
Original SKU
123456-BLK-M

        ↓

SKU_BASE = 123456
SPEC1    = BLK
SPEC2    = M
```

The preprocessing script:

1. normalizes SKU capitalization and spacing,
2. extracts the base product identifier,
3. separates remaining product specifications,
4. standardizes delimiters, and
5. exports the processed dataset for inventory matching.

Relevant code:

[`src/parse_orders.py`](src/parse_orders.py)

---

## 3. Multi-Store Inventory Matching with Oracle SQL

The processed Amazon order data was imported into Oracle SQL Developer and matched against inventory data from multiple retail locations.

The SQL matching logic evaluates:

```text
Amazon Order
     │
     ├── SKU_BASE ───────► Inventory Product Identifier
     │
     ├── SPEC1 ──────────► Attribute / Size / Description
     │
     ├── SPEC2 ──────────► Attribute / Size / Description
     │
     └── Quantity ───────► Available Store Quantity
```

A store is considered an eligible fulfillment location only when:

- the base SKU matches the inventory item,
- the product specifications match the corresponding inventory attributes, and
- the available inventory is greater than or equal to the quantity requested by the customer.

This produces all eligible inventory locations for each Amazon order.

Relevant code:

[`src/inventory_matching.sql`](src/inventory_matching.sql)

> **Portfolio Note:** Database table names, internal identifiers, and business-specific configuration have been generalized in the public SQL version.

---

## 4. Excel Fulfillment Report

The SQL results were exported to Excel and combined with the processed Amazon order data.

An Excel formula was used to identify all matching store locations for each order/SKU combination and consolidate the store number and available quantity into a single field.

Example:

```text
Order ID    SKU             Qty    Eligible Inventory
------------------------------------------------------------
ORDER-001   123456-BLK-M     1     (101,5), (103,8), (107,3)
ORDER-002   234567-NVY-L     2     (102,4), (108,6)
```

The workflow used `FILTER`, `TEXTJOIN`, and `IFERROR` to dynamically consolidate matching inventory results.

```excel
=IFERROR(
    TEXTJOIN(", ",TRUE,
        "(" &
        FILTER(
            'Export Worksheet'!$J$2:$J$5000,
            ('Export Worksheet'!$A$2:$A$5000=A2) *
            ('Export Worksheet'!$C$2:$C$5000=E2)
        ) &
        "," &
        FILTER(
            'Export Worksheet'!$K$2:$K$5000,
            ('Export Worksheet'!$A$2:$A$5000=A2) *
            ('Export Worksheet'!$C$2:$C$5000=E2)
        ) &
        ")"
    ),
    ""
)
```

The final sheet allowed the Internet Sales Team to see potential fulfillment locations without manually searching inventory store by store.

---

## Results & Business Impact


<img width="1280" height="720" alt="Business Impact Screenshot wkfd" src="https://github.com/user-attachments/assets/14779f60-a84a-484a-b816-570bb6c2aaad" />


### 86% Matching Rate

Approximately **86% of Amazon orders could be automatically matched with available store inventory** through the integrated workflow.

### 10+ Hours Saved per Week

The workflow reduced repetitive manual SKU and inventory lookup, resulting in an estimated **10+ hours of operational time saved per week** for the Internet Sales Team.

### ~85% Process Automation

Approximately **85% of the daily fulfillment preparation workflow** could be completed through the integrated JavaScript, Python, SQL, and Excel process.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| **JavaScript** | Extract Amazon unshipped order data |
| **Python** | SKU preprocessing and standardization |
| **Pandas** | Tabular data transformation |
| **Oracle SQL** | Multi-store inventory matching |
| **Excel** | Final fulfillment report and operational interface |

---

## Repository Structure

```text
amazon-order-fulfillment-automation/
│
├── README.md
│
├── sample_data/
│   └── sample_orders.csv
│
└── src/
    ├── amazon_order_extractor.js
    ├── parse_orders.py
    └── inventory_matching.sql
```

### `amazon_order_extractor.js`
Extracts order information from the Amazon unshipped orders interface and generates structured order data.

### `parse_orders.py`
Cleans and parses Amazon SKUs into standardized product identifiers and specifications.

### `inventory_matching.sql`
Matches processed Amazon orders against multi-location inventory and returns locations with sufficient stock.

### `sample_orders.csv`
Synthetic order data that demonstrates the expected input structure without exposing real customer information.

---

## Example End-to-End Transformation

```text
Amazon Order
SKU: 123456-BLK-M
Quantity: 2

        ↓ JavaScript

Raw Order CSV

        ↓ Python

SKU_BASE: 123456
SPEC1: BLK
SPEC2: M

        ↓ Oracle SQL

Store 101 → Qty 1   ✗
Store 103 → Qty 5   ✓
Store 107 → Qty 8   ✓

        ↓ Excel

Eligible Inventory:
(103,5), (107,8)
```

Instead of manually checking inventory across multiple locations, the user can immediately identify stores capable of fulfilling the order.

---

## Key Takeaways

This project demonstrates how relatively lightweight technologies can be integrated to solve a practical operational problem.

Rather than building a standalone application, the solution connected tools already used in the business workflow — Amazon Seller Central, Python, Oracle SQL, and Excel — into a repeatable data pipeline.

The project demonstrates experience with:

- data extraction and preprocessing,
- SKU normalization and matching logic,
- relational database querying,
- multi-location inventory analysis,
- workflow automation,
- operational reporting, and
- translating a business process into a practical data solution.

---

## Data Privacy

This repository is a **portfolio reconstruction of the workflow** developed during my internship.

All customer information, company inventory data, credentials, internal database structures, and other proprietary information have been removed or replaced with synthetic/generalized examples.

The repository is intended to demonstrate the **technical architecture, data-processing logic, and business impact** of the project without exposing confidential company information.
