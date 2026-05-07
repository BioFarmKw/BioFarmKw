/**
 * 基础轮播事件处理
 * 【1.导航按钮】【2.分页按钮】
 */
class SliderBasicHandler {
  constructor(slider) {
    this.slider = slider;
    this.prevButton = this.slider.querySelector('button[name="previous"]');
    this.nextButton = this.slider.querySelector('button[name="next"]');
    this.pageDotsWrapper = this.slider.querySelector(".slider-page-dots"); // 分页容器
    this.counterWrapper = this.slider.querySelector(".slider-counter"); //计数器容器
    this.SliderSeekBar = this.slider.querySelector(".slider-seek-bar"); // 滑块

    this.initModule();
  }

  /**
   * 换页按钮点击
   * @param direction 方向 previous|next
   */
  onButtonClick(direction) {
    // 假设 slider 有一个方法来处理按钮点击
    this.slider.slideByDirection(direction);
  }

  // 分页按钮点击
  onPageLinkClick(event) {
    const page = parseInt(event.currentTarget.dataset.page);
    this.slider.slideByPage(page);
  }

  initModule() {
    // 创建并绑定事件处理函数
    const onButtonClickFunction = webvista.debounce(
      this.onButtonClick.bind(this),
      200,
    );
    this.boundOnButtonClick = (event) => {
      const direction = event.currentTarget.name;
      onButtonClickFunction(direction);
    };

    // 获取总页数
    this.pageCount = this.slider.slideLength;
    if (!this.slider.ifLoopingInfinite) {
      this.pageCount = this.slider.slideLength - this.slider.slidesPerPage + 1;
    }

    // 导航按钮
    if (this.prevButton)
      this.prevButton.addEventListener("click", this.boundOnButtonClick);
    if (this.nextButton)
      this.nextButton.addEventListener("click", this.boundOnButtonClick);

    // 创建分页dots
    if (this.pageDotsWrapper) this.initPageDots();

    // 创建页码显示
    if (this.counterWrapper) this.initCounter();

    // 创建滑块对象
    if (this.SliderSeekBar)
      this.seekBar = new SliderSeekBar(
        this.slider,
        this.SliderSeekBar,
        this.pageCount,
      );

    // 支持左右按键切换
    this.boundOnKeyDown = (event) => {
      const key = event.code ? event.code.toUpperCase() : "";
      if (key === "ARROWLEFT") {
        event.preventDefault();
        this.slider.slideByDirection("previous");
      }
      if (key === "ARROWRIGHT") {
        event.preventDefault();
        this.slider.slideByDirection("next");
      }
    };
    this.slider.addEventListener("keydown", this.boundOnKeyDown);
  }

  /**
   * 初始化分页显示器
   */
  initPageDots() {
    if (!this.pageDotsWrapper) return;
    this.boundOnPageButtonClick = this.onPageLinkClick.bind(this);

    for (let i = 1; i <= this.pageCount; i++) {
      const link = document.createElement("li");
      link.className = "page-dot";
      link.setAttribute("data-page", i);
      link.setAttribute("tabindex", "0"); // 可聚焦
      if (this.pageDotsWrapper.hasAttribute("data-number"))
        link.innerText = i.toString();

      link.addEventListener("click", this.boundOnPageButtonClick);
      // 添加键盘事件
      link.addEventListener("keydown", (event) => {
        const key = event.code ? event.code.toUpperCase() : "";

        if (key === "ENTER" || key === "SPACE") {
          event.preventDefault(); // 防止页面滚动（空格键的默认行为）

          this.boundOnPageButtonClick(event);
        }
      });

      this.pageDotsWrapper.appendChild(link);
    }
  }

  /**
   * 初始化页数显示器
   */
  initCounter() {
    const totalCounterElement =
      this.counterWrapper.querySelector(".total-page");
    if (totalCounterElement) totalCounterElement.innerText = this.pageCount;
  }

  /**
   * 翻页后更新基础模块信息
   * @param currentSlide 当前索引
   * @param totalPage 总页数
   */
  updateInfo(currentSlide = null, totalPage = 1) {
    if (!currentSlide) return;

    const currentPage = currentSlide.dataset.page;

    // 分页
    if (this.pageDotsWrapper) {
      this.pageDotsWrapper
        .querySelector("li.current")
        ?.classList.remove("current");
      this.pageDotsWrapper
        .querySelector(`li[data-page="${currentPage}"]`)
        ?.classList.add("current");
    }

    // 当前页
    if (this.counterWrapper) {
      const currentCounterElement =
        this.counterWrapper.querySelector(".current-page");
      if (currentCounterElement) {
        currentCounterElement.innerText = currentPage;
      }
    }

    // 导航按钮
    if (!this.slider.ifEnableLooping) {
      this.prevButton &&
        this.prevButton.toggleAttribute("disabled", currentPage <= 1);
      this.nextButton &&
        this.nextButton.toggleAttribute("disabled", currentPage >= totalPage);
    }
  }

  /**
   * 卸载模块
   */
  unmount() {
    if (this.prevButton)
      this.prevButton.removeEventListener("click", this.boundOnButtonClick);
    if (this.nextButton)
      this.nextButton.removeEventListener("click", this.boundOnButtonClick);

    // 卸载 seekBar
    if (this.seekBar) this.seekBar.unmount();

    if (this.pageDotsWrapper) this.pageDotsWrapper.innerHTML = "";

    if (this.boundOnKeyDown)
      this.slider.removeEventListener("keydown", this.boundOnKeyDown);
  }
}

/**
 * SliderAutoplay 类管理轮播图的自动播放功能。
 * 它能根据轮播图的可见性以及用户的交互（如鼠标悬停或焦点事件）来自动开始或暂停播放。
 * 这个类也使用了 Intersection Observer API 来检测轮播图是否在视口中可见，
 * 并且根据可见性来控制自动播放的开始和停止。
 */
