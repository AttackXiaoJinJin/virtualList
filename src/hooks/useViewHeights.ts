import React,{useCallback, useEffect, useRef} from "react";
import loopRequestAnimationFrame from "../utils/loopRequestAnimationFrame.ts";
import findDOMNode from "../utils/findDomNode.ts";
import CacheMap from "../utils/CacheMap.ts";

function useViewHeights(props:{getDataKey:any;}) {
    const {getDataKey}=props
    const [forceCollectHeight, setForceCollectHeight] = React.useState(0);
    const collectLoopUuidRef = useRef<number>();

    useEffect(()=>{
        // 关闭时清除计时器
        return ()=>{
            loopRequestAnimationFrame.cancel(collectLoopUuidRef.current);
        }
    },[])

    const viewElementRef=useRef(new Map<React.Key,HTMLElement>())
    const heightsRef = useRef(new CacheMap());
    // sync同步
    // 缓存每个viewElement的高度
    /* 这个是在requestAnimationFrame内缓存viewport内所有的item高度 */
    const collectViewElementHeight=useCallback((sync = false)=>{
        loopRequestAnimationFrame.cancel(collectLoopUuidRef.current)
        const doCollect=()=>{
            viewElementRef.current.forEach((viewElement,elementKey)=>{
                if(viewElement?.offsetParent){
                    const domElement=findDOMNode<HTMLElement>(viewElement)
                    if(heightsRef.current.get(elementKey)!==domElement.offsetHeight){
                        heightsRef.current.set(elementKey,domElement.offsetHeight)
                    }
                }
            })
            // 当resized时需要通知父组件强制更新以重新计算高度
            setForceCollectHeight((c) => c + 1);
        }
        if(sync){
            doCollect()
        }else{
            collectLoopUuidRef.current=loopRequestAnimationFrame(doCollect)
        }
    },[])


    // 通过key来判断当前可视区域dom的增或删，如果viewElement为null，则说明不在可视区域中，需删除；
    // 如果viewElement不为null，说明在useChildren中该dom被渲染了，需添加
    /* 这个是缓存单个viewElement */
    const updateViewElementRef=useCallback(({item,viewElement}:{item:any;viewElement:HTMLElement})=>{
        const itemKey=getDataKey(item)
        if(viewElement){
            // 缓存并计算viewElement高度
            viewElementRef.current.set(itemKey,viewElement)
            collectViewElementHeight()
        }else{
            viewElementRef.current.delete(itemKey)
        }
    },[collectViewElementHeight,getDataKey])


    return {
        forceCollectHeight,
        updateViewElementRef,
        viewHeights:heightsRef.current,
        collectViewElementHeight
    }
}

export default useViewHeights
