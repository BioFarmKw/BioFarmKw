if (!customElements.get("mini-checkout")) {
  customElements.define(
    "mini-checkout",
    class MiniCheckout extends HTMLElement {
      constructor() {
        super();

        this.expandButton = this.querySelector(".expand-button");
        if (!this.expandButton) return;

        this.boundToggleExpand = this.toggleExpand.bind(this);
        this.expandButton.addEventListener("click", this.boundToggleExpand);

        // 监听变体切换和数量修改事件
        this.boundOnChange = this.onChange.bind(this);
        this.addEventListener("change", this.boundOnChange);
      }

      disconnectedCallback() {
        if (this.boundToggleExpand)
          this.expandButton.removeEventListener(
            "click",
            this.boundToggleExpand,
          );
        if (this.boundOnChange)
          this.removeEventListener("change", this.boundOnChange);
      }

      /**
       * 切换展开状态
       */
      toggleExpand() {
        this.classList.toggle("has-expand");
        this.expandButton.setAttribute(
          "aria-expanded",
          this.classList.contains("has-expand"),
        );
      }

      /**
       * 监听变体选择和数量选择变化
       * @param event
       */
      onChange(event) {
        const inputElement = event.target;
        if (!inputElement) return;

        const targetId = inputElement.dataset.target;
        if (!targetId) return;

        const targetInputElement = document.getElementById(targetId);
        if (!targetInputElement) return;

        if (
          targetInputElement.tagName === "INPUT" &&
          targetInputElement.type === "radio"
        ) {
          // 处理单选框
          targetInputElement.checked = true;
        } else {
          // 处理其他输入元素（如 select、text 等）
          targetInputElement.value = inputElement.value;
        }

        // 触发 change 事件
        targetInputElement.dispatchEvent(
          new Event("change", { bubbles: true }),
        );
      }
    },
  );
}
