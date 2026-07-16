(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  var SECTION_ORDER = ["home", "about", "programs", "why-us", "admissions", "contact"];

  var track = document.getElementById("sectionsTrack");
  var sections = {};
  SECTION_ORDER.forEach(function (id) {
    sections[id] = document.getElementById(id);
  });

  var currentId = "home";

  function goToSection(targetId) {
    if (!sections[targetId] || targetId === currentId) return;

    var fromIndex = SECTION_ORDER.indexOf(currentId);
    var toIndex = SECTION_ORDER.indexOf(targetId);
    var movingForward = toIndex > fromIndex;

    var current = sections[currentId];
    var next = sections[targetId];

    next.classList.remove("slide-from-left", "slide-from-right");
    next.classList.add(movingForward ? "slide-from-right" : "slide-from-left");

    void next.offsetWidth;

    current.classList.remove("is-active");
    current.classList.add(movingForward ? "slide-from-left" : "slide-from-right");

    next.classList.add("is-active");
    next.classList.remove("slide-from-left", "slide-from-right");

    currentId = targetId;
    updateActiveNav(targetId);
    updateURLHash(targetId);
    resetSectionScroll(next);

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

  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var target = link.dataset.nav;
      goToSection(target);
      closeMobileNav();
    });
  });

  var initialHash = window.location.hash.replace("#", "");
  if (initialHash && sections[initialHash]) {
    sections.home.classList.remove("is-active");
    sections[initialHash].classList.add("is-active");
    currentId = initialHash;
    updateActiveNav(initialHash);
  }

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

  function checkRevealsInViewport(sectionEl) {
    var rectBox = sectionEl.getBoundingClientRect();
    sectionEl.querySelectorAll(".reveal").forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < rectBox.top + rectBox.height * 0.9) {
        el.classList.add("is-revealed");
      }
    });
  }

  SECTION_ORDER.forEach(function (id) {
    observeRevealTargets(sections[id]);
  });
  checkRevealsInViewport(sections[currentId]);

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

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      item.classList.toggle("is-open", !isOpen);
      question.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : null;
    });
  });

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

      successBox.classList.add("is-visible");
      contactForm.reset();
    });
  }

})();
