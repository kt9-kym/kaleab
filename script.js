/* ============================================
   MARKE MARKET — script.js
   ============================================ */

// ========== STATE ==========
let cart = JSON.parse(localStorage.getItem('mm_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('mm_wish') || '[]');
let orders = JSON.parse(localStorage.getItem('mm_orders') || '[]');
let currentUser = JSON.parse(localStorage.getItem('mm_user') || 'null');
let currentCurrency = 'ETB';
let activeFilter = '';
let detailProductId = null;
let detailQty = 1;

const RATES = { ETB: 1, USD: 0.0175, EUR: 0.016 };
const SYMBOLS = { ETB: 'ETB', USD: '$', EUR: '€' };

// ========== PRODUCTS DATA ==========
const PRODUCTS = [
  { id: 1,  name: 'Organic Coffee',       price: 180,   category: 'Agriculture',  seller: "Dawit's Farm",        image: 'https://picsum.photos/seed/coffee11/400/300', desc: 'Premium Arabica coffee beans grown on the highlands of Wolaita. Sun-dried and hand-sorted for exceptional quality.', rating: 4.9 },
  { id: 2,  name: 'Traditional Basket',   price: 1200,  category: 'Agriculture',  seller: "Wolaita Crafts Co.",  image: 'https://picsum.photos/seed/basket22/400/300', desc: 'Beautifully handwoven traditional Ethiopian basket made from natural materials by local artisans.', rating: 4.7 },
  { id: 3,  name: 'Enset Seedlings',      price: 120,   category: 'Agriculture',  seller: "Dawit's Farm",        image: 'https://picsum.photos/seed/plant33/400/300', desc: 'Fresh enset seedlings (false banana), the staple crop of Wolaita. Ideal for home gardens and small farms.', rating: 4.5 },
  { id: 4,  name: 'Fresh Honey',          price: 150,   category: 'Local Foods',  seller: "Wolaita Honey Co.",   image: 'https://picsum.photos/seed/honey44/400/300', desc: 'Pure raw honey collected from highland bees in Wolaita. Unprocessed, rich in flavor and nutrients.', rating: 4.9 },
  { id: 5,  name: 'Local Spice Mix',      price: 80,    category: 'Local Foods',  seller: "Spice Kingdom",       image: 'https://picsum.photos/seed/spice55/400/300', desc: 'Traditional Wolaita berbere and mitmita spice blend. Adds authentic Ethiopian flavor to any dish.', rating: 4.6 },
  { id: 6,  name: 'Traditional Dress',    price: 1500,  category: 'Fashion',      seller: "Tigist Fashion House",image: 'https://picsum.photos/seed/dress66/400/300', desc: 'Handmade traditional Wolaita dress with intricate embroidery. Made from quality cotton by local tailors.', rating: 4.8 },
  { id: 7,  name: 'Wolaita Fabric Roll',  price: 650,   category: 'Fashion',      seller: "Tigist Fashion House",image: 'https://picsum.photos/seed/fabric77/400/300', desc: 'Authentic Wolaita woven fabric in traditional patterns. 5-meter roll, perfect for clothing or decoration.', rating: 4.4 },
  { id: 8,  name: 'Smartphone',           price: 15000, category: 'Electronics',  seller: "Sodo Tech Shop",      image: 'https://picsum.photos/seed/phone88/400/300', desc: 'Latest Android smartphone with 128GB storage, dual-SIM, 48MP camera. Fully warranted for 12 months.', rating: 4.5 },
  { id: 9,  name: 'Solar Lantern',        price: 800,   category: 'Electronics',  seller: "Sodo Tech Shop",      image: 'https://picsum.photos/seed/solar99/400/300', desc: 'High-capacity solar rechargeable LED lantern. Provides 12+ hours of bright light. Perfect for rural areas.', rating: 4.7 },
  { id: 10, name: 'Wooden Coffee Table',  price: 3500,  category: 'Furniture',    seller: "Abebe Woodworks",     image: 'https://picsum.photos/seed/table10/400/300', desc: 'Handcrafted solid wood coffee table with traditional Ethiopian design carvings. Sturdy and elegant.', rating: 4.8 },
  { id: 11, name: 'Woven Chair Set (2)',  price: 2200,  category: 'Furniture',    seller: "Abebe Woodworks",     image: 'https://picsum.photos/seed/chair11/400/300', desc: 'Set of 2 hand-woven traditional Ethiopian chairs with wooden frame. Comfortable and durable.', rating: 4.6 },
  { id: 12, name: 'Motorcycle',           price: 85000, category: 'Vehicles',     seller: "Sodo Motors",         image: 'https://picsum.photos/seed/moto12/400/300', desc: '125cc motorcycle in excellent condition. Low mileage, recently serviced. Registration papers included.', rating: 4.3 },
];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(PRODUCTS);
  updateCartBadge();
  updateWishBadge();
  typewriter();
  if (currentUser) updateAuthUI();
});

