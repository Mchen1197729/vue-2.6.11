/* @flow */

import {isRegExp, remove} from 'shared/util'
import {getFirstComponentChild} from 'core/vdom/helpers/index'

type VNodeCache = { [key: string]: ?VNode };

/*
* getComponentName()函数 获取组件的name属性
* */
function getComponentName(opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

/*
*  matches(pattern,name) 用于判断name是否是pattern的一部分 返回布尔值
*   1.如果pattern是数组,判断name是否存在于数组中
*   2.如果pattern是字符串,判断pattern按照逗号分割成的数组中是否包含name
*   3.如果pattern是正则表达式,则判断name是否满足该正则表达式
*   总结:其实就是用来判断一个组件的name属性是否满足传入<keep-alive>组件的include和exclude属性
* */
function matches(pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

/*
* pruneCache(keepAliveInstance,filter)
*   该函数有两个功能 全凭借filter函数来控制是否销毁被缓存的组件
* */
function pruneCache(keepAliveInstance: any, filter: Function) {
  // keepAliveInstance就是<keep-alive>这个组件的实例
  const {cache, keys, _vnode} = keepAliveInstance
  // cache是左右被缓存的组件的实例组成的数组
  for (const key in cache) {
    const cachedNode: ?VNode = cache[key]
    if (cachedNode) {
      // name就是被缓存的组件的name属性
      const name: ?string = getComponentName(cachedNode.componentOptions)
      // filter函数是传入的第二个参数
      if (name && !filter(name)) {
        // pruneCacheEntry()函数 作用是销毁被缓存的组件
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

// 销毁被缓存的组件实例
function pruneCacheEntry(cache: VNodeCache, key: string, keys: Array<string>, current?: VNode) {
  // cached就是被缓存的组件实例
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    // 销毁之前缓存的组件实例
    cached.componentInstance.$destroy()
  }
  cache[key] = null
  // 将这个被销毁的组件的唯一标识key从keys数组中移除
  remove(keys, key)
}

const patternTypes: Array<Function> = [String, RegExp, Array]

export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created() {
    // this.cache保存所有被缓存的组件
    this.cache = Object.create(null)
    // this.keys是所有被缓存的组件的唯一表示key字符串组成的数组(是有顺序的)
    this.keys = []
  },

  // keep-alive组件被销毁时
  destroyed() {
    // 销毁所有被缓存的组件
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted() {
    // 监视include&exclude属性的变化
    this.$watch('include', val => {
      // 因为 name=>matches(val,name)返回值为true 所以pruneCache是不会销毁被缓存的组件的
      // 而且这里是懒缓存 并不是include属性变化就去缓存新的组件 而是等组件满足include并且组件被激活时才缓存该组件
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      // 因为 name => !matches(val, name)的返回值是false 因此pruneCache函数是会将缓存的组件销毁的
      pruneCache(this, name => !matches(val, name))
    })
  },

  // 渲染函数
  render() {
    // slot就是keep-alive标签之间的节点组成的数组 [VNode,VNode,....]
    const slot = this.$slots.default
    // vnode就是slot的第一个组件子节点
    // keep-alive组件默认值缓存第一个组件子节点 所以一般搭配component或者router-view来使用
    const vnode: VNode = getFirstComponentChild(slot)
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name: ?string = getComponentName(componentOptions)
      const {include, exclude} = this
      // 这个if是用来判断非缓存组件的
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }
      // **这里才是真的进行组件缓存**
      // cache和keys是已经被缓存的组件的信息
      const {cache, keys} = this
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      if (cache[key]) {
        // 如果该组件被缓存 直接从缓存中读取组件
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest 让这个组件的key是最新的
        remove(keys, key)
        keys.push(key)
      } else {
        // 这个组件之前没有被缓存过 进行缓存
        cache[key] = vnode
        keys.push(key)
        // prune oldest entry
        // 如果缓存组件的数量超过了max 那么将最旧的一个从缓存中清除掉
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }

      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
