import videojs from 'video.js'
import './context-menu.scss'
import 'videojs-contextmenu'
import ContextMenu from './components/context-menu'
import autobind from 'utils/autobind'
import { getPointerPosition } from 'utils/positioning'
import { sliceProperties } from 'utils/slicing'

const defaults = {
  showNativeOnRecurringEvent: false
}

class ContextMenuPlugin {
  constructor(player, opts) {
    if (!Array.isArray(opts.content) && typeof opts.content !== 'function') {
      throw new Error('"content" required')
    }

    opts = Object.assign({}, defaults, opts)

    this.player = player
    this.options = sliceProperties(opts, 'content', 'showNativeOnRecurringEvent')

    autobind(this)
  }

  init() {
    // If we are not already providing "vjs-contextmenu" events, do so.
    this.player.contextmenu()
    this.player.on('vjs-contextmenu', this.onContextMenu.bind(this))
    this.player.ready(() => this.player.addClass('vjs-context-menu'))
  }

  getMenuPosition(e) {
    const pointerPosition = getPointerPosition(this.player.el(), e)
    const playerSize = this.player.el().getBoundingClientRect()

    return {
      left: Math.round(playerSize.width * pointerPosition.x),
      top: Math.round(playerSize.height - (playerSize.height * pointerPosition.y))
    }
  }

  onContextMenu(e) {
    if (this.menu) {
      this.menu.dispose()
      if (this.options.showNativeOnRecurringEvent) {
        // If this event happens while the custom menu is open, close it and do
        // nothing else. This will cause native contextmenu events to be intercepted
        // once again; so, the next time a contextmenu event is encountered, we'll
        // open the custom menu.
        return
      }
    }

    // Stop canceling the native contextmenu event until further notice.
    if (this.showNativeOnRecurringEvent) {
      this.player.contextmenu.options.cancel = false
    }

    e.preventDefault()

    // Allow dynamically setting the menu labels based on player
    let content = this.options.content

    if (typeof content === 'function') {
      content = content(this.player)
    }

    this.menu = new ContextMenu(this.player, {
      content,
      position: this.getMenuPosition(e)
    })

    // This is to handle a bug where firefox triggers both 'contextmenu' and 'click'
    // events on rightclick, causing menu to open and then immediately close.
    const clickHandler = (_e) => {
      if (!(_e.type === 'click' && (_e.which === 3 || _e.button === 2))) {
        this.menu.dispose()
      }
    }

    this.menu.on('dispose', () => {
      // Begin canceling contextmenu events again, so subsequent events will
      // cause the custom menu to be displayed again.
      this.player.contextmenu.options.cancel = true
      this.player.removeChild(this.menu)
      videojs.off(document, ['click', 'tap'], clickHandler)
      delete this.menu
    })

    this.player.addChild(this.menu)
    videojs.on(document, ['click', 'tap'], clickHandler)
  }
}

export default function(opts = {}) {
  new ContextMenuPlugin(this, opts).init()
}
