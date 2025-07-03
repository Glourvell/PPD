// Global variables
let allProducts = [];
let filteredProducts = [];
let cartItems = [];

// DOM elements
const productsGrid = document.getElementById('products-grid');
const productsCount = document.getElementById('products-count');
const loadingElement = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const cartCount = document.querySelector('.cart-count');

// Filter elements
const categoryFilter = document.getElementById('category-filter');
const priceFilter = document.getElementById('price-filter');
const discountFilter = document.getElementById('discount-filter');
const clearFiltersBtn = document.getElementById('clear-filters');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    showLoading();
    loadProducts();
    loadCartFromStorage();
    updateCartDisplay();
}

function setupEventListeners() {
    categoryFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
    discountFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
}

async function loadProducts() {
    try {
        const apiEndpoint = getApiEndpoint();
        console.log("Fetching products from:", apiEndpoint);

        const response = await fetch(apiEndpoint);
        if (!response.ok) throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);

        const data = await response.json();
        if (!data || !Array.isArray(data.products)) {
            throw new Error('Invalid API response format. Expected "products" array.');
        }

        allProducts = data.products.filter(product => product.onSale === true);
        filteredProducts = [...allProducts];

        hideLoading();

        if (allProducts.length === 0) {
            showEmptyState('No sale products are currently available.');
        } else {
            displayProducts();
            updateProductsCount();
        }
    } catch (error) {
        console.error('Product loading error:', error);
        hideLoading();

        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            showErrorState('Failed to load products. Please check your internet connection or API URL.');
        } else if (error.message.includes('products')) {
            showErrorState('API error: Expected a "products" array. Please fix your API structure.');
        } else {
            showErrorState(error.message);
        }
    }
}

function getApiEndpoint() {
    return window.PRODUCTS_API_URL || 'http://localhost:2000/';
}

function showLoading() {
    loadingElement.style.display = 'block';
    productsGrid.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

function showEmptyState(message = 'No products available.') {
    emptyState.style.display = 'block';
    emptyState.querySelector('p').textContent = message;
    productsGrid.style.display = 'none';
    errorState.style.display = 'none';
}

function showErrorState(message) {
    errorState.style.display = 'block';
    errorMessage.textContent = message;
    productsGrid.style.display = 'none';
    emptyState.style.display = 'none';
}

function displayProducts() {
    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-content">
                    <i class="fas fa-filter"></i>
                    <h3>No products match your filters</h3>
                    <p>Try adjusting your search criteria</p>
                    <button class="btn-secondary" onclick="clearFilters()">Clear Filters</button>
                </div>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const discountPercent = product.originalPrice && product.salePrice
        ? Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)
        : 0;

    const imageUrl = product.imageUrl || generatePlaceholderImage(product.name);
    const name = escapeHtml(product.name || 'Unnamed');
    const category = escapeHtml(product.category || 'Uncategorized');

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${imageUrl}" alt="${name}" onerror="this.src='https://via.placeholder.com/300x300/f8f9fa/6c757d?text=Image+Not+Found'">
                <div class="sale-badge">-${discountPercent}%</div>
                <div class="product-actions">
                    <button class="action-btn" onclick="toggleWishlist('${product.id}', event)" title="Add to Wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="quickView('${product.id}')" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${name}</h3>
                <p class="product-category">${category}</p>
                <div class="product-pricing">
                    <span class="current-price">Ksh${product.salePrice?.toFixed(2) || '0.00'}</span>
                    <span class="original-price">Ksh${product.originalPrice?.toFixed(2) || '0.00'}</span>
                    <span class="discount-percent">${discountPercent}% OFF</span>
                </div>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

function generatePlaceholderImage(text) {
    const encoded = encodeURIComponent(text || 'Product');
    return `https://via.placeholder.com/300x300/e74c3c/ffffff?text=${encoded}`;
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function applyFilters() {
    const category = categoryFilter.value.toLowerCase();
    const priceLimit = parseFloat(priceFilter.value) || Infinity;
    const minDiscount = parseFloat(discountFilter.value) || 0;

    filteredProducts = allProducts.filter(p => {
        const productDiscount = ((p.originalPrice - p.salePrice) / p.originalPrice) * 100;

        return (!category || p.category?.toLowerCase() === category)
            && (p.salePrice <= priceLimit)
            && (productDiscount >= minDiscount);
    });

    displayProducts();
    updateProductsCount();
}

function clearFilters() {
    categoryFilter.value = '';
    priceFilter.value = '';
    discountFilter.value = '';
    filteredProducts = [...allProducts];
    displayProducts();
    updateProductsCount();
}

function updateProductsCount() {
    const count = filteredProducts.length;
    productsCount.textContent = `${count} product${count !== 1 ? 's' : ''} found`;
}

function addToCart(productId) {
    const product = allProducts.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existing = cartItems.find(i => i.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.salePrice,
            image: product.imageUrl,
            quantity: 1
        });
    }

    updateCartDisplay();
    saveCartToStorage();
    showCartNotification(product.name);
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    updateCartDisplay();
    saveCartToStorage();
}

function updateCartDisplay() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function saveCartToStorage() {
    try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (err) {
        console.error('Cart save error:', err);
    }
}

function loadCartFromStorage() {
    try {
        const stored = localStorage.getItem('cart');
        cartItems = stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Cart load error:', err);
        cartItems = [];
    }
}

function showCartNotification(name = '') {
    const note = document.createElement('div');
    note.className = 'cart-notification';
    note.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${escapeHtml(name)} added to cart!</span>
        </div>
    `;
    note.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    document.body.appendChild(note);
    setTimeout(() => (note.style.transform = 'translateX(0)'), 100);
    setTimeout(() => {
        note.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(note), 300);
    }, 3000);
}

function toggleWishlist(productId, event) {
    console.log('Wishlist toggled:', productId);
    const icon = event.currentTarget.querySelector('i');
    icon.classList.toggle('fas');
    icon.classList.toggle('far');
    event.currentTarget.style.color = icon.classList.contains('fas') ? 'var(--primary-color)' : '';
}

function quickView(productId) {
    const p = allProducts.find(p => p.id === productId);
    if (p) {
        alert(`Quick View:\nName: ${p.name}\nPrice: $${p.salePrice}\nCategory: ${p.category}`);
    }
}

document.addEventListener('error', e => {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://via.placeholder.com/300x300/f8f9fa/6c757d?text=Image+Not+Found';
    }
}, true);

window.addEventListener('resize', () => {
    if (filteredProducts.length > 0) displayProducts();
});



// document.querySelector('.cart-btn').addEventListener('click', () => {
//     const panel = document.getElementById('cart-panel');
//     panel.classList.toggle('hidden');
//     renderCartItems();
// });

// function renderCartItems() {
//     const container = document.getElementById('cart-items-container');
//     if (!container) return;

//     if (cartItems.length === 0) {
//         container.innerHTML = '<p>Your cart is empty.</p>';
//         return;
//     }

//     container.innerHTML = cartItems.map(item => `
//         <div class="cart-item">
//             <img src="${item.image}" alt="${escapeHtml(item.name)}">
//             <div>
//                 <strong>${escapeHtml(item.name)}</strong><br>
//                 Ksh${item.price.toFixed(2)} x ${item.quantity}
//                 <br><button onclick="removeFromCart('${item.id}')">Remove</button>
//             </div>
//         </div>
//     `).join('');
// }

// function checkout() {
//     alert('Bado Sijamaliza Kuijenga!');
// }


