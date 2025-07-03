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


// Checkout functionality
function openCheckout() {
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    loadCheckoutItems();
    calculateOrderSummary();
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function loadCheckoutItems() {
    const checkoutItems = document.getElementById('checkout-items');
    const cartEmpty = document.getElementById('cart-empty');
    
    if (cartItems.length === 0) {
        checkoutItems.style.display = 'none';
        cartEmpty.style.display = 'block';
        return;
    }
    
    checkoutItems.style.display = 'block';
    cartEmpty.style.display = 'none';
    
    checkoutItems.innerHTML = cartItems.map(item => createCheckoutItem(item)).join('');
}

function createCheckoutItem(item) {
    const imageUrl = item.image || generatePlaceholderImage(item.name);
    
    return `
        <div class="checkout-item" data-item-id="${item.id}">
            <div class="checkout-item-image">
                <img src="${imageUrl}" alt="${escapeHtml(item.name)}" onerror="this.src='https://via.placeholder.com/60x60/f8f9fa/6c757d?text=Item'">
            </div>
            <div class="checkout-item-info">
                <div class="checkout-item-name">${escapeHtml(item.name)}</div>
                <div class="checkout-item-price">Ksh${item.price.toFixed(2)} each</div>
            </div>
            <div class="checkout-item-controls">
                <button class="quantity-btn" onclick="decreaseQuantity('${item.id}')">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="increaseQuantity('${item.id}')">+</button>
                <button class="remove-item" onclick="removeFromCheckout('${item.id}')" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function increaseQuantity(productId) {
    const item = cartItems.find(item => String(item.id) === String(productId));
    if (item) {
        item.quantity += 1;
        updateCartDisplay();
        saveCartToStorage();
        loadCheckoutItems();
        calculateOrderSummary();
    }
}

function decreaseQuantity(productId) {
    const item = cartItems.find(item => String(item.id) === String(productId));
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartDisplay();
        saveCartToStorage();
        loadCheckoutItems();
        calculateOrderSummary();
    }
}

// function removeFromCheckout(productId) {
//     removeFromCart(productId);
//     loadCheckoutItems();
//     calculateOrderSummary();
// }

// function removeFromCart(productId) {
//     cartItems = cartItems.filter(item => String(item.id) !== String(productId));
//     updateCartDisplay();
//     saveCartToStorage();
// }


function removeFromCart(productId, shouldReloadCheckout = false) {
    cartItems = cartItems.filter(item => item.id !== productId);
    updateCartDisplay();
    saveCartToStorage();
    if (shouldReloadCheckout) {
        loadCheckoutItems();
        calculateOrderSummary();
    }
}

function removeFromCheckout(productId) {
    removeFromCart(productId, true);
}


function calculateOrderSummary() {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 9.99 : 0;
    const tax = subtotal * 0; // 8% tax
    const total = subtotal + shipping + tax;
    
    
    document.getElementById('checkout-subtotal').textContent = `Ksh${subtotal.toFixed(2)}`;
    document.getElementById('checkout-shipping').textContent = subtotal >= 50 ? 'FREE' : `Ksh${shipping.toFixed(2)}`;
    document.getElementById('checkout-tax').textContent = `Ksh${tax.toFixed(1)}`;
    document.getElementById('checkout-total').textContent = `Ksh${total.toFixed(2)}`;
    
    // Update shipping cost if free shipping applies
    if (subtotal >= 50) {
        const finalTotal = subtotal + tax;
        document.getElementById('checkout-total').textContent = `Ksh${finalTotal.toFixed(0)}`;
    }
    sendTotalToServer(total)
}

//   sending the total cost to the back-end
// function sendTotalToServer(){
//     const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     fetch('/save-total', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ total })
//     })
//     .then(res => res.json())
//     .then(data => console.log('Total sent to server:', data))
//     .catch(err => console.error('Error sending total:', err));
// }

function processCheckout() {
    // Validate forms
    // const shippingForm = document.getElementById('shipping-form');
    // const paymentForm = document.getElementById('payment-form');
    
    // if (!shippingForm.checkValidity()) {
    //     shippingForm.reportValidity();
    //     return;
    // }
    
    // if (!paymentForm.checkValidity()) {
    //     paymentForm.reportValidity();
    //     return;
    // }
  


    // ver2
    // function processCheckout() {
    // const totalElement = document.getElementById('checkout-total');
    // const totalText = totalElement.textContent.replace(/[^\d.]/g, '');
    // const total = parseFloat(totalText);

    // if (isNaN(total) || total <= 0) {
    //     alert("Total amount is invalid.");
    //     return;
    // }

    // const phone = prompt("Enter your Safaricom phone number (e.g. 0712345678):");
    // if (!phone || !/^07\d{8}$/.test(phone)) {
    //     alert("Invalid phone number.");
    //     return;
    // }

    // Redirect to M-Pesa payment server
    // ✅ CORRECT for your case
//    const redirectUrl = `http://localhost:8080/lipaNaMpesa?phone=${encodeURIComponent(phone)}&amount=${encodeURIComponent(total)}`;

//     window.location.href = redirectUrl;
// }
 

// ver2-end





// ver3-new

async function processCheckout() {
  const totalElement = document.getElementById('checkout-total');
  const totalText = totalElement.textContent.replace(/[^\d.]/g, '');
  const total = parseFloat(totalText);

  if (isNaN(total) || total <= 0) {
      alert("Invalid total amount");
      return;
  }

  const phone = prompt("Enter your Safaricom phone number (e.g., 0712345678):");
  if (!phone || !/^07\d{8}$/.test(phone)) {
      alert("Invalid phone number");
      return;
  }

  // ✅ Send phone and amount to backend directly (no redirect)
  try {
    const response = await fetch("http://localhost:8080/lipaNaMpesa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phoneNumber: phone, amount: total })
    });

    const result = await response.text(); // or .json() depending on how you handle it
    console.log("MPESA response:", result);
    alert("STK push sent. Check your phone.");
  } catch (err) {
    console.error("Error sending STK:", err);
    alert("Failed to initiate payment. Try again.");
  }
}

// ver3-end



    
    if (cartItems.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        return;
    }
    
    // Simulate processing
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.innerHTML;
    
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    checkoutBtn.disabled = true;


    
    setTimeout(() => {
        // Clear cart
        cartItems = [];
        updateCartDisplay();
        saveCartToStorage();
        
        // Close checkout
        closeCheckout();
        
        // Show success message
        showOrderConfirmation();
        
        // Reset button
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
        
        // Clear forms
        shippingForm.reset();
        paymentForm.reset();
    }, 2000);
}

function showOrderConfirmation() {
    const notification = document.createElement('div');
    notification.className = 'order-confirmation';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <h3>Order Placed Successfully!</h3>
            <p>Thank you for your purchase. You'll receive a confirmation email shortly.</p>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--success-color);
        color: white;
        padding: 2rem;
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 1001;
        text-align: center;
        min-width: 300px;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add input formatting for payment fields
document.addEventListener('DOMContentLoaded', function() {
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry');
    const cvvInput = document.getElementById('cvv');
  
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
            e.target.value = formattedValue;
        });
    }
    
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
});

// Close checkout on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && checkoutModal.style.display === 'flex') {
            closeCheckout();
        }
    }
});

