/**
 * ProductInfo类
 * 监听【购物车变化】和【产品变体切换】
 * 处理数量规则的边界修正问题
 */
if (!customElements.get("product-info")) {
  customElements.define(
    "product-info",
    class ProductInfo extends HTMLElement {
      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;

      constructor() {
        super();

        // 记录最近浏览
        if (!!window.localStorage) this.addRecentlyViewedProduct();

        this.quantityForm = document.getElementById(
          `Quantity-Selector-${this.dataset.section}`,
        ); // 数量选择器容器
        if (this.quantityForm)
          this.quantityInput =
            this.quantityForm.querySelector("quantity-input"); // 商品数量选择器
        if (!this.quantityInput) return;

        this.miniQuantityForm = document.getElementById(
          `Mini-Quantity-Selector-${this.dataset.section}`,
        ); // 迷你数量选择器容器
        if (this.miniQuantityForm)
          this.miniQuantityInput =
            this.miniQuantityForm.querySelector("quantity-input"); // 迷你商品数量选择器

        // 初始化数量边界修正
        // 延迟处理，防止子元素未挂载完成
        setTimeout(() => {
          this.quantityInput.setQuantityBoundaries();
          if (this.miniQuantityInput)
            this.miniQuantityInput.setQuantityBoundaries(); // 迷你结账
        }, 500);

        // 订阅购物车变化
        // 快速产品预览无需订阅
        if (!this.dataset.originalSection) {
          // 订阅购物车更新 -> 获取最新的数量规则，并修正
          this.cartUpdateUnsubscriber = webvista.subscribe(
            PUB_SUB_EVENTS.cartUpdate,
            (event) => {
              if (event.productVariantId !== this.currentVariantId) return;
              this.fetchQuantityRules();
            },
          );
        }

        // 订阅产品变体变化
        this.variantChangeUnsubscriber = webvista.subscribe(
          PUB_SUB_EVENTS.variantChange,
          (event) => {
            if (
              event.data.sectionId !== this.dataset.section ||
              event.data.html == null
            )
              return;

            // 当变体发生变化，更新数量规则
            const targetQuantityForm = event.data.html.getElementById(
              `Quantity-Selector-${this.dataset.section}`,
            );
            this.updateQuantityRules(this.quantityForm, targetQuantityForm);
            // 更新输入框的输入边界
            this.quantityInput.setQuantityBoundaries();

            // 更新迷你结账数量规则
            if (this.miniQuantityForm) {
              const miniTargetQuantityForm = event.data.html.getElementById(
                `Mini-Quantity-Selector-${this.dataset.section}`,
              );
              this.updateQuantityRules(
                this.miniQuantityForm,
                miniTargetQuantityForm,
              );
              // 更新输入框的输入边界
              this.miniQuantityInput.setQuantityBoundaries();
            }
          },
        );
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }
        if (this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }
      }

      get currentVariantId() {
        return this.querySelector(
          ".product-info-price .product-form input[name='id']",
        ).value;
      }

      /**
       * Fetch重新获取最新的数量规则
       * 修正选择器边界规则
       */
      fetchQuantityRules() {
        webvista
          .fetchHtml(
            `${this.dataset.url}?variant=${this.currentVariantId}&section_id=${this.dataset.section}`,
          )
          .then((html) => {
            const targetQuantityForm = html.getElementById(
              `Quantity-Selector-${this.dataset.section}`,
            );
            this.updateQuantityRules(this.quantityForm, targetQuantityForm);
            // 更新输入框的输入边界
            this.quantityInput.setQuantityBoundaries();

            // 更新迷你结账数量规则
            if (this.miniQuantityForm) {
              const miniTargetQuantityForm = html.getElementById(
                `Mini-Quantity-Selector-${this.dataset.section}`,
              );
              this.updateQuantityRules(
                this.miniQuantityForm,
                miniTargetQuantityForm,
              );
              // 更新输入框的输入边界
              this.miniQuantityInput.setQuantityBoundaries();
            }
          })
          .catch((e) => {
            webvista.popToast(
              window["accessibilityStrings"]["unknownError"],
              "error",
            );
          });
      }

      /**
       * 更新选择器数量规则
       * .quantity-input 数量输入框，更新 data-cart-quantity, data-min, data-max, step
       * .quantity-label 当前变体已经添加购物车数量
       * @param target 当前选择器
       * @param source 目的选择器
       */
      updateQuantityRules(target, source) {
        if (!target || !source) return;

        // 处理 .quantity-input
        const targetInput = target.querySelector("input[name='quantity']");
        const updatedInput = source.querySelector("input[name='quantity']");

        if (targetInput && updatedInput) {
          const attributes = [
            "data-cart-quantity",
            "data-min",
            "data-max",
            "step",
          ];
          attributes.forEach((attribute) => {
            const valueUpdated = updatedInput.getAttribute(attribute);
            if (valueUpdated != null) {
              targetInput.setAttribute(attribute, valueUpdated);
            }
          });
        }

        // 处理 .quantity-label
        const targetLabel = target.querySelector(".quantity-label");
        const updatedLabel = source.querySelector(".quantity-label");

        if (targetLabel && updatedLabel) {
          targetLabel.innerHTML = updatedLabel.innerHTML;
        }
      }

      /**
       * 添加最近浏览记录
       */
      addRecentlyViewedProduct() {
        if (!this.dataset.id) return;

        const recentlyViewedData =
          webvista.retrieveData(RECENTLY_VIEWED_KEY) || [];
        const index = recentlyViewedData.indexOf(this.dataset.id);
        if (index !== -1) {
          recentlyViewedData.splice(index, 1); // 删除已经存在的记录
        }
        recentlyViewedData.push(this.dataset.id); // 添加新记录

        // 移出前面的元素，保持最多10个子元素
        if (recentlyViewedData.length > 10) {
          recentlyViewedData.splice(0, recentlyViewedData.length - 10);
        }

        webvista.storeData(RECENTLY_VIEWED_KEY, recentlyViewedData);
      }
    },
  );
}
