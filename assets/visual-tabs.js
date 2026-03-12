if (!customElements.get("visual-tabs")) {
  class VisualTabs extends HTMLElement {
    constructor() {
      super();

      this.preSlideId = null;

      this.slider = this.querySelector("slider-component");
      this.tabPanel = this.querySelector("tab-panel");
      if (!this.slider || !this.tabPanel) return;

      this.addEventListener("sliderChanged", this.onSliderChange.bind(this));
      this.addEventListener("item-active", this.onItemActive.bind(this));
    }

    onItemActive(event) {
      if (!event?.detail) return;

      const slideId = event.detail.element?.dataset.slide;
      if (slideId === this.preSlideId) return;
      this.preSlideId = slideId;

      if (slideId) this.slider.slideById(`#${slideId}`);
    }

    onSliderChange(event) {
      if (!event?.detail) return;

      const id = event.detail.currentElement?.id;
      if (!id) return;

      const tab = this.tabPanel.querySelector(`.tab[data-slide='${id}']`);
      if (tab) this.tabPanel.switchTab(tab);
    }
  }

  customElements.define("visual-tabs", VisualTabs);
}
