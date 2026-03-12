if (!customElements.get("care-service")) {
  customElements.define(
    "care-service",
    class CareService extends HTMLElement {
      constructor() {
        super();

        this.items = this.querySelectorAll(".care-item");
        if (this.items.length < 1) return;

        this.addEventListener("click", this.onItemClick.bind(this));
      }

      /**
       * Handles the click event on care items.
       * @param {Event} event - The click event object.
       */
      onItemClick(event) {
        const item = event.target.closest(".care-item");
        if (!item || !this.contains(item)) return;

        // 先取消其它的选择
        this.items.forEach((_item) => {
          if (_item !== item) _item.removeAttribute("aria-selected");
        });

        // 切换当前的
        item.toggleAttribute("aria-selected");
      }

      /**
       * Retrieves the ID of the selected care item.
       * @returns {string|null} The ID of the selected item, or null if none is selected.
       */
      getSelectedId() {
        return (
          this.querySelector(".care-item[aria-selected]")?.dataset.id ?? null
        );
      }
    },
  );
}
