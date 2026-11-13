(function () {
  const contactPath = "/contact-request.html";
  const appointmentPath = "/make-an-appointment.html";
  const sourceKeys = {
    contact: "tdr_ga4_contact_source",
    appointment: "tdr_ga4_appointment_source",
  };
  const pendingKeys = {
    contact: "tdr_ga4_contact_pending",
    appointment: "tdr_ga4_appointment_pending",
  };
  const currentPath = getPagePath(window.location);

  function getPagePath(url) {
    return url.pathname;
  }

  function isProductionSite() {
    return window.location.protocol !== "file:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
  }

  function getValue(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.warn("Unable to read GA4 attribution for this session.", error);
      return null;
    }
  }

  function getStoredSource(type) {
    return getValue(sourceKeys[type]) || "(direct)";
  }

  function saveValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn("Unable to save GA4 attribution for this session.", error);
    }
  }

  function removeValue(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn("Unable to clear GA4 attribution for this session.", error);
    }
  }

  function getConsent() {
    if (!window.CookieConsent || typeof window.CookieConsent.acceptedCategory !== "function") {
      return null;
    }

    return window.CookieConsent.acceptedCategory("analytics");
  }

  function canTrack() {
    if (!isProductionSite()) {
      return false;
    }

    return getConsent() === true;
  }

  function sendEvent(eventName, parameters) {
    if (typeof window.gtag !== "function") {
      return false;
    }

    window.gtag("event", eventName, parameters);
    return true;
  }

  function trackEvent(eventName, parameters) {
    if (!canTrack()) {
      return;
    }

    sendEvent(eventName, parameters);
  }

  function trackConfirmedConversion(type, eventName, formName) {
    const pendingKey = pendingKeys[type];
    if (getValue(pendingKey) !== "true" || !canTrack()) {
      return;
    }

    const sourcePage = getStoredSource(type);
    const sent = sendEvent(eventName, {
      form_name: formName,
      source_page: sourcePage,
    });

    if (sent) {
      removeValue(pendingKey);
      removeValue(sourceKeys[type]);
    }
  }

  function getReferrerSource() {
    if (!document.referrer) {
      return "(direct)";
    }

    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin
      ? getPagePath(referrer)
      : "(external)";
  }

  function handleConsentChange() {
    if (!canTrack()) {
      return;
    }

    if (document.body.dataset.ga4Conversion === "contact") {
      trackConfirmedConversion("contact", "generate_lead", "contact_request");
    } else if (document.body.dataset.ga4Conversion === "appointment") {
      trackConfirmedConversion("appointment", "appointment_booked", "appointment");
    }
  }

  document.addEventListener("click", function (event) {
    const cta = event.target.closest(
      'a.button, a.btn, button.button, button.btn, a[role="button"], button[role="button"], .contact-option, .tdr-contact-widget, a[href*="contact-request.html"], a[href*="make-an-appointment.html"], [data-ga4-cta]'
    );
    if (!cta || cta.closest("form")) {
      return;
    }

    const link = cta.closest("a");
    const sourcePage = getPagePath(window.location);
    const targetUrl = link ? new URL(link.href, window.location.href) : null;
    const ctaText = (cta.getAttribute("aria-label") || cta.textContent || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 100);

    trackEvent("cta_click", {
      cta_text: ctaText,
      cta_url: targetUrl ? getPagePath(targetUrl) : "",
      source_page: sourcePage,
    });

    if (!targetUrl || targetUrl.origin !== window.location.origin) {
      return;
    }

    const targetPath = getPagePath(targetUrl);
    const conversionType = targetPath.endsWith(contactPath)
      ? "contact"
      : targetPath.endsWith(appointmentPath)
        ? "appointment"
        : null;

    if (conversionType) {
      saveValue(sourceKeys[conversionType], sourcePage);
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target.id !== "contactForm" || !currentPath.endsWith(contactPath)) {
      return;
    }

    if (!getValue(sourceKeys.contact)) {
      saveValue(sourceKeys.contact, getReferrerSource());
    }
    saveValue(pendingKeys.contact, "true");
  });

  if (currentPath.endsWith(appointmentPath)) {
    if (!getValue(sourceKeys.appointment)) {
      saveValue(sourceKeys.appointment, getReferrerSource());
    }
    saveValue(pendingKeys.appointment, "true");
  }

  window.addEventListener("tdr:analytics-consent-change", handleConsentChange);
  window.addEventListener("cc:onConsent", handleConsentChange);
  window.addEventListener("cc:onChange", handleConsentChange);

  if (document.body.dataset.ga4Conversion === "contact") {
    trackConfirmedConversion("contact", "generate_lead", "contact_request");
  } else if (document.body.dataset.ga4Conversion === "appointment") {
    trackConfirmedConversion("appointment", "appointment_booked", "appointment");
  }

  handleConsentChange();
})();
