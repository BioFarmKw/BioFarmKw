// 检查是否已注册同名自定义元素，避免重复注册
if (!customElements.get("recently-viewed")) {
  class RecentlyViewed extends HTMLElement {
    constructor() {
      super();

      this.container = this.querySelector(".products-container");
      // 存储最近浏览的商品ID数组
      this.recentProductIds = [];

      // 构建请求URL
      const requestUrl = this.buildRequestUrl();
      if (!requestUrl) return this.hide();

      // 设置交叉观察器，实现懒加载
      this.observer = new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();

          // 获取商品数据
          this.fetchProductData(requestUrl);
        },
        { rootMargin: "0px 0px 400px 0px" }, // 提前400px加载
      );

      // 开始观察当前元素
      this.observer.observe(this);
    }

    // 组件卸载时清除观察器
    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }

    /**
     * 获取商品数据
     * @param {string} url - 请求URL
     */
    fetchProductData(url) {
      webvista
        .fetchHtml(url)
        .then((html) => {
          this.handleHTML(html);
        })
        .catch((error) => {
          this.hide();
        });
    }

    /**
     * 渲染商品HTML内容
     * @param {Document} html - HTML字符串
     */
    handleHTML(html) {
      // 解析HTML字符串为DOM对象
      const recentlyViewedContainer = html.querySelector("template")?.content;
      if (!recentlyViewedContainer) return this.hide();

      // 获取商品列表容器
      const productListWrapper =
        recentlyViewedContainer.querySelector(".slider-wrapper");
      const fragment = document.createDocumentFragment();

      // 按最近浏览顺序重新排序商品
      this.recentProductIds.forEach((productId) => {
        const productItem = productListWrapper.querySelector(
          `li[data-product-id="${productId}"]`,
        );

        if (productItem) {
          fragment.appendChild(productItem);
        }
      });

      // 清空容器并添加排序后的商品
      productListWrapper.innerHTML = "";
      productListWrapper.append(fragment);

      // 将处理后的HTML插入组件
      this.container.innerHTML = "";
      this.container.append(recentlyViewedContainer);

      // 初始化懒加载图片和工具提示
      webvista.initLazyImages();
      webvista.initToolTips();
    }

    /**
     * 构建请求URL
     * @returns {string|null} 返回构建好的URL或null（无最近浏览商品时）
     */
    buildRequestUrl() {
      // 从data属性获取显示数量限制，默认5个
      const maxDisplayCount = parseInt(this.dataset.limit) || 5;

      // 获取最近浏览的商品ID（保留最后浏览的N个，并反转顺序）
      this.recentProductIds =
        webvista
          .retrieveData(RECENTLY_VIEWED_KEY)
          ?.slice(-maxDisplayCount)
          ?.reverse() || [];

      // 如果没有商品ID，返回null
      if (this.recentProductIds.length === 0) return null;

      // 构建搜索参数
      const apiEndpoint = this.dataset.searchUrl;
      const searchQuery = this.recentProductIds
        .map((id) => `id:${id}`)
        .join(" OR ");
      const queryParams = new URLSearchParams({
        q: searchQuery,
        type: "product",
        section_id: this.dataset.section,
        ose: "false", // 可能表示"omit search engine"
      });

      return `${apiEndpoint}?${queryParams.toString()}`;
    }

    /**
     * 隐藏
     */
    hide() {
      this.closest(".recently-viewed")?.classList.add("hidden");
    }
  }

  // 注册自定义元素
  customElements.define("recently-viewed", RecentlyViewed);
}