class SliderAutoplay {
  /**
   * 构造函数：初始化自动播放类。
   * @param {Slider} slider - 轮播图的引用。
   * @param {number} interval - 自动播放间隔时间。
   * @param {boolean} reverse 是否反方向, default: false
   * @param focusPause 是否聚焦时候暂停播放
   */
  constructor(slider, interval, reverse = false, focusPause = false) {
    this.slider = slider;
    this.interval = interval;
    this.autoInterval = null;
    this.direction = reverse ? "previous" : "next";
    this.focusPause = focusPause;

    this.toggleAutoplayButton = this.slider.querySelector(
      ".slider-toggle-autoplay-button",
    );

    this.ifPaused = false; // 是否已经暂停播放，用于控制播放状态
    this.startTime = null; // 单个轮播循环的开始时间
    this.spendTime = null; // 暂停时候获取单个轮播循环消耗的时间，可用于下次循环开始时间
    this.leftTime = this.interval; // 重新播放的话，需要播放的剩余时间

    this.initMount();
  }

  /**
   * 播放
   * @param refresh 刷新
   */
  play(refresh = false) {
    if (refresh) {
      if (this.autoInterval) clearTimeout(this.autoInterval);
      this.startTime = null;
      this.leftTime = this.interval;
    }
    this.ifPaused = false;
    this.slider.classList.add("slider--is-playing"); // slider--is-playing用于暂停和继续播放
    this.#doPlay();
  }

  /**
   * 执行播放
   */
  #doPlay() {
    if (this.slider.hasAttribute("editor-selected") || this.ifPaused) return;

    this.startTime = Date.now(); // 获取循环的开始时间
    this.autoInterval = setTimeout(() => {
      this.slider.slideByDirection(this.direction);

      this.leftTime = this.interval; // 必须添加，防止极短的时间内未处理slideChange事件
    }, this.leftTime);
  }

  /**
   * 暂停播放
   */
  pause() {
    if (!this.autoInterval) return;
    this.ifPaused = true;
    clearTimeout(this.autoInterval);
    this.autoInterval = null;

    // 如果已经开始轮播，获取单个轮播消耗的时间。
    // 然后获取重新播放的剩余时间
    if (this.startTime) {
      this.spendTime = Date.now() - this.startTime;
      this.leftTime = Math.max(
        0,
        Math.min(this.interval, this.leftTime - this.spendTime),
      );
    }

    this.slider.classList.remove("slider--is-playing"); // 暂停播放
  }

  /**
   * 按钮切换暂停和继续播放
   */
  toggleAutoplayHandling() {
    this.ifPaused ? this.play() : this.pause();
  }

  /**
   * 当轮播图获得焦点或鼠标悬停时触发，用于暂停自动播放。
   */
  focusInHandling() {
    this.pause(); // 暂停自动播放
  }

  /**
   * 当轮播图失去焦点或鼠标移出时触发，用于恢复自动播放。
   */
  focusOutHandling() {
    this.play(); // 继续自动播放
  }

  /**
   * 给轮播图添加事件监听器，以处理焦点和鼠标事件。
   */
  initMount() {
    // 绑定事件处理方法
    if (this.focusPause) {
      this.boundFocusInHandling = this.focusInHandling.bind(this);
      this.boundFocusOutHandling = this.focusOutHandling.bind(this);
      this.slider.addEventListener("mouseover", this.boundFocusInHandling);
      this.slider.addEventListener("mouseleave", this.boundFocusOutHandling);
      this.slider.addEventListener("focusin", this.boundFocusInHandling);
      this.slider.addEventListener("focusout", this.boundFocusOutHandling);
    }

    if (this.toggleAutoplayButton) {
      this.boundToggleHandling = this.toggleAutoplayHandling.bind(this);
      this.toggleAutoplayButton.addEventListener(
        "click",
        this.boundToggleHandling,
      );
    }
  }

  /**
   * 卸载模块。
   */
  unmount() {
    if (this.focusPause) {
      this.slider.removeEventListener("mouseover", this.boundFocusInHandling);
      this.slider.removeEventListener("mouseleave", this.boundFocusOutHandling);
      this.slider.removeEventListener("focusin", this.boundFocusInHandling);
      this.slider.removeEventListener("focusout", this.boundFocusOutHandling);
    }

    if (this.toggleAutoplayButton)
      this.toggleAutoplayButton.removeEventListener(
        "click",
        this.boundToggleHandling,
      );
  }
}

/**
 * SliderDrag 类负责处理轮播图的拖拽功能。
 * 它允许用户通过鼠标或触摸拖拽来切换轮播图。
 */
class SliderDrag {
  /**
   * 构造函数：初始化拖拽功能。
   * @param {Slider} slider - 轮播图的引用。
   * @param {Boolean} smooth 是否平滑滚动, 如果是 false 拖拽将没有动画效果
   */
  constructor(slider, smooth = true) {
    this.DRAG_MOVE_RATE = 1.5; // 拖拽移动速率

    this.slider = slider;
    this.smooth = smooth;

    this.isClicking = false; // 正在点击
    this.isDragging = false; // 正在拖拽
    this.isTouch = "ontouchstart" in window;
    this.clickThreshold = this.isTouch ? 8 : 5; // 可按需调整
    this.noiseThreshold = 5; // 单帧噪声阈值，避免微颤
    this.supressClickUntil = 0; // 屏蔽 click 的时刻

    this.boundDragStart = this.onDragStart.bind(this);
    this.boundDragMove = this.onDragMove.bind(this);
    this.boundDragEnd = this.onDragEnd.bind(this);

    // 绑定事件监听
    this.bindEventListener();
  }

  /**
   * 处理拖拽开始事件。
   * @param {MouseEvent|TouchEvent} event - 触发拖拽的事件对象。
   */
  onDragStart(event) {
    // 鼠标或触摸，统一获取主轴坐标
    this.getAxisValue = (e) => {
      if (e.touches) {
        return this.slider.ifLayoutVertical
          ? e.touches[0].clientY
          : e.touches[0].clientX;
      } else {
        return this.slider.ifLayoutVertical ? e.clientY : e.clientX;
      }
    };

    this.isClicking = true;
    this.isDragging = false;

    this.dragStartPos = this.getAxisValue(event);
    this.dragLastPos = this.dragStartPos;
    this.totalDragDistance = 0; // 初始化累计位移

    this.slider.disableTransition();

    // 绑定全局事件
    document.addEventListener("mousemove", this.boundDragMove);
    document.addEventListener("mouseup", this.boundDragEnd);
    document.addEventListener("touchmove", this.boundDragMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.boundDragEnd);
  }

