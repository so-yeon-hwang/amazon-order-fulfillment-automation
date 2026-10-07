# Amazon Order Fulfillment Automation

An end-to-end data automation project inspired by a retail order fulfillment workflow developed during my Data Scientist Internship.

## Project Overview

This project demonstrates an automated workflow for processing e-commerce orders and matching them with inventory data across multiple retail locations.

The pipeline processes order data, validates product availability and requested quantities, and recommends an appropriate fulfillment location for each order.

This repository is a portfolio recreation of the workflow using synthetic data. It does not contain proprietary company data, credentials, internal database information, or confidential business information.

## Business Problem

Processing e-commerce orders manually requires employees to review individual orders, identify product SKUs, check inventory availability across multiple retail locations, and determine which location should fulfill each order.

This project demonstrates how that workflow can be automated using Python and SQL to reduce repetitive manual work and support faster fulfillment decisions.

## Workflow

E-commerce Orders  
↓  
Order & SKU Processing  
↓  
Inventory Lookup  
↓  
Quantity Validation  
↓  
Store Recommendation  
↓  
Fulfillment Output

## Technologies

- Python
- Pandas
- SQL
- Excel
- Data Validation
- Workflow Automation

## Project Structure

```text
retail-fulfillment-automation/
├── README.md
├── src/
├── sql/
├── sample_data/
├── output/
└── screenshots/
