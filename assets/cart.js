/**
 * 删除购物车 Item
 */
if (!customElements.get("cart-remove")) {
  customElements.define(
    "cart-remove",
    class CartRemove extends HTMLElement {
      constructor() {
        super();

        this.addEventListener("click", (event) => {
          event.preventDefault();

          const cartItems = this.closest("cart-items");
          if (cartItems)
            cartItems.changeQuantity(
              this.dataset.index,
              0,
              null,
              this.dataset.variantId,
            );
        });
      }
    },
  );
}

if (!customElements.get("cart-items")) {
  customElements.define(
    "cart-items",
    class CartItems extends HTMLElement {
      constructor() {
        super();

        // 监听修改事件
        this.debouncedOnChange = webvista.throttle(
          this.onChange.bind(this),
          ON_CHANGE_DEBOUNCE_TIMER,
        );
        this.addEventListener("change", this.debouncedOnChange);

        this.sectionId = this.dataset.section;
        this.inDrawer = this.hasAttribute("data-in-drawer"); // 是否在抽屉中
        if (this.inDrawer) {
          // 获取焦点陷进抽屉
          this.drawerTrap = this.closest("[data-trap]");
        }

        this.lineItemStatusElement = document.getElementById(
          `Cart-Line-Item-Status-${this.sectionId}`,
        ); // 辅助设备状态管理
        this.cartItemsContainer = document.getElementById(
          `Cart-Items-${this.sectionId}`,
        );
      }

      /**
       * 处理变化事件
       * @param event
       */
      onChange(event) {
        this.changeQuantity(
          event.target.dataset.index,
          event.target.value,
          document.activeElement,
          event.target.dataset.quantityVariantId,
        );
      }

      /**
       * Updates the quantity of a specific cart item.
       * @param {number} line - The ID of the cart item to update.
       * @param {number} quantity - The new quantity for the cart item.
       * @param {HTMLElement|null} focusableElement - The element to focus after the update, if any.
       * @param {string} variantId - The variant ID of the cart item.
       */
      changeQuantity(line, quantity, focusableElement, variantId) {
        this.enableLoading(line);

        const body = JSON.stringify({
          line,
          quantity,
          sections: [
            ...new Set(
              this.getSectionsToRender().map((section) => section.section),
            ),
          ], // 去除重复
          sections_url: window.location.pathname,
        });

        fetch(window["routes"]["cart_change_url"], {
          ...webvista.fetchConfig(),
          ...{ body },
        })
          .then((response) => {
            return response.json();
          })
          .then((responseJson) => {
            if (responseJson.errors) {
              // 用于恢复初始值
              // input.value是js属性，会随着input值变化而变化
              // inputElement.getAttribute('value') 是HTML DOM方法，用于获取初始值，这个值不会变化。
              // 为了购物车页面和购物车抽屉都有比较好的布局，每个 cart item 有两个数量输入框
              this.restoreLineItemQuantityInputs(line);
              return this.showError(responseJson.errors);
            }

            // quantity=0 表示删除item，此时 itemData = null
            const itemData = quantity > 0 ? responseJson.items[line - 1] : null;

            const updatedValue = itemData ? itemData.quantity : undefined;
            let message = "";
            const items = this.querySelectorAll(".cart-item");

            // Check if the updated quantity matches the returned quantity
            // If not, it indicates an update failure, possibly due to insufficient stock or other issues
            if (
              items.length === responseJson.items.length &&
              updatedValue !== parseInt(quantity)
            ) {
              if (typeof updatedValue === "undefined") {
                message = window["cartStrings"]["error"];
              } else {
                message = window["cartStrings"]["quantityError"].replace(
                  "[quantity]",
                  updatedValue,
                );
              }

              this.restoreLineItemQuantityInputs(line);
              return this.showError(message);
            }

            // 更新主产品数量的话（删除的话是没有itemData数据的）
            // 判断是否有捆绑的子产品，如果有的话更新子产品数量
            if (itemData) {
              const childrenItems = Array.from(
                this.querySelectorAll(
                  `.cart-item[data-parent-id="${itemData.id}"]`,
                ),
              );
              if (childrenItems.length > 0) {
                // 获取 Mainitem 数量的的变化量
                const mainItem = this.querySelector(
                  `.cart-item[data-id="${itemData.id}"]`,
                );
                const originalQuantity =
                  parseInt(
                    mainItem
                      .querySelector("input[name='updates[]']")
                      ?.getAttribute("value"),
                  ) || 1;
                const deltaQuantity = parseInt(quantity) - originalQuantity;

                const updates = childrenItems.reduce((acc, item) => {
                  const currentQuantity = parseInt(item.dataset.quantity);
                  acc[item.dataset.id] =
                    (isNaN(currentQuantity) ? 1 : currentQuantity) +
                    deltaQuantity;
                  return acc;
                }, {});

                this.updateBundleQuantity(updates, variantId, focusableElement);
                return;
              }
            }

            // 处理购物车更新
            this.handleCartUpdate(responseJson, variantId, focusableElement);
          })
          .catch((error) => {
            // console.log(error);
            // 购物车显示错误
            this.showError(window["cartStrings"]["error"]);
          })
          .finally(() => {
            this.disableLoading(line);
          });
      }

      /**
       * 批量更新捆绑产品数量
       * @param {object} updates - Key-value pairs of line IDs and their quantities
       * @param {string} variantId - The variant ID of the "main" updated item
       * @param {HTMLElement|null} focusableElement - The element to focus after the update
       */
      updateBundleQuantity(updates, variantId, focusableElement) {
        const body = JSON.stringify({
          updates,
          sections: [
            ...new Set(
              this.getSectionsToRender().map((section) => section.section),
            ),
          ], // 去除重复
          sections_url: window.location.pathname,
        });

        fetch(window["routes"]["cart_update_url"], {
          ...webvista.fetchConfig(),
          ...{ body },
        })
          .then((response) => {
            return response.json();
          })
          .then((responseJson) => {
            this.handleCartUpdate(responseJson, variantId, focusableElement);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }

      /**
       * Handles updates after changes
       * Updates the website display, manages focus, and sends broadcasts
       * @param {Object} responseJson - The response data from the server
       * @param {string} variantId - The variant ID of the updated item
       * @param {HTMLElement|null} focusableElement - The element to focus after the update, if any
       */
      handleCartUpdate(responseJson, variantId, focusableElement) {
        // 更新内容
        SectionDynamicUpdate.updateSections(
          this.getSectionsToRender(),
          responseJson.sections,
        );

        // 发送事件广播
        if (variantId) {
          webvista.publish(PUB_SUB_EVENTS.cartUpdate, {
            source: "cart-items",
            productVariantId: variantId,
          });
        }

        // 重新进入焦点陷阱
        if (focusableElement) {
          if (this.drawerTrap) {
            webvista.trapFocus(this.drawerTrap, focusableElement);
          } else {
            focusableElement.focus();
          }
        }
      }

      /**
       * 还原 Line Item 中的所有输入框的值
       * 还原为属性中的原始值
       */
      restoreLineItemQuantityInputs(line) {
        if (!line) return;

        const quantityInputs = this.querySelectorAll(
          `.quantity-input[data-index='${line}']`,
        );
        quantityInputs.forEach((input) => {
          input.value = input.getAttribute("value");
        });
      }

      /**
       * 返回需要更新的Sections
       * @returns {[{section: string, selector: string, id: string}]}
       */
      getSectionsToRender() {
        let sections = [
          {
            id: "Cart-Icon-Bubble",
            section: "cart-icon-bubble",
            selector: ".shopify-section",
          },
          {
            id: "Bottom-Cart-Bubble",
            section: "cart-icon-bubble",
            selector: ".shopify-section",
          },
        ];

        if (this.inDrawer) {
          sections = [
            ...sections,
            {
              id: "Cart-Drawer",
              section: this.sectionId,
              selector: "#Cart-Drawer-Details",
            },
            {
              id: "Cart-Drawer",
              section: this.sectionId,
              selector: ".cart-count",
            },
          ];
        } else {
          sections = [
            ...sections,
            {
              id: "Main-Cart",
              section: this.sectionId,
              selector: "#Main-Cart-Details",
            },
            {
              id: "Main-Cart",
              section: this.sectionId,
              selector: ".cart-count",
            },
          ];
        }

        return sections;
      }

      /**
       * 显示错误提示
       * @param message
       */
      showError(message = null) {
        if (!message) return;

        webvista.popToast(message, "error");
      }

      /**
       * Loading 状态
       * @param line line item
       */
      enableLoading(line = null) {
        this.cartItemsContainer.classList.add("cart-items--disabled");

        if (line) {
          const cartItemElement = this.querySelector(
            `#Cart-Item-${this.sectionId}-${line}`,
          );
          if (!cartItemElement) return;

          cartItemElement.setAttribute("aria-disabled", "true");
        }

        document.activeElement.blur();
        this.lineItemStatusElement.setAttribute("aria-hidden", "false");
      }

      /**
       * End Loading 状态
       * @param line
       */
      disableLoading(line = null) {
        this.cartItemsContainer.classList.remove("cart-items--disabled");

        if (line) {
          const cartItemElement = this.querySelector(
            `#Cart-Item-${this.sectionId}-${line}`,
          );
          if (!cartItemElement) return;

          cartItemElement.removeAttribute("aria-disabled");
        }

        this.lineItemStatusElement.setAttribute("aria-hidden", "true");
      }
    },
  );
}

if (!customElements.get("free-shipping-progress")) {
  customElements.define(
    "free-shipping-progress",
    class FreeShippingProgress extends HTMLElement {
      /**
       * data-total-amount 购物车总价金额，单位分
       * data-free-threshold 包邮门槛金额，单位元
       * data-confetti 触发彩带庆祝效果
       */
      constructor() {
        super();

        this.renderProgress();
      }

      get progressBar() {
        return this.querySelector(".free-shipping-progress");
      }

      get messageWrapper() {
        return this.querySelector(".free-shipping-message");
      }

      /**
       * 渲染包邮进度条
       */
      renderProgress() {
        const cartTotalAmount = this.dataset.totalAmount;
        const freeThreshold = this.dataset.freeThreshold;

        if (
          !webvista.isNumeric(cartTotalAmount) ||
          !webvista.isNumeric(freeThreshold)
        )
          return;

        const freeThresholdLocal =
          Math.round(parseInt(freeThreshold) * (Shopify.currency.rate || 1)) *
          100; // 门槛金额汇率转换，单位分

        let progress;
        if (cartTotalAmount - freeThresholdLocal >= 0) {
          progress = 100;
          this.messageWrapper.innerHTML =
            window["cartStrings"]["freeShippingUnlockedMessage"];
          this.classList.add("free-has-unlocked");
        } else {
          progress = (cartTotalAmount * 100) / freeThresholdLocal;

          const amountToQualify = freeThresholdLocal - cartTotalAmount;
          this.messageWrapper.innerHTML = window["cartStrings"][
            "freeShippingLockedMessage"
          ].replace(
            "[amount]",
            webvista.formatPriceAmount(
              amountToQualify,
              Shopify.currency.active,
            ),
          );
        }

        // 进度条进度
        if (this.progressBar)
          this.progressBar.style.setProperty(
            "--free-shipping-progress",
            `${progress}%`,
          );

        // 触发庆祝彩带特效
        if (this.hasAttribute("data-confetti")) {
          document.dispatchEvent(
            new CustomEvent("freeShippingUnlocked", {
              detail: { status: progress >= 100 },
            }),
          );
        }
      }
    },
  );
}

/**
 * 订单备注
 */
if (!customElements.get("cart-note-modal")) {
  customElements.define(
    "cart-note-modal",
    class CartNoteModal extends ModalDialog {
      constructor() {
        super();

        const form = this.querySelector("form");
        if (!form) return;

        this.submitButton = this.querySelector("button[type=submit]");
        form.addEventListener("submit", this.formSubmit.bind(this));
      }

      /**
       * 处理保存备注
       * @param event
       */
      formSubmit(event) {
        event.preventDefault();
        this.startLoading();

        const formData = new FormData(event.target);
        const formDataJson = Object.fromEntries(formData.entries());
        const body = JSON.stringify(formDataJson);

        fetch(window["routes"]["cart_update_url"], {
          ...webvista.fetchConfig(),
          ...{ body },
        })
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (response.error) {
              throw new Error("Cart update error");
            }

            webvista.popToast(
              window["cartStrings"]["addToNoteSuccess"],
              "success",
            );
            this.hide();
          })
          .catch((error) => {
            webvista.popToast(window["cartStrings"]["addToNoteError"], "error");
          })
          .finally(() => {
            this.endLoading();
          });
      }

      startLoading() {
        if (this.submitButton) {
          this.submitButton.classList.add("loading");
          this.submitButton.setAttribute("disabled", "disabled");
        }
      }

      endLoading() {
        if (this.submitButton) {
          this.submitButton.classList.remove("loading");
          this.submitButton.removeAttribute("disabled");
        }
      }
    },
  );
}

