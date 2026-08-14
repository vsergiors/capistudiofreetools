"use strict";

(() => {
  try {
    const header = document.querySelector("[data-header]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navMenu = document.querySelector("[data-nav-menu]");
    const year = document.querySelector("[data-year]");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    if (header) {
      const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
      };

      updateHeader();
      window.addEventListener("scroll", updateHeader, { passive: true });
    }

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    const revealElements = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.16 }
      );

      revealElements.forEach((element) => observer.observe(element));
    } else {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    }
  } catch (error) {
    console.error("Error inicializando CapiStudio Free Tools:", error);
  }
})();
