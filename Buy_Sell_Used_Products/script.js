const initialProducts = [
  {id:1,name:"Laptop",category:"Electronics",price:18500,oldPrice:25000,condition:"Excellent",description:"Reliable laptop for study, office work and everyday browsing. Clean, well-maintained and ready for a new owner.",location:"Chennai, Tamil Nadu",emoji:"💻",bg:"#e8f0ff",seller:"Arun"},
  {id:2,name:"Bicycle",category:"Cycles",price:4500,oldPrice:6500,condition:"Good",description:"Comfortable everyday bicycle with sturdy tyres and smooth gears. Great for commuting, campus rides and weekend trips.",location:"Coimbatore, Tamil Nadu",emoji:"🚲",bg:"#e7f6ee",seller:"Karthik"},
  {id:3,name:"Study Table",category:"Furniture",price:2200,oldPrice:3200,condition:"Good",description:"Compact wooden study table with a spacious top. Ideal for a student room, home office or reading corner.",location:"Madurai, Tamil Nadu",emoji:"🪑",bg:"#fff0df",seller:"Priya"},
  {id:4,name:"Smart Watch",category:"Electronics",price:1800,oldPrice:2800,condition:"Like New",description:"Sleek smart watch with activity tracking, notifications and a comfortable strap. Lightly used and in great condition.",location:"Salem, Tamil Nadu",emoji:"⌚",bg:"#f0eaff",seller:"Naveen"},
  {id:5,name:"Wireless Headphones",category:"Electronics",price:950,oldPrice:1500,condition:"Good",description:"Wireless headphones with clear sound and cushioned ear pads. A handy everyday choice for music and online classes.",location:"Tiruchirappalli, Tamil Nadu",emoji:"🎧",bg:"#e3f5fa",seller:"Meena"},
  {id:6,name:"Office Chair",category:"Furniture",price:1600,oldPrice:2400,condition:"Good",description:"Supportive office chair for studying or working from home, with a comfortable seat and adjustable height.",location:"Erode, Tamil Nadu",emoji:"💺",bg:"#fce8e8",seller:"Vijay"},
  {id:7,name:"Android Phone",category:"Electronics",price:6200,oldPrice:8500,condition:"Excellent",description:"Well-kept Android smartphone for daily calls, messaging, photos and apps. Reset and ready for its next user.",location:"Chengalpattu, Tamil Nadu",emoji:"📱",bg:"#e8efff",seller:"Divya"},
  {id:8,name:"Travel Backpack",category:"Accessories",price:650,oldPrice:1000,condition:"Good",description:"Lightweight backpack with roomy compartments, sturdy zips and comfortable shoulder straps for college or travel.",location:"Vellore, Tamil Nadu",emoji:"🎒",bg:"#fff1df",seller:"Sanjay"}
];

const categoryColors = {
  Electronics: "#e8f0ff",
  Cycles: "#e7f6ee",
  Furniture: "#fff0df",
  Accessories: "#f4eaff"
};

const categoryEmojis = {
  Electronics: "🔌",
  Cycles: "🚲",
  Furniture: "🪑",
  Accessories: "🎒"
};

const STORAGE_KEY = "reusehub_products_v2";

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not load saved products", e);
  }
  return initialProducts.map(p => ({ ...p }));
}

function persistProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn("Could not save products to localStorage", e);
  }
}

let products = loadProducts();
let activeCategory = "All Items";
let searchTerm = "";
let currentProduct = null;
let toastTimer;
let currentPage = "buy";

const $ = selector => document.querySelector(selector);
const productGrid = $("#productGrid");
const modalBackdrop = $("#modalBackdrop");
const modalContent = $("#modalContent");
const money = value => "₹" + Number(value).toLocaleString("en-IN");
const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const getProduct = id => products.find(product => product.id === Number(id));

