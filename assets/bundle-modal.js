if (!customElements.get("bundle-modal")) {
  customElements.define(
    "bundle-modal",
    class bundleModal extends Drawer {
      constructor() {
        super();

        this.contentContainer = this.querySelector(
          ".product-content-container",
        );

        this.applyButton = this.querySelector(".apply-button");
        if (!this.applyButton) return;

        this.boundApply = this.applyChange.bind(this);
        this.applyButton.addEventListener("click", this.boundApply);
      }

      disconnectedCallback() {
        super.disconnectedCallback();

        if (this.applyButton && this.boundApply)
          this.applyButton.removeEventListener("click", this.boundApply);

        if (this.quantityInput && this.boundQuantityChange)
          this.quantityInput.removeEventListener(
            "change",
            this.boundQuantityChange,
          );

        if (this.variantPickerSelects && this.boundOnChange)
          this.variantPickerSelects.removeEventListener(
            "change",
            this.boundOnChange,
          );
      }

      /**
       * 初始化事件监听
       * 监听变体切换和数量变化
       * @returns {void}
       */
      initEventListen() {
        this.variantPickerSelects = this.querySelector(
          ".product-variant-selects",
        );
        if (!this.variantPickerSelects) return;

        // 先解除绑定再重新绑定，防止重复绑定
        if (this.boundOnChange) {
          this.variantPickerSelects.removeEventListener(
            "change",
            this.boundOnChange,
          );
        }
        this.boundOnChange = this.onChange.bind(this);
        this.variantPickerSelects.addEventListener(
          "change",
          this.boundOnChange,
        );

        // 数量变化监听
        this.quantityInput = this.querySelector("input[name='quantity']"); // 数量输入框
        const displayCountElement = this.querySelector(`.quantity-count`);
        if (displayCountElement && this.quantityInput) {
          if (this.boundQuantityChange) {
            this.quantityInput.removeEventListener(
              "change",
              this.boundQuantityChange,
            );
          } // 先解绑

          this.boundQuantityChange = (event) => {
            displayCountElement.textContent = event.target.value || 1;
          };
          this.quantityInput.addEventListener(
            "change",
            this.boundQuantityChange,
          );
        }
      }

      show(opener) {
        super.show(opener);

        // 关闭 sticky header，防止遮挡
        const stickyHeader = document.getElementById("Header-Sticky");
        if (stickyHeader) stickyHeader.hide?.();

        if (this.openedBy) {
          this.productUrl = this.openedBy.getAttribute("data-product-url");
          this.variantId = parseInt(
            this.openedBy.getAttribute("data-variant-id"),
          ); // 变体id

          this.bundleProductCard = this.openedBy.closest(
            ".bundle-product-card",
          ); // 产品卡片
          if (this.bundleProductCard)
            this.bundleQuantityInput = this.bundleProductCard.querySelector(
              "input[name='quantity']",
            ); // 数量输入框
        } else if (window.Shopify.designMode) {
          this.productUrl = this.dataset.productUrl;
          this.variantId = this.dataset.variantId;
        }
        if (!this.variantId || !this.productUrl) return;

        this.variantData = null;
        this.showPlaceholder();

        if (this.fetchController) this.fetchController.abort();
        this.fetchController = new AbortController();

        webvista
          .fetchHtml(
            `${this.productUrl}?section_id=${this.dataset.section}&variant=${this.variantId}`,
            this.fetchController.signal,
          )
          .then((html) => {
            const sourceContentHtml = html.querySelector(
              "template.template-product",
            )?.innerHTML;

            if (sourceContentHtml)
              this.contentContainer.innerHTML = sourceContentHtml;

            // 获取变体信息
            this.getCurrentVariant();

            // 设置数量选择器的边界约束
            const quantity = this.querySelector("quantity-input");
            if (quantity) quantity.setQuantityBoundaries();

            if (this.bundleQuantityInput) {
              // 同步数量
              this.quantityInput = this.querySelector("input[name='quantity']");
              if (this.quantityInput)
                this.updateQuantity(
                  this.quantityInput,
                  this.bundleQuantityInput,
                );
            }

            // 初始化事件监听
            this.initEventListen();

            // 重新初始化一些监听
            webvista.initLazyImages();
            webvista.initToolTips();
          })
          .catch((error) => {
            // console.log(error);
            this.hide();
          });
      }

      hide() {
        if (this.fetchController) this.fetchController.abort(); // 暂停未完成的fetch

        super.hide();
      }

      /**
       * 应用变体选择
       * @returns {void}
       */
      applyChange() {
        if (!this.openedBy) return;

        // 获取变体信息
        const variantTitle = this.querySelector(
          ".product-info-card .info-options",
        );
        const variantPrice = this.querySelector(
          ".product-info-card .info-price .price",
        );
        const variantImage = this.querySelector(
          ".product-info-card .info-media",
        );

        // 修改变体相关
        this.openedBy.setAttribute("data-variant-id", this.currentVariant.id);
        this.openedBy.textContent = variantTitle.textContent;
        this.bundleProductCard.querySelector("input[name='id']").value =
          this.currentVariant.id;
        this.bundleProductCard.querySelector(".card-media .media").innerHTML =
          variantImage.innerHTML;
        this.bundleProductCard
          .querySelector(".card-price .price")
          .replaceWith(variantPrice.cloneNode(true));

        // 同步数量
        if (this.bundleQuantityInput && this.quantityInput) {
          this.updateQuantity(this.bundleQuantityInput, this.quantityInput);
        }

        // 触发change事件
        this.bundleProductCard.dispatchEvent(
          new Event("change", { bubbles: true }),
        );

        this.hide();
      }

      /**
       * 更新数量
       * @param {HTMLElement} targetElement 目标输入框
       * @param {HTMLElement} sourceElement 来源输入框
       */
      updateQuantity(targetElement, sourceElement) {
        if (targetElement && sourceElement) {
          targetElement.value = sourceElement.value;

          // Manually trigger the change event
          targetElement.dispatchEvent(new Event("change", { bubbles: false })); // 不冒泡，仅作为同步 display 数量
        }
      }

      /**
       * 监听变体选项变化和数量变化
       */
      onChange(event) {
        const inputElement = event.target;
        if (!inputElement) return;

        if (
          (inputElement.tagName === "INPUT" && inputElement.type === "radio") ||
          inputElement.tagName === "SELECT"
        ) {
          this.updateOptions(event.target); // 获取当前选择的属性id集合
          this.renderProductInfo(event.target);
        }
      }

      /**
       * 获取选择器每个属性的值id数组
       * 返回值的集合数组
       * @param target
       */
      updateOptions(target) {
        if (target.tagName === "SELECT" && target.selectedOptions.length) {
          const selectedOption = Array.from(target.options).find((option) =>
            option.getAttribute("selected"),
          );
          if (selectedOption) selectedOption.removeAttribute("selected");

          target.selectedOptions[0].setAttribute("selected", "selected");
        }

        this.optionValueIds = Array.from(
          this.querySelectorAll(
            "select option:checked, fieldset input:checked",
          ),
        )
          .map((element) => element.dataset.optionValueId)
          .filter(Boolean);
      }

      /**
       * 获取当前变体json对象
       */
      getCurrentVariant() {
        const json = this.querySelector(
          "script[data-selected-variant]",
        ).textContent;
        this.currentVariant = !!json ? JSON.parse(json) : null;
      }

      /**
       * 重新渲染产品信息
       * @param target
       */
      renderProductInfo(target = null) {
        this.startLoading();

        if (this.fetchController) this.fetchController.abort();
        this.fetchController = new AbortController();

        webvista
          .fetchHtml(
            `${this.productUrl}?section_id=${this.dataset.section}&option_values=${this.optionValueIds.join(",")}`,
            this.fetchController.signal,
          )
          .then((html) => {
            const sourceContent = html.querySelector(
              "template.template-product",
            )?.content;
            if (!sourceContent) return;

            const needReplaceSelectors = [
              ".product-info-card .info-media",
              ".product-info-card .info-options",
              ".product-info-card .info-price .price",
              ".product-variant-selects",
            ];
            needReplaceSelectors.forEach((selector) => {
              const source = sourceContent.querySelector(selector);
              const target = this.querySelector(selector);

              if (source && target) target.replaceWith(source);
            });

            // 获取当前变体id
            this.getCurrentVariant();

            // 重新监听事件
            this.initEventListen();

            // 重新初始化一些监听
            webvista.initLazyImages();
            webvista.initToolTips();
          })
          .catch((error) => {
            // console.log(error);
            this.hide();
          })
          .finally(() => {
            if (target) document.querySelector(`#${target.id}`)?.focus();
            this.endLoading();
          });
      }

      /**
       * 显示占位符
       */
      showPlaceholder() {
        this.contentContainer.innerHTML = this.querySelector(
          "template.template-placeholder",
        ).innerHTML;
      }

      startLoading() {
        if (this.variantPickerSelects)
          this.variantPickerSelects.setAttribute("aria-disabled", "true");
        if (this.applyButton) this.applyButton.classList.add("disabled");
      }

      endLoading() {
        if (this.variantPickerSelects)
          this.variantPickerSelects.removeAttribute("aria-disabled");
        if (this.applyButton) this.applyButton.classList.remove("disabled");
      }
    },
  );
}
