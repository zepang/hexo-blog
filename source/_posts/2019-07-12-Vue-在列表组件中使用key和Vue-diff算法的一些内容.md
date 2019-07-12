---
title: Vue-在列表组件中使用key和Vue-diff算法的一些内容
img: 'https://placem.at/places?h=140'
date: 2019-07-12 10:08:05
categories: 前端 Vue
---

最近在网上看到这样一个前端面试题： 写 [**React / Vue 项目时为什么要在列表组件中写 key，其作用是什么？**](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/1)。题主给出的答案主要有以下两点（直接粘贴的题主答案）：

1. 更准确
   
因为带key就不是就地复用了，在sameNode函数 a.key === b.key对比中可以避免就地复用的情况。所以会更加准确。

1. 更快
   
利用key的唯一性生成map对象来获取对应节点，比遍历方式更快。(这个观点，就是我最初的那个观点。从这个角度看，map会比遍历更快。)

其实大部分的网友对于第一点是认同的，主要的争议出现在第二点。以下为题主贴出的`patch.js`的部分代码（和目前最新的代码有差别，不过逻辑一样）：

```js
// vue项目  src/core/vdom/patch.js  -488行
// 以下是为了阅读性进行格式化后的代码

// oldCh 是一个旧虚拟节点数组
if (isUndef(oldKeyToIdx)) {
  oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
}
if(isDef(newStartVnode.key)) {
  // map 方式获取
  idxInOld = oldKeyToIdx[newStartVnode.key]
} else {
  // 遍历方式获取
  idxInOld = findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
}
```

解释一下上边的题主注释的两种获取方式：

`oldKeyToIdx`是以`key`为键值存储的旧节点的索引值的对象，通过对象属性值的方式来获取就是题主所说的"map方式获取"

`findIdxInOld`内部是通过for循环和sameVnode函数比较节点是否相同来获取索引

题主认为添加key属性的情况下，通过map的方式获取索引会比使用遍历循环的方式获取索引快。

这里先贴一下最新的一个代码[patch.js](https://github.com/vuejs/vue/blob/dev/src/core/vdom/patch.js#L424)：

```js
function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    let oldStartIdx = 0
    let newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx, idxInOld, vnodeToMove, refElm

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    const canMove = !removeOnly

    if (process.env.NODE_ENV !== 'production') {
      checkDuplicateKeys(newCh)
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx]
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
        oldStartVnode = oldCh[++oldStartIdx]
        newStartVnode = newCh[++newStartIdx]
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
        oldEndVnode = oldCh[--oldEndIdx]
        newEndVnode = newCh[--newEndIdx]
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
        oldStartVnode = oldCh[++oldStartIdx]
        newEndVnode = newCh[--newEndIdx]
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
        oldEndVnode = oldCh[--oldEndIdx]
        newStartVnode = newCh[++newStartIdx]
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
        idxInOld = isDef(newStartVnode.key)
          ? oldKeyToIdx[newStartVnode.key]
          : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
        if (isUndef(idxInOld)) { // New element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
        } else {
          vnodeToMove = oldCh[idxInOld]
          if (sameVnode(vnodeToMove, newStartVnode)) {
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
            oldCh[idxInOld] = undefined
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
          } else {
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
          }
        }
        newStartVnode = newCh[++newStartIdx]
      }
    }
    if (oldStartIdx > oldEndIdx) {
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(oldCh, oldStartIdx, oldEndIdx)
    }
  }

```

有些看了`diff`算法的代码的网友指出不添加key属性的情况下，则a.key 和 b.key 都是undefined，`sameVnode`通过直接进入patchVnode，会直接结束diff，根本不会运算到后边'利用对象取值而不是遍历数组'找相同节点的那一步。

咱们先不下结论，来看看vue的diff算法

## Vue-diff算法

首先是贴一张比较经典的图：

![](/diff.png)

diff算法是通过**同层的树节点进行比较而非对树进行逐层搜索遍历的方式**，所以时间复杂度只有O(n)，是一种相当高效的算法。



首先需要指出这种说法是错误的。第一点，在`sameVnode`中如果a.key 和 b.key存在值，且不相等，那么`sameVnode`直接返回`false`，可以直接省略 `a.key === b.key&&` 之后的判断逻辑，可以说是提高了效率。第二点，上述所说不会运算到后边'利用对象取值而不是遍历数组'找相同节点的那一步，是指`sameVnode`返回为`true`的情况，因为仅仅`a.key === b.key`不足以判断为`true`，如果返回`false`则还会运算到题主所说的那一步。另外，还需要说明，diff算法是通过比较新节点集合和就节点集合的方式来进行diff的，所以只要有不同的节点就会走到题主所说的那一步。


