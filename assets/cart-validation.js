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
        let cartTotalKD = cart.total_price / 1000; // Shopify returns price in cents, if currency is KD, it might be 1000 fils = 1 KD. 
        // Wait, standard Shopify handles 3 decimal places for KWD as x1000. So 10000 = 10 KD.
        // Let's assume cart.total_price / 1000 for KWD. Or just use cart.total_price. If the minimum is 10 KD, it's 10 * 1000 = 10000 in Shopify cents.
        
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

        // Shopify typically stores KWD in 3 decimal places, so 10 KD is 10000. 
        // Some themes format it. Let's use 10000 as the threshold.
        // If the currency isn't strictly 1000 multiplier, this might be an issue. Let's assume standard Shopify setup for KWD (1 KWD = 1000 fils).
        if (cart.items.length > 0 && cart.total_price < 10000) {
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
