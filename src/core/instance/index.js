import {initMixin} from './init'
import {stateMixin} from './state'
import {renderMixin} from './render'
import {eventsMixin} from './events'
import {lifecycleMixin} from './lifecycle'
import {warn} from '../util/index'

function Vue(options) {
  // 开发环境下给出友好提示
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 真正的初始化工作
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
