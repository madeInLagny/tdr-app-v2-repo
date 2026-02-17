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
      orderValueBelow150:
        document.querySelector('input[name="orderValue"]:checked').value ===
        "orderBelow150",
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
      const handlingFeePromo = document.getElementById("handlingSurchargePromo");
      handlingFeePromo.style.display = "none";
      let comment = "";
      const romaniaDeliveryFee = "<br>Note: Romania applies a fee of 25Ron per package on all deliveries in Romania, even if the order was imported in another EU country.";

      if (!formData.b2cEcommerce || !formData.orderValueBelow150) {
        comment =
          "Handling surcharges only apply to eCommerce orders of less than €150."+romaniaDeliveryFee;
      } else {
        // eCommerce = true
        if (country === "Italy") {
          comment =
            "Italy has implemented a handling surcharge on eCommerce orders of less than €150 imported and delivered in Italy.<div class='mt-3'><b>Amount:</b> €2 per package.<br><b>Starting from:</b> January 1st 2026.</div><div class='mt-3'><b>Cost Impact:</b> €2*" +
            formData.packageCount +
            " packages = €" +
            formData.packageCount * 2 +
            " for this order</div>"+romaniaDeliveryFee;
            handlingFeePromo.style.display = "block";
        } else if (country === "Romania") {
          comment =
            "Romania has implemented a handling surcharge on eCommerce orders of less than €150 delivered in Romania (regardless of the country of import).<div class='mt-3'><b>Amount:</b> RON 25 (approx €5) per package.<br><b>Starting from:</b> January 1st 2026.</div><div class='mt-3'><b>Cost Impact:</b> RON 25*" +
            formData.packageCount +
            " packages = RON " +
            formData.packageCount * 25 +
            " for this order (approx. €" +
            (formData.packageCount * 25) / 5 +
            ")</div>";
            handlingFeePromo.style.display = "block";
        } else if (country === "France") {
          comment =
            "France has implemented a handling surcharge on eCommerce orders of less than €150 imported and delivered in France.<div class='mt-3'><b>Amount:</b> €2 per HS code.<br><b>Starting from:</b> March 1st 2026.</div><div class='mt-3'><b>Cost Impact:</b> €2*" +
            formData.hsCodeCount +
            " HS codes = €" +
            formData.hsCodeCount * 2 +
            " for this order</div>"+romaniaDeliveryFee;
            handlingFeePromo.style.display = "block";
        } else {
          comment = `To date, ${country} has not introduced any national handling surcharge on e-commerce. The European Union is expected to implement an EU-wide handling surcharge by the third quarter of 2026.`;
        }
      }

      handlingFeeCommentEl.innerHTML = comment;
    }
    // Build duty comment according to rules provided
    if (dutyCommentEl) {
      let comment = "";

      if (!formData.orderValueBelow150) {
        comment =
          "Orders over €150 are subject to standard EU customs duties. <br>There is no change expected in the duty treatment for these orders in 2026. <br>";
      } else if (formData.b2cEcommerce && formData.orderValueBelow150) {
        comment =
          "Orders of less than €150 are duty-free until June 30th 2026.<br>Starting July 1st 2026, a fixed duty of €3 per HS code will apply to these orders. <div class='mt-3'><b>Cost Impact:</b> €3*" +
          formData.hsCodeCount +
          " HS code = €" +
          formData.hsCodeCount * 3 +
          " for this order</div>";
      } else if (!formData.b2cEcommerce && formData.orderValueBelow150) {
        comment =
          "Orders of less than €150 are duty-free until June 30th 2026.<br>Starting July 1st 2026, these orders will be subject to standard EU customs duties. <div class='mt-3'><b>Cost Impact:</b> Varies based on the products imported and their respective duty rates.</div>" +
          TDRCallOut;
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