  /**
   * 处理拖拽移动事件。
   * @param {MouseEvent|TouchEvent} event - 触发移动的事件对象。
   */
  onDragMove(event) {
    if (!this.isClicking) return;

    const currentPos = this.getAxisValue(event);
    let delta = this.dragLastPos - currentPos;
    this.dragLastPos = currentPos;

    // RTL 仅影响方向，不影响“是否点击”的判定
    if (!this.slider.ifLayoutVertical && webvista.isRTL()) {
      delta *= -1; // 用于位移方向一致性
    }
    const absDelta = Math.abs(delta);

    if (absDelta > this.noiseThreshold) {
      this.totalDragDistance += absDelta;

      // 一旦判定为拖拽，阻止触摸默认以避免滑屏
      if (event["touches"] && event.cancelable) event.preventDefault();

      if (!this.isDragging) {
        this.isDragging = true;
        this.slider.classList.add("slider--is-dragging");
      }

      // 使用 rAF 更丝滑
      this.rafId = requestAnimationFrame(() => {
        this.slider.slideByOffset(delta * this.DRAG_MOVE_RATE, !this.smooth);
      });
    }
  }

  /**
   * 处理拖拽结束事件。
   * @param {MouseEvent|TouchEvent} event - 触发拖拽结束的事件对象。
   */
  onDragEnd(event) {
    document.removeEventListener("mousemove", this.boundDragMove);
    document.removeEventListener("mouseup", this.boundDragEnd);
    document.removeEventListener("touchmove", this.boundDragMove);
    document.removeEventListener("touchend", this.boundDragEnd);

    this.isClicking = false;
    this.slider.enableTransition(); // 恢复动画过度

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.slider.classList.remove("slider--is-dragging");

    // 判定为“点击”：放行，不吸附、不翻页
    if (!this.isDragging && this.totalDragDistance <= this.clickThreshold) {
      return;
    }

    // 判定为“拖拽”：吸附并短暂屏蔽 click
    this.isDragging = false;
    this.supressClickUntil = Date.now() + 120; // 120ms 内屏蔽 click

    const dragDelta = this.dragLastPos - this.dragStartPos;
    let moveDirection;
    if (!this.slider.ifLayoutVertical && webvista.isRTL()) {
      moveDirection = dragDelta > 0 ? "to-previous" : "to-next";
    } else {
      moveDirection = dragDelta > 0 ? "to-next" : "to-previous";
    }

    this.slider.snapAfterOffset(moveDirection);
  }

  /**
   * 给轮播图添加拖拽事件监听器。
   */
  bindEventListener() {
    // 统一禁止原生拖拽（尤其是 IMG）
    this.boundPreventNativeDrag = (event) => {
      if (
        event.target &&
        (event.target.tagName === "IMG" || event.target.closest("img"))
      ) {
        event.preventDefault();
      }
    };
    this.slider.sliderContainer.addEventListener(
      "dragstart",
      this.boundPreventNativeDrag,
      true,
    );

    // 拖拽时禁止选中文本/图片，避免蓝框选择
    this.boundPreventSelect = (event) => {
      if (this.isDragging) event.preventDefault();
    };
    this.slider.sliderContainer.addEventListener(
      "selectstart",
      this.boundPreventSelect,
      true,
    );

    this.slider.sliderContainer.addEventListener(
      "mousedown",
      this.boundDragStart,
      { passive: true },
    );
    this.slider.sliderContainer.addEventListener(
      "touchstart",
      this.boundDragStart,
      { passive: true },
    );

    // 捕获阶段拦截 click
    this.boundClickCapture = (event) => {
      if (Date.now() < this.supressClickUntil) {
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        event.preventDefault();
      }
    };
    this.slider.sliderContainer.addEventListener(
      "click",
      this.boundClickCapture,
      true,
    );
  }

  /**
   * 卸载模块。
   */
  unmount() {
    // 移除鼠标事件
    this.slider.sliderContainer.removeEventListener(
      "mousedown",
      this.boundDragStart,
    );
    document.removeEventListener("mousemove", this.boundDragMove);
    document.removeEventListener("mouseup", this.boundDragEnd);

    this.slider.sliderContainer.removeEventListener(
      "touchstart",
      this.boundDragStart,
    );
    document.removeEventListener("touchmove", this.boundDragMove);
    document.removeEventListener("touchend", this.boundDragEnd);

    if (this.boundClickCapture)
      this.slider.sliderContainer.removeEventListener(
        "click",
        this.boundClickCapture,
        true,
      );
  }
}

/**
 * SliderWheelHandler 类负责处理轮播图的滚轮效果
 * 允许用户通过鼠标滚轮或者触摸屏滑动移动轮播图
 */
class SliderWheel {
  /**
   * 构造函数：初始化滚轮功能。
   * @param {Slider} slider - 轮播图的引用。
   */
  constructor(slider) {
    this.slider = slider;
    this.SCROLL_THRESHOLD = 60; // 滚动阈值，可以根据需要调整
    this.COOLDOWN = 300; // 节流时间
    this.lastWheelAt = 0;
    this.boundHandleWheel = this.handleWheel.bind(this);
    this.bindEventListener();
  }

