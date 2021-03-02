/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// arrayMethods是一个空对象 原型指向arrayProto
export const arrayMethods = Object.create(arrayProto)

// 数组中需要重写的方法名
const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // original就是该方法原本的逻辑 例如:Array.prototype.push
  const original = arrayProto[method]
  // def(obj,key,value,enumerable?) 使用Object.defineProperty()方法定义一个对象的属性和属性对应的值
  // 通过Object.defineProperty()给arrayMethods对象添加属性 属性的值都是函数
  // 这里添加的是显式的属性 因此会覆盖掉原型上的同名属性
  def(arrayMethods, method, function mutator (...args) {
    // result就是浏览器数组本身的逻辑
    const result = original.apply(this, args)
    // ???没看懂??? this指向谁
    // this.__ob__属性就是Observer实例
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':    // 数组末尾追加元素
      case 'unshift': // 数组头部添加元素
        // args是数组类型
        inserted = args // inserted就是调用push和unshift方法时传入的参数
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
