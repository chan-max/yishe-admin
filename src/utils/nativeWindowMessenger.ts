type MessageHandler = (data: any, event: MessageEvent) => void

export class NativeWindowMessenger {
  private childWindow: Window | null = null
  private handlers: Record<string, MessageHandler[]> = {}

  openChild(url: string, target = '_blank') {
    // 定义独立窗口的特性参数 - 全屏模式
    const windowFeatures = [
      'fullscreen=yes',
      'resizable=yes',
      'scrollbars=yes',
      'status=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'directories=no',
      'copyhistory=no'
    ].join(',')

    this.childWindow = window.open(url, target, windowFeatures)
    
    // 检查窗口是否成功打开
    if (this.childWindow) {
      window.addEventListener('message', this._onMessage)
      
      // 监听子窗口关闭事件
      const checkClosed = setInterval(() => {
        if (this.childWindow?.closed) {
          clearInterval(checkClosed)
          this.destroy()
        }
      }, 1000)
    } else {
      console.error('无法打开独立窗口，可能是被浏览器阻止了弹窗')
    }
  }

  send(type: string, data: any) {
    if (this.childWindow && !this.childWindow.closed) {
      try {
        // 确保数据可以被序列化
        const serializedData = data === null ? null : JSON.parse(JSON.stringify(data))
        this.childWindow.postMessage({ type, data: serializedData }, '*')
      } catch (error) {
        console.error('数据序列化失败:', error)
        // 如果序列化失败，尝试发送基本数据
        this.childWindow.postMessage({ type, data: null }, '*')
      }
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers[type]) this.handlers[type] = []
    this.handlers[type].push(handler)
  }

  _onMessage = (event: MessageEvent) => {
    const { type, data } = event.data || {}
    if (type && this.handlers[type]) {
      this.handlers[type].forEach(fn => fn(data, event))
    }
  }

  destroy() {
    window.removeEventListener('message', this._onMessage)
    // 不再自动关闭子窗口
    // if (this.childWindow && !this.childWindow.closed) {
    //   this.childWindow.close()
    // }
    this.childWindow = null
    this.handlers = {}
  }

  // 检查子窗口是否仍然存在
  isWindowOpen(): boolean {
    return !!(this.childWindow && !this.childWindow.closed)
  }
} 