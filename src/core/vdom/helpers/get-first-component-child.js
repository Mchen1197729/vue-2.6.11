/* @flow */

import {isDef} from 'shared/util'
import {isAsyncPlaceholder} from './is-async-placeholder'

/*
* getFirstComponentChild()函数 获取传入的参数的第一个组件子节点 只获取第一个
* */
export function getFirstComponentChild(children: ?Array<VNode>): ?VNode {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}
