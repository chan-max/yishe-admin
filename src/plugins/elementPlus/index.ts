import type { App } from "vue";
// 需要全局引入一些组件，如ElScrollbar，不然一些下拉项样式有问题
import { ElLoading, ElScrollbar, ElButton } from "element-plus";

const plugins = [ElLoading];

const components = [ElScrollbar, ElButton]

const LOADING_SPINNER_SELECTOR = '.el-loading-spinner'
const LOADER_READY_FLAG = 'appLoaderReady'
let loadingObserverStarted = false

const createLoader = () => {
  const loader = document.createElement('div')
  loader.className = 'loader'

  Array.from({ length: 6 }).forEach(() => {
    loader.appendChild(document.createElement('span'))
  })

  return loader
}

const enhanceLoadingSpinner = (spinner: Element) => {
  if (!(spinner instanceof HTMLElement) || spinner.dataset[LOADER_READY_FLAG] === '1') {
    return
  }

  spinner.dataset[LOADER_READY_FLAG] = '1'

  const textNode = spinner.querySelector('.el-loading-text')
  const loader = createLoader()

  if (textNode) {
    spinner.insertBefore(loader, textNode)
  } else {
    spinner.appendChild(loader)
  }
}

const scanLoadingSpinner = (root: ParentNode) => {
  root.querySelectorAll(LOADING_SPINNER_SELECTOR).forEach((spinner) => {
    enhanceLoadingSpinner(spinner)
  })
}

const setupGlobalLoading = () => {
  if (loadingObserverStarted || typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const startObserve = () => {
    if (loadingObserverStarted) {
      return
    }

    loadingObserverStarted = true
    scanLoadingSpinner(document)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return
          }

          if (node.matches(LOADING_SPINNER_SELECTOR)) {
            enhanceLoadingSpinner(node)
            return
          }

          scanLoadingSpinner(node)
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  if (document.body) {
    startObserve()
    return
  }

  window.addEventListener('DOMContentLoaded', startObserve, { once: true })
}

export const setupElementPlus = (app: App<Element>) => {
  plugins.forEach((plugin) => {
    app.use(plugin)
  })

  components.forEach((component) => {
    app.component(component.name, component)
  })

  setupGlobalLoading()
}
