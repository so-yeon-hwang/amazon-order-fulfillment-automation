"""
Amazon Order SKU Parser

Processes synthetic Amazon order data and transforms raw SKU strings
into standardized components for downstream inventory matching.

The parser:
1. Loads order data from CSV
2. Cleans and standardizes SKU values
3. Extracts the six-digit base SKU
4. Separates product specifications
5. Exports the processed dataset to Excel

All sample data used in this repository is synthetic.
"""

import pandas as pd


# ---------------------------------------------------------
# 1. Load synthetic Amazon order data
# ---------------------------------------------------------

INPUT_FILE = "sample_data/sample_orders.csv"
OUTPUT_FILE = "output/processed_orders.xlsx"

df = pd.read_csv(
    INPUT_FILE,
    encoding="utf-8-sig"
)


# ---------------------------------------------------------
# 2. Clean and standardize SKU values
# ---------------------------------------------------------

sku_clean = (
    df["sku"]
    .astype("string")
    .str.upper()
    .str.strip()
    .str.replace(r"\s+", "", regex=True)
)


# ---------------------------------------------------------
# 3. Extract the base SKU and product specifications
# ---------------------------------------------------------

df["SKU_BASE"] = sku_clean.str.extract(
    r"^(\d{6})",
    expand=False
)

df["SKU_SPEC"] = (
    sku_clean
    .str.replace(r"^\d{6}[-_]*", "", regex=True)
    .str.strip("-_")
)


# ---------------------------------------------------------
# 4. Standardize specification separators
# ---------------------------------------------------------

df["SKU_SPEC"] = (
    df["SKU_SPEC"]
    .str.replace(r"(?<=\d)(?=[A-Z])", "-", regex=True)
    .str.replace(r"(?<=[A-Z])(?=\d)", "-", regex=True)
    .str.replace(r"[-_]+", "-", regex=True)
    .str.strip("-")
)


# ---------------------------------------------------------
# 5. Split specifications into individual columns
# ---------------------------------------------------------

specs = df["SKU_SPEC"].str.split("-", expand=True)

for i in range(specs.shape[1]):
    df[f"SPEC{i + 1}"] = specs[i].str.strip()


# ---------------------------------------------------------
# 6. Export processed order data
# ---------------------------------------------------------

df.to_excel(
    OUTPUT_FILE,
    index=False
)

print(f"Processed {len(df)} order rows.")
print(f"Output saved to: {OUTPUT_FILE}")
