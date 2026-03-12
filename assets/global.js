const ON_CHANGE_DEBOUNCE_TIMER = 300;
const RECENTLY_VIEWED_KEY = "recently-viewed"; // 最近浏览

const PUB_SUB_EVENTS = {
  cartUpdate: "cart-update", // 购物车更新
  quantityUpdate: "quantity-update", // 产品页面产品数量更新
  variantChange: "variant-change", // 产品页面产品变体变化
  cartError: "cart-error", // 购物车错误
};

/**
 * @namespace webvista
 * @description A utility library for global web interactions, UI effects, event handling, and browser feature polyfills.
 */
const webvista = (function () {
  const SCROLL_LOCK_ATTR = "scroll-y-off";
  const FOCUS_VISIBLE_KEYS = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  const NO_DECIMAL_CURRENCIES = [
    "JPY",
    "KRW",
    "VND",
    "IDR",
    "CLP",
    "COP",
    "PYG",
    "UGX",
    "ISK",
    "HUF",
    "RWF",
    "BIF",
    "DJF",
    "GNF",
    "KMF",
    "XAF",
    "XOF",
    "XPF",
  ];

  const trapFocusHandlers = {};
  let currentFocusedElement = null;
  let mouseClick = null;
  let subscribers = {};

  function focusVisiblePolyfill() {
    window.addEventListener("keydown", (event) => {
      if (FOCUS_VISIBLE_KEYS.includes(event.code.toUpperCase())) {
        mouseClick = false;
      }
    });

    window.addEventListener("mousedown", () => {
      mouseClick = true;
    });

    window.addEventListener(
      "focus",
      () => {
        if (currentFocusedElement) {
          currentFocusedElement.classList.remove("focused");
        }
        if (mouseClick) return;

        currentFocusedElement = document.activeElement;
        currentFocusedElement.classList.add("focused");
      },
      true,
    );
  }

  function loadingImage(image) {
    if (image.hasAttribute("data-srcset")) {
      image.setAttribute("srcset", image.dataset.srcset);
      image.removeAttribute("data-srcset");
      image.onload = () => image.classList.add("image-lazy-loaded");
    } else if (!image.onload) {
      image.classList.add("image-lazy-loaded");
    }
  }

  function loadHighLightText(em) {
    const highlightContainer = em.closest(".has-highlight-text");
    if (!highlightContainer) return;

    const type = highlightContainer.dataset.highlightType || "color";

    if (type === "color") {
      em.classList.add("loaded");
      return;
    }

    const svgTemplates = {
      "hand-drawn-wave": `
        <svg class="hand-drawn-svg hand-drawn-wave" xmlns="http://www.w3.org/2000/svg" width="135" height="23" viewBox="0 0 135 23" fill="none" stroke="currentColor" aria-hidden="true" preserveAspectRatio="none" focusable="false">
          <g filter="url(#filter0_g_2707_11)">
            <path d="M3 12.4225C3.22869 10.1346 6.5187 8.79915 8.18001 8.62735C11.3481 8.29976 13.7239 8.67326 16.3032 10.7213C19.5674 13.3131 24.246 18.5595 28.694 16.7739C35.0069 14.2398 41.6613 10.9503 48.5017 10.9503C51.668 10.9503 54.4728 11.7335 57.3018 13.3059C58.6428 14.0512 59.9367 14.9373 61.2899 15.6452C62.7398 16.4037 64.007 17.5079 65.4839 18.1808C68.4945 19.5524 71.5619 20.9547 74.5784 19.1296C77.5388 17.3383 80.4291 15.4257 83.3785 13.6167C87.2623 11.2347 92.5187 9.66925 96.5051 12.4389C99.7832 14.7164 103.213 18.5294 107.38 17.9845C111.185 17.4869 115.18 13.5435 118.226 11.2447C120.675 9.3962 122.92 7.80134 125.643 6.46802C127.801 5.41108 129.98 4.34712 132 3" pathLength="1" stroke-width="3" stroke-linecap="round"/>
          </g>
          <defs>
          <filter id="filter0_g_2707_11" x="0.499878" y="0.499847" width="134" height="21.9988" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feTurbulence type="fractalNoise" baseFrequency="1 1" numOctaves="3" seed="7977"/>
            <feDisplacementMap in="shape" scale="2" xChannelSelector="R" yChannelSelector="G" result="displacedImage" width="100%" height="100%"/>
            <feMerge result="effect1_texture_2707_11">
              <feMergeNode in="displacedImage"/>
            </feMerge>
          </filter>
          </defs>
        </svg>
      `,
      "hand-drawn-circle": `
        <svg class="hand-drawn-svg hand-drawn-circle" xmlns="http://www.w3.org/2000/svg" width="126" height="62" viewBox="0 0 126 62" fill="none" stroke="currentColor" aria-hidden="true" preserveAspectRatio="none" focusable="false">
          <g filter="url(#filter0_g_2707_13)">
            <path d="M62.8021 59C70.302 57.4787 77.9954 56.9395 85.5289 55.5844C95.5183 53.7875 107.962 51.713 116.009 45.1642C119.729 42.1374 123 37.9914 123 33.0609C123 26.6577 118.711 20.0314 113.492 16.4529C100.537 7.56874 82.737 5.01831 67.378 3.68137C57.0602 2.78324 46.6541 2.75427 36.3385 3.70612C26.8854 4.57837 15.2117 5.67899 6.82421 10.5374C2.98372 12.762 2.25149 16.5874 3.67196 20.5368C6.87058 29.4302 16.4539 36.0277 24.7209 39.9912C50.2505 52.2311 80.3637 49.3857 107.645 46.971" pathLength="1" stroke-width="3" stroke-linecap="round"/>
          </g>
          <defs>
          <filter id="filter0_g_2707_13" x="0.499878" y="0.5" width="125" height="61.0003" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feTurbulence type="fractalNoise" baseFrequency="1 1" numOctaves="3" seed="9548"/>
            <feDisplacementMap in="shape" scale="2" xChannelSelector="R" yChannelSelector="G" result="displacedImage" width="100%" height="100%"/>
            <feMerge result="effect1_texture_2707_13">
              <feMergeNode in="displacedImage"/>
            </feMerge>
          </filter>
          </defs>
        </svg>
      `,
      "hand-drawn-underline": `
        <svg class="hand-drawn-svg hand-drawn-underline" xmlns="http://www.w3.org/2000/svg" width="165" height="19" viewBox="0 0 165 19" fill="none" stroke="currentColor" aria-hidden="true" preserveAspectRatio="none" focusable="false">
          <g filter="url(#filter0_g_1286_163)">
            <path d="M3 8.48706C36.0033 8.48706 69.1228 7.95195 102.065 6.01871C120.695 4.92543 139.33 3.43513 157.994 3.09883C160.15 3.05999 164.873 2.67891 159.951 3.73097C129.25 10.293 98.328 12.311 67.0869 14.4171C66.6878 14.444 52.2352 14.9891 59.3808 14.9891C71.6672 14.9891 83.9174 15.1348 96.1954 15.5309" pathLength="1" stroke-width="3" stroke-linecap="round"/>
          </g>
          <defs>
          <filter id="filter0_g_1286_163" x="0.5" y="0.500664" width="164.114" height="17.5303" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feTurbulence type="fractalNoise" baseFrequency="1 1" numOctaves="3" seed="9996"/>
            <feDisplacementMap in="shape" scale="2" xChannelSelector="R" yChannelSelector="G" result="displacedImage" width="100%" height="100%"/>
            <feMerge result="effect1_texture_1286_163">
              <feMergeNode in="displacedImage"/>
            </feMerge>
          </filter>
          </defs>
        </svg>`,
    };

    if (svgTemplates[type]) {
      em.insertAdjacentHTML("beforeend", svgTemplates[type]);
    }

    em.classList.add("loaded");
  }

  function loadToolTip(trigger) {
    trigger.addEventListener("mouseenter", function () {
      // 先删除之前的tooltip
      document
        .querySelectorAll(".tool-tip")
        .forEach((element) => element.remove());
      // 新建
      const tooltip = document.createElement("div");
      tooltip.classList.add("tool-tip");
      tooltip.innerText = this.getAttribute("data-title");

      const rect = this.getBoundingClientRect();
      tooltip.style.top = `${rect.top}px`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;

      document.body.appendChild(tooltip);

      function hideToolTip() {
        const tooltips = document.querySelectorAll(".tool-tip");
        if (tooltips) {
          tooltips.forEach((tooltip) => tooltip.remove());
        }
      }

      this.addEventListener("mouseleave", hideToolTip, { once: true });
      window.addEventListener("scroll", hideToolTip, { once: true });
    });

    trigger.setAttribute("data-tooltip-loaded", "true");
  }

  /**
   * 计算元素可见比例
   */
  function percentageSeen(element) {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const elemTop = element.getBoundingClientRect().top + scrollY;
    const elemHeight = element.offsetHeight;

    if (elemTop > scrollY + viewportHeight) return 0;
    if (elemTop + elemHeight < scrollY) return 100;

    const distance = scrollY + viewportHeight - elemTop;
    return (distance / ((viewportHeight + elemHeight) / 100)).toFixed(2);
  }

  /**
   * 随机生成区间范围的数字
   * @param min
   * @param max
   * @returns {*}
   */
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  return {
    /**
     * 防抖函数
     * @param {Function} fn 要执行的函数
     * @param {number} wait 等待毫秒数
     * @returns {Function} 防抖后的函数
     */
    debounce: function (fn, wait) {
      let timeoutId;
      return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    /**
     * 节流函数
     * @param {Function} fn 要执行的函数
     * @param {number} delay 延迟毫秒数
     * @returns {Function} 节流后的函数
     */
    throttle: function (fn, delay) {
      let lastCallTime = 0;
      return function (...args) {
        const now = Date.now();
        if (now - lastCallTime < delay) return;
        lastCallTime = now;
        return fn.apply(this, args);
      };
    },

    /**
     * 订阅事件
     * @param eventName
     * @param callback
     * @returns {(function(): void)|*}
     */
    subscribe: function (eventName, callback) {
      if (subscribers[eventName] === undefined) {
        subscribers[eventName] = [];
      }

      subscribers[eventName] = [...subscribers[eventName], callback];

      return () => {
        subscribers[eventName] = subscribers[eventName].filter(
          (cb) => cb !== callback,
        );
      };
    },

    /**
     * 发布事件
     * @param eventName
     * @param data
     */
    publish: function (eventName, data) {
      if (subscribers[eventName]) {
        subscribers[eventName].forEach((callback) => {
          callback(data);
        });
      }
    },

    /**
     * 获取fetch配置
     * @param {string} [type="json"] 响应类型
     * @param {string} [method="POST"] HTTP方法
     * @returns {Object} fetch配置对象
     */
    fetchConfig: function (type = "json", method = "POST") {
      return {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Accept: `application/${type}`,
        },
      };
    },

    /**
     * 内容请求
     * @param url
     * @param signal
     * @returns {Promise<Document>}
     */
    fetchHtml: async function (url, signal = null) {
      const fetchOptions = signal ? { signal } : {};
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} ${response.statusText}`,
        );
      }

      const text = await response.text();
      return new DOMParser().parseFromString(text, "text/html");
    },

    disablePageScroll: function () {
      if (document.body.hasAttribute(SCROLL_LOCK_ATTR)) return;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      document.body.style.top = -scrollTop + "px";
      document.body.setAttribute(SCROLL_LOCK_ATTR, "true");
    },

    enablePageScroll: function () {
      if (!document.body.hasAttribute(SCROLL_LOCK_ATTR)) return;

      const scrollPosition = -parseInt(document.body.style.top, 10);
      document.body.style.top = null;
      document.body.removeAttribute(SCROLL_LOCK_ATTR);

      requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
    },

    getFocusableElements: function (container, filter_invisible = true) {
      let list = Array.from(
        container.querySelectorAll(
          "summary, a[href], button:enabled, [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe, [tabindex]",
        ),
      );

      // 全局排除 tabindex<0 的元素
      list = list.filter((el) => {
        const tabindex = el.getAttribute("tabindex");
        return !(tabindex && parseInt(tabindex, 10) < 0);
      });

      // 可选：过滤掉不可见元素
      if (filter_invisible) {
        list = list.filter((el) => el.offsetParent !== null);
      }

      return list;
    },

    trapFocus: function (container, elementToFocus) {
      if (!container) return;
      const trap = container.hasAttribute("data-trap")
        ? container
        : container.querySelector("[data-trap]");
      if (!trap) return;

      const elements = this.getFocusableElements(trap);
      if (elements.length <= 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      elementToFocus = elementToFocus || trap;

      this.removeTrapFocus();

      trapFocusHandlers.focusin = (event) => {
        if (
          event.target !== trap &&
          event.target !== last &&
          event.target !== first
        )
          return;
        document.addEventListener("keydown", trapFocusHandlers.keydown);
      };

      trapFocusHandlers.focusout = function () {
        document.removeEventListener("keydown", trapFocusHandlers.keydown);
      };

      trapFocusHandlers.keydown = function (event) {
        if (event.code && event.code.toUpperCase() !== "TAB") return;
        if (event.target === last && !event.shiftKey) {
          event.preventDefault();
          first.focus();
        } else if (
          (event.target === trap || event.target === first) &&
          event.shiftKey
        ) {
          event.preventDefault();
          last.focus();
        }
      };

      document.addEventListener("focusin", trapFocusHandlers.focusin);
      document.addEventListener("focusout", trapFocusHandlers.focusout);
      elementToFocus.focus();

      if (
        elementToFocus.tagName === "INPUT" &&
        ["search", "text", "email", "url"].includes(elementToFocus.type) &&
        elementToFocus.value
      ) {
        elementToFocus.setSelectionRange(
          elementToFocus.value.length,
          elementToFocus.value.length,
        );
      }
    },

    removeTrapFocus: function (elementToFocus = null) {
      document.removeEventListener("focusin", trapFocusHandlers.focusin);
      document.removeEventListener("focusout", trapFocusHandlers.focusout);
      document.removeEventListener("keydown", trapFocusHandlers.keydown);

      if (!elementToFocus) return;

      if (elementToFocus.closest("[data-trap]")) {
        this.trapFocus(elementToFocus.closest("[data-trap]"), elementToFocus);
      } else {
        elementToFocus.focus();
      }
    },

    /**
     * 关闭所有视频播放
     * @param {HTMLElement|Document} dom 指定的Dom节点内
     */
    pauseAllMedia: function (dom = document) {
      dom.querySelectorAll(".js-youtube").forEach((video) => {
        video.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*",
        );
      });
      dom.querySelectorAll(".js-vimeo").forEach((video) => {
        video.contentWindow.postMessage('{"method":"pause"}', "*");
      });
      dom.querySelectorAll("video").forEach((video) => video.pause());

      dom.querySelectorAll("product-model").forEach((model) => {
        if (model.modelViewerUI) model.modelViewerUI.pause();
      });
    },

    /**
     * 播放所有视频
     * @param {HTMLElement|Document} [dom=document] - 指定的Dom节点内
     */
    playAllMedia: function (dom = document) {
      dom.querySelectorAll(".js-youtube").forEach((video) => {
        video.contentWindow.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          "*",
        );
      });
      dom.querySelectorAll(".js-vimeo").forEach((video) => {
        video.contentWindow.postMessage('{"method":"play"}', "*");
      });
      dom.querySelectorAll("video").forEach((video) => video.play());
    },

    /**
     * 监听ESCAPE按键关闭Details
     * @param {KeyboardEvent} event 键盘事件对象
     */
    onKeyUpEscape: function (event) {
      if (event.code && event.code.toUpperCase() !== "ESCAPE") return;

      const openDetailsElement = event.target.closest("details[open]");
      if (!openDetailsElement) return;

      const summaryElement = openDetailsElement.querySelector("summary");
      openDetailsElement.removeAttribute("open");
      summaryElement.setAttribute("aria-expanded", "false");
      summaryElement.focus();
    },

    /**
     * 设置Cookie
     * @param {string} name Cookie名称
     * @param {string} value Cookie值
     * @param {number} [hoursToExpire=30] 过期时间(小时)
     */
    setCookie: function (name, value, hoursToExpire = 30) {
      const date = new Date();
      date.setTime(date.getTime() + hoursToExpire * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`;
    },

    /**
     * 获取Cookie值
     * @param {string} name Cookie名称
     * @returns {string|null} Cookie值
     */
    getCookie: function (name) {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === " ") {
          cookie = cookie.substring(1);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    },

    /**
     * 存储数据到LocalStorage
     * @param {string} key 存储键名
     * @param {any} value 存储值
     * @param {number|null} [expirationInMinutes=null] 过期时间(分钟)
     */
    storeData: function (key, value, expirationInMinutes = null) {
      const dataToStore = {
        value: value,
        expiration: expirationInMinutes
          ? Date.now() + expirationInMinutes * 60000
          : null,
      };
      localStorage.setItem(key, JSON.stringify(dataToStore));
    },

    /**
     * 从LocalStorage读取数据
     * @param {string} key 存储键名
     * @returns {any|null} 存储的值或null
     */
    retrieveData: function (key) {
      try {
        const data = localStorage.getItem(key);
        if (!data) return null;

        const dataObj = JSON.parse(data);
        if (!dataObj) return null;

        if (dataObj.expiration === null || Date.now() < dataObj.expiration) {
          return dataObj.value;
        }

        localStorage.removeItem(key);
        return null;
      } catch (e) {
        return null;
      }
    },

    /**
     * 检查是否为移动端屏幕
     * @returns {boolean}
     */
    isMobileScreen: function () {
      return window.matchMedia("(max-width: 749px)").matches;
    },

    /**
     * 检测平板屏幕
     * @returns {boolean} 是否是平板(≤999px)
     */
    isPadScreen: function () {
      return window.matchMedia("(max-width: 999px)").matches;
    },

    /**
     * 是否在 Iframe 中
     * @returns {boolean} 是否是平板(≤999px)
     */
    inIframe: function () {
      try {
        return window.top !== window.self;
      } catch {
        return true;
      }
    },

    /**
     * 判断当前设备是否具备鼠标（精细指针）
     * @returns {boolean} true 表示有鼠标或触控板，false 表示触屏设备
     */
    hasMouse: function () {
      return (
        window.matchMedia("(pointer: fine)").matches ||
        window.matchMedia("(hover: hover)").matches
      );
    },

    /**
     * 监听屏幕从手机端切换到电脑端
     * 触发回调函数
     * @param {Function} callback
     */
    watchDesktopEnter: function (callback) {
      const mediaQuery = window.matchMedia("(min-width: 750px)");
      const handler = (event) => {
        if (event.matches) callback();
      };
      mediaQuery.addEventListener("change", handler);

      // 返回卸载函数
      return () => mediaQuery.removeEventListener("change", handler);
    },

    /**
     * 监听屏幕从电脑端切换到手机端
     * 触发回调函数
     * @param {Function} callback
     */
    watchMobileEnter: function (callback) {
      const mediaQuery = window.matchMedia("(max-width: 749px)");
      const handler = (event) => {
        if (event.matches) callback();
      };
      mediaQuery.addEventListener("change", handler);

      // 返回卸载函数
      return () => mediaQuery.removeEventListener("change", handler);
    },

    /**
     * 是否RTL布局
     * @returns
     */
    isRTL: function () {
      return getComputedStyle(document.documentElement).direction === "rtl";
    },

    /**
     * 判断是否为有效数字
     * @param {any} value
     * @returns {boolean}
     */
    isNumeric: function (value) {
      if (typeof value === "number" && !isNaN(value)) return true;
      if (typeof value === "string" && value.trim() !== "") {
        return !isNaN(Number(value));
      }
      return false;
    },

    /**
     * 转换为数字，失败则返回备用值
     * @param {*} value
     * @param {number} fallback
     * @returns {number}
     */
    toNumber: function (value, fallback = 0) {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : fallback;
    },

    clampNumber: function (value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    /**
     * 格式化货币金额
     * @param {number} [amount=0]
     * @param {string} currency
     * @returns {string|undefined}
     */
    formatPriceAmount: function (amount = 0, currency) {
      if (!window["priceFormatTemplate"] || !currency) return;

      const value = amount / 100;
      const hasNoDecimals = NO_DECIMAL_CURRENCIES.includes(currency);

      const price = value.toLocaleString(undefined, {
        minimumFractionDigits: hasNoDecimals ? 0 : 2,
        maximumFractionDigits: hasNoDecimals ? 0 : 2,
      });

      return window["priceFormatTemplate"].replace(/[\d,.]+/, price);
    },

    /**
     * 向下取整到指定倍数
     * @param {number} n
     * @param {number} x
     * @returns {number}
     */
    floorToMultiple: function (n, x) {
      return Math.floor(n / x) * x;
    },

    /**
     * 向上取整到指定倍数
     * @param {number} n
     * @param {number} x
     * @returns {number}
     */
    ceilToMultiple: function (n, x) {
      return Math.ceil(n / x) * x;
    },

    /**
     * 规范化字符串
     * 1. 使用 'NFD' 方式分解字符
     * 2. 移除所有变音符号
     * 3. 转换为小写
     * @param {string} str 输入字符串
     * @returns {string} 规范化后的字符串
     */
    normalizeString: function (str) {
      return str
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
    },

    /**
     * 弹出消息提示toast
     * @param {string} [message=""] 提示消息
     * @param {string} [type="info"] 类型(info|success|warning|error)
     */
    popToast: function (message = "", type = "info") {
      if (!message) return;

      const toast = document.createElement("div");
      toast.className = `toast type-${type}`;
      toast.setAttribute("aria-role", "alert");
      toast.setAttribute("aria-live", "assertive");
      toast.textContent = message;

      setTimeout(() => toast.remove(), 5000);

      const container = document.getElementById("toasts-container");
      if (container) container.appendChild(toast);
    },

    /**
     * 将元素滚动到距离屏幕顶部的指定位置
     * @param {HTMLElement} element 目标元素
     * @param {number} [offset=50] 距离顶部的偏移量
     */
    scrollToElementWithOffset: function (element, offset = 50) {
      if (!element) return;

      const elementTop =
        element.getBoundingClientRect().top + window.pageYOffset;
      const targetPosition = Math.max(0, elementTop - offset);

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    },

    /**
     * 将元素滚动到页眉底部位置
     * @param {HTMLElement} element 目标元素
     * @param {number} [offset=0] 额外偏移量
     */
    scrollElementToHeaderBottom: function (element, offset = 0) {
      const header = document.getElementById("Page-Header");
      if (!header || !element) return;

      const headerBottom = header.getBoundingClientRect().bottom;
      this.scrollToElementWithOffset(
        element,
        Math.max(0, headerBottom) + offset,
      );

      setTimeout(() => {
        const stickyHeader = document.getElementById("Header-Sticky");
        if (stickyHeader) stickyHeader.hide?.(); // 隐藏 Sticky Header，防止遮挡
      }, 500);
    },

    /**
     * 发射彩带特效
     * @param {number} particleRatio 粒子比率
     * @param {Object} opts 配置项
     */
    fireConfetti: function (particleRatio, opts) {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 999,
      };

      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    },

    /**
     * 礼花特效
     */
    cannonConfetti: function () {
      if (typeof confetti === "undefined") return;

      this.fireConfetti(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      this.fireConfetti(0.2, {
        spread: 60,
      });
      this.fireConfetti(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      this.fireConfetti(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      this.fireConfetti(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    },

    // 雪花飘落
    fallingSnowflakes: function (seconds = 15) {
      const duration = seconds * 1000;
      const animationEnd = Date.now() + duration;
      let skew = 1;

      (function frame() {
        const timeLeft = animationEnd - Date.now();
        const ticks = Math.max(200, 500 * (timeLeft / duration));
        skew = Math.max(0.8, skew - 0.001);

        confetti({
          particleCount: 1,
          startVelocity: 0,
          colors: ["#FFFFFF"],
          zIndex: 999,
          origin: {
            x: Math.random(),
            y: Math.random() * skew - 0.2,
          },
          shapes: ["circle"],
          gravity: randomInRange(0.3, 0.4),
          drift: randomInRange(-0.2, 0.2), // 左右随风飘
          scalar: randomInRange(0.6, 0.8),
          ticks: ticks,
          disableForReducedMotion: true,
        });

        if (timeLeft > 0) {
          requestAnimationFrame(frame);
        }
      })();
    },

    /**
     * 颜色处理相关
     */
    hexToHSL: function (hex) {
      // 移除 # 号并解析 RGB
      hex = hex.replace(/^#/, "");
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;

      // 计算最大值、最小值和差值
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min; // 修复：明确定义 d

      let h = 0,
        s = 0,
        l = (max + min) / 2;

      // 计算色相（hue）
      if (d !== 0) {
        switch (max) {
          case r:
            h = ((g - b) / d) % 6;
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;
      }

      // 计算饱和度（saturation）
      if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        s = Math.round(s * 100);
      }

      // 亮度（lightness）
      l = Math.round(l * 100);

      return { h, s, l };
    },

    HSLToHex: function (h, s, l) {
      // 归一化 HSL 值
      h /= 360;
      s /= 100;
      l /= 100;

      let r, g, b;

      if (s === 0) {
        r = g = b = l; // 灰度
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }

      // RGB 分量转 HEX
      const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    },

    /**
     * 获取中间颜色插值
     * @param color1
     * @param color2
     * @param rate 0-1
     */
    getIntermediateColor: function (color1, color2, rate) {
      const hsl1 = webvista.hexToHSL(color1);
      const hsl2 = webvista.hexToHSL(color2);

      const h = hsl1.h + (hsl2.h - hsl1.h) * rate;
      const s = hsl1.s + (hsl2.s - hsl1.s) * rate;
      const l = hsl1.l + (hsl2.l - hsl1.l) * rate;

      return webvista.HSLToHex(h, s, l);
    },

    // 封装事件监听逻辑
    setupFreeShippingCelebration: function () {
      let firstTrigger = true,
        hasConfetti = false;

      document.addEventListener("freeShippingUnlocked", (event) => {
        const status = event.detail.status;

        if (status) {
          if (!hasConfetti && !firstTrigger) {
            this.cannonConfetti(0.5, {
              spread: 60,
              angle: 90,
            });
          }
          hasConfetti = true;
        } else {
          hasConfetti = false;
        }

        firstTrigger = false;
      });
    },

    /**
     * 初始化图片懒加载
     */
    initLazyImages: function () {
      if (!window["enableLazyImage"]) return;

      const lazyImages = document.querySelectorAll(
        ".image-lazy-loading:not(.image-lazy-loaded)",
      );

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                loadingImage(entry.target);
                observer.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px 400px 0px" },
        );
        lazyImages.forEach((img) => observer.observe(img));
      } else {
        lazyImages.forEach(loadingImage);
      }
    },

    /**
     * 初始化高亮文本动画
     */
    initHighlightText: function () {
      const highlightTexts = document.querySelectorAll(
        ".has-highlight-text em:not(.loaded)",
      );

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                loadHighLightText(entry.target);
                observer.unobserve(entry.target);
              }
            });
          },
          {
            rootMargin: "0px 0px -200px 0px",
          },
        );

        highlightTexts.forEach((text) => observer.observe(text));
      } else {
        highlightTexts.forEach((text) => loadHighLightText(text));
      }
    },

    /**
     * 初始化提示工具
     */
    initToolTips: function () {
      if (webvista.isMobileScreen()) return;

      const tooltipTriggers = document.querySelectorAll(
        '[data-toggle="tooltip"]:not([data-tooltip-loaded])',
      );
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadToolTip(entry.target);
              observer.unobserve(entry.target);
            }
          });
        });
        tooltipTriggers.forEach((tooltipTrigger) =>
          observer.observe(tooltipTrigger),
        );
      } else {
        tooltipTriggers.forEach((tooltipTrigger) =>
          loadToolTip(tooltipTrigger),
        );
      }
    },

    /**
     * 初始化滚动协同效果
     */
    initScrollSynergy: function () {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const elements = Array.from(
        document.querySelectorAll(
          ".scroll-synergy:not([data-scroll-synergy-observed])",
        ),
      );

      if (elements.length <= 0) return;

      const elementStates = new WeakMap();

      // 初始化元素状态
      elements.forEach((el) => {
        elementStates.set(el, { prePosition: null, isVisible: false });
      });

      const updateElement = (el) => {
        const percentage = percentageSeen(el);
        const state = elementStates.get(el);
        let position;

        if (percentage <= 0) {
          position = 0;
        } else if (percentage < 30) {
          position = 1;
        } else if (percentage < 100) {
          position = 2;
        } else {
          position = 3;
        }

        // 位置发生改变
        if (state.prePosition !== position) {
          el.classList.remove("synergy-position--1", "synergy-position--2");

          if (position > 0 && position < 3) {
            el.classList.add(`synergy-position--${position}`);
          }

          state.prePosition = position;
        }

        el.style.setProperty("--synergy-ratio", `${percentage}%`);

        if (el.classList.contains("behavior--zoom-in")) {
          el.style.setProperty(
            "--zoom-in-ratio",
            (1 + 0.005 * percentage).toString(),
          );
        } else if (el.classList.contains("behavior--parallax")) {
          el.style.setProperty(
            "--parallax-ratio",
            (percentage / 100).toString(),
          );
        } else if (
          el.classList.contains("behavior--crab-left") ||
          el.classList.contains("behavior--crab-right")
        ) {
          let crabRatio = 0.25 * percentage;
          if (el.classList.contains("behavior--crab-left")) {
            crabRatio *= -1;
          }
          el.style.setProperty("--crab-ratio", `${crabRatio}%`);
        }
      };

      const handleScroll = this.throttle(() => {
        elements.forEach((el) => {
          const state = elementStates.get(el);
          if (state.isVisible) {
            updateElement(el);
          }
        });
      }, 20); // 可以根据需求调节节流时间

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          const state = elementStates.get(el);
          state.isVisible = entry.isIntersecting;

          if (entry.isIntersecting) {
            // 添加初始位置信息
            updateElement(el);
            el.setAttribute("data-init", "true");
          }
        });
      });

      elements.forEach((element) => {
        observer.observe(element);
        element.setAttribute("data-scroll-synergy-observed", "true");
      });
      window.addEventListener("scroll", handleScroll);
    },

    /**
     * 初始化标题闪烁
     */
    initTitleFlash: function () {
      // 存储原始标题和定时器
      let originalTitle = document.title;
      let alertInterval = null;

      const alertMessage =
        window["accessibilityStrings"]["stillHere"] || "We are still here!";

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          // 用户离开时开始闪烁
          let counter = 0;
          originalTitle = document.title; // 保存当前标题（防止中途被修改）
          alertInterval = setInterval(() => {
            document.title = counter++ % 2 === 0 ? alertMessage : originalTitle;
          }, 5000);
        } else {
          // 用户返回时立即停止并恢复标题
          if (alertInterval) {
            clearInterval(alertInterval);
            alertInterval = null;
            document.title = originalTitle;
          }
        }
      });

      // 页面卸载时清理定时器（防止内存泄漏）
      window.addEventListener("beforeunload", () => {
        if (alertInterval) clearInterval(alertInterval);
      });
    },

    /**
     * 初始化Header高度
     */
    initHeaderHeight: function () {
      const header = document.querySelector("header");
      if (header) {
        const rect = header.getBoundingClientRect();
        document.documentElement.style.setProperty(
          "--header-height",
          `${Math.floor(rect.height)}px`,
        );
        document.documentElement.style.setProperty(
          "--header-bottom",
          `${Math.floor(rect.bottom)}px`,
        );
      }
    },

    /**
     * 初始化focus-visible polyfill
     */
    initFocusVisible: function () {
      try {
        // 检查是否支持focus-visible
        document.querySelector(":focus-visible");
      } catch (e) {
        // 不支持的话添加事件监听
        focusVisiblePolyfill();
      }
    },

    init: function () {
      if (window.enableBrowserTabTitleFlash) this.initTitleFlash();
      this.initHeaderHeight();
      this.initLazyImages();
      this.initScrollSynergy();
      this.initToolTips();
      this.initHighlightText();
      this.initFocusVisible();
      this.setupFreeShippingCelebration();

      // Mark if there is a bottom navigation bar
      const bottomNavBar = document.getElementById("Bottom-Nav-Bar");
      if (bottomNavBar) {
        document.documentElement.classList.add("has-bottom-nav-bar");
      }

      // Festival Effect
      if (
        window.enableFestivalEffect &&
        window.festivalType == "christmas" &&
        window.enableChristmasSnow
      ) {
        const snow_duration = window.snowDuration
          ? parseInt(window.snowDuration)
          : 30;
        this.fallingSnowflakes(snow_duration);
      }

      // Design mode or debug mode
      if (window.Shopify.designMode || window.debug) {
        // Mobile screen enters desktop
        this.watchDesktopEnter(() => {
          this.initScrollSynergy();
          this.pauseAllMedia();
        });

        // Desktop screen enters mobile
        this.watchMobileEnter(() => {
          this.pauseAllMedia();
        });
      }
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => webvista.init());

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (let i = 0, count = selector.options.length; i < count; i++) {
    const option = selector.options[i];
    if (value === option.value || value === option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

/**
 * 创建并提交一个表单以发送 POST 请求。
 * 使用此函数可以动态生成和提交表单，
 * 用于发送数据到服务器，适用于不通过<a>标签或JavaScript直接发送POST请求的场景。
 * @param path
 * @param options
 */
Shopify.postLink = function (path, options) {
  options = options || {};
  const method = options["method"] || "post";
  const params = options["parameters"] || {};

  const form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (let key in params) {
    const hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options,
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);

  if (options && options["hideElement"]) {
    this.provinceContainer = document.getElementById(options["hideElement"]);
  } else {
    this.provinceContainer = document.getElementById(province_domid);
  }

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this),
  );
  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    const value = this.countryEl.getAttribute("data-default");

    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    const value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    const opt = this.countryEl.options[this.countryEl.selectedIndex];
    const raw = opt.getAttribute("data-provinces");
    const provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length <= 0) {
      this.provinceContainer.style.display = "none";
    } else {
      provinces.forEach((province) => {
        const opt = document.createElement("option");
        opt.value = province[0];
        opt.innerHTML = province[1];
        this.provinceEl.appendChild(opt);
      });

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    if (values.length && values.length > 0)
      values.forEach((value) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.innerHTML = value;
        selector.appendChild(opt);
      });
  },
};

