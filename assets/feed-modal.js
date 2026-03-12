if (!customElements.get("feed-modal")) {
  customElements.define(
    "feed-modal",
    class FeedModal extends ModalDialog {
      constructor() {
        super();

        const preButton = this.querySelector(".nav-button--prev");
        const nextButton = this.querySelector(".nav-button--next");
        if (preButton)
          preButton.addEventListener("click", this.toPre.bind(this));
        if (nextButton)
          nextButton.addEventListener("click", this.toNext.bind(this));
      }

      show(opener) {
        super.show(opener);

        // 继续播放视频
        webvista.playAllMedia(this);
      }

      /**
       * 打开前一个
       */
      toPre() {
        const preModal = document.getElementById(this.dataset.previousId);
        if (preModal) {
          this.hide();
          preModal.show();
        }
      }

      /**
       * 打开后一个
       */
      toNext() {
        const nextModal = document.getElementById(this.dataset.nextId);
        if (nextModal) {
          this.hide();
          nextModal.show();
        }
      }
    },
  );
}