// ========== TYPEWRITER ==========
const phrases = [
  'Your Local Marketplace',
  'Fresh Farm Products',
  'Traditional Crafts',
  'Electronics & More',
];
let phraseIdx = 0, charIdx = 0, deleting = false;

function typewriter() {
  const el = document.getElementById('typewriterText');
  if (!el) return;
  const phrase = phrases[phraseIdx];
  el.textContent = deleting ? phrase.slice(0, charIdx--) : phrase.slice(0, charIdx++);
  let delay = deleting ? 60 : 100;
  if (!deleting && charIdx === phrase.length + 1) { deleting = true; delay = 1800; }
  if (deleting && charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; delay = 400; }
  setTimeout(typewriter, delay);
}

// ========== CURRENCY ==========
function changeCurrency(val) {
  currentCurrency = val;
  renderProducts(getFilteredProducts());
  renderCart();
  renderWishlist();
  updateCartTotal();
}

function fmt(etbPrice) {
  const converted = etbPrice * RATES[currentCurrency];
  const symbol = SYMBOLS[currentCurrency];
  if (currentCurrency === 'ETB') return `${converted.toLocaleString()} ETB`;
  return `${symbol} ${converted.toFixed(2)}`;
}

// ========== PRODUCTS RENDER ==========
function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  const noRes = document.getElementById('noResults');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '';
    noRes.style.display = 'block';
    return;
  }
  noRes.style.display = 'none';

  grid.innerHTML = list.map(p => {
    const wished = wishlist.includes(p.id);
    const stars = '⭐'.repeat(Math.floor(p.rating));
    return `
      <div class="product-card" onclick="openProductDetail(${p.id})">
        <div class="product-img-wrap">
          <span class="product-category-tag">${p.category}</span>
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          <button class="wish-btn ${wished ? 'wished' : ''}"
            onclick="event.stopPropagation(); toggleWish(${p.id}, this)"
            title="${wished ? 'Remove from wishlist' : 'Add to wishlist'}">
            ${wished ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-body">
          <h3>${p.name}</h3>
          <div class="seller">🏪 ${p.seller}</div>
          <div class="product-rating">${stars} (${p.rating})</div>
          <div class="product-price">${fmt(p.price)}</div>
          <div class="product-actions">
            <button class="btn-buy" onclick="event.stopPropagation(); addToCart(${p.id})">🛒 Add to Cart</button>
            <button class="btn-detail" onclick="event.stopPropagation(); openProductDetail(${p.id})">View</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function getFilteredProducts() {
  let list = PRODUCTS;
  if (activeFilter) list = list.filter(p => p.category === activeFilter);
  const q = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.seller.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q)
  );
  const catSel = document.getElementById('categoryFilter')?.value || '';
  if (catSel && catSel !== activeFilter) list = list.filter(p => p.category === catSel);
  return list;
}

// ========== SEARCH ==========
function liveSearch() {
  const q = document.getElementById('searchInput').value;
  document.getElementById('clearBtn').style.display = q ? 'block' : 'none';
  renderProducts(getFilteredProducts());
}

function searchProduct() {
  scrollToSection('products');
  renderProducts(getFilteredProducts());
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearBtn').style.display = 'none';
  renderProducts(getFilteredProducts());
}

// ========== CATEGORY FILTER ==========
function filterByCategory(cat) {
  activeFilter = cat;
  document.getElementById('categoryFilter').value = cat;
  const filterBar = document.getElementById('filterBar');
  const label = document.getElementById('activeFilterLabel');
  filterBar.style.display = 'flex';
  label.textContent = `Showing: ${cat}`;
  document.getElementById('productsTitle').textContent = cat;
  document.getElementById('productsSubtitle').textContent = `All ${cat} products from local sellers`;
  scrollToSection('products');
  renderProducts(getFilteredProducts());
}

function clearFilter() {
  activeFilter = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('filterBar').style.display = 'none';
  document.getElementById('productsTitle').textContent = 'Featured Products';
  document.getElementById('productsSubtitle').textContent = 'Handpicked local products from Wolaita';
  renderProducts(getFilteredProducts());
}

// ========== CART ==========
function addToCart(productId, qty = 1) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart();
  updateCartBadge();
  showToast(`✅ "${p.name}" added to cart!`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCart();
  updateCartTotal();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
  updateCartTotal();
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>Your cart is empty</p><button class="btn-primary" onclick="closeModal('cartModal')">Browse Products</button></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }
  if (footer) footer.style.display = 'block';
  body.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <img class="cart-item-img" src="${p.image}" alt="${p.name}" />
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <div class="cart-cat">${p.category}</div>
          <div class="cart-price">${fmt(p.price * item.qty)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeCartQty(${p.id}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeCartQty(${p.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${p.id})" title="Remove">🗑</button>
        </div>
      </div>`;
  }).join('');
  updateCartTotal();
}