/**
 * Class SectionDynamicUpdate
 * 用于动态更新页面上的特定部分的内容。
 */
class SectionDynamicUpdate {
  /**
   * 解析提供的 HTML 字符串并返回指定选择器的元素的内部 HTML。
   * @param {string} html - 要解析的 HTML 字符串。
   * @param {string} selector - 用于选取 HTML 元素的 CSS 选择器。
   * @returns {string} 匹配元素的内部 HTML。
   */
  static getSectionInnerHTML(html, selector) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    if (!dom) return "";

    const element = dom.querySelector(selector) || dom;
    return element.innerHTML;
  }

  /**
   * 根据提供的 sections 数组和响应内容，更新页面上的相应部分。
   *
   * @param {Array} sections - 包含部分信息的数组，每个部分包括 id, selector 和 section 属性。
   * @param {Object} responseSections - 包含新 HTML 内容的对象，键是 section 名称。
   */
  static updateSections(sections, responseSections) {
    sections.forEach((section) => {
      const elementToReplace =
        document.getElementById(section.id)?.querySelector(section.selector) ||
        document.getElementById(section.id);

      if (elementToReplace)
        elementToReplace.innerHTML = SectionDynamicUpdate.getSectionInnerHTML(
          responseSections[section.section],
          section.selector,
        );
    });

    webvista.initLazyImages();
    if (typeof initializeScrollAnimationTrigger === "function") {
      initializeScrollAnimationTrigger();
    }
    webvista.initToolTips();
  }
}

