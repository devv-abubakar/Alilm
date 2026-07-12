/* =========================================================================
   AL-ILM SCIENCE ACADEMY — SCRIPT
   Handles:
   1) Section "slide/slip" routing between nav-linked pages
   2) Mobile hamburger menu
   3) Scroll-triggered reveal animations (IntersectionObserver)
   ========================================================================= */

(function () {
  "use strict";

  // Progressive enhancement flag: reveal animations are only applied
  // once we know JS is running (see .js-ready rules in style.css).
  document.documentElement.classList.add("js-ready");

  // Ordered list of section ids — order determines slide direction
  var SECTION_ORDER = ["home", "about", "programs", "why-us", "admissions", "contact"];

  var track = document.getElementById("sectionsTrack");
  var sections = {};
  SECTION_ORDER.forEach(function (id) {
    sections[id] = document.getElementById(id);
  });

  var currentId = "home";

  /**
   * Switch the visible section with a directional slide.
   * @param {string} targetId - id of the section to activate
   */
  function goToSection(targetId) {
    if (!sections[targetId] || targetId === currentId) return;

    var fromIndex = SECTION_ORDER.indexOf(currentId);
    var toIndex = SECTION_ORDER.indexOf(targetId);
    var movingForward = toIndex > fromIndex;

    var current = sections[currentId];
    var next = sections[targetId];

    // Position the incoming section on the correct side before revealing it
    next.classList.remove("slide-from-left", "slide-from-right");
    next.classList.add(movingForward ? "slide-from-right" : "slide-from-left");

    // Force reflow so the browser registers the starting position
    // before we animate to the active (centered) state.
    void next.offsetWidth;

    // Outgoing section exits toward the opposite side
    current.classList.remove("is-active");
    current.classList.add(movingForward ? "slide-from-left" : "slide-from-right");

    // Incoming section becomes active (animates to translateX(0))
    next.classList.add("is-active");
    next.classList.remove("slide-from-left", "slide-from-right");

    currentId = targetId;
    updateActiveNav(targetId);
    updateURLHash(targetId);
    resetSectionScroll(next);

    // Re-trigger reveal animations for elements already in view on the new page
    requestAnimationFrame(function () {
      observeRevealTargets(next);
      checkRevealsInViewport(next);
    });
  }

  function resetSectionScroll(sectionEl) {
    var scrollBox = sectionEl.querySelector(".section-scroll");
    if (scrollBox) scrollBox.scrollTop = 0;
  }

  function updateActiveNav(targetId) {
    document.querySelectorAll(".nav-link").forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.nav === targetId);
    });
  }

  function updateURLHash(targetId) {
    history.replaceState(null, "", "#" + targetId);
  }

  // Wire up every nav link (desktop + mobile + in-page CTAs)
  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var target = link.dataset.nav;
      goToSection(target);
      closeMobileNav();
    });
  });

  // Support direct linking via URL hash (e.g. shared link to #programs)
  var initialHash = window.location.hash.replace("#", "");
  if (initialHash && sections[initialHash]) {
    // Jump instantly on load (no slide) to the requested section
    sections.home.classList.remove("is-active");
    sections[initialHash].classList.add("is-active");
    currentId = initialHash;
    updateActiveNav(initialHash);
  }

  /* ---------------------------------------------------------------------
     Mobile hamburger menu
     --------------------------------------------------------------------- */
  var hamburgerBtn = document.getElementById("hamburgerBtn");
  var mobileNav = document.getElementById("mobileNav");

  function closeMobileNav() {
    hamburgerBtn.classList.remove("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
  }

  hamburgerBtn.addEventListener("click", function () {
    var isOpen = hamburgerBtn.classList.toggle("is-open");
    hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    mobileNav.classList.toggle("is-open", isOpen);
  });

  /* ---------------------------------------------------------------------
     Scroll-reveal animations
     Each .page-section scrolls internally, so we observe against that
     section's own scroll container rather than the window.
     --------------------------------------------------------------------- */
  var observers = new WeakMap();

  function observeRevealTargets(sectionEl) {
    var scrollBox = sectionEl.querySelector(".section-scroll");
    if (!scrollBox || observers.has(sectionEl)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: scrollBox, threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );

    sectionEl.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });

    observers.set(sectionEl, observer);
  }

  // Fallback: immediately reveal anything already visible without waiting
  // for a scroll event (covers the very first section on page load).
  function checkRevealsInViewport(sectionEl) {
    var rectBox = sectionEl.getBoundingClientRect();
    sectionEl.querySelectorAll(".reveal").forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < rectBox.top + rectBox.height * 0.9) {
        el.classList.add("is-revealed");
      }
    });
  }

  // Initialise reveal observers for every section up front so scrolling
  // within any section (not just the active one) works once visited.
  SECTION_ORDER.forEach(function (id) {
    observeRevealTargets(sections[id]);
  });
  checkRevealsInViewport(sections[currentId]);

  /* ---------------------------------------------------------------------
     Header shrink-on-scroll (subtle elevation change)
     --------------------------------------------------------------------- */
  var header = document.getElementById("siteHeader");
  Object.keys(sections).forEach(function (id) {
    var scrollBox = sections[id].querySelector(".section-scroll");
    if (!scrollBox) return;
    scrollBox.addEventListener("scroll", function () {
      header.style.boxShadow = scrollBox.scrollTop > 10
        ? "0 8px 24px -12px rgba(20,27,52,.25)"
        : "none";
    });
  });

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     FAQ accordion (Home preview + Admissions full list)
     --------------------------------------------------------------------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");

      // Close this item if already open, otherwise open it.
      item.classList.toggle("is-open", !isOpen);
      question.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : null;
    });
  });

  /* ---------------------------------------------------------------------
     Contact form — client-side validation + simulated submission.
     NOTE: This does not send data anywhere yet. Replace the "TODO" block
     below with a fetch() call to your backend or email service (e.g. a
     serverless function, Formspree, or your own API) before going live.
     --------------------------------------------------------------------- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    var successBox = document.getElementById("formSuccess");

    var validators = {
      name: function (value) { return value.trim().length >= 2 ? "" : "Please enter your full name."; },
      phone: function (value) { return /^[0-9+\-\s]{7,15}$/.test(value.trim()) ? "" : "Please enter a valid phone number."; },
      email: function (value) { return value.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Please enter a valid email address."; },
      program: function (value) { return value ? "" : "Please choose a program."; },
      message: function (value) { return value.trim().length >= 10 ? "" : "Please add a few more details (10+ characters)."; }
    };

    function showFieldError(fieldName, message) {
      var field = contactForm.elements[fieldName];
      var errorEl = contactForm.querySelector('[data-error-for="cf-' + fieldName + '"]');
      var wrapper = field.closest(".form-field");
      if (errorEl) errorEl.textContent = message;
      if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      successBox.classList.remove("is-visible");

      var isValid = true;
      Object.keys(validators).forEach(function (fieldName) {
        var field = contactForm.elements[fieldName];
        var message = validators[fieldName](field.value);
        showFieldError(fieldName, message);
        if (message) isValid = false;
      });

      if (!isValid) return;

      // TODO: replace this block with a real submission, e.g.:
      // fetch("https://your-backend.example.com/contact", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
      // });

      successBox.classList.add("is-visible");
      contactForm.reset();
    });
  }

})();
