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

if (navTargets.length && "IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });
  navTargets.forEach((target) => navObserver.observe(target));
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
