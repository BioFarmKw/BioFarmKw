if (!customElements.get("image-zoom-drag")) {
  customElements.define(
    "image-zoom-drag",
    class ImageZoomDrag extends HTMLElement {
      constructor() {
        super();
        this.isZoomed = false;
        this.scale = parseFloat(this.getAttribute("data-scale")) || 2;

        // 事件绑定
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        // 用于区分“点击”和“拖拽”的阈值
        this.DRAG_THRESHOLD = 5;

        // 记录偏移
        this.offsetX = 0;
        this.offsetY = 0;

        // 标记：拖拽完成后忽略一次 click
        this.ignoreClickOnce = false;

        // 最大可移动的距离
        this.maxTransX = 0;
        this.maxTransY = 0;

        // 失去焦点，还原
        this.addEventListener("focusout", this.zoomOut.bind(this));
      }

      connectedCallback() {
        this.image = this.querySelector("img");
        // 监听点击事件
        this.addEventListener("click", this.handleClick);
      }

      /**
       * 第一次点击放大；再次点击还原
       */
      handleClick(e) {
        // 若刚刚拖拽结束，则忽略一次点击
        if (this.ignoreClickOnce) {
          this.ignoreClickOnce = false;
          return;
        }

        // 若在拖拽过程中松开鼠标，容易触发 click
        // 这里根据 isDragging 判断
        if (this.isDragging) return;

        if (!this.isZoomed) {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      }

      /**
       * 放大逻辑
       */
      zoomIn() {
        this.isZoomed = true;
        // 复位光标
        this.style.cursor = "grab";

        // 禁用浏览器对触摸的滚动/缩放接管
        this.style.touchAction = "none";
        this.style.overscrollBehavior = "contain";
        this.style.userSelect = "none";
        this.image.style.webkitUserDrag = "none";

        // 先做放大动画
        this.image.style.transition = "transform 300ms ease";
        this.image.style.transform = `scale(${this.scale}) translate(0, 0)`;

        // 动画结束后再解绑 transition，并允许拖拽
        this.image.addEventListener(
          "transitionend",
          () => {
            this.image.style.transition = "";
            this.addEventListener("pointerdown", this.handleMouseDown, {
              passive: false,
            });
            this.calculateMaxTranslate();
          },
          { once: true },
        );
      }

      /**
       * 还原逻辑
       */
      zoomOut() {
        this.isZoomed = false;
        this.style.cursor = "zoom-in";

        // 恢复浏览器默认手势
        this.style.touchAction = "";
        this.style.overscrollBehavior = "";
        this.style.userSelect = "";

        // 解绑拖拽事件
        this.removeEventListener("pointerdown", this.handleMouseDown);
        this.removeEventListener("pointermove", this.handleMouseMove);
        document.removeEventListener("pointerup", this.handleMouseUp);

        // 恢复原样
        this.image.style.transition = "transform 300ms ease";
        this.image.style.transform = "scale(1) translate(0, 0)";

        // 同时将偏移重置
        this.offsetX = 0;
        this.offsetY = 0;
      }

      /**
       * 计算最大可拖拽的范围
       */
      calculateMaxTranslate() {
        // 获取容器和图片的尺寸
        const containerRect = this.getBoundingClientRect(); // 容器的尺寸
        const naturalWidth = this.image.naturalWidth; // 图片的原始宽度
        const naturalHeight = this.image.naturalHeight; // 图片的原始高度

        // 计算容器和图片的宽高比
        const containerAspectRatio = containerRect.width / containerRect.height;
        const imageAspectRatio = naturalWidth / naturalHeight;

        // 计算图片在容器内的显示区域
        let visibleWidth, visibleHeight;

        // 使用 object-fit: contain 的逻辑来计算图片实际显示区域的尺寸
        if (imageAspectRatio > containerAspectRatio) {
          // 图片较宽，限制宽度以适应容器
          visibleWidth = containerRect.width;
          visibleHeight = containerRect.width / imageAspectRatio;
        } else {
          // 图片较高，限制高度以适应容器
          visibleHeight = containerRect.height;
          visibleWidth = containerRect.height * imageAspectRatio;
        }

        // 放大后的尺寸
        visibleWidth *= this.scale;
        visibleHeight *= this.scale;

        // 计算最大可拖拽的范围，基于去除空白后的图片尺寸
        this.maxTransX = Math.max(
          (visibleWidth - containerRect.width) / 2 + 50,
          0,
        );
        this.maxTransY = Math.max(
          (visibleHeight - containerRect.height) / 2 + 50,
          0,
        );
      }

      /**
       * 鼠标按下，准备拖拽
       */
      handleMouseDown(e) {
        if (!this.isZoomed) return;
        e.preventDefault();

        this.isDragging = false;

        // 捕获指针，手指移出元素仍能收到 move 事件
        if (e.pointerId != null && this.setPointerCapture) {
          this.setPointerCapture(e.pointerId);
        }

        // 记录鼠标按下时的位置（相对于 document）
        this.startX = e.clientX;
        this.startY = e.clientY;

        // 记录“拖拽开始”时的偏移，用于后续累加
        this.startOffsetX = this.offsetX;
        this.startOffsetY = this.offsetY;

        this.style.cursor = "grabbing";

        // 监听移动和松开
        this.addEventListener("pointermove", this.handleMouseMove, {
          passive: false,
        });
        document.addEventListener("pointerup", this.handleMouseUp, {
          passive: false,
        });
      }

      /**
       * 鼠标移动，执行拖拽
       */
      handleMouseMove(e) {
        e.preventDefault();

        // 计算本次移动与初始点的差值
        const currentX = e.clientX;
        const currentY = e.clientY;
        const deltaX = currentX - this.startX;
        const deltaY = currentY - this.startY;

        // 若超过一定阈值才判定为拖拽，避免轻微点击就被当成拖拽
        if (
          !this.isDragging &&
          Math.hypot(deltaX, deltaY) > this.DRAG_THRESHOLD
        ) {
          this.isDragging = true;
        }

        if (!this.isDragging) return;

        // 基于之前的偏移 + 本次位移，得到新的偏移，并限制在最大移动范围内
        let newOffsetX = this.startOffsetX + deltaX;
        let newOffsetY = this.startOffsetY + deltaY;

        // 加入边缘阻尼逻辑
        // X 方向
        if (newOffsetX < -this.maxTransX) {
          const over = newOffsetX + this.maxTransX; // 负值，超出的距离
          newOffsetX = -this.maxTransX + over * 0.3; // 阻尼 (0.3倍)
        } else if (newOffsetX > this.maxTransX) {
          const over = newOffsetX - this.maxTransX; // 超出的距离
          newOffsetX = this.maxTransX + over * 0.3;
        }

        // Y 方向
        if (newOffsetY < -this.maxTransY) {
          const over = newOffsetY + this.maxTransY;
          newOffsetY = -this.maxTransY + over * 0.3;
        } else if (newOffsetY > this.maxTransY) {
          const over = newOffsetY - this.maxTransY;
          newOffsetY = this.maxTransY + over * 0.3;
        }

        // 更新偏移
        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;

        // 更新 transform
        this.image.style.transform = `translate3d(${this.offsetX}px, ${this.offsetY}px, 0) scale(${this.scale})`;
      }

      /**
       * 鼠标松开，结束拖拽
       */
      handleMouseUp(e) {
        this.style.cursor = "grab";

        // 移除移动监听
        this.removeEventListener("pointermove", this.handleMouseMove);
        document.removeEventListener("pointerup", this.handleMouseUp);

        if (e.pointerId != null && this.releasePointerCapture) {
          this.releasePointerCapture(e.pointerId);
        }

        // 若确实发生了拖拽，可能会触发一次多余的 click，这里标记忽略
        if (this.isDragging) {
          // 避免一次多余点击
          this.ignoreClickOnce = true;

          // 回弹逻辑
          let targetX = this.offsetX;
          let targetY = this.offsetY;

          if (this.offsetX < -this.maxTransX) targetX = -this.maxTransX;
          if (this.offsetX > this.maxTransX) targetX = this.maxTransX;

          if (this.offsetY < -this.maxTransY) targetY = -this.maxTransY;
          if (this.offsetY > this.maxTransY) targetY = this.maxTransY;

          this.image.style.transition = "transform 200ms ease-out";
          this.image.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(${this.scale})`;
          this.offsetX = targetX;
          this.offsetY = targetY;

          this.image.addEventListener(
            "transitionend",
            () => {
              this.image.style.transition = "";
            },
            { once: true },
          );
        }

        this.isDragging = false;
      }
    },
  );
}
