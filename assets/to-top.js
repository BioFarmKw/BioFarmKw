if (!customElements.get("to-top")) {
  class ToTop extends HTMLElement {
    constructor() {
      super();

      this.ifShow = false;

      this.addEventListener("click", this.onClick.bind(this));
      window.addEventListener("scroll", this.onScroll.bind(this));
    }

    onClick(event) {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    onScroll() {
      // 获取页面的滚动高度
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // 获取视窗高度
      const windowHeight = window.innerHeight;

      // 获取整个文档的总高度
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight,
      );

      // 计算整个文档的可滚动高度（总高度减去一个视窗高度）
      const scrollableHeight = docHeight - windowHeight;

      // 计算滚动比率
      const scrollPercentage = Math.min(1, scrollTop / scrollableHeight);
      if (scrollPercentage > 0.1) {
        if (!this.ifShow) this.classList.remove("hidden");
        this.ifShow = true;
      } else {
        if (this.ifShow) this.classList.add("hidden");
        this.ifShow = false;
      }

      this.querySelector(".border-progress path")?.setAttribute(
        "stroke-dashoffset",
        (1 - scrollPercentage).toString(),
      );
    }
  }

  customElements.define("to-top", ToTop);
}
