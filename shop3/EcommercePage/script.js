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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
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
    // Filter event listeners
    categoryFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
    discountFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
}

async function loadProducts() {
    try {
        const apiEndpoint = getApiEndpoint();
        
        if (apiEndpoint) {
            // Try to load from API endpoint if configured
            const response = await fetch(apiEndpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data || !Array.isArray(data.products)) {
                throw new Error('Invalid API response format. Expected products array.');
            }
            
            allProducts = data.products.filter(product => product.onSale === true);
        } else {
            // No API endpoint configured
            throw new Error('No product API endpoint configured. Please provide a valid API URL.');
        }
        
        filteredProducts = [...allProducts];
        
        hideLoading();
        
        if (allProducts.length === 0) {
            showEmptyState('No sale products are currently available.');
        } else {
            displayProducts();
            updateProductsCount();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        hideLoading();
        
        if (error.message.includes('No product API endpoint configured')) {
            showErrorState('To display sale products, please configure a product API endpoint. Set the window.PRODUCTS_API_URL variable or provide your product API details.');
        } else {
            showErrorState(`Failed to load products: ${error.message}`);
        }
    }
}

function getApiEndpoint() {
    // Check for environment variable or return null if not available
    // In a real application, this would be set via environment variables
    return window.PRODUCTS_API_URL || null;
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

function showEmptyState(message = 'No sale products are currently available.') {
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
    const discountPercent = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100);
    const imageUrl = product.imageUrl || generatePlaceholderImage(product.name);
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300/f8f9fa/6c757d?text=Product+Image'">
                <div class="sale-badge">-${discountPercent}%</div>
                <div class="product-actions">
                    <button class="action-btn" onclick="toggleWishlist('${product.id}')" title="Add to Wishlist">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="quickView('${product.id}')" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name)}</h3>
                <p class="product-category">${escapeHtml(product.category)}</p>
                <div class="product-pricing">
                    <span class="current-price">$${product.salePrice.toFixed(2)}</span>
                    <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
                    <span class="discount-percent">${discountPercent}% OFF</span>
                </div>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

