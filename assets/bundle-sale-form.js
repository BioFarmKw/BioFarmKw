if (!customElements.get("bundle-sale-form")) {
  customElements.define(
    "bundle-sale-form",
    class BundleSaleForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        if (!this.form) return;

        this.isloading = false; // Loading state

        // Cart drawer reference1
        this.cartDrawer = document.getElementById("Cart-Drawer");

        // Add to cart button
        this.addCartButton = this.querySelector("button[type='submit']");

        this.boundOnSubmitHandler = this.onSubmitHandler.bind(this);
        this.boundOnChange = this.onChange.bind(this);
        this.form.addEventListener("submit", this.boundOnSubmitHandler); // 添加购物车监听
        this.form.addEventListener("change", this.boundOnChange); // 修改产品数量监听

        // 修正数量选择器边界和值
        this.setQuantityBoundaries();

        // 验证选择状态
        this.validateSelection();

        // 初始化统计总价
        this.summaryTotal();

        // 初始化数量同步监听
        if (!this.hasAttribute("data-show-quantity-selector"))
          this.bindQuantitySync();

        // Listen for cart update events and update quantity selectors
        // This handles updates from other locations, such as the cart or product page forms
        this.cartUpdateUnsubscriber = webvista.subscribe(
          PUB_SUB_EVENTS.cartUpdate,
          (event) => {
            if (event.source === "bundle-sale-form") return;

            // 查询变体是否为当前列出的变体之一
            const variantIds = Array.from(
              this.querySelectorAll("input[name='id']"),
            ).map((input) => String(input.value)); // 使用String确保类型一致
            if (!variantIds.includes(String(event.productVariantId))) return;

            // 更新数量选择器
            if (this.fetchController) this.fetchController.abort();
            this.fetchController = new AbortController();

            webvista
              .fetchHtml(
                `${window["routes"]["root_url"]}?section_id=${this.dataset.section}`,
                this.fetchController.signal,
              )
              .then((html) => {
                this.updateBundleQuantityRulers(html);
                this.setQuantityBoundaries();
                // 由于数量选择器value会被重置，所以需要重新计算总价
                this.summaryTotal();
              })
              .catch((error) => {
                // console.log(error);
              });
          },
        );
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }

        if (this.form && this.boundOnSubmitHandler) {
          this.form.removeEventListener("submit", this.boundOnSubmitHandler);
        }

        if (this.form && this.boundOnChange) {
          this.form.removeEventListener("change", this.boundOnChange);
        }

        if (this.fetchController) {
          this.fetchController.abort();
        }
      }

      /**
       * 监听变化，修改总价格
       */
      onChange(event) {
        this.validateSelection();

        // 修改总价
        setTimeout(() => {
          this.summaryTotal();
        });
      }

      /**
       * 验证产品选择状态，修改提交按钮状态
       */
      validateSelection() {
        this.noValidSelection = !this.querySelector(
          "input[name='id']:checked:not(:disabled)",
        );
        this.setButtonState(this.noValidSelection);
      }

      /**
       * 计算总价
       */
      summaryTotal() {
        const bundleProductList = Array.from(
          this.querySelectorAll(".bundle-product-card"),
        );

        const total = bundleProductList.reduce(
          (sum, item) => {
            if (!item.querySelector('input[name="id"]')?.checked) return sum;

            const price =
              parseFloat(
                item.querySelector(".card-price .price")?.dataset.value,
              ) || 0;

            const originalPrice =
              parseFloat(
                item.querySelector(".card-price .price")?.dataset.original,
              ) || price; // 没有 original 时用现价兜底

            const quantity =
              parseInt(item.querySelector("input[name='quantity']")?.value) ||
              1;

            return {
              current: sum.current + price * quantity,
              original: sum.original + originalPrice * quantity,
            };
          },
          { current: 0, original: 0 },
        );

        const priceEl = this.querySelector(".bundle-total .price");
        if (priceEl) {
          priceEl.textContent = webvista.formatPriceAmount(
            total.current,
            Shopify.currency.active,
          );
        }

        const originalEl = this.querySelector(".bundle-total .original");
        if (originalEl) {
          if (total.original > total.current) {
            // 只有原价大于现价时才显示
            originalEl.textContent = webvista.formatPriceAmount(
              total.original,
              Shopify.currency.active,
            );
          } else {
            // 否则隐藏
            originalEl.textContent = "";
          }
        }
      }

      /**
       * 处理提交购物车
       */
      onSubmitHandler(event) {
        if (this.isloading) return;
        event.preventDefault();

        // 提交到购物车
        const btn = event.submitter || this.addCartButton;
        this.addToCart(btn);
      }

      /**
       * Executes the submission to the cart
       * @param button Submit button
       */
      addToCart(button = null) {
        if (this.noValidSelection) return;

        this.startLoading();

        const config = webvista.fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";

        // 所有有效的选中的id
        const items = this.getSelectedItems();
        if (items.length <= 0) {
          this.setButtonState(); // 禁用提交按钮
          this.endLoading();
          return;
        }

        config.body = JSON.stringify({
          items: items,
          sections: this.getSectionsToRender().map(
            (section) => section.section,
          ),
        });

        fetch(`${window["routes"]["cart_add_url"]}`, config)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (response.status) {
              webvista.popToast(response.description, "error");
              return (this.error = true);
            }

            this.error = false;

            // 更新bundle产品的数量规则
            const html = new DOMParser().parseFromString(
              response["sections"][this.dataset.section],
              "text/html",
            );
            this.updateBundleQuantityRulers(html);
            // 修正数量输入框边界
            this.setQuantityBoundaries();
            // 由于数量选择器value会被重置，所以需要重新计算总价
            this.summaryTotal();

            // 过滤掉当前的Section，无需替换html
            const sectionsNeedRender = this.getSectionsToRender().filter(
              (section) => section.id !== this.id,
            );

            // 动态更新Sections内容
            SectionDynamicUpdate.updateSections(
              sectionsNeedRender,
              response["sections"],
            );

            // 发布广播事件
            // 每一个变体变化都需要发布
            items.forEach((item) => {
              webvista.publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "bundle-sale-form",
                productVariantId: item["id"],
              });
            });

            if (
              this.cartDrawer &&
              !this.cartDrawer.hasAttribute("data-status-silence")
            ) {
              // 打开抽屉
              this.cartDrawer.show(button);
            } else {
              return (window.location = window["routes"]["cart_url"]);
            }
          })
          .catch((error) => {
            // console.log(error);
            webvista.popToast(
              window["accessibilityStrings"]["unknownError"],
              "error",
            );
            this.error = true;
          })
          .finally(() => {
            this.endLoading();
          });
      }

      /**
       * Get selected items
       * @param {string} parentId Parent ID (optional)
       * @returns {Array} Returns an array of selected items, each containing ID and quantity
       */
      getSelectedItems(parentId = null) {
        return Array.from(
          this.querySelectorAll("input[name='id']:checked:not(:disabled)"),
        ).map((input) => {
          const quantityInput = input
            .closest(".bundle-product-card")
            ?.querySelector("input[name='quantity']");
          return {
            id: input.value,
            quantity: parseInt(quantityInput?.value) || 1,
            ...(parentId && { parent_id: parentId }),
          };
        });
      }

      /**
       * 绑定数量输入框与显示元素的同步
       */
      bindQuantitySync() {
        this.querySelectorAll("input[name='quantity']").forEach((input) => {
          input.addEventListener("change", (event) => {
            const value = event.target.value || 1;

            const displayElement = this.querySelector(
              `.quantity-count[data-product="${event.target.dataset.product}"]`,
            );
            if (displayElement) displayElement.textContent = value;
          });
        });
      }

      /**
       * Updates the quantity of items via external call
       * @param {number} value - The quantity to set
       */
      setItemsQuantity(value) {
        // Check if external quantity updates are allowed
        if (!this.hasAttribute("data-allow-external-quantity-update")) return;

        const quantity = value ?? 1;
        this.querySelectorAll("input[name='quantity']").forEach((input) => {
          input.value = quantity;

          // Manually trigger the change event
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }

      /**
       * 获取需要渲染的 section
       * @returns {[{section: string, id: string},{section: string, selector: string, id: string}]}
       */
      getSectionsToRender() {
        const sections = [
          {
            id: this.id,
            section: this.dataset.section,
          },
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
          {
            id: "Cart-Drawer",
            section: "cart-drawer",
            selector: ".cart-count",
          },
        ];

        if (
          this.cartDrawer &&
          !this.cartDrawer.hasAttribute("data-status-silence")
        ) {
          sections.push({
            id: "Cart-Drawer",
            section: this.cartDrawer.dataset.section,
            selector: "#Cart-Drawer-Details",
          });
        }

        return sections;
      }

      /**
       * 更新Bundle产品的数量规则
       * @param html
       */
      updateBundleQuantityRulers(html) {
        const targetQuantityInputs = this.querySelectorAll(
          "input[name='quantity']",
        );
        targetQuantityInputs.forEach((targetInput) => {
          const sourceInput = html.getElementById(targetInput.id);

          if (sourceInput) {
            const attributes = [
              "data-cart-quantity",
              "data-min",
              "data-max",
              "step",
            ];

            for (let attribute of attributes) {
              const sourceInputValue = sourceInput.getAttribute(attribute);
              if (sourceInputValue != null) {
                targetInput.setAttribute(attribute, sourceInputValue);
              }
            }
          }
        });
      }

      /**
       * 修正数量输入的边界
       */
      setQuantityBoundaries() {
        this.querySelectorAll("quantity-input").forEach((quantityInput) => {
          quantityInput.setQuantityBoundaries();
        });
      }

      startLoading() {
        this.isloading = true;

        if (this.addCartButton) {
          this.addCartButton.setAttribute("disabled", "disabled");
          this.addCartButton.classList.add("loading");
        }
      }

      endLoading() {
        this.isloading = false;

        if (this.addCartButton) {
          this.addCartButton.removeAttribute("disabled");
          this.addCartButton.classList.remove("loading");
        }
      }

      /**
       * 设置按钮状态
       * @param disabled 禁用
       */
      setButtonState(disabled = true) {
        this.addCartButton?.toggleAttribute("disabled", disabled);
      }
    },
  );
}