// ==================== PAGE ROUTING (BUY vs SELL) ====================
function switchPage(page, options = {}) {
  currentPage = page;
  const pageBuy = $("#pageBuy");
  const pageSell = $("#pageSell");
  const tabBuy = $("#tabBuy");
  const tabSell = $("#tabSell");

  if (page === "sell") {
    pageBuy.hidden = true;
    pageSell.hidden = false;
    tabBuy.classList.remove("active");
    tabSell.classList.add("active-sell");
    renderSellerView();
    if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    pageSell.hidden = true;
    pageBuy.hidden = false;
    tabBuy.classList.add("active");
    tabSell.classList.remove("active-sell");
    renderProducts();
    if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function handleHashChange() {
  const hash = window.location.hash.toLowerCase();
  if (hash === "#sell" || hash.startsWith("#sell")) {
    switchPage("sell");
  } else if (hash === "#products") {
    switchPage("buy", { preserveScroll: true });
    setTimeout(() => {
      const el = $("#products");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  } else {
    switchPage("buy");
  }
}

window.addEventListener("hashchange", handleHashChange);

// Navigation tab clicks
$("#tabBuy").addEventListener("click", e => {
  e.preventDefault();
  window.location.hash = "buy";
  switchPage("buy");
});

$("#tabSell").addEventListener("click", e => {
  e.preventDefault();
  window.location.hash = "sell";
  switchPage("sell");
});

// ==================== BUY MARKETPLACE RENDERING ====================
function renderProducts() {
  const query = searchTerm.trim().toLowerCase();
  const visible = products.filter(p =>
    (activeCategory === "All Items" || p.category === activeCategory) &&
    (!query || [p.name, p.category, p.description, p.location, p.condition, p.seller].some(v => String(v).toLowerCase().includes(query)))
  );

  productGrid.innerHTML = visible.map(p => `
    <article class="product-card">
      <div class="product-visual" style="--visual-bg:${p.bg || categoryColors[p.category] || "#edf3fc"}">
        <span class="condition-badge">${escapeHTML(p.condition)}</span>
        <button class="heart-button" type="button" data-action="favorite" data-id="${p.id}" aria-label="Save ${escapeHTML(p.name)} to favourites" aria-pressed="false">♡</button>
        <span class="product-emoji" aria-hidden="true">${escapeHTML(p.emoji || "📦")}</span>
      </div>
      <div class="product-body">
        <div class="product-category">${escapeHTML(p.category)}</div>
        <h3 class="product-title" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</h3>
        <p class="product-description">${escapeHTML(p.description)}</p>
        <div class="price-line">
          <span class="price">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
        </div>
        <div class="product-location">⌖ ${escapeHTML(p.location || "Location not specified")}</div>
        <div class="card-actions">
          <button class="btn btn-outline" type="button" data-action="details" data-id="${p.id}">View Details</button>
          <button class="btn btn-primary" type="button" data-action="buy" data-id="${p.id}">Buy Now</button>
        </div>
      </div>
    </article>`).join("");

  $("#emptyState").hidden = visible.length > 0;
  productGrid.hidden = visible.length === 0;
  $("#resultsLabel").textContent = query
    ? `Showing ${visible.length} result${visible.length === 1 ? "" : "s"} for “${searchTerm.trim()}”`
    : activeCategory === "All Items" ? "Showing all products" : `Showing ${activeCategory.toLowerCase()}`;
  $("#clearSearch").hidden = !query;
  $("#productCount").textContent = products.length;
  $("#allCount").textContent = products.length;
  document.querySelectorAll(".filter-chip").forEach(btn => btn.classList.toggle("active", btn.dataset.category === activeCategory));
}

// ==================== SELLER PAGE RENDERING (ACTIVE INVENTORY) ====================
function renderSellerView() {
  const sellerTableBody = $("#sellerTableBody");
  const sellerEmptyState = $("#sellerEmptyState");
  const totalValue = products.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const categoriesCount = new Set(products.map(p => p.category)).size;

  // Update KPI counters
  $("#sellerCountTotal").textContent = products.length;
  $("#sellerCategoriesTotal").textContent = categoriesCount;
  $("#sellerValueTotal").textContent = money(totalValue);
  $("#sellListCount").textContent = products.length;

  if (products.length === 0) {
    sellerTableBody.innerHTML = "";
    sellerEmptyState.hidden = false;
    return;
  }

  sellerEmptyState.hidden = true;
  sellerTableBody.innerHTML = products.map((p, idx) => `
    <tr>
      <td>
        <div class="product-cell">
          <div class="product-thumb" style="background:${p.bg || categoryColors[p.category] || "#edf3fc"}">
            ${escapeHTML(p.emoji || "📦")}
          </div>
          <div class="product-meta">
            <strong>${escapeHTML(p.name)}</strong>
            <small>ID: #${String(p.id).slice(-4)}</small>
          </div>
        </div>
      </td>
      <td><span class="category-pill">${escapeHTML(p.category)}</span></td>
      <td>
        <strong style="font-size:13px; color:var(--navy);">${money(p.price)}</strong>
        ${p.oldPrice ? `<br><small style="color:#a8b2c0; text-decoration:line-through; font-size:10px;">${money(p.oldPrice)}</small>` : ""}
      </td>
      <td><span class="condition-pill">${escapeHTML(p.condition)}</span></td>
      <td><strong>${escapeHTML(p.seller || "Community Seller")}</strong></td>
      <td><small style="color:#718296;">⌖ ${escapeHTML(p.location || "Local community")}</small></td>
      <td><span class="status-pill">Live for Sale</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-table-action" type="button" data-action="details" data-id="${p.id}" title="View product card">Details</button>
          <button class="btn btn-table-action btn-delist" type="button" data-action="delist" data-id="${p.id}" title="Remove this item from sale">Remove</button>
        </div>
      </td>
    </tr>`).join("");
}

// Delist / Remove an item from sale
function handleDelistProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  const ok = window.confirm(`Are you sure you want to remove "${p.name}" from active listings?`);
  if (!ok) return;

  products = products.filter(item => item.id !== Number(id));
  persistProducts();
  renderSellerView();
  renderProducts();
  showToast(`"${p.name}" removed from sale`);
}

// Reset to Default Sample Products
$("#btnResetDemo").addEventListener("click", () => {
  const ok = window.confirm("Reset all listings back to the original 8 sample products from your record note?");
  if (!ok) return;
  products = initialProducts.map(p => ({ ...p }));
  persistProducts();
  renderSellerView();
  renderProducts();
  showToast("Marketplace reset to original sample products!");
});

// Table action clicks (Details or Delist)
$("#sellerTableBody").addEventListener("click", event => {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === "details") openDetails(id);
  if (action === "delist") handleDelistProduct(id);
});

// ==================== SEARCH & FILTERS ====================
function setSearch(value) {
  searchTerm = value;
  $("#searchInput").value = value;
  if (currentPage !== "buy") switchPage("buy");
  renderProducts();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ==================== MODALS (DETAILS & BUY NOW) ====================
function openModal() {
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  $("#modalClose").focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = "";
  currentProduct = null;
}

function detailsMarkup(p) {
  return `
    <div class="modal-product-visual" style="background:${p.bg || categoryColors[p.category] || "#edf3fc"}">
      <span>${escapeHTML(p.emoji || "📦")}</span>
    </div>
    <div class="modal-kicker">${escapeHTML(p.category)} · PRE-LOVED FIND</div>
    <h2 id="modalTitle">${escapeHTML(p.name)}</h2>
    <div>
      <span class="modal-price">${money(p.price)}</span>
      ${p.oldPrice ? `<span class="modal-old-price">${money(p.oldPrice)}</span>` : ""}
    </div>
    <p class="modal-description">${escapeHTML(p.description)}</p>
    <div class="detail-list">
      <div class="detail-item"><small>Condition</small><strong>${escapeHTML(p.condition)}</strong></div>
      <div class="detail-item"><small>Location</small><strong>${escapeHTML(p.location || "Not specified")}</strong></div>
      <div class="detail-item"><small>Seller</small><strong>${escapeHTML(p.seller || "Community seller")}</strong></div>
      <div class="detail-item"><small>Category</small><strong>${escapeHTML(p.category)}</strong></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" type="button" data-action="close">Close</button>
      <button class="btn btn-primary" type="button" data-action="buy" data-id="${p.id}">Buy Now · ${money(p.price)}</button>
    </div>
    <p class="demo-note">Demo marketplace: this listing is for college-project demonstration only.</p>`;
}

function openDetails(id) {
  const p = getProduct(id);
  if (!p) return;
  currentProduct = p;
  modalContent.innerHTML = detailsMarkup(p);
  openModal();
}

function openPurchase(id) {
  const p = getProduct(id);
  if (!p) return;
  currentProduct = p;
  modalContent.innerHTML = `
    <div class="modal-kicker">DEMO CHECKOUT</div>
    <h2 id="modalTitle">Purchase ${escapeHTML(p.name)}</h2>
    <div class="detail-list">
      <div class="detail-item"><small>Product</small><strong>${escapeHTML(p.name)}</strong></div>
      <div class="detail-item"><small>Price</small><strong>${money(p.price)}</strong></div>
      <div class="detail-item"><small>Condition</small><strong>${escapeHTML(p.condition)}</strong></div>
      <div class="detail-item"><small>Category</small><strong>${escapeHTML(p.category)}</strong></div>
    </div>
    <p class="modal-description">${escapeHTML(p.description)}</p>
    <form id="purchaseForm" class="purchase-form">
      <label>Customer name <span style="color:#e85c56">*</span>
        <input name="customerName" required maxlength="70" autocomplete="name" placeholder="Enter your full name">
      </label>
      <label>Phone number <span style="color:#e85c56">*</span>
        <input name="phone" required type="tel" inputmode="tel" pattern="[0-9+()\\-\\s]{7,18}" maxlength="18" autocomplete="tel" placeholder="Enter phone number">
      </label>
      <button class="btn btn-primary" type="submit">Confirm Purchase · ${money(p.price)}</button>
    </form>
    <p class="demo-note">🛡️ Demonstration only. No payment will be collected and no order will be sent to a seller.</p>`;
  openModal();
  $("#purchaseForm input").focus();
}

function showPurchaseSuccess(name, product) {
  modalContent.innerHTML = `
    <div class="success-panel">
      <div class="success-icon">✓</div>
      <div class="modal-kicker">DEMO ORDER CONFIRMED</div>
      <h2 id="modalTitle">Thanks, ${escapeHTML(name)}!</h2>
      <p>Your demo purchase request for <strong>${escapeHTML(product.name)}</strong> (${money(product.price)}) was completed successfully.<br><br>This is a college-project simulation. No real payment or order has been made.</p>
      <button class="btn btn-primary" type="button" data-action="close">Back to ReUseHub</button>
    </div>`;
  showToast("Demo purchase confirmed!");
}

// Product Grid Click Delegation
productGrid.addEventListener("click", event => {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "details") openDetails(btn.dataset.id);
  if (action === "buy") openPurchase(btn.dataset.id);
  if (action === "favorite") {
    const liked = btn.classList.toggle("liked");
    btn.textContent = liked ? "♥" : "♡";
    btn.setAttribute("aria-pressed", String(liked));
    showToast(liked ? "Added to your favourites" : "Removed from favourites");
  }
});

modalContent.addEventListener("click", event => {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "close") closeModal();
  if (btn.dataset.action === "buy") openPurchase(btn.dataset.id);
});

$("#modalClose").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modalBackdrop.hidden) closeModal(); });

