# E-commerce Sale Products Page

A complete, responsive e-commerce product page designed to display sale items with full checkout functionality.

## Features

- **Responsive Design**: Mobile-first design that works on all devices
- **Product Display**: Grid layout for sale products with hover effects
- **Advanced Filtering**: Filter by category, price range, and discount percentage
- **Shopping Cart**: Add/remove items with persistent storage
- **Complete Checkout**: Full checkout process with shipping and payment forms
- **Professional UI**: Modern design with smooth animations and transitions

## Setup Instructions

### 1. Product API Configuration

To display products, configure your API endpoint by setting the global variable:

```javascript
window.PRODUCTS_API_URL = 'https://your-api-endpoint.com/products';
```

### 2. Expected API Response Format

Your API should return products in this format:

```json
{
  "products": [
    {
      "id": "unique-product-id",
      "name": "Product Name",
      "category": "electronics|clothing|home|sports",
      "originalPrice": 199.99,
      "salePrice": 89.99,
      "onSale": true,
      "imageUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### 3. Product Requirements

- Products must have `onSale: true` to appear on the sale page
- All prices should be numbers (not strings)
- Categories should match the filter options: electronics, clothing, home, sports
- Image URLs should be valid and accessible

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Checkout Features

- **Cart Management**: Add, remove, and update quantities
- **Order Summary**: Automatic calculation of subtotal, shipping, and tax
- **Shipping Form**: Complete address validation
- **Phone Payment**: Contact information for payment processing
- **Backend Integration**: Complete order data sent to backend API
- **Order Processing**: Full order placement with confirmation
- **Free Shipping**: Automatically applied for orders over $50

## Backend Integration

### Order Data Format

When an order is placed, the following data is sent to your backend:

```json
{
  "orderId": "ORD-1234567890-ABC12",
  "orderDate": "2024-01-01T12:00:00.000Z",
  "items": [
    {
      "id": "product-id",
      "name": "Product Name", 
      "price": 29.99,
      "quantity": 2,
      "total": 59.98
    }
  ],
  "subtotal": 59.98,
  "shipping": 9.99,
  "tax": 4.80,
  "total": 74.77,
  "customer": {
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "phoneNumber": "(555) 123-4567"
  },
  "shippingAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State", 
    "zipCode": "12345"
  }
}
```

### Backend Endpoint Configuration

Set your order processing endpoint:

```javascript
window.ORDER_BACKEND_URL = 'https://your-api.com/orders';
```

## Customization

### Colors and Branding

Update CSS variables in `styles.css`:

```css
:root {
    --primary-color: #e74c3c;    /* Main brand color */
    --secondary-color: #3498db;   /* Secondary accent */
    --success-color: #27ae60;     /* Success messages */
}
```

### Shipping and Tax Rates

Modify calculation logic in `script.js`:

```javascript
const shipping = subtotal >= 50 ? 0 : 9.99;  // Free shipping threshold
const tax = subtotal * 0.08;                 // Tax rate (8%)
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- Font Awesome 6.0.0 (icons)
- Google Fonts (Inter typeface)

No additional JavaScript libraries required.