// 商品数量选择器
class QuantityInput extends HTMLElement {
  quantityUpdateUnsubscriber = undefined;

  constructor() {
    super();
    this.changeEvent = new Event("change", { bubbles: true });

    this.input = this.querySelector("input"); // 输入框
    this.input.addEventListener("change", this.onInputChange.bind(this));

    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this)),
    );

    this.updateQtyButtonState();
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) this.quantityUpdateUnsubscriber();
  }

  /**
   * 处理输入框变化
   * @param event
   */
  onInputChange(event) {
    this.updateQtyButtonState();
  }

  /**
   * 处理加减按钮点击
   * @param event
   */
  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    // stepUp 和 stepDown 不会触发输入框的Change事件，所以需要手动触发
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }

  /**
   * 调整数量加减按钮 disabled 属性
   */
  updateQtyButtonState() {
    const value = parseInt(this.input.value);

    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity-button[name='minus']");
      buttonMinus.classList.toggle("disabled", value <= min);
    }

    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity-button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }

  /**
   * 数量选择器边界值修正
   * 更新 input 输入框的 Min 和 Max 值和当前值
   */
  setQuantityBoundaries() {
    const data = {
      cartQuantity: this.input.dataset.cartQuantity
        ? parseInt(this.input.dataset.cartQuantity)
        : 0, // 已经添加购物车数量
      min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1, // 单次结账某个产品可添加的最小值
      max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null, // 单次结账某个产品可添加的最大值
      step: this.input.step ? parseInt(this.input.step) : 1,
    };

    let min = data.min;
    // 可添加最大值 = 可购买的最大值 - 购物车中已添加的值
    const max = data.max === null ? data.max : data.max - data.cartQuantity;
    if (max !== null) min = Math.min(min, max);

    // 可输入最小值 <= step
    if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

    this.input.min = min;
    this.input.max = max;
    this.input.value = min;
    this.input.dispatchEvent(this.changeEvent); // 触发值修改事件

    // 更新加减按钮状态
    this.updateQtyButtonState();
  }
}
customElements.define("quantity-input", QuantityInput);

