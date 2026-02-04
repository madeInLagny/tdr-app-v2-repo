/**
 * EU Customs Calculator
 * Calculates duty rates, handling surcharges, and VAT declaration modes
 * based on EU 2026 customs regulations
 */

(function () {
  "use strict";
  // ===== DOM Elements =====
  const form = document.getElementById("euCustomsForm");
  const importCountrySelect = document.getElementById("importCountry");
  const orderValueInput = document.getElementById("orderValue");
  const packageCountInput = document.getElementById("packageCount");
  const hsCodeCountInput = document.getElementById("hsCodeCount");
  const resultsSection = document.getElementById("resultsSection");
  const emptyState = document.getElementById("emptyState");
  const handlingFeeCommentEl = document.getElementById("handlingFeeComment");
  const dutyCommentEl = document.getElementById("dutyComment");

  // ===== Initialization =====
  function init() {
    form.addEventListener("submit", handleFormSubmit);
  }

  // ===== Form Submit Handler =====
  function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
      importCountry: importCountrySelect.value,
      orderValue: parseFloat(orderValueInput.value),
      packageCount: parseInt(packageCountInput.value),
      hsCodeCount: parseInt(hsCodeCountInput.value),
      b2cEcommerce:
        document.querySelector('input[name="eCommerce"]:checked').value ===
        "yes",
    };

    displayResults(formData);
  }

  // ===== Display Results =====
  function displayResults(formData) {
    // Build handling fee comment according to rules provided
    if (handlingFeeCommentEl) {
      const country = formData.importCountry || "This country";
      let comment = "";

      if (!formData.b2cEcommerce || formData.orderValue >= 150) {
        comment =
          "Handling surcharges only apply to eCommerce orders of less than €150.";
      } else {
        // eCommerce = true
        if (country === "Italy") {
          comment =
            "Italy has implemented handling surcharge on eCommerce orders of less than €150.<div class='mt-3'><b>Amount:</b> €2 per package.<br><b>Starting from:</b> January 1st 2026.</div><div class='mt-3'><b>Cost Impact:</b> €2*" +
            formData.packageCount +
            " packages = €" +
            formData.packageCount * 2 +
            " for this order</div>";
        } else if (country === "Romania") {
          comment =
            "Romania has implemented handling surcharge on eCommerce orders of less than €150.<div class='mt-3'><b>Amount:</b> RON 25 (approx €5) per package.<br><b>Starting from:</b> January 1st 2026.</div><div class='mt-3'><b>Cost Impact:</b> RON 25*" +
            formData.packageCount +
            " packages = RON " +
            formData.packageCount * 25 +
            " for this order (approx. €" +
            (formData.packageCount * 25) / 5 +
            ")</div>";
        } else if (country === "France") {
          comment =
            "France has implemented a handling surcharge on eCommerce orders of less than €150.<div class='mt-3'><b>Amount:</b> €2 per package.<br><b>Starting from:</b> March 1st 2026.</div><div class='mt-3'><b>Cost Impact:</b> €2*" +
            formData.packageCount +
            " packages = €" +
            formData.packageCount * 2 +
            " for this order</div>";
        } else {
          comment = `To date, ${country} has not introduced any national handling surcharge on e-commerce. The European Union is expected to implement an EU-wide handling surcharge by the third quarter of 2026.`;
        }
      }

      handlingFeeCommentEl.innerHTML = comment;
    }
    // Build duty comment according to rules provided
    if (dutyCommentEl) {
      let comment = "";
      let TDRCallOut =
        "<div class='mt-3'><b>Reduce the burden of import duties:</b> TDR helps you recover customs charges paid on EU imports.. <a href='/contact-us.html'>Talk to us...</a></div>";

      if (formData.orderValue > 150) {
        comment =
          "Orders over €150 are subject to standard EU customs duties. <br>There is no change expected in the duty treatment for these orders under the new regulations. <br>" +
          TDRCallOut;
      }else if (formData.b2cEcommerce && formData.orderValue <= 150) {
        comment =
          "Orders of less than €150 are duty-free until June 30th 2026.<br>Starting July 1st 2026, a fixed duty of €3 per HS code will apply to these orders. <div class='mt-3'><b>Cost Impact:</b> €3*" +
            formData.hsCodeCount +
            " HS code = €" +
            formData.hsCodeCount * 3 +
            " for this order</div>" +
          TDRCallOut;
      }else if (!formData.b2cEcommerce && formData.orderValue <= 150) {
        comment =
          "Orders of less than €150 are duty-free until June 30th 2026.<br>Starting July 1st 2026, these orders will be subject to standard EU customs duties. <div class='mt-3'><b>Cost Impact:</b> Varies based on the products imported and their respective duty rates.</div>" + TDRCallOut
      }

	  dutyCommentEl.innerHTML = comment;
    }
    // Show results, hide empty state
    resultsSection.style.display = "block";
    emptyState.style.display = "none";

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ===== Initialize on DOM Ready =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Complete with Duty Calculation */
/* 

orders of more than 150 EUR:
* Dutiable as per current rules (This duty amount is refundable. Contact TDR to learn more)

ecom of less than 150 EUR:
* duty free until June 30th 2026 
* 3€ per HS code starting July 1st 2026 (This fixed duty amount is refundable. Contact TDR to learn more)
not ecom orders: 
* duty free until June 30th 2026
* Dutiable starting July 1st 2026 (same as current rules for orders over 150 EUR) (This fixed duty amount is refundable. Contact TDR to learn more)

*/

/* TDR has developped solutions to mitigate duties impact on your business. Talk to us... */

/* Stay in the know with EU Customs Regulations development: Subscribe to our EU 2026 Newsletter: */
