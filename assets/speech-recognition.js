/**
 * 语音识别自定义元素
 */
if (!customElements.get("speech-recognition")) {
  class SpeechRecognition extends HTMLElement {
    constructor() {
      super();

      // 初始化状态变量
      this.recognition = null; // 语音识别实例
      this.isListening = false; // 当前是否正在监听

      // 初始化语音识别
      this.initRecognition();

      // 添加点击事件监听
      this.addEventListener("click", this.toggleListening.bind(this));

      // 键盘事件
      this.addEventListener("keydown", (event) => {
        if (event.code === "Enter" || event.code === "Space") {
          event.preventDefault(); // 避免空格滚动页面
          this.toggleListening();
        }
      });
    }

    disconnectedCallback() {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
    }

    /**
     * 点击事件处理 - 切换语音识别状态
     */
    toggleListening() {
      if (!this.recognition)
        return webvista.popToast(
          window["speechRecognition"]["unSupport"],
          "error",
        );

      if (this.isListening) {
        this.recognition.stop();
      } else {
        this.recognition.start();
      }
    }

    /**
     * 初始化语音识别功能
     */
    initRecognition() {
      try {
        // 检测浏览器支持情况并创建实例
        const Recognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        this.recognition = new Recognition();

        // 配置识别参数
        this.recognition.interimResults = false; // 只要最终结果
        this.recognition.continuous = false; // 单次识别

        // 绑定事件处理
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onaudiostart = this.handleAudioStart.bind(this);
        this.recognition.onaudioend = this.handleAudioEnd.bind(this);
        this.recognition.onend = () => {
          this.isListening = false;
          this.classList.remove("is-listening");
        };
        this.recognition.onerror = this.handleError.bind(this);

        this.classList.add("init-success");
      } catch (error) {
        this.classList.add("init-failed");
      }
    }

    /**
     * 处理识别结果
     */
    handleResult(event) {
      const transcript = event.results[0][0].transcript;

      // 触发自定义事件，让外部可以获取结果
      this.dispatchEvent(
        new CustomEvent("speech-result", {
          detail: { transcript },
          bubbles: true,
        }),
      );
    }

    /**
     * 处理音频开始事件
     */
    handleAudioStart() {
      this.isListening = true;
      this.classList.add("is-listening");
    }

    /**
     * 处理音频结束事件
     */
    handleAudioEnd() {
      this.isListening = false;
      this.classList.remove("is-listening");
    }

    /**
     * 处理错误事件
     */
    handleError(event) {
      let errorMessage = window["speechRecognition"]["error"];
      switch (event.error) {
        case "no-speech":
          errorMessage = window["speechRecognition"]["noSpeech"];
          break;
        case "audio-capture":
          errorMessage = window["speechRecognition"]["audioCapture"];
          break;
        case "not-allowed":
          errorMessage = window["speechRecognition"]["notAllowed"];
          break;
      }

      // 需要手动停止并清理状态
      this.isListening = false;
      this.classList.remove("is-listening");
      this.recognition.abort(); // 或 this.recognition.stop()

      webvista.popToast(errorMessage, "error");
    }
  }

  // 注册自定义元素
  customElements.define("speech-recognition", SpeechRecognition);
}