/**
 * @class ModalOpener
 * @extends HTMLElement
 * @classdesc 自定义元素 ModalOpener，用于打开指定的模态对话框。
 */
class ModalOpener extends HTMLElement {
  constructor() {
    super();
    if (this.hasAttribute("aria-disabled")) return;
    this.modal = document.getElementById(this.getAttribute("aria-controls"));
    if (!this.modal) return;

    // 如果元素没有设置 tabindex（有回退链接的情况）
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");

      const link = this.querySelector("a.fallback-link"); // 只允许最多有一个回退链接
      if (link) link.setAttribute("tabindex", "-1"); // 避免抢占焦点
    }

    this.boundOnOpenerClick = this.onOpenerClick.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.addEventListener("click", this.boundOnOpenerClick);
    this.addEventListener("keydown", this.boundOnKeyDown);
  }

  disconnectedCallback() {
    if (this.boundOnOpenerClick)
      this.removeEventListener("click", this.boundOnOpenerClick);
    if (this.boundOnKeyDown)
      this.removeEventListener("keydown", this.boundOnKeyDown);
  }

  onOpenerClick(event) {
    event.preventDefault(); // 当不支持 js 的情况下，a 标签可作为回退方案，a 标签放在组件内部

    if (this.getAttribute("aria-expanded") === "true") return;
    this.modal.show(this);
  }

  /**
   * 键盘事件
   */
  onKeyDown(event) {
    if (["Space", "Enter"].includes(event.code)) {
      event.preventDefault(); // 防止页面滚动
      this.modal.show(this);
    }
  }
}
customElements.define("modal-opener", ModalOpener);

/**
 * @class ModalDialog
 * @extends HTMLElement
 * @classdesc 自定义元素 ModalDialog，用于显示和隐藏模态对话框。
 */
class ModalDialog extends HTMLElement {
  constructor() {
    super();

    // 打开模态时候允许页面滚动
    this.enableScrollWhenOpen = this.hasAttribute("data-enable-scroll");
    this.ifHasDisablePageScroll = false;

    // 禁止其它方式关闭
    if (!this.hasAttribute("data-force")) {
      this.boundHandleEscapeKey = this.handleEscapeKey.bind(this);
      this.boundHandleOverlayClick = this.handleOverlayClick.bind(this);
      this.addEventListener("keyup", this.boundHandleEscapeKey); // 监听 ESC 键
      this.addEventListener("click", this.boundHandleOverlayClick); // 监听遮罩层点击
    }
  }

  disconnectedCallback() {
    if (!this.hasAttribute("data-force")) {
      this.removeEventListener("keyup", this.boundHandleEscapeKey);
      this.removeEventListener("click", this.boundHandleOverlayClick);
    }
  }

  handleEscapeKey(event) {
    event.stopPropagation();
    if (event.code && event.code.toUpperCase() === "ESCAPE") this.hide();
  }

  handleOverlayClick(event) {
    event.stopPropagation();

    // this.contains(event.target) 防止嵌套使用
    if (
      this.contains(event.target) &&
      event.target.classList.contains("modal-overlay")
    ) {
      this.hide();
    }
  }

  show(opener) {
    this.openedBy = opener;

    this.setAttribute("open", "");
    if (this.openedBy) this.openedBy.setAttribute("aria-expanded", "true");
    webvista.trapFocus(this);

    // 判断是否已经禁用了页面滚动
    this.ifHasDisablePageScroll = document.body.hasAttribute("scroll-y-off");
    if (!this.enableScrollWhenOpen && !this.ifHasDisablePageScroll)
      webvista.disablePageScroll();
  }

  hide() {
    this.removeAttribute("open");

    if (this.openedBy) {
      this.openedBy.setAttribute("aria-expanded", "false");
      webvista.removeTrapFocus(this.openedBy);
    }

    webvista.pauseAllMedia(this); // 关闭所有播放的媒体

    if (!this.enableScrollWhenOpen && !this.ifHasDisablePageScroll)
      webvista.enablePageScroll();
  }
}
customElements.define("modal-dialog", ModalDialog);

/**
 * @class Drawer
 * @extends ModalDialog
 * @classdesc 自定义元素 Drawer，用于显示和隐藏抽屉式对话框，并支持拖拽关闭功能。
 */
class Drawer extends ModalDialog {
  constructor() {
    super();

    this.innerWrapper = this.querySelector(".modal-inner");
    this.dragHandle = this.querySelector(".drawer-handle");
    if (!this.innerWrapper || !this.dragHandle) return;

    this.boundDragStart = this.onDragStart.bind(this);
    this.boundDragMove = this.onDragMove.bind(this);
    this.boundDragEnd = this.onDragEnd.bind(this);

    this.dragHandle.addEventListener("touchstart", this.boundDragStart, {
      passive: true,
    });

    this.dragHandle.addEventListener("mousedown", this.boundDragStart);

    // 模板编辑模式
    if (
      window.Shopify.designMode &&
      !this.hasAttribute("data-disable-design-mode")
    ) {
      this.boundOnSectionSelect = (event) => {
        if (event.detail.sectionId === this.dataset.section) {
          this.show();
        } else {
          this.hide();
        }
      };
      this.boundOnSectionDeselect = (event) => {
        if (event.detail.sectionId === this.dataset.section) {
          this.hide();
        }
      };

      document.addEventListener(
        "shopify:section:select",
        this.boundOnSectionSelect,
      ); // 监听区块选中事件
      document.addEventListener(
        "shopify:section:deselect",
        this.boundOnSectionDeselect,
      ); // 监听区块取消选中事件
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.dragHandle && this.boundDragStart) {
      this.dragHandle.removeEventListener("touchstart", this.boundDragStart);
      this.dragHandle.removeEventListener("mousedown", this.boundDragStart);
    }

    if (this.boundDragMove) {
      document.removeEventListener("mousemove", this.boundDragMove);
      document.removeEventListener("touchmove", this.boundDragMove);
    }

    if (this.boundDragEnd) {
      document.removeEventListener("mouseup", this.boundDragEnd);
      document.removeEventListener("touchend", this.boundDragEnd);
      document.removeEventListener("touchcancel", this.boundDragEnd);
    }

    if (this.boundOnSectionSelect) {
      document.removeEventListener(
        "shopify:section:select",
        this.boundOnSectionSelect,
      );
    }
    if (this.boundOnSectionDeselect) {
      document.removeEventListener(
        "shopify:section:deselect",
        this.boundOnSectionDeselect,
      );
    }
  }

  show(opener) {
    this.dragOffset = 0;
    this.innerWrapper.style.top = "";

    this.isClicking = false;
    this.isDragging = false;

    // 取消未完成的动画帧
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    super.show(opener);
  }

  /**
   * 处理拖拽开始事件。
   * @param {MouseEvent|TouchEvent} event - 触发拖拽的事件对象。
   */
  onDragStart(event) {
    document.addEventListener("mousemove", this.boundDragMove, {
      passive: false,
    });
    document.addEventListener("mouseup", this.boundDragEnd);

    document.addEventListener("touchmove", this.boundDragMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.boundDragEnd);
    document.addEventListener("touchcancel", this.boundDragEnd); // 触摸取消

    this.isClicking = true;
    this.isDragging = false;

    if (event.touches) {
      this.dragStartPos = event.touches[0].clientY;
    } else {
      this.dragStartPos = event.clientY;
    }
  }

  /**
   * 拖拽移动
   * @param event {MouseEvent|TouchEvent}
   */
  onDragMove(event) {
    if (!this.isClicking) return;

    if (event.touches) {
      this.currentPos = event.touches[0].clientY;
    } else {
      this.currentPos = event.clientY;
    }

    this.dragOffset = this.currentPos - this.dragStartPos;

    if (this.dragOffset > 1) {
      if (event.cancelable) event.preventDefault();

      if (!this.isDragging) this.classList.add("is-dragging");
      this.isDragging = true; // 拖拽状态

      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => {
        this.applyTranslation();
      });
    }
  }

  onDragEnd() {
    this.isClicking = false;

    if (this.boundDragMove) {
      document.removeEventListener("mousemove", this.boundDragMove);
      document.removeEventListener("touchmove", this.boundDragMove);
    }

    if (this.boundDragEnd) {
      document.removeEventListener("mouseup", this.boundDragEnd);
      document.removeEventListener("touchend", this.boundDragEnd);
      document.removeEventListener("touchcancel", this.boundDragEnd);
    }

    // 取消未完成的动画帧
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // 没有移动
    if (!this.isDragging) return;

    this.isDragging = false;
    this.classList.remove("is-dragging");

    if (this.dragOffset > 150) {
      this.hide();
    } else {
      this.dragOffset = 0;
      this.applyTranslation();
    }
  }

  /**
   * 应用拖拽移动变换
   */
  applyTranslation() {
    this.innerWrapper.style.top = `${this.dragOffset}px`;
  }
}
customElements.define("drawer-component", Drawer);

/**
 * @class ConfirmOpener
 * @extends ModalOpener
 * @classdesc 自定义元素 ConfirmOpener，继承自 ModalOpener，用于打开确认对话框。
 */
class ConfirmOpener extends ModalOpener {
  /**
   * @method onOpenerClick
   * @description 处理按钮点击事件，设置确认消息并显示模态对话框。
   */
  onOpenerClick(event) {
    const confirmMessageElement = this.modal.querySelector(".confirm-message");
    const message = this.getAttribute("data-message") || "Are you sure?";
    if (message) confirmMessageElement.innerText = message;

    super.onOpenerClick(event);
  }

  /**
   * @method sendRequest
   * @description 发送 POST 请求到指定的 URL。
   */
  sendRequest() {
    const url = this.getAttribute("data-url");
    if (!url) return;
    const method = this.getAttribute("data-method") || "post";

    Shopify.postLink(url, {
      parameters: { _method: method },
    });
  }
}
customElements.define("confirm-opener", ConfirmOpener);

/**
 * @class ConfirmDialog
 * @extends ModalDialog
 * @classdesc 自定义元素 ConfirmDialog，继承自 ModalDialog，用于显示确认对话框。
 */
