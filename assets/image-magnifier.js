if (!customElements.get("image-magnifier")) {
  customElements.define(
    "image-magnifier",
    class ImageMagnifier extends HTMLElement {
      constructor() {
        super();

        if (!webvista.hasMouse()) return; // 无鼠标禁用

        this.image = this.querySelector("img");
        if (!this.image) return;

        this.isMagnifying = false; // 是否正在放大
        this.scale = parseFloat(this.getAttribute("data-scale")) || 1.5; // 放大倍数
      }

      connectedCallback() {
        this.boundOnClick = this.onClick.bind(this);
        this.addEventListener("click", this.boundOnClick);
      }

      disconnectedCallback() {
        if (this.isMagnifying) this.closeMagnifier(); // 关闭已经打开放大器

        if (this.boundOnClick)
          this.removeEventListener("click", this.boundOnClick);

        if (this.boundOnMouseMove)
          this.removeEventListener("mousemove", this.boundOnMouseMove);

        if (this.boundOnMouseLeave)
          this.removeEventListener("mouseleave", this.boundOnMouseLeave);

        if (this.boundOnKeyup)
          document.removeEventListener("keyup", this.boundOnKeyup);
      }

      onClick(event) {
        if (this.isMagnifying) {
          // 关闭放大器
          this.closeMagnifier();
        } else {
          // 打开放大器
          this.openMagnifier(event);
        }
      }

      onKeyup(event) {
        if (event.code && event.code.toUpperCase() === "ESCAPE")
          this.closeMagnifier();
      }

      onMouseMove(event) {
        this.updateMagnifierPosition(event);
      }

      onMouseLeave() {
        this.closeMagnifier(); // 关闭放大器
      }

      /**
       * 打开放大器
       * @param {MouseEvent} event
       */
      openMagnifier(event) {
        if (this.isMagnifying) return;
        this.magnifier = document.getElementById("Magnifier");
        if (!this.magnifier) {
          this.magnifier = document.createElement("div");
          this.magnifier.id = "Magnifier";
          this.magnifier.className = "magnifier hidden"; // 先隐藏
          this.magnifier.ariaHidden = true; // 无障碍隐藏

          // 插入到 body 最后
          document.body.appendChild(this.magnifier);
        } else {
          this.magnifier.innerHTML = ""; // 清空，可重用，防止放大镜意外关闭
        }

        // 插入图片
        this.magnifierImage = this.image.cloneNode(true);
        this.magnifier.appendChild(this.magnifierImage);

        // 设置初始化信息：放大器位置，图片尺寸
        const baseRect = (this.image || this).getBoundingClientRect();
        const targetW = Math.round(baseRect.width * this.scale);
        const targetH = Math.round(baseRect.height * this.scale);
        this.magnifierImage.style.width = `${targetW}px`;
        this.magnifierImage.style.height = `${targetH}px`;

        // 添加移动监听
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseLeave = this.onMouseLeave.bind(this);
        this.addEventListener("mousemove", this.boundOnMouseMove);
        this.addEventListener("mouseleave", this.boundOnMouseLeave);

        // 监听键盘事件
        this.boundOnKeyup = this.onKeyup.bind(this);
        document.addEventListener("keyup", this.boundOnKeyup);

        // 获取位置信息
        this.updateMagnifierPosition(event);

        this.isMagnifying = true; // 记录状态
        this.classList.add("is-magnifying");

        // 显示放大镜
        this.magnifier.classList.remove("hidden");
      }

      /**
       * 关闭放大器
       * @returns
       */
      closeMagnifier() {
        if (!this.magnifier || !this.isMagnifying) return;

        this.magnifier.classList.add("hidden");
        this.magnifier.innerHTML = ""; // 清空
        this.isMagnifying = false;
        this.classList.remove("is-magnifying");

        // 关闭移动监听
        if (this.boundOnMouseMove) {
          this.removeEventListener("mousemove", this.boundOnMouseMove);
          this.boundOnMouseMove = null; // 防止重复解除
        }

        if (this.boundOnMouseLeave) {
          this.removeEventListener("mouseleave", this.boundOnMouseLeave);
          this.boundOnMouseLeave = null; // 防止重复解除
        }

        if (this.boundOnKeyup) {
          document.removeEventListener("keyup", this.boundOnKeyup);
          this.boundOnKeyup = null;
        }
      }

      /**
       * 设置放大器位置
       * @param {MouseEvent} event
       * @returns
       */
      updateMagnifierPosition(event) {
        if (!this.magnifier || !this.magnifierImage) return;

        const rect = this.getBoundingClientRect(); // 容器定位

        const magnifyPositionX = event.clientX; // 放大器x坐标位置
        const magnifyPositionY = event.clientY; // 放大器y坐标位置
        const imageOffsetX = (magnifyPositionX - rect.left) * this.scale; // 图片偏移x位置
        const imageOffsetY = (magnifyPositionY - rect.top) * this.scale; // 图片偏移y位置

        this.magnifier.style.insetInlineStart = `${magnifyPositionX}px`;
        this.magnifier.style.insetBlockStart = `${magnifyPositionY}px`;
        this.magnifierImage.style.transform = `translate(-${imageOffsetX}px, -${imageOffsetY}px)`;
      }
    },
  );
}
