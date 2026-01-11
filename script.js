/* =========================================================
   Kingdom Woodcraft — script.js (clean + fixed)
   - Safe initialization
   - GA event helpers
   - Click tracking via data-track/data-label
   - Nav toggle (mobile)
   - Gallery jump dropdown
   - Store rendering + personalization + optional success UI
   - Gallery lightbox
   - Quote/Contact form (Formspree) AJAX submit + GA + thank-you redirect
========================================================= */

(() => {
  "use strict";

  /* =========================
     Helpers
  ========================= */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // GA helper (no errors if GA not loaded)
  function track(eventName, params = {}) {
    if (!window.gtag) return;
    window.gtag("event", eventName, params);
  }

  // Normalize label for tracking
  function cleanLabel(str) {
    return (str || "")
      .toString()
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 60);
  }

  /* =========================
     DOM Ready
  ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    // 1) SOURCE PAGE → fills hidden input if present
    const src = $("#source_page");
    if (src) src.value = window.location.href;

    // 2) Footer year
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 3) Global click tracking (data-track + data-label)
    initClickTracking();

    // 4) Mobile nav
    initMobileNav();

    // 5) Gallery jump
    initGalleryJump();

    // 6) Store page
    initStorePage();

    // 7) Lightbox
    initLightbox();

    // 8) Quote form
    initQuoteForm();
  });

  /* =========================
     CLICK TRACKING
     - Tracks any element with [data-track]
     - data-label optional; falls back to element text
     - Special case: data-track="phone" -> phone_click
  ========================= */
  function initClickTracking() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-track]");
      if (!el) return;

      const type = (el.getAttribute("data-track") || "").trim();
      const label =
        el.getAttribute("data-label") ||
        cleanLabel(el.getAttribute("aria-label")) ||
        cleanLabel(el.textContent);

      // Map events
      if (type === "phone") {
        track("phone_click", {
          event_category: "engagement",
          event_label: label || "phone",
        });
        return;
      }

      // Default CTA click
      track("cta_click", {
        event_category: "engagement",
        event_label: label || type || "cta",
      });
    });
  }

  /* =========================
     NAV (mobile)
  ========================= */
  function initMobileNav() {
    const toggle = $("[data-nav-toggle]");
    const links = $("[data-nav-links]");
    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });

    $$("a", links).forEach((a) => {
      a.addEventListener("click", () => links.classList.remove("open"));
    });
  }

  /* =========================
     GALLERY CATEGORY JUMP
     - Works only on pages with #galleryJump
     - Enter key supported
     - Root-level pages with leading slash
  ========================= */
  function initGalleryJump() {
    const input = $("#galleryJump");
    if (!input) return;

    function goToGalleryCategory() {
      const raw = (input.value || "").trim();
      if (!raw) return;

      // 1) If they picked from datalist, use data-href
      const listId = input.getAttribute("list");
      const datalist = listId ? document.getElementById(listId) : null;

      if (datalist) {
        const option = Array.from(datalist.options).find(
          (o) => (o.value || "").trim().toLowerCase() === raw.toLowerCase()
        );
        const href = option?.dataset?.href;
        if (href) {
          track("gallery_jump", {
            event_category: "navigation",
            event_label: cleanLabel(raw),
          });
          window.location.href = href;
          return;
        }
      }

      // 2) Fallback normalize + map
      const key = raw
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[’'"]/g, "");

      const map = {
        bathrooms: "/bathroom.html",
        bathroom: "/bathroom.html",
        bath: "/bathroom.html",

        kitchen: "/kitchen.html",

        livingroom: "/livingroom.html",
        "living room": "/livingroom.html",

        "custom beam wrapping": "/custom-beam-wrapping.html",
        "beam wrapping": "/custom-beam-wrapping.html",
        beams: "/custom-beam-wrapping.html",
        beam: "/custom-beam-wrapping.html",

        "custom made": "/custom-made.html",
        custom: "/custom-made.html",
        furniture: "/custom-made.html",

        "custom rooms / accent walls": "/custom-room-accent-walls.html",
        "custom rooms": "/custom-room-accent-walls.html",
        "accent walls": "/custom-room-accent-walls.html",
        "accent wall": "/custom-room-accent-walls.html",
        "feature wall": "/custom-room-accent-walls.html",
        "feature walls": "/custom-room-accent-walls.html",

        "decks / roofs": "/decks-roofs.html",
        decks: "/decks-roofs.html",
        deck: "/decks-roofs.html",
        roofs: "/decks-roofs.html",
        roof: "/decks-roofs.html",

        "door installations": "/door-installations.html",
        doors: "/door-installations.html",
        door: "/door-installations.html",

        "floors / baseboards / trim": "/floors-trim.html",
        "floors / trim": "/floors-trim.html",
        floors: "/floors-trim.html",
        floor: "/floors-trim.html",
        baseboards: "/floors-trim.html",
        baseboard: "/floors-trim.html",
        trim: "/floors-trim.html",
        molding: "/floors-trim.html",

        "outdoor space": "/outdoor-space.html",
        outdoor: "/outdoor-space.html",
        pergola: "/outdoor-space.html",
        pergolas: "/outdoor-space.html",
        porch: "/outdoor-space.html",
        porches: "/outdoor-space.html",

        "shelves / closets": "/shelves-closets.html",
        shelves: "/shelves-closets.html",
        shelf: "/shelves-closets.html",
        closets: "/shelves-closets.html",
        closet: "/shelves-closets.html",
        storage: "/shelves-closets.html",
      };

      if (map[key]) {
        track("gallery_jump", {
          event_category: "navigation",
          event_label: cleanLabel(raw),
        });
        window.location.href = map[key];
        return;
      }

      const found = Object.keys(map).find((k) => k.includes(key));
      if (found) {
        track("gallery_jump", {
          event_category: "navigation",
          event_label: cleanLabel(raw),
        });
        window.location.href = map[found];
        return;
      }

      alert("No match found. Try: Bathrooms, Kitchen, Livingroom, Decks, Trim…");
    }

    // Enter to go
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goToGalleryCategory();
      }
    });

    // Optional: if you have a "Go" button calling global function, expose it.
    window.goToGalleryCategory = goToGalleryCategory;
  }

  /* =========================
     STORE PAGE
     - Requires [data-store-root]
     - Renders PRODUCTS
     - Tracks buy + personalize clicks
     - Optional success box
  ========================= */
  function initStorePage() {
    const storeRoot = $("[data-store-root]");
    if (!storeRoot) return;

    const categorySelect = $("#storeCategory");
    const productsEl = $("#products");

    const personalizeToggle = $("#personalizeToggle");
    const personalizationWrap = $("#personalizationWrap");

    const personalizationText = $("#personalizationText");
    const hiddenProductId = $("#selectedProductId");
    const selectedProductName = $("#selectedProductName");

    const personalizeForm = $("#personalizeForm");
    const successBox = $("#personalizeSuccess");

    // Replace buyUrl with Stripe Payment Links or PayPal checkout URLs
    const PRODUCTS = [
      { id: "cb-maple-endgrain", name: "Maple End-Grain Cutting Board", price: 120, category: "Cutting Boards", buyUrl: "https://example.com/stripe-link-maple" },
      { id: "cb-walnut-chef", name: "Walnut Chef Board (Juice Groove)", price: 145, category: "Cutting Boards", buyUrl: "https://example.com/stripe-link-walnut" },
      { id: "cb-mixed-wood", name: "Mixed Hardwood Board", price: 95, category: "Cutting Boards", buyUrl: "https://example.com/stripe-link-mixed" },

      { id: "sv-charcuterie", name: "Charcuterie / Serving Board", price: 85, category: "Serving Boards", buyUrl: "https://example.com/stripe-link-charcuterie" },
      { id: "sv-pizza-peel", name: "Wood Pizza Peel", price: 60, category: "Serving Boards", buyUrl: "https://example.com/stripe-link-peel" },

      { id: "hg-coasters", name: "Handmade Coasters (Set of 4)", price: 28, category: "Home Goods", buyUrl: "https://example.com/stripe-link-coasters" },
      { id: "hg-shelf", name: "Floating Shelf", price: 75, category: "Home Goods", buyUrl: "https://example.com/stripe-link-shelf" },

      { id: "gf-engraved-keepsake", name: "Engraved Keepsake Box", price: 55, category: "Gifts", buyUrl: "https://example.com/stripe-link-box" },
      { id: "gf-name-plaque", name: "Custom Name Plaque", price: 45, category: "Gifts", buyUrl: "https://example.com/stripe-link-plaque" },

      { id: "ot-custom", name: "Custom Request (Deposit)", price: 50, category: "Other", buyUrl: "https://example.com/stripe-link-deposit" },
    ];

    function money(n) {
      return `$${Number(n).toFixed(2)}`;
    }

    function updatePersonalizeUI() {
      if (!personalizeToggle || !personalizationWrap) return;

      const show = !!personalizeToggle.checked;
      personalizationWrap.style.display = show ? "block" : "none";

      if (!show) {
        storeRoot.removeAttribute("data-selected-product");
        if (hiddenProductId) hiddenProductId.value = "";
        if (selectedProductName) selectedProductName.textContent = "None selected";
        if (successBox) successBox.classList.remove("open");
      }
    }

    function setSelectedProduct(productId) {
      const product = PRODUCTS.find((p) => p.id === productId);
      storeRoot.setAttribute("data-selected-product", productId);

      if (hiddenProductId) hiddenProductId.value = productId;
      if (selectedProductName) selectedProductName.textContent = product ? product.name : "Custom / not listed";

      if (personalizeToggle) personalizeToggle.checked = true;
      updatePersonalizeUI();

      track("store_personalize_click", {
        event_category: "store",
        event_label: product ? product.name : productId,
      });

      if (personalizationText) personalizationText.focus();
    }

    function render(category) {
      if (!productsEl) return;

      const list = !category || category === "All"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === category);

      productsEl.innerHTML = list
        .map(
          (p) => `
          <div class="product">
            <div class="img" aria-hidden="true"></div>

            <div class="body">
              <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start;">
                <div>
                  <h3 style="margin:0 0 .25rem;">${p.name}</h3>
                  <div class="muted">${p.category}</div>
                </div>
                <div class="price">${money(p.price)}</div>
              </div>

              <div style="margin:.8rem 0; display:flex; justify-content:center;">
                <span class="pill">Handmade • Built to last</span>
              </div>

              <div style="display:flex;gap:.6rem;flex-wrap:wrap; justify-content:center;">
                <a class="btn btn-primary"
                   href="${p.buyUrl}"
                   target="_blank"
                   rel="noopener"
                   data-store-buy="${p.id}">
                   Buy
                </a>
                <button class="btn btn-ghost"
                        type="button"
                        data-personalize="${p.id}">
                        Personalize
                </button>
              </div>

              <div class="small">
                If you want engraving, click <strong>Personalize</strong> (after purchase, submit the text below).
              </div>
            </div>
          </div>
        `
        )
        .join("");

      // Track Buy clicks
      $$("[data-store-buy]", productsEl).forEach((a) => {
        a.addEventListener("click", () => {
          const id = a.getAttribute("data-store-buy");
          const product = PRODUCTS.find((p) => p.id === id);
          track("store_buy_click", {
            event_category: "store",
            event_label: product ? product.name : id,
          });
        });
      });

      // Personalize buttons
      $$("[data-personalize]", productsEl).forEach((btn) => {
        btn.addEventListener("click", () => setSelectedProduct(btn.getAttribute("data-personalize")));
      });
    }

    if (categorySelect) categorySelect.addEventListener("change", () => render(categorySelect.value));
    if (personalizeToggle) personalizeToggle.addEventListener("change", updatePersonalizeUI);

    updatePersonalizeUI();
    render(categorySelect ? categorySelect.value : "All");

    // Optional client-side success UI (Formspree still handles the POST)
    if (personalizeForm) {
      personalizeForm.addEventListener("submit", () => {
        track("store_personalize_submit", {
          event_category: "store",
          event_label: storeRoot.getAttribute("data-selected-product") || "none",
        });

        if (successBox) {
          successBox.classList.add("open");
          successBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  /* =========================
     GALLERY LIGHTBOX
     - Images with [data-lightbox-img]
     - Optional data-full for full-size
     - Tracks opens
  ========================= */
  function initLightbox() {
    const galleryImages = $$("[data-lightbox-img]");
    if (!galleryImages.length) return;

    let lightbox = $("#lightbox");

    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.id = "lightbox";
      lightbox.className = "lightbox";
      lightbox.innerHTML = `
        <div class="lightbox-inner" role="dialog" aria-modal="true" aria-label="Image viewer">
          <div class="lightbox-bar">
            <div id="lightboxCaption" style="font-weight:900;"></div>
            <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
              <button class="lightbox-btn" type="button" id="lightboxPrev">Prev</button>
              <button class="lightbox-btn" type="button" id="lightboxNext">Next</button>
              <button class="lightbox-btn" type="button" id="lightboxClose">Close</button>
            </div>
          </div>
          <img id="lightboxImage" class="lightbox-img" alt="" />
        </div>
      `;
      document.body.appendChild(lightbox);
    }

    const imgEl = $("#lightboxImage", lightbox);
    const capEl = $("#lightboxCaption", lightbox);
    const btnClose = $("#lightboxClose", lightbox);
    const btnPrev = $("#lightboxPrev", lightbox);
    const btnNext = $("#lightboxNext", lightbox);

    const imgs = galleryImages;
    let idx = 0;

    function openAt(i) {
      idx = i;
      const img = imgs[idx];
      const caption = img.alt || "";
      imgEl.src = img.getAttribute("data-full") || img.src;
      imgEl.alt = caption || "Gallery image";
      capEl.textContent = caption;
      lightbox.classList.add("open");

      track("gallery_lightbox_open", {
        event_category: "engagement",
        event_label: cleanLabel(caption || `image_${idx + 1}`),
      });
    }

    function close() {
      lightbox.classList.remove("open");
      imgEl.src = "";
    }

    function prev() {
      openAt((idx - 1 + imgs.length) % imgs.length);
    }

    function next() {
      openAt((idx + 1) % imgs.length);
    }

    imgs.forEach((img, i) => img.addEventListener("click", () => openAt(i)));

    if (btnClose) btnClose.addEventListener("click", close);
    if (btnPrev) btnPrev.addEventListener("click", prev);
    if (btnNext) btnNext.addEventListener("click", next);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });
  }

  /* =========================
     CONTACT/QUOTE FORM (Formspree)
     - AJAX submit
     - GA lead event
     - Redirect to thank-you.html
     - Disables submit button while sending
  ========================= */
  function initQuoteForm() {
    const quoteForm = $("#quote-form");
    if (!quoteForm) return;

    // Works for custom domain + GitHub Pages
    const THANK_YOU_URL = new URL("thank-you.html", window.location.href).toString();
    const quoteSubmit = $("#quote-submit");

    quoteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (quoteSubmit) {
        quoteSubmit.disabled = true;
        quoteSubmit.textContent = "Sending…";
      }

      try {
        const formData = new FormData(quoteForm);

        const res = await fetch(quoteForm.action, {
          method: quoteForm.method || "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          track("quote_request_submit", {
            event_category: "lead",
            event_label: "quote_form",
          });

          window.location.assign(THANK_YOU_URL);
          return;
        }

        // Formspree returns JSON errors sometimes
        let msg = "Something went wrong. Please try again.";
        try {
          const data = await res.json();
          if (data?.errors?.length) msg = data.errors.map((x) => x.message).join("\n");
        } catch (_) {}

        alert(msg);
      } catch (_) {
        alert("Network error. Please check your connection and try again.");
      } finally {
        if (quoteSubmit) {
          quoteSubmit.disabled = false;
          quoteSubmit.textContent = "Send Request";
        }
      }
    });
  }
})();