/**
 * 订单运费预估
 */
if (!customElements.get("shipping-calculator-modal")) {
  customElements.define(
    "shipping-calculator-modal",
    class ShippingCalculatorModal extends ModalDialog {
      static MAX_ATTEMPTS = 3;
      constructor() {
        super();

        this.asyncAttemptCount = 0; // Async请求尝试次数

        const form = this.querySelector("form");
        if (!form) return;

        form.addEventListener("submit", this.prepareRate.bind(this));

        this.submitButton = this.querySelector("button[type=submit]");
        this.successMessageElement = this.querySelector(".alert-success");
      }

      /**
       * 请求查询物流信息
       * @param event
       */
      prepareRate(event) {
        event.preventDefault();

        this.hideResults();
        this.startLoading();

        const formData = new FormData(event.target);
        const shipping_address = {
          country: formData.get("country"),
          province: formData.get("province"),
          zip: formData.get("zip"),
        };
        const body = JSON.stringify({ shipping_address: shipping_address });

        fetch(`${window["routes"]["cart_url"]}/prepare_shipping_rates.json`, {
          ...webvista.fetchConfig(),
          ...{ body },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Network response was not ok: ${response.statusText}`,
              );
            }
            return response.json();
          })
          .then((response) => {
            if (response == null || response.ok) {
              this.asyncRate({ shipping_address: shipping_address });
            } else {
              throw new Error("Prepare shipping rates error");
            }
          })
          .catch((error) => {
            this.showError();
          });
      }

      /**
       * 异步查询返回的信息
       * @param params
       */
      asyncRate(params) {
        fetch(
          `${window["routes"]["cart_url"]}/async_shipping_rates.json?` +
            this.serialize(params),
          { ...webvista.fetchConfig("json", "GET") },
        )
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (
              response != null &&
              response["shipping_rates"] != null &&
              response["shipping_rates"].length > 0
            ) {
              this.showResults(response);
            } else {
              if (
                ++this.asyncAttemptCount >= ShippingCalculatorModal.MAX_ATTEMPTS
              ) {
                this.showError();
              } else {
                setTimeout(() => this.asyncRate(params), 3000);
              }
            }
          })
          .catch((error) => {
            this.showError();
          });
      }

      startLoading() {
        if (this.submitButton) {
          this.submitButton.classList.add("loading");
          this.submitButton.setAttribute("disabled", "disabled");
        }
      }

      endLoading() {
        if (this.submitButton) {
          this.submitButton.classList.remove("loading");
          this.submitButton.removeAttribute("disabled");
        }
      }

      showError() {
        this.endLoading();
        webvista.popToast(
          window["cartStrings"]["estimateShippingError"],
          "error",
        );
      }

      /**
       * 显示查询到的结果
       * @param result
       */
      showResults(result) {
        this.endLoading();

        const rates = result["shipping_rates"];
        if (!rates || rates.length <= 0 || !this.successMessageElement) return;

        // 标题修改
        const countElement =
          this.successMessageElement.querySelector(".result-count");
        countElement.innerText = rates.length;

        // 显示查询到的物流列表
        const template =
          this.successMessageElement.querySelector("template").content; // 消息模板
        const fragment = document.createDocumentFragment();
        rates.forEach((rate) => {
          const clone = document.importNode(template, true);

          clone.querySelector(".presentment-name").textContent =
            rate["presentment-name"] || rate["name"];
          clone.querySelector(".delivery-price").textContent = window[
            "priceFormatTemplate"
          ].replace(/0([,.]0{0,2})?/, rate["price"]);

          let deliveryDate = rate["delivery_date"];
          if (rate["delivery_range"] && Array.isArray(rate["delivery_range"])) {
            if (rate["delivery_range"].length > 1) {
              if (rate["delivery_range"][0] === rate["delivery_range"][1]) {
                deliveryDate = rate["delivery_range"][0];
              } else {
                deliveryDate = rate["delivery_range"].join(" - ");
              }
            } else {
              deliveryDate = rate["delivery_range"][0];
            }
          }

          if (!deliveryDate || deliveryDate.trim() === "") {
            clone.querySelector(".delivery-date-wrapper")?.remove();
          } else {
            clone.querySelector(".delivery-date").textContent = deliveryDate;
          }

          fragment.appendChild(clone);
        });

        this.successMessageElement
          .querySelector(".message-list")
          ?.appendChild(fragment);
        this.successMessageElement.removeAttribute("hidden");
        this.endLoading();
      }

      hideResults() {
        if (this.successMessageElement) {
          this.successMessageElement.querySelector(".message-list").innerHTML =
            "";
          this.successMessageElement.setAttribute("hidden", "true");
        }
      }

      serialize(obj, prefix) {
        const str = Object.keys(obj)
          .filter((key) => obj.hasOwnProperty(key))
          .map((key) => {
            const k = prefix ? `${prefix}[${key}]` : key;
            const v = obj[key];
            return v !== null && typeof v === "object"
              ? this.serialize(v, k)
              : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
          });
        return str.join("&");
      }
    },
  );
}

/**
 * 应用折扣码
 */
if (!customElements.get("cart-code-modal")) {
  customElements.define(
    "cart-code-modal",
    class CartCodeModal extends ModalDialog {
      constructor() {
        super();

        const form = this.querySelector("form");
        if (!form) return;

        this.sectionId = this.dataset.section;
        this.codes = this.dataset.codes ? this.dataset.codes.split(",") : []; // 已经应用的折扣码

        this.submitButton = this.querySelector("button[type=submit]");
        form.addEventListener("submit", this.formSubmit.bind(this));

        this.codeList = this.querySelector(".applied-code-list");
        if (this.codeList)
          this.codeList.addEventListener("click", this.codeRemove.bind(this));
      }

      /**
       * 处理提交折扣码
       * @param {Event} event
       */
      formSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const raw = formData.get("discount");
        const code = (raw ? String(raw) : "").trim();

        if (!code) return;

        const hasCode = this.codes
          .map((c) => (c || "").trim().toLowerCase())
          .includes(code.toLowerCase());
        if (hasCode) {
          webvista.popToast(
            window["cartStrings"]["codeAlreadyApplied"],
            "warning",
          );
          return;
        }

        const updatedCodes = [...this.codes, code].join(",");
        this.updateDiscount(updatedCodes).then((response) => {
          webvista.popToast(
            window["cartStrings"]["applyCodeSuccess"],
            "success",
          );
          this.hide();
        });
      }

      /**
       * 移除折扣应用
       */
      codeRemove(event) {
        const button = event.target.closest(".remove-code-button");
        if (!button || !this.contains(button)) return;

        const code = (button.dataset.code || "").trim();

        // 过滤掉要删除的 code
        const updatedCodes = this.codes.filter(
          (c) => (c || "").trim() !== code,
        );

        // 请求更新
        this.updateDiscount(updatedCodes.join(",")).then((response) => {
          // 移除按钮对应的 DOM 节点
          button.closest(".applied-code")?.remove();

          webvista.popToast(
            window["cartStrings"]["removeCodeSuccess"],
            "success",
          );
        });
      }

      /**
       * 传入折扣码，更新购物车并刷新需要的 sections
       * 支持多个折扣码比如 'code1,code2,code3'
       * @param {string} discount
       */
      async updateDiscount(discount) {
        this.startLoading();
        const sections = [
          ...new Set(
            this.getSectionsToRender().map((section) => section.section),
          ),
        ];

        const body = JSON.stringify({
          discount,
          sections,
          sections_url: window.location.pathname,
        });

        try {
          const res = await fetch(window["routes"]["cart_update_url"], {
            ...webvista.fetchConfig(),
            ...{ body },
          });

          if (!res.ok) {
            throw new Error(`Network error: ${res.status}`);
          }

          const response = await res.json();

          if (response.error) {
            throw new Error(response.error);
          }

          // 检查无效折扣码 —— 直接抛异常
          if (Array.isArray(response.discount_codes)) {
            const invalidCodes = response.discount_codes
              .filter((d) => d && d.applicable === false)
              .map((d) => d.code);

            if (invalidCodes.length > 0) {
              const codesText = invalidCodes.join(", ");
              throw new Error(
                window["cartStrings"]["codeInvalid"].replace(
                  "[code]",
                  codesText,
                ),
              );
            }
          }

          // 正常更新 sections
          if (response.sections) {
            SectionDynamicUpdate.updateSections(
              this.getSectionsToRender(),
              response.sections,
            );
          }

          return response;
        } catch (err) {
          // 统一异常处理（包含无效折扣码和请求错误）
          webvista.popToast(err.message, "error");
          // console.error(err); // 按需调试
          throw err;
        } finally {
          this.endLoading();
        }
      }

      /**
       * 获取需要重新渲染的购物车 Section 配置
       *
       * 根据元素是否具有 `data-in-drawer` 属性，
       * 返回对应的 Section 信息数组。
       *
       * @returns {{id: string, section: string, selector: string}[]}
       */
      getSectionsToRender() {
        if (this.hasAttribute("data-in-drawer")) {
          return [
            {
              id: "Cart-Drawer",
              section: this.sectionId,
              selector: "#Cart-Drawer-Details",
            },
          ];
        } else {
          return [
            {
              id: "Main-Cart",
              section: this.sectionId,
              selector: "#Main-Cart-Details",
            },
          ];
        }
      }

      startLoading() {
        if (this.submitButton) {
          this.submitButton.classList.add("loading");
          this.submitButton.setAttribute("disabled", "disabled");
        }
      }

      endLoading() {
        if (this.submitButton) {
          this.submitButton.classList.remove("loading");
          this.submitButton.removeAttribute("disabled");
        }
      }
    },
  );
}