function updateCartTotal() {
  const total = cart.reduce((sum, item) => {
    const p = PRODUCTS.find(x => x.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
  const el = document.getElementById('cartTotalDisplay');
  if (el) el.textContent = fmt(total);
}

function updateCartBadge() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartBadge').textContent = count;
}

function saveCart() { localStorage.setItem('mm_cart', JSON.stringify(cart)); }

function placeOrder() {
  if (!cart.length) return;
  const items = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    return { name: p.name, qty: item.qty, price: p.price };
  });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const order = {
    id: 'ORD-' + Date.now().toString().slice(-6),
    items,
    total,
    status: 'Placed',
    date: new Date().toLocaleDateString('en-ET'),
  };
  orders.unshift(order);
  localStorage.setItem('mm_orders', JSON.stringify(orders));
  cart = [];
  saveCart();
  updateCartBadge();
  closeModal('cartModal');
  showToast('🎉 Order placed successfully!', 'success');
  openModal('ordersModal');
  renderOrders();
}

// ========== WISHLIST ==========
function toggleWish(productId, btnEl) {
  const idx = wishlist.indexOf(productId);
  const p = PRODUCTS.find(x => x.id === productId);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    if (btnEl) { btnEl.textContent = '🤍'; btnEl.classList.remove('wished'); }
    showToast(`Removed "${p.name}" from wishlist`, 'info');
  } else {
    wishlist.push(productId);
    if (btnEl) { btnEl.textContent = '❤️'; btnEl.classList.add('wished'); }
    showToast(`❤️ "${p.name}" added to wishlist!`, 'success');
  }
  saveWishlist();
  updateWishBadge();
}

function toggleWishFromDetail() {
  const btn = document.getElementById('pdWishBtn');
  const inWish = wishlist.includes(detailProductId);
  toggleWish(detailProductId, null);
  btn.textContent = (!inWish) ? '💔 Remove' : '❤️ Wishlist';
  // refresh grid hearts
  renderProducts(getFilteredProducts());
}

function removeFromWishlist(productId) {
  const idx = wishlist.indexOf(productId);
  if (idx > -1) wishlist.splice(idx, 1);
  saveWishlist();
  updateWishBadge();
  renderWishlist();
  renderProducts(getFilteredProducts());
}

function renderWishlist() {
  const body = document.getElementById('wishlistBody');
  if (!body) return;
  if (!wishlist.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">❤️</div><p>Your wishlist is empty</p><button class="btn-primary" onclick="closeModal('wishlistModal')">Discover Products</button></div>`;
    return;
  }
  body.innerHTML = wishlist.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return '';
    return `
      <div class="wishlist-item">
        <img class="wishlist-item-img" src="${p.image}" alt="${p.name}" />
        <div class="wishlist-item-info">
          <h4>${p.name}</h4>
          <div class="w-price">${fmt(p.price)}</div>
          <div style="font-size:.75rem;color:var(--gray-400)">${p.category} · ${p.seller}</div>
        </div>
        <div class="wishlist-item-actions">
          <button class="btn-add-wish" onclick="addToCart(${p.id}); removeFromWishlist(${p.id})">Add to Cart</button>
          <button class="btn-remove-wish" onclick="removeFromWishlist(${p.id})">Remove ✕</button>
        </div>
      </div>`;
  }).join('');
}

function saveWishlist() { localStorage.setItem('mm_wish', JSON.stringify(wishlist)); }
function updateWishBadge() { document.getElementById('wishCount').textContent = wishlist.length; }

