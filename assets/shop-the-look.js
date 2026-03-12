if (!customElements.get("shop-the-look")) {
  customElements.define(
    "shop-the-look",
    class ShopTheLook extends HTMLElement {
      constructor() {
        super();

        this.lookImage = this.querySelector(".shop-the-look-image");
        if (this.lookImage) {
          // 初始化设置
          this.bundleItems = Array.from(this.querySelectorAll(".bundle-item"));

          this.lookImage.addEventListener("mouseover", (event) => {
            if (event.target.classList.contains("spot-button")) {
              this.onMouseOverSpot(event.target);
            }
          });
          this.lookImage.addEventListener("mouseout", (event) => {
            if (event.target.classList.contains("spot-button")) {
              this.onMouseOutSpot(event.target);
            }
          });

          this.bundleItems.forEach((item) => {
            item.addEventListener(
              "mouseenter",
              this.onMouseEnterItem.bind(this),
            );
            item.addEventListener(
              "mouseleave",
              this.onMouseLeaveItem.bind(this),
            );
          });
        }
      }

      /**
       * 鼠标悬停在 spot 上时的处理
       * @param {Element} spot
       */
      onMouseOverSpot(spot) {
        this.activeSpot(spot);
      }

      /**
       * 鼠标离开 spot 时的处理
       * @param {Element} spot
       */
      onMouseOutSpot(spot) {
        this.inactiveSpot(spot);
      }

      /**
       * 激活 spot
       * @param {Element} spot
       */
      activeSpot(spot) {
        this.classList.add("has-active");
        spot.classList.add("active");

        // 激活对应的产品
        const productCard = document.getElementById(
          spot.getAttribute("aria-controls"),
        );
        if (productCard) productCard.classList.add("active");
      }

      /**
       * 取消激活 spot
       * @param {Element} spot
       */
      inactiveSpot(spot) {
        spot.classList.remove("active");
        this.classList.remove("has-active");

        // 取消激活对应的产品
        const productCard = document.getElementById(
          spot.getAttribute("aria-controls"),
        );
        if (productCard) productCard.classList.remove("active");
      }

      /**
       * 鼠标进入产品项时的处理
       * @param {Event} event
       */
      onMouseEnterItem(event) {
        const spot = this.querySelector(
          `.spot-button[aria-controls="${event.currentTarget.id}"]`,
        );
        if (spot) this.activeSpot(spot);
      }

      /**
       * 鼠标离开产品项时的处理
       * @param {Event} event
       */
      onMouseLeaveItem(event) {
        const spot = this.querySelector(
          `.spot-button[aria-controls="${event.currentTarget.id}"]`,
        );
        if (spot) this.inactiveSpot(spot);
      }
    },
  );
}
