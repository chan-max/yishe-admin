type MessageHandler = (data: any, event: MessageEvent) => void

export class NativeWindowMessenger {
  private childWindow: Window | null = null
  private handlers: Record<string, MessageHandler[]> = {}

  openChild(url: string, target = '_blank') {
    this.childWindow = window.open(url, target)
    window.addEventListener('message', this._onMessage)
  }

  send(type: string, data: any) {
    if (this.childWindow) {
      this.childWindow.postMessage({ type, data }, '*')
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
    this.childWindow = null
    this.handlers = {}
  }
} 