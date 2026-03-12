if (!customElements.get("anchor-nav")) {
  customElements.define(
    "anchor-nav",
    class AnchorNav extends HTMLElement {
      constructor() {
        super();

        this.intersectionObserver = null;

        // Get all anchor targets
        this.getAnchors();
        if (this.anchors.length <= 0) return;

        // Initially set the first anchor as active
        this.setAnchorActive(this.anchors[0]["element"]);

        // Listen for anchor clicks and scroll to the corresponding position
        this.addEventListener("click", (event) => {
          if (event.target.classList.contains("anchor-item")) {
            event.preventDefault();

            // Scroll to anchor position
            const anchor = this.anchors.find((anchor) => {
              return anchor.element === event.target;
            });
            if (anchor) {
              const target = anchor.target;
              if (target) {
                const anchorOffset = window.innerHeight * 0.3;
                webvista.scrollToElementWithOffset(target, anchorOffset);
              }
            }
          }
        });

        // Initialize after DOM is ready
        if (document.readyState === "complete") {
          this.initObserver();
        } else {
          window.addEventListener("load", () => this.initObserver());
        }
      }

      /**
       * Collects all elements with the class "anchor-item" within the current context,
       * maps them to objects containing the element and its corresponding target element
       * (identified by the data-target-id attribute), and filters out anchors without a valid target.
       *
       * @returns {void}
       */
      getAnchors() {
        this.anchors = Array.from(this.querySelectorAll(".anchor-item"))
          .map((item) => {
            const href = item.getAttribute("href");
            const targetId = item.dataset.targetId;

            return {
              element: item,
              target: targetId ? document.getElementById(targetId) : null,
            };
          })
          .filter((anchor) => anchor.target !== null);
      }

      /**
       * Initializes the Intersection Observer to track anchor targets' visibility.
       * Cleans up any previous observer before creating a new one.
       * Uses different observer options depending on whether the script is running inside an iframe.
       * When an anchor target becomes visible, sets the corresponding anchor as active.
       * Observes all anchor targets defined in `this.anchors`.
       */
      initObserver() {
        // First, clean up any previous observer
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
        }

        // Since rootMargin may not work inside iframes, use threshold instead
        const options = webvista.inIframe()
          ? { root: null, threshold: 0.3 }
          : { root: null, rootMargin: "-40% 0px" };

        this.intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Find which anchor corresponds to this target
              const activeAnchor = this.anchors.find(
                (anchor) => anchor.target === entry.target,
              );

              if (activeAnchor) {
                this.setAnchorActive(activeAnchor.element);
              }
            }
          });
        }, options);

        // Observe all anchor targets
        this.anchors.forEach((anchor) => {
          this.intersectionObserver.observe(anchor.target);
        });
      }

      disconnectedCallback() {
        if (this.intersectionObserver) this.intersectionObserver.disconnect();
      }

      /**
       * Set anchor active
       * @param {Element} item
       * @returns
       */
      setAnchorActive(item) {
        if (!item) return;

        this.querySelector(".active")?.classList.remove("active");
        item.classList.add("active");

        // Set underline position
        this.setLinePosition(item);

        // Send a custom "item-active" event
        // Useful for scrollable content views to capture and move the item into viewport
        this.dispatchEvent(
          new CustomEvent("item-active", {
            bubbles: true,
            detail: {
              element: item,
            },
          }),
        );
      }

      /**
       * Set underline position
       * @param {Element} item
       * @returns
       */
      setLinePosition(item) {
        if (!item) return;

        const wrapperRect = this.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        const left = itemRect.left - wrapperRect.left;
        const right = wrapperRect.right - itemRect.right;
        const width = itemRect.width;

        this.style.setProperty("--item-left", `${left}px`);
        this.style.setProperty("--item-right", `${right}px`);
      }
    },
  );
}
