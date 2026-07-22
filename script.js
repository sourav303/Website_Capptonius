const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const header = document.querySelector("[data-header]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
    }
  });
}

if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("has-shadow", window.scrollY > 10);
  });
}


const enrollForm = document.querySelector("[data-enroll-form]");
const enrollNote = document.querySelector("[data-enroll-note]");
const paymentPanel = document.querySelector("[data-payment-panel]");
const paymentService = document.querySelector("[data-payment-service]");
const paymentAmount = document.querySelector("[data-payment-amount]");
const paypalStatus = document.querySelector("[data-paypal-status]");
const paypalButtonContainer = document.querySelector("#paypal-button-container");
const editEnrollmentButton = document.querySelector("[data-edit-enrollment]");
const enrollmentEmailLink = document.querySelector("[data-enrollment-email]");

let currentEnrollment = null;
let paypalRendered = false;

function getPayPalConfig() {
  return window.CAPPTONIUS_PAYPAL_CONFIG || {};
}

function formatPaymentAmount(amount) {
  const config = getPayPalConfig();
  const currency = config.currency || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

function isPayPalConfigured() {
  const config = getPayPalConfig();
  return Boolean(
    config.clientId &&
    !String(config.clientId).includes("REPLACE_WITH") &&
    config.currency
  );
}

function setPayPalStatus(message, type) {
  if (!paypalStatus) return;
  paypalStatus.textContent = message;
  paypalStatus.dataset.status = type || "info";
}

function buildEnrollmentEmail(orderId) {
  if (!currentEnrollment) return "mailto:hr@capptonius.com";
  const subject = encodeURIComponent("Paid enrollment request from " + currentEnrollment.fullName);
  const body = encodeURIComponent(
    "Full Name: " + currentEnrollment.fullName +
    "\nEmail ID: " + currentEnrollment.email +
    "\nPhone Number: " + currentEnrollment.phone +
    "\nService Required: " + currentEnrollment.service +
    "\nAmount Paid: " + formatPaymentAmount(currentEnrollment.amount) +
    "\nPayPal Order ID: " + orderId +
    "\n\nAdditional Details:\n" + currentEnrollment.details
  );
  return "mailto:hr@capptonius.com?subject=" + subject + "&body=" + body;
}

function loadPayPalSdk() {
  if (window.paypal) return Promise.resolve();
  const config = getPayPalConfig();
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector("[data-paypal-sdk]");
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.paypalSdk = "true";
    script.src = "https://www.paypal.com/sdk/js?client-id=" +
      encodeURIComponent(config.clientId) +
      "&currency=" + encodeURIComponent(config.currency || "USD") +
      "&components=buttons";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function renderPayPalButtons() {
  if (!paypalButtonContainer || !currentEnrollment) return;
  if (!isPayPalConfigured()) {
    setPayPalStatus("Payment setup is pending. Add your PayPal Business Client ID in payment-config.js.", "warning");
    paypalButtonContainer.innerHTML = "";
    return;
  }

  if (currentEnrollment.amount <= 0) {
    setPayPalStatus("Enter a valid payment amount before continuing.", "warning");
    paypalButtonContainer.innerHTML = "";
    return;
  }

  if (paypalRendered) {
    paypalButtonContainer.innerHTML = "";
    paypalRendered = false;
  }

  setPayPalStatus("Pay securely with PayPal to complete your enrollment.", "info");

  loadPayPalSdk()
    .then(() => {
      if (!window.paypal) throw new Error("PayPal SDK did not load.");
      paypalButtonContainer.innerHTML = "";
      return window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal"
        },
        createOrder: (data, actions) => actions.order.create({
          purchase_units: [{
            description: currentEnrollment.description,
            custom_id: "CAP-" + Date.now(),
            amount: {
              currency_code: currentEnrollment.currency,
              value: currentEnrollment.amount.toFixed(2)
            }
          }]
        }),
        onApprove: (data, actions) => actions.order.capture().then((details) => {
          const payerName = details && details.payer && details.payer.name
            ? [details.payer.name.given_name, details.payer.name.surname].filter(Boolean).join(" ")
            : currentEnrollment.fullName;
          setPayPalStatus("Payment completed. Thank you, " + payerName + ". Your PayPal order ID is " + data.orderID + ".", "success");
          if (enrollmentEmailLink) {
            enrollmentEmailLink.href = buildEnrollmentEmail(data.orderID);
            enrollmentEmailLink.hidden = false;
          }
          enrollForm.classList.add("is-complete");
        }),
        onCancel: () => {
          setPayPalStatus("Payment was cancelled. You can retry whenever you are ready.", "warning");
        },
        onError: () => {
          setPayPalStatus("PayPal could not process the payment. Please try again or contact hr@capptonius.com.", "error");
        }
      }).render("#paypal-button-container");
    })
    .then(() => {
      paypalRendered = true;
    })
    .catch(() => {
      setPayPalStatus("Unable to load PayPal checkout. Please check your Client ID and internet connection.", "error");
    });
}