class ConfirmDialog extends ModalDialog {
  constructor() {
    super();

    const confirmButton = this.querySelector(".confirm-button");
    if (confirmButton)
      confirmButton.addEventListener("click", this.handleConfirm.bind(this));

    const cancelButton = this.querySelector(".cancel-button");
    if (cancelButton)
      cancelButton.addEventListener("click", this.hide.bind(this));
  }

  /**
   * @method handleConfirm
   * @description 处理确认按钮点击事件，调用触发元素的 sendRequest 方法。
   */
  handleConfirm() {
    if (!this.openedBy) return;

    this.openedBy.sendRequest();
  }
}
customElements.define("confirm-dialog", ConfirmDialog);

/**
 * @class VideoModalOpener
 * @extends ModalDialog
 * @classdesc 视频窗口打开器
 */
class VideoModal extends ModalDialog {
  constructor() {
    super();

    // 视频内容容器
    this.contentContainer = this.querySelector(".modal-content");
  }

  show(opener) {
    if (opener !== this.openedBy) {
      // 新按钮打开，重新inject内容
      const template = opener.querySelector("template");
      if (!template) return;

      const templateContent = template.content.cloneNode(true);

      // 清空并替换 innerWrapper 的内容
      this.contentContainer.innerHTML = "";
      this.contentContainer.appendChild(templateContent);
      webvista.initLazyImages();
    }

    super.show(opener);

    // 继续播放视频
    webvista.playAllMedia(this);
  }
}
customElements.define("video-modal", VideoModal);

/**
 * Tabs 组件
 * @class TabPanel
 */
class TabPanel extends HTMLElement {
  constructor() {
    super();

    this.tabs = Array.from(this.querySelectorAll(".tab"));
    this.tabsWrapper = this.querySelector(".tab-panel-tabs"); // tabs容器

    this.autoSwitch = this.hasAttribute("data-auto-switch"); // 是否开启自动切换

    // 数值化并兜底最小间隔（1000ms），避免字符串进入 setTimeout
    const rawInterval = Number(this.dataset.interval);
    this.switchInterval =
      Number.isFinite(rawInterval) && rawInterval >= 1000 ? rawInterval : 3000;

    this.ifPaused = false; // 是否暂停自动切换

    this.hoverSwitch = this.hasAttribute("data-hover-switch"); // 是否开启鼠标悬停切换

    this.scrollableContentViewer = this.querySelector(
      "scrollable-content-viewer",
    ); // 可拖拽容器组件

    // 如果存在可拖拽组件，在该组件安装完成后执行初始化
    // 否则直接初始化
    this.boundInit = this.init.bind(this);
    if (this.scrollableContentViewer) {
      this.scrollableContentViewer.addEventListener(
        "scrollable-content-viewer-installed",
        this.boundInit,
      );
    } else {
      this.init();
    }

    if (!this.tabs || this.tabs.length < 2) this.autoSwitch = false; // 少于2个tab不自动切换

    // 监听 tab 点击和鼠标悬浮事件
    this.boundOnTabSelected = this.onTabSelected.bind(this);
    this.boundOnKeydown = this.onKeydown.bind(this);
    this.addEventListener("click", this.boundOnTabSelected);
    this.addEventListener("keydown", this.boundOnKeydown);
    if (this.hoverSwitch) {
      this.addEventListener("mouseover", this.boundOnTabSelected); // mouseover事件会冒泡，可以用作代理委托
    }

    if (this.autoSwitch) {
      // 处理自动播放
      this.boundOnFocusIn = this.onFocusIn.bind(this);
      this.boundOnFocusOut = this.onFocusOut.bind(this);
      this.addEventListener("focusin", this.boundOnFocusIn);
      this.addEventListener("focusout", this.boundOnFocusOut);

      // 整个组件的指针悬停时暂停，离开后恢复
      this.boundPauseAutoSwitch = this.pauseAutoSwitch.bind(this);
      this.boundStartAutoSwitch = this.startAutoSwitch.bind(this);
      this.addEventListener("pointerenter", this.boundPauseAutoSwitch);
      this.addEventListener("pointerleave", this.boundStartAutoSwitch);

      // 页面不可见时暂停，重新可见时恢复
      this.boundOnVisibilitychange = () => {
        if (document.hidden) this.pauseAutoSwitch();
        else this.startAutoSwitch();
      };
      document.addEventListener(
        "visibilitychange",
        this.boundOnVisibilitychange,
      );
    }
  }

  disconnectedCallback() {
    if (this.autoInterval) clearTimeout(this.autoInterval);

    if (this.scrollableContentViewer && this.boundInit) {
      this.scrollableContentViewer.removeEventListener(
        "scrollable-content-viewer-installed",
        this.boundInit,
      );
    }

    if (this.boundOnTabSelected) {
      this.removeEventListener("click", this.boundOnTabSelected);
    }
    if (this.boundOnKeydown) {
      this.removeEventListener("keydown", this.boundOnKeydown);
    }
    if (this.hoverSwitch && this.boundOnTabSelected) {
      this.removeEventListener("mouseover", this.boundOnTabSelected);
    }

    if (this.autoSwitch) {
      if (this.boundOnFocusIn)
        this.removeEventListener("focusin", this.boundOnFocusIn);
      if (this.boundOnFocusOut)
        this.removeEventListener("focusout", this.boundOnFocusOut);
      if (this.boundPauseAutoSwitch)
        this.removeEventListener("pointerenter", this.boundPauseAutoSwitch);
      if (this.boundStartAutoSwitch)
        this.removeEventListener("pointerleave", this.boundStartAutoSwitch);
      if (this.boundOnVisibilitychange) {
        document.removeEventListener(
          "visibilitychange",
          this.boundOnVisibilitychange,
        );
      }
    }
  }

  /**
   * 初始化
   */
  init() {
    const currentTab =
      this.tabs.find(
        (element) => element.getAttribute("aria-selected") === "true",
      ) || this.tabs[0];

    this.switchTab(currentTab);

    // 自动切换
    if (this.autoSwitch) {
      // 尊重用户动效偏好（减少动效时不自动切换）
      const prefersReduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReduced) this.startAutoSwitch();
    }

    this.setInstalled();
  }

  /**
   * 处理Tab被选中激活
   * @param event
   */
  onTabSelected(event) {
    const tab = event.target.closest(".tab");
    if (!tab) return;

    this.switchTab(tab);
  }

  /**
   * 处理键盘切换 Tab
   * @param event
   */
  onKeydown(event) {
    const tab = event.target.closest(".tab");
    if (!tab) return;

    const key = event.code ? event.code.toUpperCase() : "";
    if (key === "ENTER" || key === "SPACE") {
      this.switchTab(tab);
      event.preventDefault(); // 防止 Space 键的默认滚动行为
      return;
    }

    // 增加方向键与 Home/End 支持
    const tabs = this.tabs;
    const cur = tab;
    const idx = tabs.indexOf(cur);

    if (key === "ARROWRIGHT" || key === "ARROWDOWN") {
      event.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      this.switchTab(next);
      next.focus({ preventScroll: true });
    } else if (key === "ARROWLEFT" || key === "ARROWUP") {
      event.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      this.switchTab(prev);
      prev.focus({ preventScroll: true });
    } else if (key === "HOME") {
      event.preventDefault();
      const first = tabs[0];
      this.switchTab(first);
      first.focus({ preventScroll: true });
    } else if (key === "END") {
      event.preventDefault();
      const last = tabs[tabs.length - 1];
      this.switchTab(last);
      last.focus({ preventScroll: true });
    }
  }

  onFocusIn() {
    this.pauseAutoSwitch();
  }

  onFocusOut() {
    this.startAutoSwitch();
  }

  /**
   * 切换 Tab
   * @param tab DomElement
   * @constructor
   */
  switchTab(tab) {
    if (!tab) return;

    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (!panel) return;

    this.querySelectorAll(".tab[aria-selected='true']").forEach((el) =>
      el.setAttribute("aria-selected", "false"),
    );

    this.querySelectorAll(".panel:not([aria-hidden])").forEach((el) => {
      el.setAttribute("aria-hidden", "true");
    });

    tab.setAttribute("aria-selected", "true");
    panel.removeAttribute("aria-hidden");

    // 获取当前tab定位信息
    window.requestAnimationFrame(() => this.getTabPosition(tab));

    // 发送切换事件
    tab.dispatchEvent(
      new CustomEvent("item-active", {
        bubbles: true,
        detail: {
          element: tab,
        },
      }),
    );
  }

  /**
   * 获取tab的定位信息
   */
  getTabPosition(tab) {
    if (!tab || !this.tabsWrapper) return;

    const wrapperRect = this.tabsWrapper.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const left = tabRect.left - wrapperRect.left;
    const right = wrapperRect.right - tabRect.right;

    this.style.setProperty("--tab-left", `${left}px`);
    this.style.setProperty("--tab-right", `${right}px`);
  }

  pauseAutoSwitch() {
    this.ifPaused = true;
    if (this.autoInterval) clearTimeout(this.autoInterval);
  }

  startAutoSwitch() {
    if (!this.autoSwitch) return;

    this.ifPaused = false;
    if (this.autoInterval) clearTimeout(this.autoInterval);

    // tabs 不足 2 个时直接返回
    if (!this.tabs || this.tabs.length < 2) return;

    this.autoInterval = setTimeout(
      this.switchToNext.bind(this),
      this.switchInterval,
    );
  }

  /**
   * 切换下一个
   */
  switchToNext() {
    if (this.ifPaused) return;

    let nextTab = this.querySelector(
      '.tab[aria-selected="true"]',
    )?.nextElementSibling;
    if (!nextTab) nextTab = this.tabs[0];

    this.switchTab(nextTab);

    this.autoInterval = setTimeout(
      this.switchToNext.bind(this),
      this.switchInterval,
    );
  }

  /**
   * 标记组件已经安装完成
   */
  setInstalled() {
    this.classList.add("tab-panel--installed");
  }
}

customElements.define("tab-panel", TabPanel);

/**
 * DetailsDisclosure 类
 * 这个类用于创建一个自定义的 HTML 元素，特别适用于管理 <details> 元素的展开和收起行为。
 * 它主要用于控制与 <details> 和 <summary> 元素相关的动画，并处理用户与这些元素的交互。
 * 当 <details> 元素的状态改变（展开或收起）时，它会相应地播放或取消内容区域的动画。
 * 这个类还提供了一个方法来手动关闭 <details> 元素，确保可访问性和一致的状态管理。
 */
class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");
    this.content =
      this.mainDetailsToggle.querySelector("summary").nextElementSibling;
    if (!this.mainDetailsToggle || !this.content) return;

    this.observeVisibility();
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  /**
   * 监听元素可见性
   * 可见的时候执行一操作
   */
  observeVisibility() {
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleWhenVisibility();
            observer.unobserve(this);
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
      },
    );

    this.observer.observe(this);
  }

  /**
   * 当元素可见的时候执行
   */
  handleWhenVisibility() {
    if (this.mainDetailsToggle.hasAttribute("open")) this.onToggle();

    this.mainDetailsToggle.addEventListener("toggle", this.onToggle.bind(this));
  }

  /**
   * 处理 toggle 事件
   */
  onToggle() {
    this.mainDetailsToggle
      .querySelector("summary")
      .setAttribute(
        "aria-expanded",
        this.mainDetailsToggle.hasAttribute("open"),
      );

    // 异步添加防止动画未应用
    setTimeout(() => {
      this.mainDetailsToggle.classList.toggle(
        "has-opened",
        this.mainDetailsToggle.hasAttribute("open"),
      );
    });
  }

  open() {
    this.mainDetailsToggle.setAttribute("open", "true");
  }

  close() {
    this.mainDetailsToggle.removeAttribute("open");
  }
}

customElements.define("details-disclosure", DetailsDisclosure);

