if (!customElements.get("product-model")) {
  customElements.define(
    "product-model",
    class ProductModel extends DeferredMedia {
      loadContent(focus = true) {
        super.loadContent(focus);

        Shopify.loadFeatures([
          {
            name: "model-viewer-ui",
            version: "1.0",
            onLoad: this.setupModelViewerUI.bind(this),
          },
        ]);
      }

      setupModelViewerUI(errors) {
        if (errors) return;

        const modelViewer = this.querySelector("model-viewer");
        if (modelViewer) {
          this.modelViewerUI = new Shopify.ModelViewerUI(modelViewer);

          // 阻止拖拽事件冒泡，防止触发轮播拖拽
          modelViewer.addEventListener("load", () => {
            const stop = (event) => event.stopPropagation();
            ["mousedown", "mouseup", "touchstart", "touchend", "wheel"].forEach(
              (eventName) => {
                modelViewer.addEventListener(eventName, stop);
              },
            );
          });
        }
      }
    },
  );
}

window.ProductModel = {
  // use the Shopify-XR library to support AR Quick Look in iOS’s Safari, and Android’s Scene Viewer
  loadShopifyXR() {
    Shopify.loadFeatures([
      {
        name: "shopify-xr",
        version: "1.0",
        onLoad: this.setupShopifyXR.bind(this),
      },
    ]);
  },

  setupShopifyXR(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener("shopify_xr_initialized", () =>
        this.setupShopifyXR(),
      );
      return;
    }

    document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
      window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
      modelJSON.remove();
    });
    window.ShopifyXR.setupXRElements();
  },
};

window.addEventListener("DOMContentLoaded", () => {
  if (window.ProductModel) window.ProductModel.loadShopifyXR();
});
