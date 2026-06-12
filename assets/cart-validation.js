/**
 * Cart Validation Logic
 * 1. Minimum fish order must be 5 KG.
 * 2. Minimum cart value must be 10 KD to proceed.
 */

document.addEventListener('DOMContentLoaded', function() {
  
  function validateCart() {
    fetch(window.Shopify.routes.root + 'cart.js')
      .then(response => response.json())
      .then(cart => {
        let totalFishQty = 0;
        let cartTotalKD = cart.total_price / 100; // Shopify returns KWD price in cents (100 multiplier). So 20.55 KD is returned as 2055.
        
        let hasFish = false;

        cart.items.forEach(item => {
          // Check if item is fish using the hidden property we added in fill-your-basket
          if (item.properties && item.properties['_is_fish']) {
            hasFish = true;
            totalFishQty += item.quantity;
          } else if (item.product_title && item.product_title.toLowerCase().includes('fish')) {
            // Fallback: check title if property is missing
            hasFish = true;
            totalFishQty += item.quantity;
          }
        });

        const checkoutButtons = document.querySelectorAll('[name="checkout"], .checkout-btn, .cart__checkout-button');
        const validationMessageContainer = document.getElementById('cart-validation-message');
        
        let errorMessages = [];
        let isValid = true;

        if (hasFish && totalFishQty < 5) {
          errorMessages.push("Minimum fish order must be 5 KG.");
          isValid = false;
        }

        // Check 10 KD minimum cart value logic
        if (cart.items.length > 0 && cartTotalKD < 10.0) {
          errorMessages.push("Minimum cart value must be 10 KD to proceed.");
          isValid = false;
        }

        if (!isValid) {
          checkoutButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.setAttribute('aria-disabled', 'true');
          });

          // Inject error message in cart if not exists
          if (!validationMessageContainer) {
            const msgDiv = document.createElement('div');
            msgDiv.id = 'cart-validation-message';
            msgDiv.style.color = '#d32f2f';
            msgDiv.style.padding = '10px';
            msgDiv.style.marginTop = '10px';
            msgDiv.style.marginBottom = '10px';
            msgDiv.style.backgroundColor = '#ffebee';
            msgDiv.style.borderRadius = '5px';
            msgDiv.style.textAlign = 'center';
            msgDiv.style.fontWeight = 'bold';
            
            // Try to append before checkout buttons
            if (checkoutButtons.length > 0) {
              const firstBtn = checkoutButtons[0];
              if (firstBtn.parentNode) {
                firstBtn.parentNode.insertBefore(msgDiv, firstBtn);
              }
            }
          }
          
          const msgContainer = document.getElementById('cart-validation-message');
          if (msgContainer) {
            msgContainer.innerHTML = errorMessages.join('<br>');
            msgContainer.style.display = 'block';
          }

        } else {
          checkoutButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.removeAttribute('aria-disabled');
          });

          if (validationMessageContainer) {
            validationMessageContainer.style.display = 'none';
          }
        }
      });
  }

  // Run on load
  validateCart();

  // Run on cart update events (Shopify standard and custom)
  // We hook into standard XMLHttpRequest to detect cart updates
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('load', function() {
      if (this.responseURL && this.responseURL.includes('/cart')) {
        setTimeout(validateCart, 500); // Wait for DOM updates
      }
    });
    originalOpen.apply(this, arguments);
  };

  // Also hook into fetch
  const originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments).then(res => {
      if (res.url && res.url.includes('/cart')) {
        setTimeout(validateCart, 500);
      }
      return res;
    });
  };

  // Intercept checkout form submission just in case
  document.addEventListener('submit', function(e) {
    if (e.target.action && e.target.action.includes('/cart')) {
      const checkoutButtons = e.target.querySelectorAll('[name="checkout"]');
      if (checkoutButtons.length > 0 && checkoutButtons[0].disabled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });
});
