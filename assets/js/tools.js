"use strict";

(() => {
  const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
  const CLASS_PREFIX_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*$/;

  const getForm = (name) => document.querySelector(`[data-form="${name}"]`);
  const getOutput = (id) => document.getElementById(id);
  const getStatus = (name) => document.querySelector(`[data-status="${name}"]`);

  const setStatus = (name, message, isError = false) => {
    const status = getStatus(name);
    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? "var(--danger-color)" : "var(--success-color)";
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const sanitizeText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

  const isValidUrl = (value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  };

  const readRequired = (formData, key, maxLength) => {
    const value = sanitizeText(formData.get(key), maxLength);
    if (!value) {
      throw new Error(`El campo ${key} es obligatorio.`);
    }
    return value;
  };

  const writeOutput = (id, value) => {
    const output = getOutput(id);
    if (!output) {
      throw new Error(`No existe el output ${id}.`);
    }
    output.textContent = value;
  };

  const toJson = (value) => JSON.stringify(value, null, 2);

  const hexToDecimal = (hex) => parseInt(hex.replace("#", ""), 16);

  const setupEmbedGenerator = () => {
    const form = getForm("embed");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const title = readRequired(formData, "title", 256);
        const description = readRequired(formData, "description", 4000);
        const color = readRequired(formData, "color", 7);
        const image = sanitizeText(formData.get("image"), 500);
        const footer = sanitizeText(formData.get("footer"), 2048) || "CapiStudio Free Tools";

        if (!HEX_COLOR_REGEX.test(color)) {
          throw new Error("El color debe tener formato HEX válido, por ejemplo #9c5723.");
        }

        if (!isValidUrl(image)) {
          throw new Error("La URL de imagen no es válida.");
        }

        const embed = {
          embeds: [
            {
              title,
              description,
              color: hexToDecimal(color),
              footer: { text: footer },
              timestamp: new Date().toISOString(),
              ...(image ? { image: { url: image } } : {})
            }
          ]
        };

        writeOutput("embed-output", toJson(embed));

        const preview = document.querySelector("[data-embed-preview]");
        if (preview) {
          preview.style.borderLeftColor = color;
          preview.innerHTML = `
            <strong>Vista previa</strong>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
            ${image ? `<img src="${escapeHtml(image)}" alt="Imagen del embed" loading="lazy" />` : ""}
            <small>${escapeHtml(footer)}</small>
          `;
        }

        setStatus("embed", "Embed generado correctamente.");
      } catch (error) {
        setStatus("embed", error.message || "Error generando embed.", true);
      }
    });
  };

  const setupConfigGenerator = () => {
    const form = getForm("config");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const project = readRequired(formData, "project", 64);
        const format = readRequired(formData, "format", 10);
        const prefix = readRequired(formData, "prefix", 8);
        const database = readRequired(formData, "database", 24);
        const port = Number(formData.get("port"));

        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error("El puerto debe estar entre 1 y 65535.");
        }

        const config = {
          app: {
            name: project,
            environment: "production",
            port
          },
          bot: {
            prefix,
            token: "CHANGE_ME_SECURE_TOKEN"
          },
          database: {
            provider: database,
            url: "CHANGE_ME_DATABASE_URL"
          },
          security: {
            rateLimit: true,
            sanitizeInputs: true
          }
        };

        const output = {
          json: () => toJson(config),
          yaml: () => `app:\n  name: ${project}\n  environment: production\n  port: ${port}\nbot:\n  prefix: "${prefix}"\n  token: CHANGE_ME_SECURE_TOKEN\ndatabase:\n  provider: ${database}\n  url: CHANGE_ME_DATABASE_URL\nsecurity:\n  rateLimit: true\n  sanitizeInputs: true`,
          env: () => `APP_NAME=${project}\nNODE_ENV=production\nPORT=${port}\nBOT_PREFIX=${prefix}\nBOT_TOKEN=CHANGE_ME_SECURE_TOKEN\nDATABASE_PROVIDER=${database}\nDATABASE_URL=CHANGE_ME_DATABASE_URL\nRATE_LIMIT=true\nSANITIZE_INPUTS=true`
        };

        if (!output[format]) {
          throw new Error("Formato no soportado.");
        }

        writeOutput("config-output", output[format]());
        setStatus("config", "Configuración generada correctamente.");
      } catch (error) {
        setStatus("config", error.message || "Error generando configuración.", true);
      }
    });
  };

  const setupDiscordTools = () => {
    const form = getForm("discord");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const username = readRequired(formData, "username", 80);
        const content = readRequired(formData, "content", 2000);
        const avatar = sanitizeText(formData.get("avatar"), 500);

        if (!isValidUrl(avatar)) {
          throw new Error("La URL del avatar no es válida.");
        }

        const permissions = formData.getAll("permission")
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);

        const permissionInteger = permissions.reduce((total, current) => total + current, 0);
        const payload = {
          username,
          content,
          allowed_mentions: { parse: [] },
          ...(avatar ? { avatar_url: avatar } : {})
        };

        const permissionOutput = document.querySelector("[data-permission-output]");
        if (permissionOutput) {
          permissionOutput.textContent = String(permissionInteger);
        }

        writeOutput("discord-output", toJson(payload));
        setStatus("discord", "Payload de Discord generado correctamente.");
      } catch (error) {
        setStatus("discord", error.message || "Error generando payload.", true);
      }
    });
  };

  const setupMinecraftResources = () => {
    const form = getForm("minecraft");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const motd = readRequired(formData, "motd", 120);
        const gamemode = readRequired(formData, "gamemode", 16);
        const difficulty = readRequired(formData, "difficulty", 16);
        const maxPlayers = Number(formData.get("maxPlayers"));
        const serverPort = Number(formData.get("serverPort"));

        if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 500) {
          throw new Error("Los jugadores máximos deben estar entre 1 y 500.");
        }

        if (!Number.isInteger(serverPort) || serverPort < 1 || serverPort > 65535) {
          throw new Error("El puerto debe estar entre 1 y 65535.");
        }

        const properties = [
          `motd=${motd}`,
          `gamemode=${gamemode}`,
          `difficulty=${difficulty}`,
          `max-players=${maxPlayers}`,
          `server-port=${serverPort}`,
          "online-mode=true",
          "enable-command-block=false",
          "spawn-protection=16",
          "view-distance=10",
          "simulation-distance=10"
        ].join("\n");

        writeOutput("minecraft-output", properties);
        setStatus("minecraft", "server.properties generado correctamente.");
      } catch (error) {
        setStatus("minecraft", error.message || "Error generando recurso de Minecraft.", true);
      }
    });
  };

  const setupTemplateGenerator = () => {
    const form = getForm("template");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const templateType = readRequired(formData, "templateType", 24);
        const brand = readRequired(formData, "brand", 48);
        const color = readRequired(formData, "templateColor", 7);

        if (!HEX_COLOR_REGEX.test(color)) {
          throw new Error("El color debe tener formato HEX válido.");
        }

        const safeBrand = escapeHtml(brand);
        const templates = {
          landing: `<!doctype html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${safeBrand}</title>\n  <style>\n    body { margin: 0; font-family: system-ui; background: #111; color: #fff; }\n    .hero { min-height: 100vh; display: grid; place-items: center; text-align: center; padding: 32px; }\n    .btn { display: inline-block; padding: 14px 22px; border-radius: 999px; background: ${color}; color: #fff; text-decoration: none; font-weight: 800; }\n  </style>\n</head>\n<body>\n  <main class="hero">\n    <section>\n      <h1>${safeBrand}</h1>\n      <p>Landing page moderna lista para editar.</p>\n      <a class="btn" href="#">Empezar</a>\n    </section>\n  </main>\n</body>\n</html>`,
          card: `<article class="product-card">\n  <h3>${safeBrand}</h3>\n  <p>Producto destacado con diseño limpio.</p>\n  <a href="#">Ver más</a>\n</article>\n\n<style>\n.product-card { padding: 24px; border-radius: 18px; background: #18181d; color: #fff; border: 1px solid rgba(255,255,255,.1); }\n.product-card a { color: ${color}; font-weight: 800; }\n</style>`,
          navbar: `<header class="navbar">\n  <a href="#" class="brand">${safeBrand}</a>\n  <nav>\n    <a href="#">Inicio</a>\n    <a href="#">Servicios</a>\n    <a href="#">Contacto</a>\n  </nav>\n</header>\n\n<style>\n.navbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 32px; background: #111; color: #fff; }\n.navbar a { color: inherit; text-decoration: none; font-weight: 800; }\n.navbar nav { display: flex; gap: 18px; }\n.brand { color: ${color} !important; }\n</style>`
        };

        if (!templates[templateType]) {
          throw new Error("Plantilla no soportada.");
        }

        writeOutput("template-output", templates[templateType]);
        setStatus("template", "Template generado correctamente.");
      } catch (error) {
        setStatus("template", error.message || "Error generando template.", true);
      }
    });
  };

  const setupPluginGenerator = () => {
    const form = getForm("plugin");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const pluginType = readRequired(formData, "pluginType", 24);
        const classPrefix = readRequired(formData, "classPrefix", 24);

        if (!CLASS_PREFIX_REGEX.test(classPrefix)) {
          throw new Error("El prefijo solo puede usar letras, números y guiones, empezando por una letra.");
        }

        const snippets = {
          copy: `document.querySelectorAll("[data-${classPrefix}-copy]").forEach((button) => {\n  button.addEventListener("click", async () => {\n    try {\n      const target = document.querySelector(button.dataset.${classPrefix}Copy);\n      if (!target) throw new Error("Target no encontrado");\n      await navigator.clipboard.writeText(target.textContent.trim());\n      button.textContent = "Copiado";\n    } catch (error) {\n      console.error("Error copiando:", error);\n    }\n  });\n});`,
          accordion: `document.querySelectorAll(".${classPrefix}-accordion__button").forEach((button) => {\n  button.addEventListener("click", () => {\n    const panel = document.getElementById(button.getAttribute("aria-controls"));\n    const isOpen = button.getAttribute("aria-expanded") === "true";\n    button.setAttribute("aria-expanded", String(!isOpen));\n    if (panel) panel.hidden = isOpen;\n  });\n});`,
          cookie: `const banner = document.querySelector(".${classPrefix}-cookie");\nconst accept = document.querySelector(".${classPrefix}-cookie__accept");\nif (banner && localStorage.getItem("${classPrefix}-cookies") !== "accepted") {\n  banner.hidden = false;\n}\nif (accept) {\n  accept.addEventListener("click", () => {\n    localStorage.setItem("${classPrefix}-cookies", "accepted");\n    if (banner) banner.hidden = true;\n  });\n}`
        };

        if (!snippets[pluginType]) {
          throw new Error("Plugin no soportado.");
        }

        writeOutput("plugin-output", snippets[pluginType]);
        setStatus("plugin", "Plugin generado correctamente.");
      } catch (error) {
        setStatus("plugin", error.message || "Error generando plugin.", true);
      }
    });
  };

  const setupCopyButtons = () => {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", async () => {
        const targetId = button.getAttribute("data-copy-target");
        const target = targetId ? getOutput(targetId) : null;

        try {
          if (!target) {
            throw new Error("No se encontró el contenido a copiar.");
          }

          await navigator.clipboard.writeText(target.textContent || "");
          const originalText = button.textContent;
          button.textContent = "Copiado";
          window.setTimeout(() => {
            button.textContent = originalText;
          }, 1400);
        } catch (error) {
          console.error("Error copiando al portapapeles:", error);
          button.textContent = "Error";
        }
      });
    });
  };

  try {
    setupEmbedGenerator();
    setupConfigGenerator();
    setupDiscordTools();
    setupMinecraftResources();
    setupTemplateGenerator();
    setupPluginGenerator();
    setupCopyButtons();
  } catch (error) {
    console.error("Error inicializando tools:", error);
  }
})();