/**
 * DropMenu 类
 * 这个类继承自 DetailsDisclosure，提供了特定于下拉菜单和选择器的功能。
 * 除了继承自基类的展开和收起行为的管理外，它还添加了焦点管理的特性。
 * 当用户将焦点从该元素移出时，DropMenu 类会自动关闭 <details> 元素。
 * 支持鼠标悬停打开
 * 还可以根据指定容器的大小自动调整宽度，防止超出或者被隐藏。
 * 适用于页眉【下拉菜单】、【地区和语言选择器】等需要焦点控制和动画支持的交互元素。
 */
class DropMenu extends DetailsDisclosure {
  constructor() {
    super();

    this.hoverCloseTimer = null;

    // 需要计算并设置宽度，防止 flex-direction: column, flex-wrap: wrap; 一些浏览器宽度无法自动撑开的问题
    this.strenchContent = this.querySelector(
      ".submenu-list[data-auto-strench]",
    );
    this.hasStrenchContent = false;
  }

  handleWhenVisibility() {
    super.handleWhenVisibility();
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.addEventListener("keydown", this.onKeyDown.bind(this));

    // 鼠标悬停打开
    if (this.hasAttribute("data-hover-open")) {
      const enableDelayClose = this.hasAttribute("data-delay-close"); // 设置延迟关闭

      this.mainDetailsToggle.addEventListener("mouseenter", () => {
        if (enableDelayClose && this.hoverCloseTimer) {
          clearTimeout(this.hoverCloseTimer);
          this.hoverCloseTimer = null;
        }
        this.open();
      });
      this.mainDetailsToggle.addEventListener("mouseleave", () => {
        if (enableDelayClose) {
          if (this.hoverCloseTimer) clearTimeout(this.hoverCloseTimer);
          this.hoverCloseTimer = setTimeout(this.close.bind(this), 300);
        } else {
          this.close();
        }
      });
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    // 调整位置，防止超出屏幕区域
    if (this.mainDetailsToggle.hasAttribute("data-constrain"))
      this.adjustContentPosition();

    if (this.strenchContent && !this.hasStrenchContent) {
      this.strenchContent.style.width = this.strenchContent.scrollWidth + "px";
      this.hasStrenchContent = true;
    }

    // 切换 header 激活状态
    const header = this.closest(".section-header");
    if (header)
      header.classList.toggle(
        "header--is-active",
        this.mainDetailsToggle.hasAttribute("open"),
      );

    super.onToggle();
  }

  /**
   * 监听键盘ESC事件，关闭 dropmenu
   * @param {*} event
   */
  onKeyDown(event) {
    if (
      (event.key === "Escape" || event.code === "Escape") &&
      this.mainDetailsToggle?.hasAttribute("open")
    ) {
      event.stopPropagation(); // 避免冒泡到更上层导致重复处理
      this.close();

      this.mainDetailsToggle
        ?.querySelector("summary, [role='button'], button, a")
        ?.focus();

      // 如果有延迟关闭计时器，也清理掉
      if (this.hoverCloseTimer) {
        clearTimeout(this.hoverCloseTimer);
        this.hoverCloseTimer = null;
      }
    }
  }

  /**
   * 调整内容位置，使其不能超过【右侧】限制区域
   * 默认是视口屏幕区域
   * data-area 可设置自定义边界区域
   * data-adjust 自动调整位置
   */
  adjustContentPosition() {
    const needAdjust = this.mainDetailsToggle.hasAttribute("data-adjust"); // 是否需要自动调整位置

    if (!this.mainDetailsToggle.hasAttribute("open")) {
      this.mainDetailsToggle.classList.remove("position--exceed");

      // 自动调整位置，重置位置
      if (needAdjust) {
        this.content.style.left = null;
      }
    } else {
      // 调整位置，使其不能超过限制区域
      let areaRightSidePosition = document.documentElement.clientWidth; // 右边界，默认屏幕右侧，不包含滚动条
      let areaLeftSidePosition = 0; // 左边界，默认屏幕左侧
      if (this.dataset.area) {
        // 如果设置了自定义边界
        const areaRect = document
          .querySelector(this.dataset.area)
          ?.getBoundingClientRect();
        if (areaRect) {
          areaRightSidePosition = areaRect.right;
          areaLeftSidePosition = areaRect.left;
        }
      }

      const contentRect = this.content.getBoundingClientRect();
      // 偏移量
      let offset = contentRect.right - areaRightSidePosition;

      if (offset > 0) {
        // 超出区域
        this.mainDetailsToggle.classList.add("position--exceed");

        if (needAdjust) {
          this.content.style.left = `${-Math.ceil(offset)}px`;
        }
      }
    }

    this.mainDetailsToggle.classList.toggle(
      "position--constrained",
      this.mainDetailsToggle.hasAttribute("open"),
    );
  }
}

customElements.define("drop-menu", DropMenu);

/**
 * 抽屉菜单
 */
class menuDrawer extends DetailsDisclosure {
  onToggle() {
    if (this.mainDetailsToggle.hasAttribute("open")) {
      webvista.disablePageScroll();

      // 重新计算页眉高度
      this.setTopPosition();
    } else {
      webvista.enablePageScroll();
    }

    super.onToggle();
  }

  setTopPosition() {
    const pageHeader = this.closest(".section-header");
    if (!pageHeader) return;

    document.documentElement.style.setProperty(
      "--header-bottom",
      `${pageHeader.querySelector("header").getBoundingClientRect().bottom}px`,
    );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${window.innerHeight}px`,
    );
  }
}

customElements.define("menu-drawer", menuDrawer);

/**
 * 延迟播放媒体
 */
class DeferredMedia extends HTMLElement {
  constructor() {
    super();

    this.template = this.querySelector("template");
    if (!this.template) return;

    // 点击按钮加载
    const playButton = this.querySelector(".media-play-button");
    if (playButton) {
      playButton.removeAttribute("disabled");
      playButton.addEventListener("click", this.loadContent.bind(this));
    }

    // 静音按钮
    this.muteButton = this.querySelector(".mute-button");
    if (this.muteButton)
      this.muteButton.addEventListener("click", this.toggleMute.bind(this));

    // data-load-when-visible: 当内容可见的时候加载视频资源
    if (this.hasAttribute("data-load-when-visible")) {
      this.initObserver();
    }
  }

  /**
   * 监听资源滚动到视口区域
   * 自动播放视频
   */
  initObserver() {
    const options = {
      root: null,
      rootMargin: "100px 0px 100px 0px",
    };

    new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadContent();
          observer.disconnect();
        }
      });
    }, options).observe(this);
  }

  /**
   * 获取媒体资源
   * @param focus
   */
  loadContent(focus = true) {
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.template.content.firstElementChild.cloneNode(true),
      );
      this.deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe"),
      );

      // 发送加载完成事件
      this.dispatchEvent(
        new CustomEvent("deferred-loaded", {
          bubbles: true,
        }),
      );

      // 下次渲染时候设置加载状态，防止火狐浏览器自动聚焦导致的页面闪中
      requestAnimationFrame(() => {
        this.setAttribute("loaded", "true");
      });

      if (this.deferredElement.nodeName === "VIDEO") {
        // 有静音按钮，监听音量变化
        if (this.muteButton) {
          this.deferredElement.addEventListener(
            "volumechange",
            this.onVolumeChange.bind(this),
          );

          // 初始化静音按钮状态
          this.muteButton.setAttribute(
            "aria-pressed",
            String(this.deferredElement.hasAttribute("muted")),
          );
        }

        // 自动播放
        if (this.deferredElement.getAttribute("autoplay")) {
          this.deferredElement.play(); // 播放视频
        }

        // 播放完成
        this.deferredElement.addEventListener(
          "ended",
          this.removeContent.bind(this),
        );
      }

      if (focus) this.deferredElement.focus();
    }
  }

  /**
   * 播放完成后移除资源
   */
  removeContent() {
    if (this.deferredElement) {
      this.deferredElement.remove();
      this.removeAttribute("loaded");
    }
  }

  /**
   * 处理音量变化
   */
  onVolumeChange() {
    this.muteButton.setAttribute(
      "aria-pressed",
      String(this.deferredElement.muted),
    );
  }

  /**
   * 切换静音状态
   */
  toggleMute() {
    if (this.deferredElement?.nodeName !== "VIDEO") return;

    this.deferredElement.muted = !this.deferredElement.muted;

    // 发送自定义事件
    this.dispatchEvent(
      new CustomEvent("video-mute", {
        bubbles: true,
        detail: {
          muted: this.deferredElement.muted,
        },
      }),
    );
  }
}

customElements.define("deferred-media", DeferredMedia);

/**
 * 超多变体的变体属性选择器
 * 支持超过250个变体数量
 */
class HighVariantSelects extends HTMLElement {
  constructor() {
    super();

    this.productForm = document.getElementById(
      `product-form-${this.dataset.section}`,
    );

    // 切换图片时候，页面是否自动滚动到相册位置
    this.ifAutoScrollToTop = this.hasAttribute("data-auto-scroll-to-top");

    this.addEventListener("change", this.onVariantChange.bind(this));
  }

  /**
   * 变体变化处理
   */
  onVariantChange(event) {
    this.toggleAddButtonStatus(true);
    this.removeErrorMessage(); // 移除product-form的错误消息

    this.updateOptions(event.target);
    this.renderProductInfo(event.isTrusted ? event.target : null);
  }

  /**
   * 获取选择器每个属性的值id数组
   * 返回值的集合数组
   * @param target
   */
  updateOptions(target) {
    if (target.tagName === "SELECT" && target.selectedOptions.length) {
      const selectedOption = Array.from(target.options).find((option) =>
        option.getAttribute("selected"),
      );
      if (selectedOption) selectedOption.removeAttribute("selected");
      target.selectedOptions[0].setAttribute("selected", "selected");
    }

    this.optionValueIds = Array.from(
      this.querySelectorAll("select option:checked, fieldset input:checked"),
    )
      .map((element) => element.dataset.optionValueId)
      .filter(Boolean);
  }

  /**
   * 更新媒体当前展示
   */
  updateMedia() {
    if (!this.currentVariant?.featured_media?.id) return;

    // 设置当前展示的媒体
    const mediaGallery = document.getElementById(
      `Media-Gallery-${this.dataset.section}`,
    );
    if (mediaGallery)
      mediaGallery.updateGallery(
        this.currentVariant.featured_media.id,
        this.ifAutoScrollToTop,
      );
  }

  // 更新浏览器地址
  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`,
    );
  }