  /**
   * 处理滚轮事件
   * @param {Event} event
   * @returns
   */
  handleWheel(event) {
    const now = Date.now();
    if (now - this.lastWheelAt < this.COOLDOWN) return;

    // 合并 X/Y，横向滚轮也能翻页
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    const canNext = this.slider.index < this.slider.totalPages - 1;
    const canPrev = this.slider.index > 0;

    if (
      (delta > this.SCROLL_THRESHOLD && canNext) ||
      (delta < -this.SCROLL_THRESHOLD && canPrev)
    ) {
      event.stopPropagation();
      this.lastWheelAt = now;
      this.slider.index += delta > 0 ? 1 : -1;
      this.slider.performSlide();
    }
  }

  bindEventListener() {
    this.slider.addEventListener("wheel", this.boundHandleWheel, {
      passive: true,
    });
  }

  /**
   * 卸载模块
   */
  unmount() {
    this.slider.removeEventListener("wheel", this.boundHandleWheel);
  }
}

/**
 * SliderInfiniteLoop 用于处理无缝循环滚动模式
 * 支持无限拖拽
 */
class SliderInfiniteLoop {
  constructor(slider) {
    this.slider = slider;
    this.paddingSlides();

    this.slider.addEventListener(
      "sliderChanged",
      this.onSlideChange.bind(this),
    );
  }

  /**
   * 补充轮播，原轮播的前后分别补充副本
   * 和视口显示的轮播项数量有关，需要在前后补充2n-1个副本，n为同时显示的项目数量
   * 比如视口显示3个项，就需要在轮播开始和末尾补充5个副本
   * 比如轮播的id分别是slide-1到slider-10, 就需要补充为 slide-6，slide-7，slide-8,slide-9,slide-10,slide-1...slide-10, slide-1, slide-2, slide-3，slide-4，slide-5
   */
  paddingSlides() {
    const {
      slidesPerPage,
      slideLength: totalSlides,
      sliderWrapper,
    } = this.slider;
    const paddingCount = 2 * slidesPerPage - 1;

    // 创建文档片段
    const fragmentAfter = document.createDocumentFragment();
    const fragmentBefore = document.createDocumentFragment();
    for (let i = 0; i < paddingCount; i++) {
      // 克隆幻灯片并添加到文档片段
      let cloneSlideItem = this.cloneSlide(i % totalSlides);
      if (cloneSlideItem) fragmentAfter.append(cloneSlideItem);

      cloneSlideItem = this.cloneSlide(totalSlides - 1 - (i % totalSlides));
      if (cloneSlideItem) fragmentBefore.prepend(cloneSlideItem);
    }
    // 追加和前置克隆幻灯片
    this.slider.sliderWrapper.append(fragmentAfter);
    this.slider.sliderWrapper.prepend(fragmentBefore);

    this.slider.updateSliderMetrics(); // 更新轮播的静态数据
    this.slider.index = paddingCount; //重新定位
    if (typeof initializeScrollAnimationTrigger === "function") {
      initializeScrollAnimationTrigger(); // 重新动画监听
    }

    webvista.initLazyImages(); // 图片懒加载监听
    webvista.initToolTips();
  }

  /**
   * 克隆轮播项
   * @param fromIndex
   * @returns {ActiveX.IXMLDOMNode|Node|boolean}
   */
  cloneSlide(fromIndex = null) {
    const cloneSlide = this.slider.sliderItems[fromIndex].cloneNode(true);
    if (!cloneSlide) return false;

    cloneSlide.classList.add("slider-slide--clone");
    cloneSlide.setAttribute("aria-hidden", true); // 辅助设备隐藏
    cloneSlide.setAttribute("data-clone-from", `#${cloneSlide.id}`);
    cloneSlide.setAttribute("data-page", fromIndex + 1);
    cloneSlide.id = `${cloneSlide.id}-Clone`;

    // 移除Shopify编辑属性
    cloneSlide.removeAttribute("data-shopify-editor-block");

    // 移除tabindex属性，防止焦点聚焦（焦点应该始终在本体列表中切换）
    cloneSlide.removeAttribute("tabindex");
    const elements = webvista.getFocusableElements(cloneSlide, false);

    if (elements && elements.length > 0) {
      elements.forEach((element) => {
        element.setAttribute("tabindex", -1);
      });
    }

    return cloneSlide;
  }

  /**
   * 移除补充的轮播
   */
  removePaddings() {
    this.slider
      .querySelectorAll(".slider-slide--clone")
      .forEach((element) => element.remove());
  }

  /**
   * 处理无缝循环
   * @param event
   */
  onSlideChange(event) {
    if (event.target !== this.slider) return; // 考虑到嵌套轮播的情况下，必须是当前轮播触发的事件

    const currentSlide = event.detail.currentElement;
    if (currentSlide && currentSlide.hasAttribute("data-clone-from")) {
      const cloneFromId = currentSlide.dataset.cloneFrom;

      if (cloneFromId)
        setTimeout(() => {
          // 延迟执行防止闪白
          this.slider.slideById(cloneFromId, true);
        }, 30);
    }
  }

  /**
   * 卸载模块
   */
  unmount() {
    this.removePaddings();
  }
}

/**
 * 轮播进度滑块
 * 可拖拽切换轮播
 */
class SliderSeekBar {
  constructor(slider, element, pageCount) {
    this.slider = slider;
    this.element = element;
    this.pageCount = pageCount;

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    const rect = this.element.getBoundingClientRect();
    const width = rect.width / this.pageCount; // 滑块宽度
    const progressWidth = rect.width - width; // 进度宽度，总宽度减去滑块宽度

    // 滑块移动和轮播移动的比例
    this.ratio = this.slider.maxTranslateValue / progressWidth;

    this.element.style.setProperty("--handle-width", `${width}px`);
    this.element.style.setProperty("--progress-width", `${progressWidth}px`);

    this.boundDragStart = this.onDragStart.bind(this);
    this.boundDragMove = this.onDragMove.bind(this);
    this.boundDragEnd = this.onDragEnd.bind(this);

    this.element.addEventListener("mousedown", this.boundDragStart);
    this.element.addEventListener("touchstart", this.boundDragStart, {
      passive: false,
    });
  }

