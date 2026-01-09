/* =========================
   SOURCE PAGE TRACKING
   - Fills <input id="source_page"> if present (contact/quote form)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const src = document.getElementById("source_page");
  if (src) src.value = window.location.href;
});

/* =========================
   GLOBAL UTILITIES
========================= */

// Footer year (works on any page that has <span id="year"></span>)
(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* =========================
   CLICK TRACKING (GA if present)
   - Tracks buttons/links with data-track + data-label
========================= */
(() => {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;

    const type = el.getAttribute("data-track");
    const label =
      el.getAttribute("data-label") ||
      (el.textContent || "").trim().slice(0, 60);

    if (window.gtag) {
      gtag("event", type === "phone" ? "phone_click" : "cta_click", {
        event_category: "engagement",
        event_label: label,
      });
    }
  });
})();

/* =========================
   NAV (mobile)
========================= */
(() => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  // Close menu after clicking a nav link (mobile UX)
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
})();

/* =========================
   GALLERY CATEGORY JUMP (searchable dropdown)
   - Works only on pages with #galleryJump
   - Enter key works
   - "Go" button calls goToGalleryCategory()
   IMPORTANT: category pages are ROOT files
========================= */
function goToGalleryCategory() {
  const input = document.getElementById("galleryJump");
  if (!input) return;

  const raw = (input.value || "").trim();
  if (!raw) return;

  // 1) If they picked an option from the datalist, use its data-href
  const listId = input.getAttribute("list");
  const datalist = listId ? document.getElementById(listId) : null;

  if (datalist) {
    const option = Array.from(datalist.options).find(
      (o) => (o.value || "").trim().toLowerCase() === raw.toLowerCase()
    );
    const href = option?.dataset?.href;
    if (href) {
      window.location.href = href;
      return;
    }
  }

  // 2) Fallback: normalize input and use a map (supports partial typing)
  const key = raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’'"]/g, "");

  // ✅ ROOT-LEVEL FILES (leading slash = safe from any page)
  const map = {
    // Bathrooms
    bathrooms: "/bathroom.html",
    bathroom: "/bathroom.html",
    bath: "/bathroom.html",

    // Kitchen
    kitchen: "/kitchen.html",

    // Livingroom
    livingroom: "/livingroom.html",
    "living room": "/livingroom.html",

    // Custom Beam Wrapping
    "custom beam wrapping": "/custom-beam-wrapping.html",
    "beam wrapping": "/custom-beam-wrapping.html",
    beams: "/custom-beam-wrapping.html",
    beam: "/custom-beam-wrapping.html",

    // Custom Made
    "custom made": "/custom-made.html",
    custom: "/custom-made.html",
    furniture: "/custom-made.html",

    // Custom Rooms / Accent Walls
    "custom rooms / accent walls": "/custom-room-accent-walls.html",
    "custom rooms": "/custom-room-accent-walls.html",
    "accent walls": "/custom-room-accent-walls.html",
    "accent wall": "/custom-room-accent-walls.html",
    "feature wall": "/custom-room-accent-walls.html",
    "feature walls": "/custom-room-accent-walls.html",

    // Decks / Roofs
    "decks / roofs": "/decks-roofs.html",
    decks: "/decks-roofs.html",
    deck: "/decks-roofs.html",
    roofs: "/decks-roofs.html",
    roof: "/decks-roofs.html",

    // Door Installations
    "door installations": "/door-installations.html",
    doors: "/door-installations.html",
    door: "/door-installations.html",

    // Floors / Trim
    "floors / baseboards / trim": "/floors-trim.html",
    "floors / trim": "/floors-trim.html",
    floors: "/floors-trim.html",
    floor: "/floors-trim.html",
    baseboards: "/floors-trim.html",
    baseboard: "/floors-trim.html",
    trim: "/floors-trim.html",
    molding: "/floors-trim.html",

    // Outdoor Space
    "outdoor space": "/outdoor-space.html",
    outdoor: "/outdoor-space.html",
    pergola: "/outdoor-space.html",
    pergolas: "/outdoor-space.html",
    porch: "/outdoor-space.html",
    porches: "/outdoor-space.html",

    // Shelves / Closets
    "shelves / closets": "/shelves-closets.html",
    shelves: "/shelves-closets.html",
    shelf: "/shelves-closets.html",
    closets: "/shelves-closets.html",
    closet: "/shelves-closets.html",
    storage: "/shelves-closets.html",
  };

  // Exact match
  if (map[key]) {
    window.location.href = map[key];
    return;
  }

  // Partial match
  const found = Object.keys(map).find((k) => k.includes(key));
  if (found) {
    window.location.href = map[found];
    return;
  }

  alert("No match found. Try: Bathrooms, Kitchen, Livingroom, Decks, Trim…");
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("galleryJump");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToGalleryCategory();
    }
  });
});

