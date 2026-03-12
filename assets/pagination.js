class Pagination extends HTMLElement {
  constructor() {
    super();

    const paginateContent = document.getElementById("Paginate-Content");
    if (!paginateContent) return;

    this.updateUrl = true; // Whether to update the browser address on pagination

    this.sectionId = paginateContent.dataset.section;
    this.contentListWrapper = paginateContent.querySelector(".content-list");
    if (!this.sectionId || !this.contentListWrapper) return;
    this.bindListener();
  }

  bindListener() {
    this.querySelectorAll(".pagination-item").forEach((item) => {
      item.addEventListener("click", this.handleEvent.bind(this));
    });
  }

  handleEvent(event = null) {
    if (event) event.preventDefault();

    const url = event.currentTarget.href;
    if (!url) return;

    const queryString = url.split("?")[1];
    if (queryString) this.fetchContent(queryString);
  }

  /**
   * Fetch 新内容
   * @param queryString
   */
  fetchContent(queryString = null) {
    if (!queryString) return;
    this.startLoading();

    fetch(
      `${window.location.pathname}?section_id=${this.sectionId}&${queryString}`,
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.statusText}`,
          );
        }
        return response.text();
      })
      .then((responseText) => {
        // 渲染页面
        if (responseText) this.render(responseText);

        // 记录浏览器地址，返回
        if (this.updateUrl)
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${queryString}`,
          );
      })
      .catch((error) => {
        webvista.popToast(
          window["accessibilityStrings"]["unknownError"],
          "error",
        );
      })
      .finally(() => {
        this.endLoading();
      });
  }

  /**
   * 渲染内容
   * @param htmlText
   */
  render(htmlText) {
    if (!htmlText) return;

    const sourceDom = new DOMParser().parseFromString(htmlText, "text/html");
    const sourceContentDom = this.getSourceContent(sourceDom);
    if (!sourceContentDom) return;

    this.renderContent(sourceContentDom);
    this.renderPagination(sourceDom);

    if (typeof initializeScrollAnimationTrigger === "function") {
      initializeScrollAnimationTrigger(this.contentListWrapper); // 重新初始化【滚屏展示】动画效果
    }

    webvista.initLazyImages(); // 重新初始化图片懒加载
    webvista.initToolTips();
  }

  /**
   * 获取 Source 中的内容
   * @param sourceDom
   * @returns {*}
   */
  getSourceContent(sourceDom) {
    if (!sourceDom) return;

    const contentList = sourceDom.querySelector(
      "#Paginate-Content .content-list",
    );
    if (contentList) {
      // 移除所有 .grid-item.collection-advertise 元素
      contentList
        .querySelectorAll(".grid-item.collection-advertise")
        .forEach((el) => el.remove());
    }
    return contentList;
  }

  /**
   * 渲染列表
   * @param sourceContentDom
   */
  renderContent(sourceContentDom) {
    // 返回页面顶部
    webvista.scrollElementToHeaderBottom(this.contentListWrapper, 32);
    this.contentListWrapper.innerHTML = sourceContentDom.innerHTML;
  }

  /**
   * 渲染分页
   * @param sourceDom
   */
  renderPagination(sourceDom) {
    // 分页器更新
    const sourcePaginationContainer = sourceDom.querySelector(
      ".pagination-container",
    );
    const targetPaginationContainer = this.closest(".pagination-container");

    if (sourcePaginationContainer && targetPaginationContainer)
      targetPaginationContainer.innerHTML = sourcePaginationContainer.innerHTML;
  }

  startLoading() {
    this.contentListWrapper.classList.add("loading");
  }

  endLoading() {
    this.contentListWrapper.classList.remove("loading");
  }
}

customElements.define("pagination-page", Pagination);

/**
 * 查看更多分页器
 */
class PaginationMore extends Pagination {
  constructor() {
    super();

    this.updateUrl = false;
  }

  /**
   * 添加事件监听
   */
  bindListener() {
    this.button = this.querySelector(".pagination-more-button");

    this.boundClickHandler = this.handleEvent.bind(this);
    if (this.button)
      this.button.addEventListener("click", this.boundClickHandler);
  }

  renderContent(sourceContentDom) {
    const fragment = document.createDocumentFragment();
    Array.from(sourceContentDom.childNodes).forEach((node) => {
      fragment.appendChild(node);
    });
    this.contentListWrapper.appendChild(fragment);
  }

  startLoading() {
    super.startLoading();

    this.button.classList.add("loading");
    this.button.setAttribute("aria-disabled", true);
  }

  endLoading() {
    super.endLoading();

    this.button.classList.remove("loading");
    this.button.removeAttribute("aria-disabled");
  }
}

customElements.define("pagination-more", PaginationMore);

class PaginationScrollMore extends Pagination {
  constructor() {
    super();

    this.updateUrl = false;
  }

  bindListener() {
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleEvent();

            observer.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px 200px 0px" },
    );

    this.observer.observe(this);
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  handleEvent(event = null) {
    const url = this.getAttribute("data-url");
    if (!url) return;

    const queryString = url.split("?")[1];
    if (queryString) this.fetchContent(queryString);
  }

  renderContent(sourceContentDom) {
    const fragment = document.createDocumentFragment();
    Array.from(sourceContentDom.childNodes).forEach((node) => {
      fragment.appendChild(node);
    });
    this.contentListWrapper.appendChild(fragment);
  }

  startLoading() {
    super.startLoading();
  }

  endLoading() {
    super.endLoading();
  }
}

customElements.define("pagination-scroll-more", PaginationScrollMore);