  // 更新表单的variantId
  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`,
    );

    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      // 手动触发Change事件
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  /**
   * 设置变体不可售状态
   */
  setUnavailable() {
    // 隐藏指定元素
    const hidden_element_ids = [
      `Price-${this.dataset.section}`,
      `Inventory-${this.dataset.section}`,
      `Sku-${this.dataset.section}`,
      `Price-Per-Item-${this.dataset.section}`,
      `Volume-Note-${this.dataset.section}`,
      `Volume-${this.dataset.section}`,
      `Quantity-Rules-${this.dataset.section}`,
    ];

    hidden_element_ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.classList.add("hidden");
    });
  }

  // 更新本地取货、配送
  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant["available"]) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  /**
   * 移除product-form的错误消息
   */
  removeErrorMessage() {
    if (!this.productForm) return;

    this.productForm.closest("product-form")?.handleErrorMessage();
  }

  /**
   * 更新产品信息
   * 价格、库存、SKU、更新数量选择器和购买按钮区域（包括添加购物车，动态结账，到货通知按钮），分享，赠品，迷你结账，到货通知表单
   * 发送变体变化广播
   * @param target 目标焦点元素
   */
  renderProductInfo(target = null) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    webvista
      .fetchHtml(
        `${this.dataset.url}?option_values=${this.optionValueIds.join(",")}&section_id=${this.sourceSectionId}`,
        this.abortController.signal,
      )
      .then((html) => {
        this.updateBlock(html, "Variant-Selects"); // 更新选择器
        this.getCurrentVariant(); // 获取当前变体
        if (!this.currentVariant) {
          // 变体不存在
          this.toggleAddButtonStatus(
            true,
            window["variantStrings"]["unavailable"],
          );
          return this.setUnavailable();
        }

        this.updateVariantInput();
        this.updateURL();
        this.updatePickupAvailability();

        // 更新当前变体媒体
        this.updateMedia();

        // 同步添加购物车按钮
        const addCartButtonSource = html.getElementById(
          `Product-Submit-Button-${this.sourceSectionId}`,
        );
        this.toggleAddButtonStatus(
          addCartButtonSource
            ? addCartButtonSource.hasAttribute("disabled")
            : true,
          addCartButtonSource
            ? addCartButtonSource.querySelector(".button-text").innerText
            : window["variantStrings"]["soldOut"],
        );

        this.updateBlock(html, "Price");
        this.updateBlock(
          html,
          "Inventory",
          true,
          null,
          ({ innerHTML }) => innerHTML === "",
        );
        this.updateBlock(
          html,
          "Sku",
          true,
          null,
          ({ innerHTML }) => innerHTML === "",
        );

        this.updateBlock(html, "Share-Link"); // 分享链接
        this.updateBlock(
          html,
          "Notify-Email-Button",
          false,
          null,
          ({ classList }) => classList.contains("hidden"),
        ); // 同步到货订阅按钮
        this.updateBlock(html, "Notify-Email"); // 更新到货通知表单
        this.updateBlock(html, "Mini-Check", true, [
          ".mini-checkout-product .media",
          ".mini-checkout-product .mini-product-info",
          ".mini-variant-selects",
        ]); // 迷你结账

        // 重新初始化一些监听
        webvista.initLazyImages();
        webvista.initToolTips();

        // 发送广播
        webvista.publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId: this.dataset.section, // 目标 section id
            html, // 源 html
            variant: this.currentVariant,
          },
        });
      })
      .then(() => {
        if (target) document.querySelector(`#${target.id}`)?.focus();
      })
      .catch((error) => {
        // console.log(error);
        if (error.name === "AbortError") {
          // console.log(error);
        } else {
          webvista.popToast(
            window["accessibilityStrings"]["unknownError"],
            "error",
          );
        }
      });
  }

  /**
   * 更新页面区块内容
   * @param {Document} html - 包含新内容的HTML文档
   * @param {string} blockId - 区块基础ID
   * @param {boolean} [replaceEntireBlock=true] - 是否替换整个区块内容
   * @param {string[]} [selectorsToReplace] - 需要单独替换的选择器数组
   * @param {Function} [shouldHideCallback] - 决定区块是否隐藏的回调函数
   */
  updateBlock(
    html,
    blockId,
    replaceEntireBlock = true,
    selectorsToReplace,
    shouldHideCallback = (sourceElement) => false,
  ) {
    // 获取源元素和目标元素
    const sourceElement = html.getElementById(
      `${blockId}-${this.sourceSectionId}`,
    );
    const targetElement = document.getElementById(
      `${blockId}-${this.dataset.section}`,
    );

    // 如果元素不存在则直接返回
    if (!sourceElement || !targetElement) return;

    // 如果源Id存在，需要替换内容里面的源id为目标id
    if (this.dataset.originalSection) {
      // 创建源元素的克隆，避免修改原始DOM
      const clonedSource = sourceElement.cloneNode(true);
      // 将sourceElement中的this.dataset.originalSection字符串替换为this.dataset.section字符串
      const htmlContent = clonedSource.innerHTML;
      const regex = new RegExp(this.dataset.originalSection, "g");
      clonedSource.innerHTML = htmlContent.replace(regex, this.dataset.section);
      // 使用处理后的克隆元素作为新的源元素
      sourceElement.innerHTML = clonedSource.innerHTML;
    }

    // 替换内容逻辑
    if (replaceEntireBlock) {
      if (!selectorsToReplace?.length) {
        // 替换整个区块内容
        targetElement.innerHTML = sourceElement.innerHTML;
      } else {
        // 替换指定选择器的内容
        selectorsToReplace.forEach((selector) => {
          const targetSubElement = targetElement.querySelector(selector);
          const sourceSubElement = sourceElement.querySelector(selector);

          if (targetSubElement && sourceSubElement) {
            targetSubElement.replaceWith(sourceSubElement.cloneNode(true));
          }
        });
      }
    }

    // 更新区块可见性
    targetElement.classList.toggle("hidden", shouldHideCallback(sourceElement));
  }

  /**
   * 修改添加购物车按钮状态
   * @param disable
   * @param text
   */
  toggleAddButtonStatus(disable = true, text) {
    if (!this.productForm) return;

    const getButton = (id) =>
      document.getElementById(`${id}-${this.dataset.section}`);
    const updateButton = (button, text) => {
      if (button) {
        button.toggleAttribute("disabled", disable);
        if (text) {
          const textElement = button.querySelector(".button-text");
          if (textElement) textElement.textContent = text;
        }
      }
    };

    const addCartButton = getButton("Product-Submit-Button");
    const miniAddCartButton = getButton("Mini-Submit-Button");
    const dynamicCheckout = this.productForm.querySelector(".dynamic-checkout");

    updateButton(addCartButton, text);
    updateButton(miniAddCartButton, text);

    if (dynamicCheckout)
      dynamicCheckout.classList.toggle("hidden", disable && !!text);
  }

  /**
   * 获取当前变体json对象
   */
  getCurrentVariant() {
    const json = this.querySelector(
      "script[data-selected-variant]",
    ).textContent;
    this.currentVariant = !!json ? JSON.parse(json) : null;
  }

  /**
   * 获取源 section id
   * @returns {string}
   */
  get sourceSectionId() {
    return this.dataset.originalSection || this.dataset.section;
  }
}
customElements.define("high-variant-selects", HighVariantSelects);

/*
  推荐产品，互补产品
 */
class ProductRecommendations extends HTMLElement {
  constructor() {
    super();

    this.container = this.querySelector(".products-container");
    if (!this.dataset.url) return;

    this.obsever = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.fetchProductData();
      },
      { rootMargin: "0px 0px 400px 0px" },
    );

    this.obsever.observe(this);
  }

  disconnectedCallback() {
    if (this.obsever) this.obsever.disconnect();
  }

  fetchProductData() {
    webvista
      .fetchHtml(this.dataset.url)
      .then((html) => {
        this.handleHtml(html);
      })
      .catch((error) => {
        this.hide();
      });
  }

  handleHtml(html) {
    const recommendationContainer = html.querySelector(
      `#${this.id} template`,
    )?.content;
    if (!recommendationContainer) return this.hide();

    this.container.innerHTML = "";
    this.container.append(recommendationContainer);

    // 加载完成状态
    webvista.initLazyImages();
    webvista.initToolTips();
  }

  hide() {
    if (this.hasAttribute("data-hide-target")) {
      document.getElementById(this.dataset.hideTarget)?.classList.add("hidden");
    } else {
      this.classList.add("hidden");
    }
  }
}

customElements.define("product-recommendations", ProductRecommendations);

/**
 * 产品卡片处理类
 * 主要是为了处理 Swatch 图片切换（hover）
 */
class ProductCard extends HTMLElement {
  constructor() {
    super();

    this.colorSwatches = this.querySelector(".color-swatches");
    if (this.colorSwatches) this.initSwatchHandle();
  }

  disconnectedCallback() {
    if (!this.colorSwatches || !this.boundOnSwatchHover) return;
    this.colorSwatches.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.removeEventListener("mouseenter", this.boundOnSwatchHover);
    });
  }

  /**
   * 初始化颜色选择器（mouseenter 切换）
   */
  initSwatchHandle() {
    const swatches = this.colorSwatches.querySelectorAll(".color-swatch");
    if (!swatches.length) return;

    // 保存处理器引用，便于解绑
    this.boundOnSwatchHover = this.onSwatchHover.bind(this);

    swatches.forEach((swatch) => {
      swatch.addEventListener("mouseenter", this.boundOnSwatchHover);
      swatch.addEventListener("focus", this.boundOnSwatchHover, true); // 让键盘 Tab 到色块时也生效（基础可访问性）
    });
  }

  onSwatchHover(event) {
    const swatch = event.currentTarget;
    const currentSwatch = this.colorSwatches.querySelector(
      ".color-swatch.active",
    );
    const index = swatch.dataset.index;

    const variantImage = this.querySelector(
      `.product-card-variant-image[data-index="${index}"]`,
    );
    if (!variantImage || swatch === currentSwatch) return;

    if (currentSwatch) this.inActiveSwatch(currentSwatch);
    this.activeSwatch(swatch, variantImage);
  }

  /**
   * 激活 swatch
   * @param swatch
   * @param image
   */
  activeSwatch(swatch, image) {
    swatch.classList.add("active");
    this.classList.add("has-swatch-active");
    image.classList.remove("hidden");
  }

  /**
   * 取消激活 swatch
   * @param swatch
   */
  inActiveSwatch(swatch) {
    swatch.classList.remove("active");
    this.classList.remove("has-swatch-active");
    const index = swatch.dataset.index;
    this.querySelector(
      `.product-card-variant-image[data-index="${index}"]`,
    )?.classList.add("hidden");
  }
}

customElements.define("product-card", ProductCard);

/**
 * 粘性滚动效果
 * data-sticky-distance 粘性距离，值越大，粘性时间越久
 * data-top-halt 滚动到顶部的停顿距离，值越大停顿越久
 * data-bottom-halt 滚动到底部的停顿距离，值越大停顿越久
 * data-trigger-position 触发效果的位置，top|center|bottom; 默认值 top，滚动到页面顶部时候触发
 * data-mobile-disabled 手机端禁用
 */
