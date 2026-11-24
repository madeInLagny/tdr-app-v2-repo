/**
 * EU Customs Calculator
 * Estimates the fixed EU charges on distance sales of imported goods:
 *  - temporary customs duty of EUR 3 per item (consignments of EUR 150 or less)
 *  - Union handling fee of EUR 2 per item (any value)
 *
 * All measures live in the MEASURES object below (amount, start and end dates).
 * To update the tool when a rule changes, edit MEASURES and lastVerified: no other change is needed.
 */

(function () {
  "use strict";

  // ===== Measures (single source of truth) =====
  const MEASURES = {
    lastVerified: "2026-11-23",
    // Temporary customs duty, Council Regulation (EU) 2026/382.
    // Per item (tariff classification, not quantity), distance sales up to EUR 150.
    duty: {
      amount: 3,
      start: "2026-07-01",
      end: "2028-07-01", // normal customs duties apply afterwards
      maxValue: 150,
    },
    // Union handling fee, Commission Delegated Regulation (EU) 2026/2152.
    // Per customs declaration line item, distance sales of any value, no end date.
    handlingFee: {
      amount: 2,
      start: "2026-11-01",
      maxValue: null, // null = no value limit (confirmed)
    },
  };

  // ===== DOM Elements =====
  const form = document.getElementById("euCustomsForm");
  const hsCodeCountInput = document.getElementById("hsCodeCount");
  const resultsSection = document.getElementById("resultsSection");
  const emptyState = document.getElementById("emptyState");
  const totalCommentEl = document.getElementById("totalComment");
  const handlingFeeCommentEl = document.getElementById("handlingFeeComment");
  const dutyCommentEl = document.getElementById("dutyComment");

  const SAME_ITEM_NOTE =
    "An item is counted by tariff classification (HS code), not by quantity. 5 T-shirts count as 1 item only if they all have exactly the same HS code; T-shirts with different HS codes count separately, and a T-shirt and a watch count as 2 items.";

  // ===== Helpers =====
  function getAsOfDate() {
    // ?asOf=YYYY-MM-DD lets you preview the rules on another date (QA only)
    const param = new URLSearchParams(window.location.search).get("asOf");
    return param && /^\d{4}-\d{2}-\d{2}$/.test(param)
      ? new Date(param + "T00:00:00")
      : new Date();
  }

  function onOrAfter(date, iso) {
    return date >= new Date(iso + "T00:00:00");
  }

  function before(date, iso) {
    return date < new Date(iso + "T00:00:00");
  }

  function eur(value) {
    const rounded = Math.round(value * 100) / 100;
    return "€" + (Number.isInteger(rounded) ? rounded : rounded.toFixed(2));
  }

  function formatDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // ===== Initialization =====
  function init() {
    form.addEventListener("submit", handleFormSubmit);
  }

  // ===== Form Submit Handler =====
  function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
      orderValueBelow150:
        document.querySelector('input[name="orderValue"]:checked').value ===
        "orderBelow150",
      hsCodeCount: parseInt(hsCodeCountInput.value, 10),
      IOSS:
        document.querySelector('input[name="IOSS"]:checked').value === "yes",
    };

    displayResults(formData);
  }

  // ===== Calculation =====
  function calculate(formData, asOf) {
    const items = formData.hsCodeCount;
    const result = {
      items: items,
      dutyApplies: false,
      dutyBeforeStart: false,
      dutyEnded: false,
      duty: 0,
      handlingApplies: false,
      handlingNotYet: false,
      handling: 0,
    };

    // Temporary EUR 3 duty: consignments of EUR 150 or less, distance sales, any VAT scheme
    if (formData.orderValueBelow150) {
      if (before(asOf, MEASURES.duty.start)) {
        result.dutyBeforeStart = true;
      } else if (onOrAfter(asOf, MEASURES.duty.end)) {
        result.dutyEnded = true;
      } else {
        result.dutyApplies = true;
        result.duty = MEASURES.duty.amount * items;
      }
    }

    // Union handling fee: any value, from its start date
    const underLimit =
      MEASURES.handlingFee.maxValue === null ||
      (formData.orderValueBelow150 && MEASURES.handlingFee.maxValue >= 150);
    if (underLimit) {
      if (onOrAfter(asOf, MEASURES.handlingFee.start)) {
        result.handlingApplies = true;
        result.handling = MEASURES.handlingFee.amount * items;
      } else {
        result.handlingNotYet = true;
      }
    }

    return result;
  }

  // ===== Display Results =====
  function displayResults(formData) {
    const asOf = getAsOfDate();
    const r = calculate(formData, asOf);
    const items = r.items;
    const itemWord = items === 1 ? "item" : "items";

    // ---- Total
    if (totalCommentEl) {
      let total = "";
      if (r.dutyApplies || r.handlingApplies) {
        const parts = [];
        if (r.dutyApplies) {
          parts.push(
            "customs duty " + eur(MEASURES.duty.amount) + " × " + items + " = " + eur(r.duty),
          );
        }
        if (r.handlingApplies) {
          parts.push(
            "handling fee " + eur(MEASURES.handlingFee.amount) + " × " + items + " = " + eur(r.handling),
          );
        }
        total =
          "<div class='mb-2'><b>Estimated fixed EU charges for this order:</b> " +
          eur(r.duty + r.handling) +
          "</div><div>" +
          parts.join("<br>") +
          "</div><div class='mt-2'><small>" +
          (r.dutyApplies
            ? "Before import VAT on the goods. "
            : "Before import VAT on the goods and before the normal customs duty, which varies with the products. ") +
          SAME_ITEM_NOTE +
          "</small></div>";
      } else {
        total =
          "No fixed EU charge applies to this order on the selected date. Normal customs duties and VAT still apply.";
      }
      totalCommentEl.innerHTML = total;
    }

    // ---- Handling fee
    if (handlingFeeCommentEl) {
      let comment = "";

      if (r.handlingApplies) {
        comment =
          "The Union handling fee applies to goods sold under distance sales arrangements, <b>regardless of their value</b>, including orders above €150.<div class='mt-3'><b>Amount:</b> " +
          eur(MEASURES.handlingFee.amount) +
          " per item.<br><b>Starting from:</b> " +
          formatDate(MEASURES.handlingFee.start) +
          ".</div><div class='mt-3'><b>Cost Impact:</b> " +
          eur(MEASURES.handlingFee.amount) +
          " × " +
          items +
          " " +
          itemWord +
          " = " +
          eur(r.handling) +
          " for this order</div>";

        // VAT
        if (formData.IOSS) {
          comment +=
            "<div class='mt-3'><b>VAT:</b> the fee forms part of the VAT taxable amount, except in the specified circumstances in which the IOSS is used. Check the treatment with your customs representative.</div>";
        } else {
          comment +=
            "<div class='mt-3'><b>VAT:</b> VAT applies to the fee: it is added to the value of the goods when VAT is calculated.</div>";
        }

        comment +=
          "<div class='mt-3'><b>Who pays:</b> the debtor, in practice the IOSS user or the indirect customs representative acting as declarant.</div><div class='mt-3'><b>Refund:</b> the fee is non-refundable, even if the goods are not released for free circulation or the declaration is invalidated.</div><div class='mt-3'>From 1 July 2028, a reduced fee will apply to goods released from customs warehouses used for distance sales (amount to be set in a separate act).</div>";
      } else if (r.handlingNotYet) {
        comment =
          "The Union handling fee of " +
          eur(MEASURES.handlingFee.amount) +
          " per item applies from " +
          formatDate(MEASURES.handlingFee.start) +
          ", on distance sales of any value.";
      } else {
        comment = "No Union handling fee applies to this order.";
      }

      handlingFeeCommentEl.innerHTML = comment;
    }

    // ---- Duty
    if (dutyCommentEl) {
      let comment = "";

      if (!formData.orderValueBelow150) {
        comment =
          "The temporary €" +
          MEASURES.duty.amount +
          " duty applies to consignments of €150 or less. Orders above €150 are subject to standard EU customs duties, which vary with the products and their tariff classification.";
      } else if (r.dutyBeforeStart) {
        comment =
          "Low value consignments (orders of €150 or less) are duty-free until " +
          formatDate(MEASURES.duty.start) +
          ". From that date a fixed duty of €" +
          MEASURES.duty.amount +
          " per item applies.";
      } else if (r.dutyEnded) {
        comment =
          "The temporary €" +
          MEASURES.duty.amount +
          " duty ended on " +
          formatDate(MEASURES.duty.end) +
          ". Normal customs duties now apply, depending on the type of goods.";
      } else {
        comment =
          "A temporary customs duty of €" +
          MEASURES.duty.amount +
          " per item applies to distance sales of consignments of €150 or less, <b>whatever the VAT scheme</b> (IOSS, special arrangements or standard VAT). It applies from " +
          formatDate(MEASURES.duty.start) +
          " until " +
          formatDate(MEASURES.duty.end) +
          ", after which normal customs duties apply." +
          "<div class='mt-3'><b>Cost Impact:</b> €" +
          MEASURES.duty.amount +
          " × " +
          items +
          " " +
          itemWord +
          " = " +
          eur(r.duty) +
          " for this order</div>";

        if (!formData.IOSS) {
          comment +=
            "<div class='mt-3'><b>Exception:</b> goods that benefit from a preferential trade agreement or a Customs Union measure, declared in H1 without the IOSS, are excluded from the flat duty. For those goods the cost can be lower than shown above.</div>";
        }

        comment +=
          "<div class='mt-3'>" +
          SAME_ITEM_NOTE +
          "</div><div class='mt-3'>The €" +
          MEASURES.duty.amount +
          " duty cannot be recovered, at least until July 2028.</div>";
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