// ========== ORDERS ==========
function renderOrders() {
  const body = document.getElementById('ordersBody');
  if (!body) return;
  if (!orders.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><p>No orders yet</p><button class="btn-primary" onclick="closeModal('ordersModal')">Start Shopping</button></div>`;
    return;
  }
  const statuses = ['Placed', 'Processing', 'Delivered'];
  const statusClass = { Placed: 'status-placed', Processing: 'status-processing', Delivered: 'status-delivered' };
  body.innerHTML = orders.map(o => {
    const st = o.status;
    return `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">🧾 ${o.id}</span>
          <span class="order-status ${statusClass[st] || 'status-placed'}">${st}</span>
        </div>
        <div class="order-items">${o.items.map(i => `${i.name} ×${i.qty}`).join(' · ')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="order-total">${fmt(o.total)}</span>
          <span class="order-date">${o.date}</span>
        </div>
      </div>`;
  }).join('');
}

// ========== PRODUCT DETAIL MODAL ==========
function openProductDetail(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  detailProductId = productId;
  detailQty = 1;
  document.getElementById('pdTitle').textContent = p.name;
  document.getElementById('pdImg').src = p.image;
  document.getElementById('pdImg').alt = p.name;
  document.getElementById('pdCategory').textContent = p.category;
  document.getElementById('pdName').textContent = p.name;
  document.getElementById('pdPrice').textContent = fmt(p.price);
  document.getElementById('pdDesc').textContent = p.desc;
  document.getElementById('pdSeller').textContent = '🏪 ' + p.seller;
  document.getElementById('pdQty').textContent = 1;
  const inWish = wishlist.includes(productId);
  document.getElementById('pdWishBtn').textContent = inWish ? '💔 Remove' : '❤️ Wishlist';
  openModal('productModal');
}

function changeQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  document.getElementById('pdQty').textContent = detailQty;
}

function addFromDetail() {
  addToCart(detailProductId, detailQty);
  closeModal('productModal');
}

// ========== AUTH ==========
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) { showToast('Please fill in all fields', 'error'); return; }
  currentUser = { name: email.split('@')[0] || 'User', email, type: 'user' };
  localStorage.setItem('mm_user', JSON.stringify(currentUser));
  updateAuthUI();
  showToast('✅ Logged in successfully!', 'success');
}

function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  if (!name || !phone || !email || !pass) { showToast('Please fill in all fields', 'error'); return; }
  currentUser = { name, email, phone, type: 'user' };
  localStorage.setItem('mm_user', JSON.stringify(currentUser));
  updateAuthUI();
  showToast(`🎉 Welcome, ${name}! Account created.`, 'success');
}

function doGuestLogin() {
  currentUser = { name: 'Guest', email: '', type: 'guest' };
  localStorage.setItem('mm_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeModal('loginModal');
  showToast('Welcome, Guest!', 'info');
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('mm_user');
  document.getElementById('loggedInPanel').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  closeModal('loginModal');
  showToast('Logged out.', 'info');
}

function updateAuthUI() {
  if (!currentUser) return;
  document.getElementById('loggedInPanel').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userEmail').textContent = currentUser.email || 'Guest account';
  const initial = currentUser.name[0]?.toUpperCase() || '👤';
  document.getElementById('userAvatar').textContent = initial;
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginFields').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerFields').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('authTitle').textContent = tab === 'login' ? '👤 Welcome Back' : '✨ Create Account';
}

// ========== CONTACT FORM ==========
function submitContact(e) {
  e.preventDefault();
  showToast('✅ Message sent! We\'ll get back to you soon.', 'success');
  e.target.reset();
}

// ========== NAVIGATION ==========
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-link[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('mainNav').classList.remove('open');
}

function scrollToSection(id) {
  showPage('home');
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function toggleMobileMenu() {
  document.getElementById('mainNav').classList.toggle('open');
}

// ========== MODALS ==========
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Re-render dynamic content
  if (id === 'cartModal') { renderCart(); updateCartTotal(); }
  if (id === 'wishlistModal') renderWishlist();
  if (id === 'ordersModal') renderOrders();
  if (id === 'loginModal' && currentUser) updateAuthUI();
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  // only restore scroll if no other modals open
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.style.overflow = '';
  }
}

function closeModalOutside(event, id) {
  if (event.target.id === id) closeModal(id);
}

// Close modals on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  }
});

// ========== TOAST ==========
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .25s ease forwards';
    setTimeout(() => toast.remove(), 280);
  }, 3000);
}