  onDragStart(event) {
    event.preventDefault();
    this.isClicking = true;
    this.isDragging = false;
    this.clickThreshold = 5;
    this.totalDragDistance = 0;

    this.dragStartPos = event.clientX || event.touches[0].clientX;
    this.dragCurrentPos = this.dragStartPos;

    document.addEventListener("mousemove", this.boundDragMove);
    document.addEventListener("mouseup", this.boundDragEnd);
    document.addEventListener("touchmove", this.boundDragMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.boundDragEnd);
  }

  onDragMove(event) {
    if (!this.isClicking) return;
    const currentPos = event.clientX || event.touches[0].clientX;
    const dragOffset = currentPos - this.dragCurrentPos;
    this.dragCurrentPos = currentPos;

    if (Math.abs(dragOffset) > 1) {
      this.totalDragDistance += Math.abs(dragOffset);
      event.preventDefault();
      this.isDragging = true;
      this.element.classList.add("is-dragging");
      this.slider.slideByOffset(dragOffset * this.ratio);
    }
  }

  /**
   * 拖拽结束
   * @param event
   */
  onDragEnd(event) {
    document.removeEventListener("mousemove", this.boundDragMove);
    document.removeEventListener("mouseup", this.boundDragEnd);
    document.removeEventListener("touchmove", this.boundDragMove);
    document.removeEventListener("touchend", this.boundDragEnd);

    this.isClicking = false;
    if (!this.isDragging && this.totalDragDistance <= this.clickThreshold)
      return;

    this.isDragging = false;
    this.element.classList.remove("is-dragging");

    const dragDelta = this.dragStartPos - this.dragCurrentPos;
    let moveDirection;
    if (!this.slider.ifLayoutVertical && webvista.isRTL()) {
      moveDirection = dragDelta > 0 ? "to-previous" : "to-next";
    } else {
      moveDirection = dragDelta > 0 ? "to-next" : "to-previous";
    }

    this.slider.snapAfterOffset(moveDirection);
  }

  unmount() {
    this.element.removeEventListener("mousedown", this.boundDragStart);
    this.element.removeEventListener("touchstart", this.boundDragStart);
    document.removeEventListener("mousemove", this.boundDragMove);
    document.removeEventListener("mouseup", this.boundDragEnd);
    document.removeEventListener("touchmove", this.boundDragMove);
    document.removeEventListener("touchend", this.boundDragEnd);
  }
}

/**
 * 轮播滚动基础类
 * 支持【自动播放】【循环滚动】【无缝滚动】【可拖拽】【可滚轮】【垂直布局】
 * 生命周期钩子，方便继承重写: hookBeforeInstall, hookAfterInstall
 */
