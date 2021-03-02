/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// arrayMethods是一个空对象 原型指向arrayProto
export const arrayMethods = Object.create(arrayProto)

// 数组中需要重写的方法名组成的数组
const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  // def(obj,key,value,enumerable?) 使用Object.defineProperty()阿里定义一个对象的属性和属性对应的值
  def(arrayMethods, method, function mutator (...args) {
    // result就是浏览器数组本身的逻辑
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push': // 数组末尾追加元素
      case 'unshift': // 数组头部添加元素
        inserted = args
        break
      case 'splice': // 可能是删除也可能是替换
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