modalContent.addEventListener("submit", event => {
  if (event.target.id !== "purchaseForm") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  const name = event.target.elements.customerName.value.trim();
  const product = currentProduct;
  if (!name || !product) return;
  showPurchaseSuccess(name, product);
});

// Search and Filter controls
$("#searchForm").addEventListener("submit", event => {
  event.preventDefault();
  setSearch($("#searchInput").value);
  if (currentPage !== "buy") switchPage("buy");
  $("#products").scrollIntoView({ behavior: "smooth" });
});

$("#searchInput").addEventListener("input", event => {
  searchTerm = event.target.value;
  if (currentPage !== "buy") switchPage("buy");
  renderProducts();
});

document.querySelectorAll(".filter-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    activeCategory = btn.dataset.category;
    renderProducts();
  });
});

$("#clearSearch").addEventListener("click", () => setSearch(""));
$("#resetFilters").addEventListener("click", () => {
  activeCategory = "All Items";
  setSearch("");
});

// ==================== SELL FORM SUBMIT HANDLER ====================
$("#sellForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const category = String(data.get("category"));
  const price = Number(data.get("price"));
  const condition = String(data.get("condition"));
  const description = String(data.get("description")).trim();
  const seller = String(data.get("seller")).trim();
  const location = String(data.get("location") || "").trim() || "Local community";

  if (!name || !category || !Number.isFinite(price) || price <= 0 || !condition || !description || !seller) {
    $("#sellMessage").hidden = false;
    $("#sellMessage").textContent = "Please complete every required field with valid details.";
    return;
  }

  const product = {
    id: Date.now(),
    name,
    category,
    price,
    oldPrice: null,
    condition,
    description,
    location,
    emoji: categoryEmojis[category] || "📦",
    bg: categoryColors[category] || "#edf3fc",
    seller
  };

  products.unshift(product);
  persistProducts();

  form.reset();
  $("#sellMessage").hidden = false;
  $("#sellMessage").textContent = `Success! “${name}” is now listed in the active seller inventory and marketplace.`;

  renderSellerView();
  renderProducts();
  showToast(`“${name}” was listed for sale!`);

  // Scroll smoothly down to the Active Inventory section on the sell page
  setTimeout(() => {
    const el = $("#listedProductsSection");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 100);
});

// ==================== INITIALIZATION ====================
$("#year").textContent = new Date().getFullYear();

// Check URL Hash for initial view
handleHashChange();
