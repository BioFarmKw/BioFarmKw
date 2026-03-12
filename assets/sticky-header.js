if (!customElements.get("sticky-header")) {
  customElements.define(
    "sticky-header",
    class StickyHeader extends HTMLElement {
      constructor() {
        super();

        this.stickyType = this.getAttribute("data-sticky-type") || "none";
        if (this.stickyType === "none") return;

        this.categoryMenu = document.getElementById("Header-Menu-Categories");

        this.onScrollHandler = this.onScroll.bind(this);
        this.preventHide = false; // 阻止隐藏
        this.preventReveal = false; // 阻止重新显示
        this.hideHeaderOnScrollUp = () => (this.preventReveal = true);

        this.preScrollTop = 0; // 上一次位置
        this.preStatus = 0; // 上一次状态
      }

      connectedCallback() {
        this.header = document.querySelector(".section-header");
        this.headerIsAlwaysSticky = true;
        this.headerBounds = {}; // header容器界限

        this.setHeaderHeight();

        window
          .matchMedia("(min-width: 750px)")
          .addEventListener("change", this.setHeaderHeight.bind(this));

        if (this.headerIsAlwaysSticky) {
          this.header.classList.add("shopify-section-header-sticky");
        }

        this.predictiveSearch = this.querySelector("predictive-search");

        // 初始化 body 的 header 状态
        document.documentElement.setAttribute("data-header-status", "visible");

        // 添加阻止Header显示
        this.addEventListener("preventHeaderReveal", this.hideHeaderOnScrollUp);

        window.addEventListener("scroll", this.onScrollHandler);

        this.createObserver();
      }

      disconnectedCallback() {
        window.removeEventListener("scroll", this.onScrollHandler);
      }

      setHeaderHeight() {
        if (
          document.documentElement.style.getPropertyValue("--header-height") !==
          ""
        )
          return;
        document.documentElement.style.setProperty(
          "--header-height",
          `${this.header.querySelector("header").offsetHeight}px`,
        );
      }

      /**
       * 监听初始页面Header的位置
       * 无论 Header 是否显示
       */
      createObserver() {
        const observer = new IntersectionObserver((entries, observer) => {
          this.headerBounds = entries[0].intersectionRect;

          observer.disconnect();
        });

        observer.observe(this.header);
      }

      onScroll() {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > this.preScrollTop ? "down" : "up";
        // 标记页面滚动方向
        document.documentElement.setAttribute(
          "data-scroll-direction",
          scrollDirection,
        );

        // 当禁用页面滚动或者当打开搜索弹窗
        if (
          document.body.hasAttribute("scroll-y-off") ||
          (this.predictiveSearch && this.predictiveSearch.isOpen)
        )
          return;

        const headerPassed = scrollTop > this.headerBounds.bottom;
        const headerToTop = scrollTop <= this.headerBounds.top;

        this.preScrollTop = scrollTop;

        // 处理滚动逻辑
        if (headerToTop) {
          if (this.preStatus !== 3) {
            this.preStatus = 3;
            this.header.classList.remove("scrolled-past-header");
            this.openCategoryMenu(); // 打开分类菜单
            if (!this.headerIsAlwaysSticky)
              requestAnimationFrame(this.reset.bind(this));
          }

          return;
        }

        if (scrollDirection === "down" && headerPassed) {
          if (this.preStatus !== 1) {
            this.preStatus = 1;
            this.header.classList.add("scrolled-past-header");
            this.closeCategoryMenu(); // 关闭分类菜单
            if (!this.preventHide && !this.headerIsAlwaysSticky) {
              requestAnimationFrame(this.hide.bind(this));
            }
          }
        } else if (scrollDirection === "up" && headerPassed) {
          if (this.preStatus !== 2) {
            this.preStatus = 2;
            this.header.classList.add("scrolled-past-header");
            this.closeCategoryMenu(); // 关闭分类菜单

            if (!this.preventReveal) {
              if (!this.headerIsAlwaysSticky)
                requestAnimationFrame(this.reveal.bind(this));
            } else {
              // debounce 效果：延迟恢复 preventReveal
              window.clearTimeout(this.isScrolling);
              this.isScrolling = setTimeout(() => {
                this.preventReveal = false;
              }, 60);
              if (!this.headerIsAlwaysSticky)
                requestAnimationFrame(this.hide.bind(this));
            }
          }
        } else {
          this.preStatus = 0;
        }
      }

      // 隐藏header
      hide() {
        return;
        this.header.classList.add(
          "shopify-section-header-hidden",
          "shopify-section-header-sticky",
        );
        this.closeDropMenus();
        // 更新 body 的 header 状态
        document.documentElement.setAttribute("data-header-status", "hidden");
      }

      // 重新显示header
      reveal() {
        this.header.classList.add(
          "shopify-section-header-sticky",
          "header-reveal-animate",
        );
        this.header.classList.remove("shopify-section-header-hidden");
        // 更新 body 的 header 状态
        document.documentElement.setAttribute("data-header-status", "visible");
      }

      reset() {
        this.header.classList.remove(
          "shopify-section-header-hidden",
          "shopify-section-header-sticky",
          "header-reveal-animate",
        );
        // 恢复 body 的 header 状态
        document.documentElement.setAttribute("data-header-status", "visible");
      }

      /**
       * 关闭打开的Menu
       */
      closeDropMenus() {
        this.dropMenus =
          this.dropMenus || this.header.querySelectorAll("drop-menu");
        this.dropMenus.forEach((dropMenu) => dropMenu.close());
      }

      /**
       * 打开分类菜单
       */
      openCategoryMenu() {
        if (
          this.categoryMenu &&
          this.categoryMenu.hasAttribute("data-reveal-open")
        )
          this.categoryMenu.open();
      }

      /**
       * 关闭分类菜单
       */
      closeCategoryMenu() {
        if (this.categoryMenu) this.categoryMenu.close();
      }
    },
  );
}