if (enrollForm) {
  enrollForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!enrollForm.reportValidity()) return;
    const formData = new FormData(enrollForm);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const amount = Number(formData.get("amount") || "0");
    const details = String(formData.get("details") || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      if (enrollNote) enrollNote.textContent = "Please enter a valid payment amount.";
      return;
    }

    const config = getPayPalConfig();
    currentEnrollment = {
      fullName,
      email,
      phone,
      service,
      details,
      amount,
      currency: config.currency || "USD",
      description: (config.paymentDescription || "Capptonius enrollment payment") + " - " + service
    };

    if (paymentService) paymentService.textContent = service;
    if (paymentAmount) paymentAmount.textContent = formatPaymentAmount(amount);
    if (paymentPanel) paymentPanel.hidden = false;
    if (enrollNote) {
      enrollNote.textContent = "Review your service selection below and complete checkout.";
    }
    enrollForm.classList.add("is-ready-for-payment");
    renderPayPalButtons();
    paymentPanel && paymentPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  if (editEnrollmentButton) {
    editEnrollmentButton.addEventListener("click", () => {
      if (paymentPanel) paymentPanel.hidden = true;
      enrollForm.classList.remove("is-ready-for-payment", "is-complete");
      if (enrollNote) enrollNote.textContent = "";
      if (enrollmentEmailLink) enrollmentEmailLink.hidden = true;
      paypalButtonContainer && (paypalButtonContainer.innerHTML = "");
      paypalRendered = false;
    });
  }
}

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const need = String(formData.get("need") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = encodeURIComponent("Website inquiry from " + name);
    const body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\nNeed: " + need + "\n\nMessage:\n" + message);
    window.location.href = "mailto:hr@capptonius.com?subject=" + subject + "&body=" + body;
    if (formNote) {
      formNote.textContent = "Opening your email app with the inquiry ready to send.";
    }
  });
}


const animatedElements = document.querySelectorAll(
  ".hero-content > *, .hero-dashboard, .tool-strip, .service-item, .content-section h2, .content-section p, .solution-grid article, .process-list div, .contact-form"
);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  animatedElements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--delay", Math.min(index * 35, 280) + "ms");
    revealObserver.observe(element);
  });
} else {
  animatedElements.forEach((element) => element.classList.add("is-visible"));
}

const counters = document.querySelectorAll("[data-count]");
if (counters.length) {
  const runCounter = (element) => {
    const target = Number(element.dataset.count || "0");
    const duration = target > 500 ? 1200 : 850;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      element.textContent = value === 200 ? "200+" : String(value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(runCounter);
  }
}

const serviceItems = document.querySelectorAll(".service-item");
serviceItems.forEach((item) => {
  item.addEventListener("click", () => {
    serviceItems.forEach((other) => other.classList.remove("is-active"));
    item.classList.add("is-active");
  });
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      item.click();
    }
  });
});

const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
const navTargets = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function updateActiveNav() {
  if (!navLinks.length || !navTargets.length) return;
  const headerOffset = (header ? header.offsetHeight : 0) + 90;
  const pagePosition = window.scrollY + headerOffset;
  let activeTarget = navTargets[0];

  navTargets.forEach((target) => {
    if (target.offsetTop <= pagePosition) {
      activeTarget = target;
    }
  });

  if (window.scrollY < 120) {
    activeTarget = document.querySelector("#home") || activeTarget;
  }

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + activeTarget.id);
  });
}

if (navTargets.length) {
  updateActiveNav();
  window.addEventListener("scroll", updateActiveNav, { passive: true });
  window.addEventListener("resize", updateActiveNav);
}


const modelContent = {
  augment: {
    label: "Recommended for fast hiring",
    title: "Extend your engineering team with vetted specialists.",
    copy: "Plug developers, QA engineers, cloud specialists, or full squads into your existing workflow without slowing delivery.",
    points: ["Shortlist aligned talent quickly", "Scale up or down as priorities change", "Keep control of product direction"]
  },
  build: {
    label: "Recommended for product launches",
    title: "Build web, mobile, and enterprise software with a focused delivery team.",
    copy: "Move from idea to shipped product with UI/UX, engineering, QA, DevOps, and release support under one delivery path.",
    points: ["Shape requirements and user journeys", "Develop scalable applications", "Launch with testing and deployment support"]
  },
  manage: {
    label: "Recommended for long-term ownership",
    title: "Let Capptonius manage a dedicated technology function for you.",
    copy: "Hand over a project, infrastructure workflow, or support function to a team built around measurable service outcomes.",
    points: ["Define service scope and success metrics", "Run delivery with transparent reporting", "Improve continuously as the business grows"]
  }
};

const modelTabs = document.querySelectorAll("[data-model]");
const modelPanel = document.querySelector("[data-model-panel]");
const modelTitle = document.querySelector("[data-model-title]");
const modelCopy = document.querySelector("[data-model-copy]");
const modelPoints = document.querySelector("[data-model-points]");
const modelLabel = document.querySelector(".model-label");

function renderModel(modelKey) {
  const content = modelContent[modelKey];
  if (!content || !modelPanel || !modelTitle || !modelCopy || !modelPoints || !modelLabel) return;
  modelLabel.textContent = content.label;
  modelTitle.textContent = content.title;
  modelCopy.textContent = content.copy;
  modelPoints.innerHTML = content.points.map((point) => "<li>" + point + "</li>").join("");
  modelPanel.classList.remove("is-changing");
  window.requestAnimationFrame(() => modelPanel.classList.add("is-changing"));
}

modelTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    modelTabs.forEach((item) => {
      item.classList.toggle("is-active", item === tab);
      item.setAttribute("aria-selected", String(item === tab));
    });
    renderModel(tab.dataset.model || "augment");
  });
});

const extraRevealElements = document.querySelectorAll(".experience-heading, .model-switcher, .model-panel, .stack-marquee");
if ("IntersectionObserver" in window) {
  const extraRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        extraRevealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  extraRevealElements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--delay", Math.min(index * 55, 220) + "ms");
    extraRevealObserver.observe(element);
  });
} else {
  extraRevealElements.forEach((element) => element.classList.add("is-visible"));
}


const testimonialItems = document.querySelectorAll(".testimonial-card, .testimonial-heading");
if ("IntersectionObserver" in window) {
  const testimonialObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        testimonialObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  testimonialItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--delay", Math.min(index * 65, 220) + "ms");
    testimonialObserver.observe(item);
  });
} else {
  testimonialItems.forEach((item) => item.classList.add("is-visible"));
}