class StickyScroll extends HTMLElement {
  constructor() {
    super();

    // 手机端禁用
    if (this.hasAttribute("data-mobile-disabled") && webvista.isMobileScreen())
      return;

    this.hasListenWindowScroll = false; // 是否已经监听页面滚动
    this.inView = false; // 是否在视区内

    this.preStatus = 0; // 前状态 0: 未开始；1: 效果中；2: 已结束
    this.currentStatus = 0; // 当前状态

    this.stickyContainer = this.querySelector(".sticky-scroll-container");
    if (!this.stickyContainer) return;

    this.changeRatio = 0;
    this.stickyScrollDistance =
      parseInt(this.getAttribute("data-sticky-distance")) || 0; // 粘性效果距离，距离越大，动画时间越长
    this.getTriggerOffset(); // 获取触发位置，可以实现提前触发或者延迟触发
    this.topHalt = parseInt(this.getAttribute("data-top-halt")) || 0; // 上停顿距离
    this.bottomHalt = parseInt(this.getAttribute("data-bottom-halt")) || 0; // 下停顿距离

    if (
      this.stickyScrollDistance > 0 &&
      this.stickyScrollDistance - this.topHalt - this.bottomHalt <= 0
    )
      return;

    this.containerHeight = this.offsetHeight; // 容器高度
    this.boundHandleScrollEffect = this.handleScrollEffect.bind(this); // 绑定滚动效果
    if (!this.hasAttribute("data-initialized")) this.initializeHeight();

    this.observeScrollIntoView();
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  observeScrollIntoView() {
    this.observer = new IntersectionObserver(
      (entries) => {
        this.inView = entries[0].isIntersecting;
        if (
          this.inView &&
          this.hasAttribute("data-initialized") &&
          this.referencePageScrollY == null
        )
          this.getReferenceScrollY();

        this.inView
          ? this.listenWindowScroll()
          : this.removeListenWindowScroll();
      },
      {
        root: null,
        rootMargin: "0px 0px -200px 0px",
        threshold: 0,
      },
    );

    this.observer.observe(this);
  }

  /**
   * 获取相对于页面顶部的触发位置
   * 可以实现提前触发或者延迟触发
   */
  getTriggerOffset() {
    this.triggerPosition = this.getAttribute("data-trigger-position") || "top";
    const clientHeight = document.documentElement.clientHeight;

    if (this.triggerPosition === "top") {
      this.triggerOffset = 0;
    } else if (this.triggerPosition === "center") {
      this.triggerOffset = clientHeight / 2;
    } else {
      this.triggerOffset = clientHeight;
    }
  }

  /**
   * 获取参照的 scrollY
   * 之后会获取相对的滚动距离
   */
  getReferenceScrollY() {
    const rect = this.getBoundingClientRect();
    const pageScrollTop = window.scrollY || document.documentElement.scrollTop;
    this.referencePageScrollY = pageScrollTop + rect.top - this.triggerOffset;
  }

  /**
   * 监听页面滚动
   */
  listenWindowScroll() {
    if (!this.hasListenWindowScroll) {
      window.addEventListener("scroll", this.boundHandleScrollEffect);
      this.hasListenWindowScroll = true;
    }
  }

  /**
   * 取消页面滚动监听
   */
  removeListenWindowScroll() {
    if (this.hasListenWindowScroll) {
      window.removeEventListener("scroll", this.boundHandleScrollEffect);
      this.hasListenWindowScroll = false;
    }
  }

  /**
   * 设置容器高度
   */
  initializeHeight() {
    this.style.height = `${this.containerHeight + this.stickyScrollDistance}px`;
    this.setAttribute("data-initialized", "true");
  }

  /**
   * 处理滚动效果
   * 有前后停顿效果
   */
  handleScrollEffect() {
    const currentPageScrollY =
      window.scrollY || document.documentElement.scrollTop;
    const rect = this.getBoundingClientRect();

    if (
      rect.top <= this.triggerOffset &&
      rect.bottom > document.documentElement.clientHeight
    ) {
      // 触发效果的滚动范围
      const relativeScrollY = currentPageScrollY - this.referencePageScrollY;
      const ratio =
        (relativeScrollY - this.topHalt) /
        (this.stickyScrollDistance +
          this.triggerOffset -
          this.topHalt -
          this.bottomHalt);
      this.changeRatio = Math.min(1, Math.max(0, ratio));
    } else if (rect.top > this.triggerOffset) {
      this.changeRatio = 0;
    } else {
      this.changeRatio = 1;
    }

    // 当前状态
    if (this.changeRatio <= 0) {
      this.currentStatus = 0; // 未开始
    } else if (this.changeRatio >= 1) {
      this.currentStatus = 2; // 已结束
    } else {
      this.currentStatus = 1; // 效果中
    }

    // 状态变化
    if (this.preStatus !== this.currentStatus) {
      if (this.currentStatus === 1) {
        this.classList.add("sticky-scroll--effect");
        this.classList.remove("sticky-scroll--end");
      } else if (this.currentStatus === 2) {
        this.classList.add("sticky-scroll--end");
        this.classList.remove("sticky-scroll--effect");
      } else {
        this.classList.remove("sticky-scroll--effect");
        this.classList.remove("sticky-scroll--end");
      }
    }

    this.preStatus = this.currentStatus; // 更新状态
    this.style.setProperty("--change-ratio", this.changeRatio);
  }
}
customElements.define("sticky-scroll", StickyScroll);

/**
 * 数字递增效果
 */
class IncrementNumber extends HTMLElement {
  constructor() {
    super();
    // 初始化起始数字
    this.start = 0;
    // 当前显示的数字
    this.currentNumber = 0;

    // 使用 IntersectionObserver 观察元素是否进入视窗
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (entries[0].isIntersecting) {
          // 当元素进入视窗时，初始化并开始动画
          this.init();
          // 停止观察
          observer.disconnect();
        }
      },
      {
        root: null, // 使用视窗作为根
        rootMargin: "-300px 0px -300px 0px",
      },
    );

    this.observer.observe(this);
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  // 初始化目标数字和动画持续时间
  init() {
    // 提取数字部分
    const textContent = this.textContent;
    const numberMatch = textContent.match(/\d+/);
    if (!numberMatch) return;

    this.targetNumber = parseInt(numberMatch[0], 10);

    this.remainingText = textContent.replace(numberMatch[0], "[number]"); // 提取非数字部分，并用[number]占位
    this.duration = parseInt(this.getAttribute("data-duration"), 10) || 2000;
    this.startTime = Date.now();
    this.updateNumber();
  }

  // 缓动函数，定义非线性进度
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // 更新数字的方法
  updateNumber() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.startTime;
    const progress = Math.min(elapsedTime / this.duration, 1);
    const easedProgress = this.easeInOutQuad(progress);
    this.currentNumber = Math.floor(
      this.start + easedProgress * (this.targetNumber - this.start),
    );
    this.textContent = this.remainingText.replace(
      "[number]",
      this.currentNumber,
    );

    if (progress < 1) {
      requestAnimationFrame(this.updateNumber.bind(this));
    }
  }
}
customElements.define("increment-number", IncrementNumber);

/**
 * 动态打字效果
 */
class TypingWords extends HTMLElement {
  constructor() {
    super();
    this.index = 0;

    this.observer = new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) {
        this.text = this.getAttribute("data-text") || "";
        this.interval = this.getAttribute("data-interval")
          ? parseInt(this.getAttribute("data-interval"))
          : 10;

        this.initTyping();

        observer.disconnect();
      }
    });

    this.observer.observe(this);
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
    this.clearTimers();
  }

  clearTimers() {
    if (this.timer) clearInterval(this.timer);
    if (this.restartTimer) clearTimeout(this.restartTimer);
  }

  initTyping() {
    this.textContent = ""; // 清空内容
    this.index = 0; // 重置索引
    this.timer = setInterval(() => this.type(), 150);
  }

  type() {
    if (this.index < this.text.length) {
      this.textContent += this.text.charAt(this.index);
      this.index++;
    } else {
      clearInterval(this.timer);
      this.restartTimer = setTimeout(
        () => this.initTyping(),
        this.interval * 1000,
      );
    }
  }
}
customElements.define("typing-words", TypingWords);

class CustomCopyText extends HTMLElement {
  constructor() {
    super();

    const debounceHandle = webvista.debounce(() => {
      if (typeof Shopify !== "undefined" && Shopify.designMode) {
        return webvista.popToast(
          window["copyStrings"]["copyDisabled"],
          "warning",
        );
      }

      navigator.clipboard
        .writeText(this.getAttribute("data-text"))
        .then(() => {
          webvista.popToast(this.getAttribute("data-message"), "success");
        })
        .catch((err) => {
          webvista.popToast(window["copyStrings"]["copyFailed"], "error");
        });
    }, 500);

    this.addEventListener("click", debounceHandle);

    // 监听键盘事件，支持空格和回车
    this.addEventListener("keydown", (event) => {
      const key = event.code ? event.code.toUpperCase() : "";

      if (key === "ENTER" || key === "SPACE") {
        event.preventDefault(); // 防止页面滚动（空格键的默认行为）
        debounceHandle(); // 执行复制操作
      }
    });
  }
}
customElements.define("custom-copy-text", CustomCopyText);

class LinkForm extends HTMLElement {
  constructor() {
    super();

    this.searchInput = this.querySelector(".filter-input");

    if (this.searchInput) {
      this.searchInput.addEventListener("keyup", this.onKeyup.bind(this));

      this.searchField = this.searchInput.parentElement;
      this.resetButton = this.searchField.querySelector(".reset-button");
      this.resetButton.addEventListener("click", this.resetFilter.bind(this));

      this.previousValue = "";
    }

    // 使用事件委托来处理点击事件，提高性能
    this.boundOnItemClick = this.onItemClick.bind(this);
    this.addEventListener("click", this.boundOnItemClick);
  }

  disconnectedCallback() {
    if (this.boundOnItemClick)
      this.removeEventListener("click", this.boundOnItemClick);
  }

  onKeyup() {
    const searchValue = webvista.normalizeString(this.searchInput.value);
    if (searchValue === this.previousValue) return;

    this.previousValue = searchValue;
    this.toggleResetButton();

    const itemList = this.querySelectorAll(".list-item");
    let visibleCount = 0;
    itemList.forEach((element) => {
      const name = webvista.normalizeString(
        element.querySelector(".name").textContent,
      );
      if (name.indexOf(searchValue) > -1) {
        element.classList.remove("hidden");
        visibleCount++;
      } else {
        element.classList.add("hidden");
      }
    });
  }

  resetFilter() {
    this.searchInput.value = "";
    this.onKeyup();
    this.searchInput.focus();
  }

  toggleResetButton() {
    this.resetButton.classList.toggle("hidden", !this.searchInput.value);
  }

  /**
   * @method onItemClick
   * @description 链接的点击事件处理函数。阻止默认行为，设置输入值，并提交表单。
   * @param {Event} event - 点击事件对象
   */
  onItemClick(event) {
    const link = event.target.closest("a");
    if (!link) return;

    event.preventDefault();
    const form = this.querySelector("form");
    if (!form) return;

    const input = this.querySelector("input.link-value");
    if (input) input.value = link.dataset.value;

    form.submit();
  }
}
customElements.define("link-form", LinkForm);

/**
 * 文本容器，有限制高度功能
 */
class ExpandableContainer extends HTMLElement {
  constructor() {
    super();

    if (!this.hasAttribute("data-limit-height")) return;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.init();
          this.observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px 300px 0px",
      },
    );
    this.observer.observe(this);
  }

  init() {
    if (this.contentMain.scrollHeight <= this.contentMain.clientHeight) return;

    this.classList.add("has-exceed");
    this.expandButton?.addEventListener("click", this.toggleExpand.bind(this));
    this.expandButton?.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  get contentMain() {
    return this.querySelector(".content-main");
  }

  get expandButton() {
    return this.querySelector(".expand-button");
  }

  get readMoreText() {
    return this.querySelector(".read-more-text");
  }

  get readLessText() {
    return this.querySelector(".read-less-text");
  }

  toggleExpand() {
    const isExpanded = this.classList.toggle("has-expand");
    this.expandButton.setAttribute("aria-expanded", isExpanded.toString());

    // 为屏幕阅读器提供反馈
    if (isExpanded) {
      this.readMoreText.classList.add("hidden");
      this.readLessText.classList.remove("hidden");
    } else {
      this.readMoreText.classList.remove("hidden");
      this.readLessText.classList.add("hidden");
    }
  }

  onKeyDown(event) {
    // Handle Enter or Space key (standard for button activation)
    if (["Space", "Enter"].includes(event.code)) {
      event.preventDefault(); // Prevent scroll when Space is pressed
      this.toggleExpand();
    }
  }
}
customElements.define("expandable-container", ExpandableContainer);

/**
 * 行内的倒计时组件，可直接用于富文本
 * 用法: <inline-timer>2025-12-31 23:59:59</inline-timer>
 */
class InlineTimer extends HTMLElement {
  connectedCallback() {
    // Read the target datetime from the element’s text
    const targetText = this.textContent.trim();
    this.targetDate = new Date(targetText.replace(/-/g, "/")); // safer parsing

    // Clear existing content
    this.textContent = "";

    this.daysEl = document.createElement("b");
    this.daysEl.className = "days";
    this.hoursEl = document.createElement("b");
    this.hoursEl.className = "hours";
    this.minutesEl = document.createElement("b");
    this.minutesEl.className = "minutes";

    const sep1 = document.createElement("small");
    sep1.textContent = ":";
    sep1.className = "sep";
    const sep2 = document.createElement("small");
    sep2.textContent = ":";
    sep2.className = "sep";

    this.appendChild(this.daysEl);
    this.appendChild(sep1);
    this.appendChild(this.hoursEl);
    this.appendChild(sep2);
    this.appendChild(this.minutesEl);

    this.update();
    this.timerId = setInterval(() => this.update(), 1000 * 60); // update every minute
  }

  disconnectedCallback() {
    clearInterval(this.timerId);
  }

  update() {
    const now = new Date();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      this.daysEl.textContent = `0 ${window.timer.d}`;
      this.hoursEl.textContent = `0 ${window.timer.h}`;
      this.minutesEl.textContent = `0 ${window.timer.m}`;
      clearInterval(this.timerId);
      return;
    }

    const minutes = Math.floor(diff / 1000 / 60);
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;

    this.daysEl.textContent = `${days} ${window.timer.d}`;
    this.hoursEl.textContent = `${hours} ${window.timer.h}`;
    this.minutesEl.textContent = `${mins} ${window.timer.m}`;
  }
}

customElements.define("inline-timer", InlineTimer);
