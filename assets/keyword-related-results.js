/**
 * 搜索关键词相关的产品或者文章
 */
if (!customElements.get("keyword-related-results")) {
  customElements.define(
    "keyword-related-results",
    class KeywordRelatedResults extends HTMLElement {
      constructor() {
        super();

        const url = this.constructQueryUrl();
        this.resultsContainer = this.querySelector(".related-list");
        if (!url || !this.resultsContainer) return this.remove();

        this.observer = new IntersectionObserver(
          (entries, observer) => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();

            this.fetchContent(url);
          },
          { rootMargin: "0px 0px 400px 0px" },
        );

        this.observer.observe(this);
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
      }

      fetchContent(url) {
        fetch(url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Network response was not ok: ${response.statusText}`,
              );
            }
            return response.text();
          })
          .then((text) => {
            this.renderHtml(text);
          })
          .catch((error) => {
            this.remove();
            webvista.popToast(
              window["accessibilityStrings"]["unknownError"],
              "error",
            );
          });
      }

      /**
       * 渲染内容
       * @param text
       */
      renderHtml(text) {
        const sourceDom = new DOMParser().parseFromString(text, "text/html");
        const sourceDomTemplate = sourceDom.querySelector(
          `#${this.id} template`,
        );
        if (sourceDomTemplate) {
          this.resultsContainer.replaceWith(
            sourceDomTemplate.content.cloneNode(true),
          );

          // 加载完成状态
          webvista.initLazyImages();
          webvista.initToolTips();
        } else {
          this.remove();
        }
      }

      /**
       * 构造查询 url
       * @returns {string|null}
       */
      constructQueryUrl() {
        const query = this.dataset.keyword;
        if (!query) return null;

        const baseUrl = this.dataset.searchUrl;
        const type = this.dataset.type || "product";

        const params = new URLSearchParams({
          q: query,
          type: type,
          section_id: this.dataset.section,
          ose: "false", // 默认排序
        });

        return `${baseUrl}?${params.toString()}`;
      }
    },
  );
}
