"use strict";

(() => {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");

  if (!form || !status) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const discord = String(formData.get("discord") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (name.length < 2 || discord.length < 2 || !type || message.length < 10) {
        status.style.color = "var(--danger-color)";
        status.textContent = "Completa todos los campos correctamente.";
        return;
      }

      status.style.color = "var(--success-color)";
      status.textContent = "Formulario validado. Conéctalo a tu backend o Discord webhook.";
      form.reset();
    } catch (error) {
      status.style.color = "var(--danger-color)";
      status.textContent = "No se pudo procesar el formulario.";
      console.error("Contact form error:", error);
    }
  });
})();