function generatePlaceholderImage(productName) {
    const encodedName = encodeURIComponent(productName);
    return `https://via.placeholder.com/300x300/e74c3c/ffffff?text=${encodedName}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function applyFilters() {
    const categoryValue = categoryFilter.value.toLowerCase();
    const priceValue = parseFloat(priceFilter.value) || Infinity;
    const discountValue = parseFloat(discountFilter.value) || 0;
    
    filteredProducts = allProducts.filter(product => {
        // Category filter
        if (categoryValue && product.category.toLowerCase() !== categoryValue) {
            return false;
        }
        
        // Price filter
        if (product.salePrice > priceValue) {
            return false;
        }
        
        // Discount filter
        const productDiscount = ((product.originalPrice - product.salePrice) / product.originalPrice) * 100;
        if (productDiscount < discountValue) {
            return false;
        }
        
        return true;
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
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
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
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function saveCartToStorage() {
    try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cartItems = JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        cartItems = [];
    }
}

function showCartNotification(productName) {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${escapeHtml(productName)} added to cart!</span>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
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
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function toggleWishlist(productId) {
    // Wishlist functionality placeholder
    console.log('Toggle wishlist for product:', productId);
    
    // In a real application, this would save to wishlist
    const heartIcon = event.target.closest('.action-btn').querySelector('i');
    heartIcon.classList.toggle('fas');
    heartIcon.classList.toggle('far');
    
    const isAdded = heartIcon.classList.contains('fas');
    if (isAdded) {
        event.target.closest('.action-btn').style.color = 'var(--primary-color)';
    } else {
        event.target.closest('.action-btn').style.color = '';
    }
}

function quickView(productId) {
    // Quick view functionality placeholder
    console.log('Quick view for product:', productId);
    
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        alert(`Quick View: ${product.name}\nPrice: $${product.salePrice}\nCategory: ${product.category}`);
    }
}

// Error handling for image loading failures
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://via.placeholder.com/300x300/f8f9fa/6c757d?text=Image+Not+Found';
    }
}, true);

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
    // Refresh layout if needed
    if (filteredProducts.length > 0) {
        displayProducts();
    }
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
                <div class="checkout-item-price">$${item.price.toFixed(2)} each</div>
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
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        updateCartDisplay();
        saveCartToStorage();
        loadCheckoutItems();
        calculateOrderSummary();
    }
}

function decreaseQuantity(productId) {
    const item = cartItems.find(item => item.id === productId);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartDisplay();
        saveCartToStorage();
        loadCheckoutItems();
        calculateOrderSummary();
    }
}

function removeFromCheckout(productId) {
    removeFromCart(productId);
    loadCheckoutItems();
    calculateOrderSummary();
}

function calculateOrderSummary() {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 9.99 : 0;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-shipping').textContent = subtotal >= 50 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('checkout-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
    
    // Update shipping cost if free shipping applies
    if (subtotal >= 50) {
        const finalTotal = subtotal + tax;
        document.getElementById('checkout-total').textContent = `$${finalTotal.toFixed(2)}`;
    }
}

function processCheckout() {
    // Validate forms
    const shippingForm = document.getElementById('shipping-form');
    const contactForm = document.getElementById('contact-form');
    
    if (!shippingForm.checkValidity()) {
        shippingForm.reportValidity();
        return;
    }
    
    if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
    }
    
    if (cartItems.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        return;
    }
    
    // Collect order data for backend
    const orderData = collectOrderData();
    
    // Simulate processing
    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.innerHTML;
    
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    checkoutBtn.disabled = true;
    
    // Send order data to backend (replace with your actual endpoint)
    sendOrderToBackend(orderData).then(() => {
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
        contactForm.reset();
    }).catch((error) => {
        console.error('Order processing failed:', error);
        
        // Reset button
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
        
        alert('Order processing failed. Please try again or contact support.');
    });
}

function collectOrderData() {
    const shippingForm = document.getElementById('shipping-form');
    const contactForm = document.getElementById('contact-form');
    
    const formData = new FormData(shippingForm);
    const contactData = new FormData(contactForm);
    
    const orderData = {
        // Order information
        orderId: generateOrderId(),
        orderDate: new Date().toISOString(),
        
        // Cart items
        items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        
        // Order totals
        subtotal: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
        shipping: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0) >= 50 ? 0 : 9.99,
        tax: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.08,
        total: calculateOrderTotal(),
        
        // Customer information
        customer: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phoneNumber: contactData.get('phoneNumber')
        },
        
        // Shipping address
        shippingAddress: {
            street: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zip')
        }
    };
    
    return orderData;
}

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function calculateOrderTotal() {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    return subtotal + shipping + tax;
}

async function sendOrderToBackend(orderData) {
    // Replace this URL with your actual backend endpoint
    const backendUrl = window.ORDER_BACKEND_URL || '/api/orders';
    
    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Order submitted successfully:', result);
        return result;
    } catch (error) {
        console.error('Failed to submit order:', error);
        
        // For demo purposes, log the order data to console
        console.log('Order data that would be sent to backend:', orderData);
        
        // Simulate successful submission after a delay
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, orderId: orderData.orderId }), 1000);
        });
    }
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

// Add input formatting for phone number
document.addEventListener('DOMContentLoaded', function() {
    const phoneNumberInput = document.getElementById('phone-number');
    
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Format as (XXX) XXX-XXXX
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = `(${value}`;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            
            e.target.value = value;
        });
        
        // Validate phone number format
        phoneNumberInput.addEventListener('blur', function(e) {
            const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
            if (e.target.value && !phonePattern.test(e.target.value)) {
                e.target.setCustomValidity('Please enter a valid phone number in format (XXX) XXX-XXXX');
            } else {
                e.target.setCustomValidity('');
            }
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


