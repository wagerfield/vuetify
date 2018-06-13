import '../../stylus/components/_dialogs.styl'

// Mixins
import Dependent from '../../mixins/dependent'
import Detachable from '../../mixins/detachable'
import Overlayable from '../../mixins/overlayable'
import Returnable from '../../mixins/returnable'
import Stackable from '../../mixins/stackable'
import Toggleable from '../../mixins/toggleable'

// Directives
import ClickOutside from '../../directives/click-outside'

// Helpers
import { getZIndex } from '../../util/helpers'

export default {
  name: 'v-dialog-content',

  mixins: [
    Dependent,
    Detachable,
    Overlayable,
    Returnable,
    Stackable,
    Toggleable
  ],

  directives: {
    ClickOutside
  },

  data () {
    return {
      animate: false,
      animateTimeout: null,
      isDependent: false,
      stackClass: 'v-dialog__content--active',
      stackMinZIndex: 200
    }
  },

  props: {
    disabled: Boolean,
    persistent: Boolean,
    fullscreen: Boolean,
    fullWidth: Boolean,
    noClickAnimation: Boolean,
    maxWidth: {
      type: [String, Number],
      default: 'none'
    },
    origin: {
      type: String,
      default: 'center center'
    },
    width: {
      type: [String, Number],
      default: 'auto'
    },
    scrollable: Boolean,
    transition: {
      type: [String, Boolean],
      default: 'dialog-transition'
    }
  },

  computed: {
    classes () {
      return {
        [(`v-dialog ${this.contentClass}`).trim()]: true,
        'v-dialog--active': this.isActive,
        'v-dialog--persistent': this.persistent,
        'v-dialog--fullscreen': this.fullscreen,
        'v-dialog--scrollable': this.scrollable,
        'v-dialog--animated': this.animate
      }
    },
    contentClasses () {
      return {
        'v-dialog__content': true,
        'v-dialog__content--active': this.isActive
      }
    },
    computedStyle () {
      return this.fullscreen || {
        maxWidth: this.maxWidth === 'none' ? undefined : (isNaN(this.maxWidth) ? this.maxWidth : `${this.maxWidth}px`),
        width: this.width === 'auto' ? undefined : (isNaN(this.width) ? this.width : `${this.width}px`)
      }
    }
  },

  watch: {
    isActive (val) {
      if (val) {
        this.show()
      } else {
        this.removeOverlay()
        this.unbind()
      }
    }
  },

  mounted () {
    this.isBooted = this.isActive
    this.isActive && this.show()
  },

  beforeDestroy () {
    if (typeof window !== 'undefined') this.unbind()
  },

  methods: {
    animateClick () {
      this.animate = false
      // Needed for when clicking very fast
      // outside of the dialog
      this.$nextTick(() => {
        this.animate = true
        clearTimeout(this.animateTimeout)
        this.animateTimeout = setTimeout(() => (this.animate = false), 150)
      })
    },
    closeConditional (e) {
      // If the dialog content contains
      // the click event, or if the
      // dialog is not active
      if (this.$refs.content.contains(e.target) ||
        !this.isActive
      ) return false

      // If we made it here, the click is outside
      // and is active. If persistent, and the
      // click is on the overlay, animate
      if (this.persistent) {
        if (!this.noClickAnimation &&
          this.overlay === e.target
        ) this.animateClick()

        return false
      }

      // close dialog if !persistent, clicked outside and we're the topmost dialog.
      // Since this should only be called in a capture event (bottom up), we shouldn't need to stop propagation
      return getZIndex(this.$refs.content) >= this.getMaxZIndex()
    },
    show () {
      !this.fullscreen && !this.hideOverlay && this.genOverlay()
      this.fullscreen && this.hideScroll()
      this.$refs.content.focus()
      this.$listeners.keydown && this.bind()
    },
    bind () {
      window.addEventListener('keydown', this.onKeydown)
    },
    unbind () {
      window.removeEventListener('keydown', this.onKeydown)
    },
    onKeydown (e) {
      this.$emit('keydown', e)
    }
  },

  render (h) {
    const dialog = h('div', {
      class: this.classes,
      style: this.computedStyle,
      ref: 'dialog',
      directives: [
        {
          name: 'click-outside',
          value: () => (this.isActive = false),
          args: {
            closeConditional: this.closeConditional,
            include: this.getOpenDependentElements
          }
        },
        { name: 'show', value: this.isActive }
      ],
      on: {
        click: e => { e.stopPropagation() }
      }
    }, this.showLazyContent(this.$slots.default))

    return h('div', {
      'class': this.contentClasses,
      attrs: { tabIndex: -1 },
      style: { zIndex: this.activeZIndex },
      ref: 'content'
    }, [
      !this.transition
        ? dialog
        : h('transition', {
          props: {
            name: this.transition,
            origin: this.origin
          }
        }, [dialog])
    ])
  }
}