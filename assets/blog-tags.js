if (!customElements.get("blog-tags")) {
  customElements.define(
    "blog-tags",
    class BlogTags extends HTMLElement {
      constructor() {
        super();

        if (!this.blogContent) return;

        this.addEventListener("click", (event) => {
          const link = event.target.closest(".blog-tag");
          if (!link || !this.contains(link)) return;

          this.handleEvent(event);
        });
      }

      disconnectedCallback() {
        if (this.fetchController) this.fetchController.abort();
      }

      get blogContent() {
        return document.getElementById("Blog-Content");
      }

      /**
       * 处理Tag点击
       * @param event
       */
      handleEvent(event) {
        event.preventDefault();

        let href = event.target.getAttribute("href") || "";
        href = href.replace(/^#/, "");
        if (!href) return;

        const a = event.target;
        const currentTagElement = this.querySelector(
          '.blog-tag[aria-current="page"]',
        );
        if (currentTagElement)
          currentTagElement.removeAttribute("aria-current");
        a.setAttribute("aria-current", "page");

        // 发送切换事件
        this.dispatchEvent(
          new CustomEvent("item-active", {
            bubbles: true,
            detail: {
              element: a,
            },
          }),
        );

        this.fetchContent(href);
      }

      fetchContent(href) {
        if (!href) return;
        this.startLoading();

        if (this.fetchController) this.fetchController.abort();
        this.fetchController = new AbortController();
        const signal = this.fetchController.signal;

        fetch(href, { signal })
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
          })
          .finally(() => {
            this.endLoading();
          });
      }

      render(htmlText) {
        if (!htmlText) return;

        const html = new DOMParser().parseFromString(htmlText, "text/html");
        const sourceContentDom = html.querySelector("#Blog-Content");
        const sourceFoundDom = html.querySelector("#Blog-Found");

        if (sourceContentDom) {
          const nextHTML = sourceContentDom.innerHTML;
          if (this.blogContent.innerHTML !== nextHTML)
            this.blogContent.innerHTML = nextHTML;

          if (typeof initializeScrollAnimationTrigger === "function") {
            initializeScrollAnimationTrigger(this.blogContent); // 重新初始化【滚屏展示】动画效果
          }
          webvista.initLazyImages();
          webvista.initToolTips();
        }

        if (sourceFoundDom) {
          const found = document.querySelector("#Blog-Found");
          if (found && found.innerHTML !== sourceFoundDom.innerHTML) {
            found.innerHTML = sourceFoundDom.innerHTML;
          }
        }
      }

      startLoading() {
        this.blogContent.classList.add("loading");
      }

      endLoading() {
        this.blogContent.classList.remove("loading");
      }
    },
  );
}
