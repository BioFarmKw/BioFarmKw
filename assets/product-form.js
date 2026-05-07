/**
 * Handles the add-to-cart operation.
 */
if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector("form");
        if (!this.form) return;

        this.isloading = false;
        this.error = false;
        if (this.variantIdInput) this.variantIdInput.disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this)); // Add event listener for form submission

        // Bundle Sale form initialization
        this.bundleSale = document.getElementById(
          `Bundle-Sale-${this.dataset.section}`,
        );
        // Care Service
        this.CareService = document.getElementById(
          `Care-Service-${this.dataset.section}`,
        );
        // Listen for changes in the main product quantity and synchronize the quantity with bundled products
        if (this.bundleSale) {
          const QuantityInput = document.getElementById(
            `Quantity-${this.dataset.section}`,
          );
          if (QuantityInput)
            QuantityInput.addEventListener("change", (event) => {
              this.bundleSale.setItemsQuantity(event.target.value);
            });
        }

        this.addCartButton = this.querySelector('button[type="submit"]'); // 添加购物车按钮
        this.miniAddCartButton = document.getElementById(
          `Mini-Submit-Button-${this.dataset.section}`,
        ); // 迷你结账按钮

        // 设置添加购物车按钮相关的辅助设备属性
        this.cartDrawer = document.getElementById("Cart-Drawer");
        if (
          this.cartDrawer &&
          !this.cartDrawer.hasAttribute("data-status-silence")
        ) {
          if (this.addCartButton) {
            this.addCartButton.setAttribute("aria-haspopup", "dialog");
            this.addCartButton.setAttribute("aria-expanded", "false");
            this.addCartButton.setAttribute("aria-controls", "Cart-Drawer");
          }

          if (this.miniAddCartButton) {
            this.miniAddCartButton.setAttribute("aria-haspopup", "dialog");
            this.miniAddCartButton.setAttribute("aria-expanded", "false");
            this.miniAddCartButton.setAttribute("aria-controls", "Cart-Drawer");
          }
        }

        // 错误消失提示容器
        this.errorMessageWrapper = document.getElementById(
          `Product-Form-Error-Message-${this.dataset.section}`,
        );

        // 如果是在快速预览抽屉内
        // 只有快速预览抽屉会给其添加data-original-section属性
        if (this.hasAttribute("data-original-section")) {
          this.quickAddDrawer = document.getElementById(
            "Product-Quick-View-Drawer",
          );
        }

        // 迷你结账相关
        this.miniChecker = document.getElementById(
          `Mini-Check-${this.dataset.section}`,
        );
        if (this.miniChecker) {
          let isMiniCheckShouldHide = true; // 是否应该隐藏迷你结账
          // 如果迷你结账存在，添加相关事件监听
          this.productFormObserver = new IntersectionObserver(
            (entries, observer) => {
              const rootBoundsTop = entries[0].rootBounds?.top || 0; // 防止iframe中（模板编辑器中）无法获取 rootBounds 属性
              if (entries[0].isIntersecting) {
                isMiniCheckShouldHide = true;
                this.hideMiniCheck();
              } else if (entries[0].boundingClientRect.top < rootBoundsTop) {
                isMiniCheckShouldHide = false;
                this.showMiniCheck();
              }
            },
            {
              root: null,
              rootMargin: "-200px 0px 200px 0px",
            },
          );
          this.productFormObserver.observe(this);

          // 监听页脚显示，出现的话需要隐藏迷你结账，防止遮挡
          const footer = document.getElementById("Page-Footer");
          if (footer) {
            this.footerObserver = new IntersectionObserver(
              (entries) => {
                if (entries[0].isIntersecting) {
                  this.hideMiniCheck();
                } else {
                  if (!isMiniCheckShouldHide) this.showMiniCheck();
                }
              },
              {
                root: null,
                rootMargin: "0px 0px 0px 0px",
              },
            );

            // 监听页脚元素
            this.footerObserver.observe(footer);
          }

          // 同步数量
          const quantityInput = document.getElementById(
            `Quantity-${this.dataset.section}`,
          );
          if (quantityInput)
            quantityInput.addEventListener("change", (event) => {
              const miniQuantityInput = document.getElementById(
                `Mini-Quantity-${this.dataset.section}`,
              );
              if (miniQuantityInput) {
                // 同步数量
                miniQuantityInput.value = event.target.value;

                // 触发目标元素的change事件，不许冒泡
                miniQuantityInput.dispatchEvent(
                  new Event("change", { bubbles: false }),
                );
              }
            });
        }
      }

      disconnectedCallback() {
        if (this.productFormObserver) this.productFormObserver.disconnect();
        if (this.footerObserver) this.footerObserver.disconnect();
      }

      get variantIdInput() {
        return this.form.querySelector("[name=id]");
      }

      /**
       * 是否隐藏错误信息
       * 当产品是礼品卡的时候，隐藏错误信息
       * @returns {boolean}
       */
      get hideErrors() {
        return this.dataset.hideErrors === "true";
      }

      /**
       * 处理点击提交购物车
       * @param event
       */
      onSubmitHandler(event) {
        if (this.isloading) return;
        event.preventDefault();

        if (this.addCartButton.hasAttribute("disabled")) return;

        this.handleErrorMessage();
        this.startLoading();

        const config = webvista.fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers[
          "Content-Type"
        ]; /* 浏览器会自动为 formData 对象生成带有边界(boundary)的 multipart/form-data 类型*/

        // 获取表单值
        const formData = new FormData(this.form); // 原表单数据

        // 判断是否有捆绑销售
        if (this.bundleSale) {
          const bundleItems = this.bundleSale.getSelectedItems(
            formData.get("id"),
          ); // 获取所有已选的捆绑产品

          if (bundleItems.length > 0)
            bundleItems.forEach((item, index) => {
              formData.append(`items[][id]`, item["id"]);
              formData.append(`items[][quantity]`, item["quantity"]);
              formData.append(`items[][parent_id]`, item["parent_id"]);
            });
        }

        // 判断是否有Care服务
        if (this.CareService) {
          const careId = this.CareService.getSelectedId();
          if (careId) {
            formData.append(`items[][id]`, careId);
            formData.append(`items[][quantity]`, formData.get("quantity"));
            formData.append(`items[][parent_id]`, formData.get("id"));
          }
        }

        formData.append(
          "sections",
          this.getSectionsToRender()
            .map((section) => section.section)
            .join(),
        );
        formData.append("sections_url", window.location.pathname);
        config.body = formData;

        fetch(`${window["routes"]["cart_add_url"]}`, config)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (response.status) {
              webvista.publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message,
              });

              this.handleErrorMessage(response.description);
              return (this.error = true);
            }
            this.error = false;

            // 动态更新Sections内容
            SectionDynamicUpdate.updateSections(
              this.getSectionsToRender(),
              response["sections"],
            );

            // 发布购物车更新事件
            webvista.publish(PUB_SUB_EVENTS.cartUpdate, {
              source: "product-form",
              productVariantId: formData.get("id"),
            });

            if (
              this.cartDrawer &&
              !this.cartDrawer.hasAttribute("data-status-silence")
            ) {
              // 打开抽屉
              this.cartDrawer.show(event.submitter);
            } else {
              return (window.location = window["routes"]["cart_url"]);
            }
          })
          .catch((error) => {
            this.handleErrorMessage(
              window["accessibilityStrings"]["unknownError"],
            );
            this.error = true;
          })
          .finally(() => {
            this.endLoading();
          });
      }

      /**
       * 获取需要重新渲染的位置
       * @returns {[{section: string, selector: string, id: string}]}
       */
      getSectionsToRender() {
        const sections = [
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
       * 错误显示
       * @param errorMessage
       */
      handleErrorMessage(errorMessage = null) {
        if (this.hideErrors || !this.errorMessageWrapper) return;

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);
        this.errorMessageWrapper.textContent = errorMessage ? errorMessage : "";
      }

      startLoading() {
        this.isloading = true;

        this.addCartButton.setAttribute("disabled", "disabled");
        this.addCartButton.classList.add("loading");

        if (this.miniAddCartButton) {
          this.miniAddCartButton.setAttribute("disabled", "disabled");
          this.miniAddCartButton.classList.add("loading");
        }
      }

      endLoading() {
        this.isloading = false;

        this.addCartButton.removeAttribute("disabled");
        this.addCartButton.classList.remove("loading");

        if (this.miniAddCartButton) {
          this.miniAddCartButton.removeAttribute("disabled");
          this.miniAddCartButton.classList.remove("loading");
        }

        // 关闭快速预览
        if (!this.error && this.quickAddDrawer) {
          this.quickAddDrawer.hide();
        }
      }

      showMiniCheck() {
        if (this.miniChecker) this.miniChecker.classList.add("active");
      }

      hideMiniCheck() {
        if (this.miniChecker) this.miniChecker.classList.remove("active");
      }
    },
  );
}
