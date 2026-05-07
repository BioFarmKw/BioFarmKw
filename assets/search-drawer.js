if (!customElements.get("search-drawer")) {
  customElements.define(
    "search-drawer",
    class SearchDrawer extends Drawer {
      constructor() {
        super();

        this.recommendationByHistory = this.querySelector(
          "recommendation-by-history",
        );
      }

      show(opener) {
        super.show(opener);

        if (this.recommendationByHistory) {
          this.recommendationByHistory.showContent();
        }
      }

      hide() {
        super.hide();

        if (this.recommendationByHistory) {
          this.recommendationByHistory.abortFetch();
        }
      }
    },
  );
}