/* =========================
   STORE PAGE
   - Category dropdown filtering
   - Placeholder products w/ buy links
   - Personalization request via Formspree (no backend)
   - Selected product sync
   - Client-side success message (optional)
========================= */
(() => {
  const storeRoot = document.querySelector("[data-store-root]");
  if (!storeRoot) return;

  const categorySelect = document.querySelector("#storeCategory");
  const productsEl = document.querySelector("#products");

  const personalizeToggle = document.querySelector("#personalizeToggle");
  const personalizationWrap = document.querySelector("#personalizationWrap");

  const personalizationText = document.querySelector("#personalizationText");
  const hiddenProductId = document.querySelector("#selectedProductId");
  const selectedProductName = document.querySelector("#selectedProductName");

  const personalizeForm = document.querySelector("#personalizeForm");
  const successBox = document.querySelector("#personalizeSuccess");

  // Replace buyUrl with Stripe Payment Links or PayPal hosted checkout URLs
  const PRODUCTS = [
    // Cutting Boards
    { id: "cb-maple-endgrain", name: "Maple End-Grain Cutting Board", price: 120, category: "Cutting Boards", buyUrl: "https://example.com/stripe-link-maple" },
    { id: "cb-walnut-chef", name: "Walnut Chef Board (Juice Groove)", price: 145, category: "Cutting Boards", buyUrl: "https://example.com/stripe-link-walnut" },
    { id: "cb-mixed-wood", name: "Mixed Hardwood Board", price: 95, category: "Cutting Boards", buyUrl: "https://example.com/stripe-link-mixed" },

    // Serving / Charcuterie
    { id: "sv-charcuterie", name: "Charcuterie / Serving Board", price: 85, category: "Serving Boards", buyUrl: "https://example.com/stripe-link-charcuterie" },
    { id: "sv-pizza-peel", name: "Wood Pizza Peel", price: 60, category: "Serving Boards", buyUrl: "https://example.com/stripe-link-peel" },

    // Home Goods
    { id: "hg-coasters", name: "Handmade Coasters (Set of 4)", price: 28, category: "Home Goods", buyUrl: "https://example.com/stripe-link-coasters" },
    { id: "hg-shelf", name: "Floating Shelf", price: 75, category: "Home Goods", buyUrl: "https://example.com/stripe-link-shelf" },

    // Gifts
    { id: "gf-engraved-keepsake", name: "Engraved Keepsake Box", price: 55, category: "Gifts", buyUrl: "https://example.com/stripe-link-box" },
    { id: "gf-name-plaque", name: "Custom Name Plaque", price: 45, category: "Gifts", buyUrl: "https://example.com/stripe-link-plaque" },

    // Other
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
              <a class="btn btn-primary" href="${p.buyUrl}" target="_blank" rel="noopener">Buy</a>
              <button class="btn btn-ghost" type="button" data-personalize="${p.id}">Personalize</button>
            </div>

            <div class="small">
              If you want engraving, click <strong>Personalize</strong> (after purchase, submit the text below).
            </div>
          </div>
        </div>
      `
      )
      .join("");

    productsEl.querySelectorAll("[data-personalize]").forEach((btn) => {
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
      if (successBox) {
        successBox.classList.add("open");
        successBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
})();

/* =========================
   GALLERY LIGHTBOX
   - Works on any page that has images with [data-lightbox-img]
========================= */
(() => {
  const galleryImages = document.querySelectorAll("[data-lightbox-img]");
  if (!galleryImages.length) return;

  let lightbox = document.querySelector("#lightbox");

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

  const imgEl = lightbox.querySelector("#lightboxImage");
  const capEl = lightbox.querySelector("#lightboxCaption");
  const btnClose = lightbox.querySelector("#lightboxClose");
  const btnPrev = lightbox.querySelector("#lightboxPrev");
  const btnNext = lightbox.querySelector("#lightboxNext");

  const imgs = Array.from(galleryImages);
  let idx = 0;

  function openAt(i) {
    idx = i;
    const img = imgs[idx];
    imgEl.src = img.getAttribute("data-full") || img.src;
    imgEl.alt = img.alt || "Gallery image";
    capEl.textContent = img.alt || "";
    lightbox.classList.add("open");
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
})();

/* =========================
   CONTACT FORM (Formspree)
   - AJAX submit
   - Tracks GA event (if present)
   - Redirects to thank-you page on success
   - Disable button while sending
========================= */
(() => {
  const quoteForm = document.getElementById("quote-form");
  if (!quoteForm) return;

  // Resolves correctly whether you're on a custom domain OR GitHub Pages project URL.
  const THANK_YOU_URL = new URL("thank-you.html", window.location.href);

  const quoteSubmit = document.getElementById("quote-submit");

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
        if (window.gtag) {
          gtag("event", "quote_request_submit", {
            event_category: "lead",
            event_label: "quote_form",
          });
        }

        window.location.assign(THANK_YOU_URL.toString());
        return;
      } else {
        let msg = "Something went wrong. Please try again.";
        try {
          const data = await res.json();
          if (data?.errors?.length) msg = data.errors.map((x) => x.message).join("\n");
        } catch (_) {}
        alert(msg);
      }
    } catch (err) {
      alert("Network error. Please check your connection and try again.");
    } finally {
      if (quoteSubmit) {
        quoteSubmit.disabled = false;
        quoteSubmit.textContent = "Send Request";
      }
    }
  });
})();
