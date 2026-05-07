if (!customElements.get("feature-highlights")) {
  customElements.define(
    "feature-highlights",
    class FeatureHighlights extends HTMLElement {
      constructor() {
        super();

        this.featureSlider = this.querySelector("slider-component");

        this.addEventListener("click", (event) => {
          if (event.target.classList.contains("spot-button")) {
            this.onSpotClick(event.target);
          }
        });

        this.addEventListener("sliderChanged", this.onSliderChange.bind(this));
      }

      onSpotClick(spot) {
        const hasOpen = spot.getAttribute("aria-expanded") === "true";
        if (!hasOpen) {
          // 关闭其它
          this.closeAllActive();

          // 打开当前的
          spot.setAttribute("aria-expanded", "true");
          const featureSlide = document.getElementById(
            spot.getAttribute("aria-controls"),
          );
          if (!featureSlide) return;

          if (this.featureSlider)
            this.featureSlider.slideByElement(featureSlide);
        }
      }

      /**
       * 关闭所有激活的
       */
      closeAllActive() {
        this.querySelectorAll(".spot-button[aria-expanded=true]").forEach(
          (spot) => {
            spot.setAttribute("aria-expanded", "false");
          },
        );
      }

      /**
       * 处理轮播变化
       * @param {object} event
       */
      onSliderChange(event) {
        const index = event.detail?.currentIndex;
        if (index == null) return;

        this.closeAllActive();
        const spot = this.querySelector(`.spot-button:nth-child(${index + 1})`);
        if (spot) spot.setAttribute("aria-expanded", "true");
      }
    },
  );
}