class Slider extends HTMLElement {
  constructor() {
    super();
    // 配置常量
    this.TRANSITION_DURING = parseInt(this.dataset.transitionDuring) || 800; // 动画效果持续时间
    this.DEFAULT_INTERVAL = 5000; // 轮播间隔
    this.TRANSITION_THRESHOLD = 50; // 移动的边界阈值，可拖拽超出边界阈值

    // 状态参数
    this.index = 0; //当前索引
    this.initSliderStatus = false; // 是否完成轮播初始化
    this.preTranslate = 0; // 上一步的位置，当发生拖拽的时候用到
    this.currentTranslate = 0; // 当前的位置

    this.lastWindowSize = window.innerWidth;

    this.sliderContainer = this.querySelector(".slider-container");
    this.sliderWrapper = this.querySelector(".slider-wrapper");
    if (!this.sliderContainer || !this.sliderWrapper) return;

    // 初始化基础配置
    this.initConfig();

    // 添加屏幕尺寸变化监听
    if (window.Shopify.designMode || window.debug) {
      this.debounceWindowSizeChangeHandler = webvista.debounce(
        this.onWindowSizeChange.bind(this),
        500,
      );
      window.addEventListener("resize", this.debounceWindowSizeChangeHandler);
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.install();
            obs.unobserve(this);
            break;
          }
        }
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );

    observer.observe(this);
  }

  disconnectedCallback() {
    this.uninstall();

    // 移除屏幕尺寸变化监听
    if (this.debounceWindowSizeChangeHandler)
      window.removeEventListener(
        "resize",
        this.debounceWindowSizeChangeHandler,
      );
  }

  // 安装
  install() {
    if (this.initSliderStatus) return;

    // 屏幕尺寸显示判断，判断手机和非手机是否显示
    if (webvista.isMobileScreen() && !this.ifSlideMobile) {
      return;
    } else if (!webvista.isMobileScreen() && !this.ifSlideDesktop) {
      return;
    }

    this.hookBeforeInstall(); // 生命周期钩子，安装前执行

    // 初始化位置，默认是0，!后续模块可能会修改该值!
    this.index = 0;

    // 更新幻灯片的度量信息和相关数据
    this.updateSliderMetrics();

    // 验证模块安装前，是否符合轮播条件
    if (!this.verifyBeforeMountModules()) return;

    // 给轮播元素添加页码
    this.initPages();

    // 挂载功能模块
    this.mountModules();

    // 初始化轮播位置
    this.initPosition();

    // 完成轮播初始化
    this.toggleStatus(true);

    this.hookAfterInstall(); // 生命周期钩子，安装完成后执行
  }

  hookBeforeInstall() {}

  hookAfterInstall() {}

  // 卸载
  uninstall() {
    if (this.autoplayHandler) this.autoplayHandler.pause(); //关闭播放

    // 移除功能模块
    this.unmountModules();

    // 清除轮播位移变化
    // 必须添加，否则如果手机版设置为网格布局，电脑端设置的为轮播布局
    // 页面尺寸由电脑端切换为手机端，将导致布局异常
    this.clearTranslation();

    // 取消轮播初始化
    this.toggleStatus(false);
  }

  // 重装
  reInstall() {
    if (this.initSliderStatus) this.uninstall();
    this.install();
  }

  /**
   * 初始化配置信息
   * data-slide-desktop {Boolean} 是否电脑上启用轮播
   * data-slide-mobile {Boolean} 是否在手机上启用轮播
   * data-autoplay {Boolean} 是否自动播放
   * data-autoplay-reverse {Boolean} 是否反向自动播放，需要启用【自动播放】才生效
   * data-interval {Int} 自动播放的价格事件，单位ms
   * data-focus-pause {Boolean} 是否聚焦时候暂停播放
   * data-slide-smooth {Boolean} 是否有平滑的滚动动画
   * data-draggable {Boolean} 是否可拖拽
   * data-wheelable {Boolean} 是否可使用滚轮切换
   * data-looping-infinite {Boolean} 是否无限无缝循环滚动
   * data-looping {Boolean} 是否循环播放，当【无缝滚动】或【自动播放】时候自动为True
   * data-keep-video 是否保持视频媒体播放状态，默认是暂停其它媒体播放，并且播放当前视频
   */
  initConfig() {
    this.ifSlideDesktop = this.hasAttribute("data-slide-desktop"); // 是否在电脑上启用轮播
    this.ifSlideMobile = this.hasAttribute("data-slide-mobile"); // 是否在手机上启用轮播
    this.ifEnableAutoplay = this.hasAttribute("data-autoplay"); // 是否自动播放, default: false
    this.ifReversePlay = this.hasAttribute("data-autoplay-reverse"); // 是否反方向自动播放
    this.interval = this.dataset.interval || this.DEFAULT_INTERVAL; //轮播间隔，毫秒
    this.ifFocusPause = this.hasAttribute("data-focus-pause"); // 是否聚焦时候暂停播放

    // 是否平滑滚动, default: false; 如果开启了无缝轮播滚动，最好开启该属性
    this.ifSlideSmooth = this.hasAttribute("data-slide-smooth");
    this.ifeEnableDragging = this.hasAttribute("data-draggable"); // 是否支持拖拽, default: false
    this.ifEnableWheeling = this.hasAttribute("data-wheelable"); // 是否支持滚轮, default: false
    this.ifLoopingInfinite = this.hasAttribute("data-looping-infinite"); // 是否无缝循环滚动, default: false
    this.ifEnableLooping =
      this.ifLoopingInfinite ||
      this.ifEnableAutoplay ||
      this.hasAttribute("data-looping"); // 是否循环滚动, default: false

    // 辅助设备相关
    this.ifAriaLive = this.hasAttribute("aria-live");

    // 视频媒体播放
    this.keepVideo = this.hasAttribute("data-keep-video");
  }

  /**
   * 初始化page
   */
  initPages() {
    this.sliderItems.forEach((sliderItem, index) => {
      sliderItem.setAttribute("data-page", index + 1);
    });
  }

  /**
   * 初始化位置
   */
  initPosition() {
    this.disableTransition();
    this.performSlide();

    setTimeout(() => {
      this.enableTransition();
    }, this.TRANSITION_DURING);
  }

  /**
   * 验证是否满足安装轮播条件
   * @returns {boolean}
   */
  verifyBeforeMountModules() {
    return this.sliderTotalSize > this.sliderClientSize && this.totalPages > 1;
  }

  /**
   * 处理屏幕尺寸变化事件
   * 分为宽度和高度
   */
  onWindowSizeChange() {
    let currentSize;
    if (this.ifLayoutVertical) {
      currentSize = window.innerHeight;
    } else {
      currentSize = window.innerWidth;
    }

    if (currentSize !== this.lastWindowSize) {
      this.reInstall();

      this.lastWindowSize = currentSize;
    }
  }

  /**
   * 轮播安装状态切换
   * @param status
   */
  toggleStatus(status = false) {
    this.initSliderStatus = status;
    this.classList.toggle("slider--installed", status);

    // 根据方向添加/移除 class
    if (status) {
      this.sliderContainer.classList.toggle(
        "is-horizontal",
        !this.ifLayoutVertical,
      );
      this.sliderContainer.classList.toggle(
        "is-vertical",
        this.ifLayoutVertical,
      );
    } else {
      this.sliderContainer.classList.remove("is-horizontal", "is-vertical");
    }
  }

  /**
   * 加载所有模块
   */
  mountModules() {
    if (this.initSliderStatus) return;

    // 基础事件处理器，包括导航按钮和分页按钮
    this.BasicHandler = new SliderBasicHandler(this);

    // 初始化拖拽
    if (this.ifeEnableDragging)
      this.dragHandler = new SliderDrag(this, this.ifSlideSmooth);

    // 初始化滚轮
    if (this.ifEnableWheeling && !webvista.isMobileScreen())
      this.wheelHandler = new SliderWheel(this);

    // 无缝循环轮播
    if (this.ifLoopingInfinite)
      this.seamLoopingHandler = new SliderInfiniteLoop(this);

    // 自动播放
    if (this.ifEnableAutoplay)
      this.autoplayHandler = new SliderAutoplay(
        this,
        this.interval,
        this.ifReversePlay,
        this.ifFocusPause,
      );
  }

  /**
   * 卸载所有模块
   */
  unmountModules() {
    // 移除基础的事件处理器，包括导航按钮和分页按钮
    if (this.BasicHandler) this.BasicHandler.unmount();

    if (this.ifeEnableDragging && this.dragHandler) this.dragHandler.unmount();

    if (this.ifEnableWheeling && this.wheelHandler) this.wheelHandler.unmount();

    if (this.ifEnableAutoplay && this.autoplayHandler)
      this.autoplayHandler.unmount();

    if (this.ifLoopingInfinite && this.seamLoopingHandler)
      this.seamLoopingHandler.unmount();

    if (Shopify.designMode && this.shopifyDesignModelHandler)
      this.shopifyDesignModelHandler.unmount();
  }

  /**
   * 更新幻灯片的度量信息和相关静态数据。
   * 轮播总数、单个轮播宽度、视口宽度、内容总宽度、视口内的项目数等信息
   */
  updateSliderMetrics() {
    this.sliderItems = Array.from(
      this.sliderContainer.querySelectorAll('[id^="Slide-"]'),
    ).filter(
      (slide) => slide.innerHTML.trim() !== "" && slide.offsetParent !== null,
    );

    this.slideLength = this.sliderItems.length;
    if (this.slideLength <= 1) return;

    // 获取尺寸、数量数据
    // 使用【getBoundingClientRect】会比【offsetLeft】有更高的精度
    let sliderContainerRect = this.sliderContainer.getBoundingClientRect();
    const sliderRect0 = this.sliderItems[0].getBoundingClientRect();
    const sliderRect1 = this.sliderItems[1].getBoundingClientRect();
    const sliderRectLast = this.sliderItems.at(-1).getBoundingClientRect();

    // 自动判断是水平轮播还是垂直轮播
    this.ifLayoutVertical = false;
    if (sliderRect1.top > sliderRect0.top) {
      this.sliderItemOffset = sliderRect1.top - sliderRect0.top;
      this.sliderClientSize = sliderContainerRect.height;
      this.sliderTotalSize = sliderRectLast.bottom - sliderRect0.top;

      this.ifLayoutVertical = true;
    } else {
      this.sliderClientSize = sliderContainerRect.width;
      if (webvista.isRTL()) {
        // RTL布局情况
        this.sliderItemOffset = sliderRect0.left - sliderRect1.left;
        this.sliderTotalSize = sliderRect0.right - sliderRectLast.left;
      } else {
        this.sliderItemOffset = sliderRect1.left - sliderRect0.left;
        this.sliderTotalSize = sliderRectLast.right - sliderRect0.left;
      }
    }
    if (this.sliderTotalSize <= this.sliderClientSize) return;

    this.slidesPerPage = Math.max(
      1,
      Math.round(this.sliderClientSize / this.sliderItemOffset),
    );
    if (this.slideLength === this.slidesPerPage) this.slidesPerPage--; // 防止只有一页，并且最后一个轮播项被遮挡的情况； 强行让其变成两页
    this.maxTranslateValue = this.sliderTotalSize - this.sliderClientSize;
    this.totalPages = this.slideLength - this.slidesPerPage + 1;
  }

  // 根据方向切换
  slideByDirection(direction = "next") {
    if (!this.initSliderStatus) return;
    this.index += direction === "previous" ? -1 : 1;

    this.performSlide();
  }

  /**
   * 根据元素滚动，滚动到轮播项位置
   * @param element
   * @param silent 是否静默模式
   * @returns {boolean}
   */
  slideByElement(element = null, silent = false) {
    if (!this.initSliderStatus || !element) return false;

    // 如果 element 是克隆元素，找到其 original 元素
    if (element.hasAttribute("data-clone-from"))
      element = this.querySelector(element.getAttribute("data-clone-from"));
    if (!element) return false;

    if (this.sliderItems.indexOf(element) >= 0) {
      this.index = this.sliderItems.indexOf(element);
      if (silent) this.disableTransition(); // 关闭动画
      this.performSlide();
      if (silent)
        setTimeout(this.enableTransition.bind(this), this.TRANSITION_DURING); // 恢复动画
    } else {
      return false;
    }
  }

  /**
   * 根据页数滚动
   * @param page 页数
   * @param silent 是否静默模式
   */
  slideByPage(page = 1, silent = false) {
    if (!this.initSliderStatus || page < 1) return false;

    const slide = this.sliderItems.find(
      (slide) =>
        !slide.hasAttribute("data-clone-from") &&
        parseInt(slide.dataset.page) === page,
    );
    this.slideByElement(slide, silent);
  }

  /**
   * 根据元素id滚动, id带#，比如 #Slide-1
   * @param id
   * @param silent 是否静默模式
   */
  slideById(id, silent = false) {
    if (!this.initSliderStatus || !id) return false;

    const slide = this.querySelector(id);
    if (!slide) return false;

    this.slideByElement(slide, silent);
  }

  /**
   * 根据偏差距离移动
   * @param offset
   * @param silence 是否静默，即是否不移动元素
   */
  slideByOffset(offset = 0, silence = false) {
    this.preTranslate = this.currentTranslate;
    this.currentTranslate += offset;

    if (!silence) this.applyTranslation();
  }

  /**
   * 位移之后，更新最接近的单元
   * @param direction 移动方向，to-previous: 从右侧向左，或向上移动; to-next: 从左侧向右 或向下移动
   */
  snapAfterOffset(direction) {
    const DRAG_THRESHOLD = Math.min(
      this.sliderItemOffset / 2,
      this.TRANSITION_THRESHOLD - 1, // -1，让触发从头开始
    );

    if (direction === "to-next") {
      //从左侧向右 或向下移动
      this.index = Math.floor(
        (this.currentTranslate + DRAG_THRESHOLD) / this.sliderItemOffset,
      );
    } else {
      // 从右侧向左，或向上移动
      this.index = Math.ceil(
        (this.currentTranslate - DRAG_THRESHOLD) / this.sliderItemOffset,
      );
    }

    this.performSlide();
  }

  /**
   * 将某个单元移动到可见区域
   * @param index
   */
  slideToVisible(index) {
    const slide = this.sliderItems[index];
    if (!slide) return;

    if (this.isVisibleSlide(slide)) return;

    const slideRect = slide.getBoundingClientRect();
    const containerRect = this.sliderContainer.getBoundingClientRect();

    let offset;

    if (slideRect.right >= containerRect.right) {
      offset = slideRect.right - containerRect.right;
    } else {
      offset = slideRect.left - containerRect.left;
    }

    this.slideByOffset(offset);
  }

  /**
   * 执行翻页
   */
  performSlide() {
    this.correctIndex(); //修正索引

    this.updateCurrentTranslate();
    this.applyTranslation();

    this.updateInfo(); // 更新显示信息
  }

  /**
   * 更新当前位移值
   */
  updateCurrentTranslate() {
    this.currentTranslate = this.index * this.sliderItemOffset;
    if (this.ifLoopingInfinite) return;

    // 考虑可视区域非整数倍数个轮播单元的情况
    if (this.index <= 0) {
      this.currentTranslate = 0;
    } else if (this.index >= this.totalPages - 1) {
      this.currentTranslate = this.maxTranslateValue;
    }
  }

  /**
   * 应用位移变换
   * 可单独使用，但是不改变索引值
   */
  applyTranslation() {
    this.correctTranslate();
    this.sliderWrapper.style.transform = this.ifLayoutVertical
      ? `translate3d(0, ${-this.currentTranslate}px, 0)`
      : webvista.isRTL()
        ? `translate3d(${this.currentTranslate}px, 0, 0)`
        : `translate3d(${-this.currentTranslate}px, 0, 0)`;

    // 更新移动比例
    this.style.setProperty(
      "--change-ratio",
      `${this.currentTranslate / this.maxTranslateValue}`,
    );
  }

  /**
   * 发送轮播变化事件
   */
  dispatchChangeEvent() {
    this.dispatchEvent(
      new CustomEvent("sliderChanged", {
        bubbles: true,
        detail: {
          currentIndex: this.index,
          currentElement: this.sliderItems[this.index],
        },
      }),
    );
  }

  // 矫正索引
  correctIndex() {
    if (this.ifEnableLooping) {
      if (this.index < 0) {
        this.index = this.slideLength - this.slidesPerPage;
      } else if (this.index > this.slideLength - this.slidesPerPage) {
        this.index = 0;
      }
    } else {
      if (this.index < 0) {
        this.index = 0;
      } else if (this.index > this.slideLength - this.slidesPerPage) {
        this.index = this.slideLength - this.slidesPerPage;
      }
    }
  }

  /**
   * 修正移动距离
   */
  correctTranslate() {
    // 拖拽阈值，有弹性效果，只有拖拽的时候生效
    let threshold = 0;
    if (this.dragHandler && this.dragHandler.isDragging)
      threshold = Math.min(
        this.sliderItemOffset / 2,
        this.TRANSITION_THRESHOLD,
      );
    const boundary = [-threshold, this.maxTranslateValue + threshold];

    if (this.currentTranslate > boundary[1]) {
      this.currentTranslate = boundary[1];
      this.setAttribute("data-move-exceed", "next");
    } else if (this.currentTranslate < boundary[0]) {
      this.currentTranslate = boundary[0];
      this.setAttribute("data-move-exceed", "pre");
    } else {
      this.removeAttribute("data-move-exceed");
    }
  }

  /**
   * 更新轮播状态信息
   */
  updateInfo() {
    // 激活当前的轮播项
    const activeSlide = this.sliderItems.find((slide) =>
      slide.classList.contains("active"),
    );
    this.currentSlide = this.sliderItems[this.index];

    if (activeSlide) {
      activeSlide.classList.remove("active");
      if (this.ifAriaLive) activeSlide.setAttribute("aria-hidden", "true"); // 如果启用了aria-live，只显示当前活动的子项
    }
    if (this.currentSlide) {
      this.currentSlide.classList.add("active");
      if (this.ifAriaLive) this.currentSlide.removeAttribute("aria-hidden"); // 如果启用了aria-live，只显示当前活动的子项
    }

    // 关闭正在播放的媒体
    if (!this.keepVideo) {
      webvista.pauseAllMedia(this);

      // 需要延迟执行，防止video未初始化完成
      setTimeout(() => {
        webvista.playAllMedia(this.currentSlide);
      }, 50);
    }

    // 发送slideChanged事件
    setTimeout(this.dispatchChangeEvent.bind(this), this.TRANSITION_DURING);

    if (this.autoplayHandler) this.autoplayHandler.play(true); // 播放

    // 更新基础模块信息
    this.BasicHandler.updateInfo(this.currentSlide, this.totalPages);
  }

  /**
   * 判断元素对象是否显示在当前视口内
   * @param element
   * @returns {boolean}
   */
  isVisibleSlide(element = null) {
    if (!element) return false;

    const elementIndex = this.sliderItems.indexOf(element);
    // 如果元素不在 sliderItems 中，返回 false
    if (elementIndex === -1) return false;

    return (
      elementIndex >= this.index &&
      elementIndex < this.index + this.slidesPerPage
    );
  }

  /**
   * 判断元素是否是当前Slide
   * @param element
   * @returns {boolean}
   */
  isCurrentSlide(element = null) {
    return element === this.sliderItems[this.index];
  }

  // 禁用过渡效果
  disableTransition() {
    this.sliderWrapper.style.transition = "";
  }

  // 启用过渡效果
  enableTransition() {
    if (this.ifSlideSmooth)
      this.sliderWrapper.style.transition = `transform ${this.TRANSITION_DURING}ms`;
  }

  /**
   * 清除轮播变换
   */
  clearTranslation() {
    this.index = 0;
    this.preTranslate = 0;
    this.currentTranslate = 0;
    this.sliderWrapper.style.transition = "";
    this.sliderWrapper.style.transform = "";
  }
}

customElements.define("slider-component", Slider);

/**
 * 产品详情媒体轮播
 */
class ProductMediaSlider extends Slider {
  constructor() {
    super();
  }
}

customElements.define("product-media-slider", ProductMediaSlider);

/**
 * 缩略图
 */
class ProductThumbnailSlider extends Slider {
  constructor() {
    super();
  }

  /**
   * 将缩略图元素移动到合适的位置
   * @param element
   * @returns {boolean}
   */
  moveElementToOptimalPosition(element) {
    if (
      !this.initSliderStatus ||
      !element ||
      this.sliderItems.indexOf(element) < 0
    )
      return false;

    this.index = this.sliderItems.indexOf(element);
    // 修改index到合适的位置
    if (
      this.index < 0 ||
      (this.index > this.slideLength - this.slidesPerPage &&
        this.index < this.slideLength)
    ) {
      this.index = this.totalPages - 1; // 最后一页
    } else if (this.index >= this.slideLength) {
      this.index = 0;
    } else if (this.index > 0) {
      this.index = this.index - 1;
    }

    this.performSlide();
  }
}
customElements.define("product-thumbnail-slider", ProductThumbnailSlider);
