/**
 * Amazon Order Data Extractor
 *
 * Portfolio recreation of a browser-based data extraction utility
 * developed to support an e-commerce order fulfillment workflow.
 *
 * The script extracts order and product information displayed on an
 * Amazon order management page and exports the structured data as CSV.
 *
 * Extracted fields include:
 * - Order ID
 * - Buyer name
 * - Product name
 * - ASIN
 * - SKU
 * - Quantity
 * - Item subtotal
 * - Ship-by date
 * - Deliver-by date
 * - Order comments / cancellation status
 *
 * NOTE:
 * This repository contains no real customer or company data.
 * Any sample data included in the project is synthetic and provided
 * solely for portfolio demonstration purposes.
 */




(() => {
  const ORDER_ID_REGEX = /^\d{3}-\d{7}-\d{7}$/;
  const SKU_REGEX = /^SKU:\s*(.+)$/i;

  const cleanText = value =>
    String(value ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .trim();

  const isVisible = element => {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rectangle.width > 0 &&
      rectangle.height > 0
    );
  };

  const extractMatch = (text, regex) => {
    const match = String(text ?? "").match(regex);
    return match ? cleanText(match[1]) : "";
  };

  const appearsBefore = (firstElement, secondElement) =>
    Boolean(
      firstElement.compareDocumentPosition(secondElement) &
        Node.DOCUMENT_POSITION_FOLLOWING
    );

  const sortInDocumentOrder = elements =>
    elements.sort((firstElement, secondElement) => {
      if (appearsBefore(firstElement, secondElement)) return -1;
      if (appearsBefore(secondElement, firstElement)) return 1;
      return 0;
    });

  const findSmallestMatchingElements = (
    selectors,
    exactPattern
  ) =>
    sortInDocumentOrder(
      [...document.querySelectorAll(selectors)]
        .filter(isVisible)
        .filter(element =>
          exactPattern.test(cleanText(element.innerText))
        )
        .filter(element =>
          ![...element.children].some(child =>
            exactPattern.test(cleanText(child.innerText))
          )
        )
    );

  /*
   * Extract quantity for one specific product.
   *
   * Supported formats:
   * Quantity: 1
   * Quantity Unshipped: 1
   */
  const extractQuantity = productContainer => {
    if (!productContainer) return "";

    const productText = String(
      productContainer.innerText || ""
    )
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "");

    const quantityMatch = productText.match(
      /Quantity(?:\s+Unshipped)?\s*:\s*(\d+)/i
    );

    return quantityMatch ? quantityMatch[1] : "";
  };

  /*
   * Return a short cancellation comment only when
   * "Buyer cancellation" appears inside the order row.
   *
   * Separate cancellation banners are intentionally ignored.
   */
  const extractCancellationComment = orderContainer => {
    if (!orderContainer) return "";

    const cancellationElements = [
      ...orderContainer.querySelectorAll(
        "div, span, p, td, section"
      )
    ]
      .filter(isVisible)
      .filter(element =>
        /^Buyer cancellation$/i.test(
          cleanText(element.innerText)
        )
      )
      .filter(element =>
        ![...element.children].some(child =>
          /^Buyer cancellation$/i.test(
            cleanText(child.innerText)
          )
        )
      );

    return cancellationElements.length
      ? "Buyer cancellation"
      : "";
  };

  /*
   * Locate all order IDs currently displayed on the page.
   */
  const orderIdElements =
    findSmallestMatchingElements(
      "a, span, div",
      ORDER_ID_REGEX
    );

  /*
   * Locate every SKU currently displayed on the page.
   * Each SKU will become one exported product row.
   */
  const skuElements =
    findSmallestMatchingElements(
      "div, span, p, li",
      SKU_REGEX
    );

  if (!orderIdElements.length) {
    console.error(
      "No order IDs were found on the page."
    );
    return;
  }

  if (!skuElements.length) {
    console.error(
      "No SKU elements were found on the page."
    );
    return;
  }

  /*
   * Collect information shared by all products
   * belonging to the same order.
   */
  const orderMetadata = orderIdElements.map(
    orderIdElement => {
      const orderId = cleanText(
        orderIdElement.innerText
      );

      let currentContainer =
        orderIdElement.closest("tr") ||
        orderIdElement.parentElement;

      let bestOrderContainer = currentContainer;

      for (
        let level = 0;
        level < 15 && currentContainer;
        level += 1
      ) {
        const containerText = String(
          currentContainer.innerText || ""
        );

        const containedOrderIds =
          containerText.match(
            /\b\d{3}-\d{7}-\d{7}\b/g
          ) || [];

        const uniqueOrderIds = [
          ...new Set(containedOrderIds)
        ];

        const containsOnlyCurrentOrder =
          uniqueOrderIds.length === 1 &&
          uniqueOrderIds[0] === orderId;

        if (
          containsOnlyCurrentOrder &&
          /Buyer name:/i.test(containerText)
        ) {
          bestOrderContainer = currentContainer;
        }

        if (
          containsOnlyCurrentOrder &&
          /Buyer name:/i.test(containerText) &&
          /Ship by date:/i.test(containerText) &&
          /Deliver by date:/i.test(containerText) &&
          /Unshipped/i.test(containerText)
        ) {
          bestOrderContainer = currentContainer;
          break;
        }

        currentContainer =
          currentContainer.parentElement;
      }

      const orderText = String(
        bestOrderContainer?.innerText || ""
      )
        .replace(/\u00a0/g, " ")
        .replace(/\r/g, "");

      return {
        orderId,
        element: orderIdElement,
        container: bestOrderContainer,

        buyerName: extractMatch(
          orderText,
          /Buyer name:\s*\n\s*([^\n]+)/i
        ),

        shipByDate: extractMatch(
          orderText,
          /Ship by date:\s*([^\n]+)/i
        ),

        deliverByDate: extractMatch(
          orderText,
          /Deliver by date:\s*([^\n]+)/i
        ),

        comment: extractCancellationComment(
          bestOrderContainer
        )
      };
    }
  );

  /*
   * Convert every SKU into a separate product row.
   * Multi-item orders will produce multiple rows.
   */
  const extractedRows = [];

  for (const skuElement of skuElements) {
    const precedingOrders = orderMetadata.filter(order =>
      appearsBefore(order.element, skuElement)
    );

    const matchingOrder = precedingOrders.at(-1);

    if (!matchingOrder) continue;

    /*
     * Find the smallest container representing
     * exactly one product.
     */
    let currentContainer =
      skuElement.parentElement;

    let bestProductContainer =
      currentContainer;

    for (
      let level = 0;
      level < 15 && currentContainer;
      level += 1
    ) {
      const containerText = String(
        currentContainer.innerText || ""
      );

      const containedSkuElements = [
        ...currentContainer.querySelectorAll(
          "div, span, p, li"
        )
      ]
        .filter(isVisible)
        .filter(element =>
          SKU_REGEX.test(cleanText(element.innerText))
        )
        .filter(element =>
          ![...element.children].some(child =>
            SKU_REGEX.test(
              cleanText(child.innerText)
            )
          )
        );

      const containsOneProduct =
        containedSkuElements.length === 1 &&
        /ASIN:/i.test(containerText) &&
        /Quantity(?:\s+Unshipped)?\s*:/i.test(
          containerText
        );

      if (containsOneProduct) {
        bestProductContainer =
          currentContainer;
      }

      if (containedSkuElements.length > 1) {
        break;
      }

      currentContainer =
        currentContainer.parentElement;
    }

    const productText = String(
      bestProductContainer?.innerText || ""
    )
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "");

    const productNameCandidates = [
      ...bestProductContainer.querySelectorAll("a")
    ]
      .filter(isVisible)
      .map(link => cleanText(link.innerText))
      .filter(Boolean)
      .filter(
        text => !ORDER_ID_REGEX.test(text)
      )
      .filter(
        text =>
          !/buy shipping|more information|buyer name/i.test(
            text
          )
      )
      .filter(
        text =>
          !/^(ASIN|SKU|Quantity|Item subtotal):/i.test(
            text
          )
      );

    const productName =
      productNameCandidates.sort(
        (firstText, secondText) =>
          secondText.length - firstText.length
      )[0] || "";

    extractedRows.push({
      order_id: matchingOrder.orderId,
      buyer_name: matchingOrder.buyerName,
      product_name: productName,

      asin: extractMatch(
        productText,
        /ASIN:\s*([^\n]+)/i
      ),

      sku: extractMatch(
        productText,
        /SKU:\s*([^\n]+)/i
      ),

      quantity: extractQuantity(
        bestProductContainer
      ),

      item_subtotal: extractMatch(
        productText,
        /Item subtotal:\s*\$?([0-9.,]+)/i
      ),

      ship_by_date:
        matchingOrder.shipByDate,

      deliver_by_date:
        matchingOrder.deliverByDate,

      comment:
        matchingOrder.comment
    });
  }

  /*
   * Keep all valid product rows.
   * Products are not deduplicated by order ID.
   */
  const finalRows = extractedRows.filter(
    row => row.order_id && row.sku
  );

  if (!finalRows.length) {
    console.error(
      "No product data is available for export."
    );
    return;
  }

  console.table(finalRows);

  const distinctOrderCount = new Set(
    finalRows.map(row => row.order_id)
  ).size;

  const missingQuantityRows =
    finalRows.filter(row => !row.quantity);

  const cancellationRows =
    finalRows.filter(
      row => row.comment === "Buyer cancellation"
    );

  console.log(
    `Extracted ${distinctOrderCount} order(s) and ${finalRows.length} product row(s).`
  );

  if (missingQuantityRows.length) {
    console.warn(
      `${missingQuantityRows.length} product row(s) are missing quantity values:`,
      missingQuantityRows
    );
  } else {
    console.log(
      "Quantity was successfully extracted for every product row."
    );
  }

  console.log(
    `Detected ${cancellationRows.length} product row(s) marked as Buyer cancellation.`
  );

  console.table(
    cancellationRows.map(row => ({
      order_id: row.order_id,
      buyer_name: row.buyer_name,
      sku: row.sku,
      quantity: row.quantity,
      comment: row.comment
    }))
  );

  /*
   * Generate and download the CSV file.
   */
  const headers = Object.keys(finalRows[0]);

  const escapeCsvValue = value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...finalRows.map(row =>
      headers
        .map(header =>
          escapeCsvValue(row[header])
        )
        .join(",")
    )
  ].join("\n");

  const csvBlob = new Blob(
    ["\uFEFF" + csvContent],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const downloadUrl =
    URL.createObjectURL(csvBlob);

  const downloadLink =
    document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download =
    `amazon_unshipped_orders_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  setTimeout(
    () => URL.revokeObjectURL(downloadUrl),
    1000
  );
})();
