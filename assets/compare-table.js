/**
 * 用于产品对比表格
 * 监听 swatch 点击用于切换显示变体图片
 */
if (!customElements.get("compare-table")) {
  customElements.define(
    "compare-table",
    class CompareTable extends HTMLElement {
      constructor() {
        super();

        this.initSwatchListeners();

        if (!webvista.isMobileScreen()) {
          this.initZebra(); // 初始化斑马线
          this.initCellHoverDistance(); // 初始化列焦点
        }

        // 设计模式或者调试模式
        if (window.Shopify.designMode || window.debug) {
          this.unwatchDesktopEnter = webvista.watchDesktopEnter(() => {
            this.initZebra();
            this.initCellHoverDistance();
          });
        }
      }

      disconnectedCallback() {
        this.destroySwatchListeners();

        if (window.Shopify.designMode || window.debug) {
          if (this.unwatchDesktopEnter) this.unwatchDesktopEnter();
        }
      }

      /**
       * 初始化斑马线
       */
      initZebra() {
        this.querySelectorAll(".table-row").forEach((row, idx) => {
          if ((idx + 1) % 2 === 0) {
            // 偶数行（从1开始数）
            row.classList.add("zebra-row");
          }
        });
      }

      /**
       * 监听鼠标移动到 td/th，获取其左右距离
       */
      initCellHoverDistance() {
        // 激活第一个 th
        const firstHeaderCell = this.querySelector("th:not(.field-name-th)");
        if (firstHeaderCell) this.updateCellHoverPosition(firstHeaderCell);

        // 监听鼠标悬浮
        this.addEventListener("mouseover", (event) => {
          const cell = event.target.closest("td, th");
          this.updateCellHoverPosition(cell);
        });
      }

      /**
       * 获取当前激活cell位置
       * @param {Element} cell
       * @returns
       */
      updateCellHoverPosition(cell) {
        // 排除行标题
        if (
          !cell ||
          cell.classList.contains("field-name-td") ||
          cell.classList.contains("field-name-th")
        ) {
          return;
        }

        const cellRect = cell.getBoundingClientRect();
        const tableRect = this.getBoundingClientRect();

        const left = cellRect.left - tableRect.left;
        const right = tableRect.right - cellRect.right;

        this.style.setProperty("--cell-left", `${left}px`);
        this.style.setProperty("--cell-right", `${right}px`);
      }

      /**
       * 只监听含有 data-swatch-synergy 属性的父级下的第一个 color-swatches
       */
      initSwatchListeners() {
        this.boundOnSwatchesClick = this.onSwatchesClick.bind(this);
        this.swatchElements = this.querySelectorAll(
          "[data-swatch-synergy] .color-swatches",
        );

        this.swatchElements.forEach((swatches) => {
          swatches.addEventListener("click", this.boundOnSwatchesClick);
        });
      }

      /**
       * 解绑 swatch 监听
       */
      destroySwatchListeners() {
        if (!this.swatchElements || !this.boundOnSwatchesClick) return;

        this.swatchElements.forEach((swatches) => {
          swatches.removeEventListener("click", this.boundOnSwatchesClick);
        });
      }

      onSwatchesClick(event) {
        event.preventDefault();
        event.stopPropagation();

        const swatch = event.target.closest(".color-swatch");
        if (!swatch) return;

        const index = swatch.getAttribute("data-index");
        const column = swatch.closest("td").dataset.id;

        const currentSwatch = event.currentTarget.querySelector(
          ".color-swatch.active",
        );
        if (currentSwatch) this.toggleSwatch(currentSwatch, column, false);
        if (swatch !== currentSwatch) this.toggleSwatch(swatch, column);
      }

      /**
       * 切换 swatch 激活状态
       * @param swatch
       * @param column
       * @param active
       */
      toggleSwatch(swatch, column, active = true) {
        const variantImage = this.querySelector(
          `.product-variant-image[data-index='${column}-${swatch.dataset.index}']`,
        );
        if (!variantImage) return;

        if (active) {
          swatch.classList.add("active");
          variantImage.classList.remove("hidden");
          variantImage.parentElement.classList.add("has-swatch-active");
        } else {
          swatch.classList.remove("active");
          variantImage.classList.add("hidden");
          variantImage.parentElement.classList.remove("has-swatch-active");
        }
      }
    },
  );
}
