if (!customElements.get("image-text-tabs")) {
  customElements.define(
    "image-text-tabs",
    class ImageTextTabs extends HTMLElement {
      constructor() {
        super();

        this.boundOnTabChange = this.onTabChange.bind(this);
        this.addEventListener("item-active", this.boundOnTabChange);
      }

      disconnectedCallback() {
        if (this.boundOnTabChange) {
          this.removeEventListener("item-active", this.boundOnTabChange);
        }
      }

      onTabChange(event) {
        const index = event.target?.dataset.index;
        if (!index) return;

        this.querySelectorAll(".tab-image").forEach((image) => {
          image.classList.add("hidden");
        });

        const currentImage = this.querySelector(
          `.tab-image[data-index="${index}"]`,
        );
        if (currentImage) currentImage.classList.remove("hidden");
      }
    },
  );
}
