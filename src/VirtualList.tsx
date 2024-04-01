import {useCallback, useMemo,useState,useRef} from 'react'
import type { ResizeObserverProps } from 'rc-resize-observer';
import ResizeObserver from 'rc-resize-observer';
import useViewHeights from "./hooks/useViewHeights";
import useViewChildren from "./hooks/useViewChildren";

const MIN_SCROLLBAR_SIZE=20

interface VirtualListProps {
    getDataKey:string|((item:any)=>string);
    height?:number;
    itemHeight?:number;
    data:any[];
    scrollWidth?:number;
    className?:string;
    component?: React.FC<any>;
    fullHeight?:boolean;
    onNativeScroll?:React.UIEventHandler<HTMLElement>;
    onVirtualScroll?: (info: {x: number; y: number;}) => void;
}

function VirtualList(props:VirtualListProps) {
    const {
        getDataKey:_getDataKey,
        height,
        itemHeight,
        data,
        scrollWidth,
        className,
        component:Component,
        fullHeight = true,
        onNativeScroll,
        onVirtualScroll,
    }=props

    const useVirtual = Boolean(height && itemHeight);
    const inVirtual = useVirtual && (itemHeight! * data.length > height! || Boolean(scrollWidth));

    const fillerInnerRef = useRef<HTMLDivElement>();
    const componentRef = useRef<HTMLDivElement>();




    //scrollMoving=================================
    const [scrollMoving, setScrollMoving] = useState(false);

    const onScrollbarStartMove = useCallback(() => {
        setScrollMoving(true);
    },[]);
    const onScrollbarStopMove = useCallback(() => {
        setScrollMoving(false);
    },[]);

    //==============================================
    const getDataKey=useCallback((data:any)=>{
        // 比如外面传入 getItemKey=(item)=>item.id
        if (typeof _getDataKey === 'function') {
            return _getDataKey(data);
        }
        // 比如外面传入 id，那我们就拿data[i].id
        return data?.[_getDataKey as string];

    },[_getDataKey])


    // 高度====================
    const {
        forceCollectHeight,
        updateViewElementRef,
        viewHeights,
        collectViewElementHeight
    }=useViewHeights({getDataKey})

    const [offsetTop, setOffsetTop] = useState(0);
    const [offsetLeft, setOffsetLeft] = useState(0);


    // 计算需要滚动的高度，开始index，最后index，滚动的偏移量==============
    const {
        itemScrollTop,
        viewStartIndex,
        viewEndIndex,
        viewStartOffset,
    }=useMemo(()=>{
        // 没必要虚拟列表就渲染全部item
        if (!useVirtual) {
            return {
                scrollHeight: undefined,
                start: 0,
                end: data.length - 1,
                offset: undefined,
            };
        }
        // Always use virtual scroll bar in avoid shaking
        // useVirtual=true
        // todo:实验下什么情况下是既在container内又用到虚拟滚动条的
        if (!inVirtual) {
            return {
                scrollHeight: fillerInnerRef.current?.offsetHeight || 0,
                start: 0,
                end: data.length - 1,
                offset: undefined,
            };
        }
        let itemScrollTop=0
        let viewStartIndex:number
        let viewStartOffset:number
        let viewEndIndex:number
        // 这里取长度，我理解就是取一个快照，这样即使data.length改变了也不受影响
        const dataLength=data.length
        for(let i=0;i<dataLength;i++){
            const item=data[i]
            const itemKey=getDataKey(item)
            // 从已计算缓存的heightCache里获取每个item height
            const cacheItemHeight=viewHeights.get(itemKey)
            // item底部距离容器顶部的距离=item顶部距离+item高度
            const itemBottom=itemScrollTop+(cacheItemHeight===undefined?itemHeight:cacheItemHeight)
            // 根据容器顶部和item底部判断item是否在容器中
            if(itemBottom>=offsetTop&&viewStartIndex===undefined){
                viewStartIndex=i
                viewStartOffset=itemScrollTop
            }
            // 根据容器底部和item顶部判断item是否在容器中
            if(itemBottom>offsetTop+height &&viewEndIndex===undefined){
                viewEndIndex=i
            }
            // 为下一次循环赋初始值，也就是下一个item的top是上一个item的bottom
            /* fixme:算是优化？每个item是根据上一个item计算而来的，并不是每次都整体做计算 */
            itemScrollTop=itemBottom
        }
        // When scrollTop at the end but data cut to small count will reach this
        // fixme:实验下是什么情况，猜测是当滚动条已经移动到最底部后，再搜索忽然跳到中间数据时，会卡住
        if(viewStartIndex===undefined){
            viewStartIndex=0
            viewStartOffset=0
            // https://github.com/ant-design/ant-design/issues/37986
            viewEndIndex = Math.ceil(height&&itemHeight?height / itemHeight:0);
        }
        if(viewEndIndex===undefined){
            viewEndIndex=data.length-1
        }
        // endIndex可能会超出data.length，所以最后再来个兜底
        // ps:我觉得只有 endIndex = Math.ceil(height / itemHeight); 这种情况会超出，只在这种情况防止下是不是更精确点
        viewEndIndex = Math.min(viewEndIndex + 1, data.length - 1);

        return {
            itemScrollTop,
            viewStartIndex,
            viewEndIndex,
            viewStartOffset,
        }

    },[data, getDataKey, height, inVirtual, itemHeight, offsetTop, useVirtual, viewHeights])



    // 记录滚动时，data容器和指定高度容器的最大可滚动高度
    const maxScrollHeight=itemScrollTop-height
    const maxScrollHeightRef = useRef(maxScrollHeight);
    maxScrollHeightRef.current = maxScrollHeight;
    // 当列表不可滚动时不阻止滚动
    // https://github.com/react-component/virtual-list/pull/55
    // fixme:当列表不可以滚动时，为什么滚动条还能滚动？
    // 控制滚动条滚动的范围，不至于离谱
    const keepScrollbarInRange=useCallback((newScrollTop:number)=>{
        let newTop = newScrollTop;
        if (!Number.isNaN(maxScrollHeightRef.current)) {
            newTop = Math.min(newTop, maxScrollHeightRef.current);
        }
        newTop = Math.max(newTop, 0);
        return newTop;
    },[])

    const syncScrollTop=useCallback((newTop:number|((prevTop:number)=>number))=>{
        setOffsetTop((origin)=>{
            let newScrollTop:number
            if(typeof newTop==='function'){
                newScrollTop=newTop(origin)
            }else{
                newScrollTop=newTop
            }
            const adjustedScrollTop=keepScrollbarInRange(newScrollTop)
            // 缓存
            componentRef.current.scrollTop=adjustedScrollTop
            return adjustedScrollTop
        })


    },[keepScrollbarInRange])

    //渲染每个item===================
    const renderedRefChildren=useViewChildren({
        scrollWidth,
        list,
        viewStartIndex,
        viewEndIndex,
        getDataKey,
        renderFunc,
        setRef
    })
    //设置style===========================
    const componentStyle=useMemo(()=>{
        let componentStyle: React.CSSProperties = null;
        if (height) {
            componentStyle = { [fullHeight ? 'height' : 'maxHeight']: height, ...ScrollStyle };

            if (useVirtual) {
                componentStyle.overflowY = 'hidden';
                // 横向滚动条
                if (scrollWidth) {
                    componentStyle.overflowX = 'hidden';
                }
                // 滚动时不允许操作item
                if (scrollMoving) {
                    componentStyle.pointerEvents = 'none';
                }
            }
        }
        return componentStyle
    },[fullHeight, height, scrollMoving, scrollWidth, useVirtual])

    const [containerSize, setContainerSize] = useState({ width: 0, height });

    const onUpdateContainerSize=useCallback((sizeInfo:{width:number;offsetWidth:number;height:number;offsetHeight:number;})=>{
        const {width,offsetWidth,height,offsetHeight}=sizeInfo
        setContainerSize({
            width:width||offsetWidth,
            height:height||offsetHeight
        })
    },[])

    const virtualScrollInfo = useMemo(()=>{
        return {
            x: offsetLeft,
            y: offsetTop,
        }
    },[offsetLeft, offsetTop])
    // 用ref的原因是记录比较，这样就不每次都触发事件
    const lastVirtualScrollInfoRef = useRef(virtualScrollInfo);

    const triggerVirtualScroll = useCallback(() => {
        if (onVirtualScroll) {
            const nextInfo = virtualScrollInfo;
            // 值没有更新就不触发事件
            if (
                lastVirtualScrollInfoRef.current.x !== nextInfo.x ||
                lastVirtualScrollInfoRef.current.y !== nextInfo.y
            ) {
                onVirtualScroll(nextInfo);

                lastVirtualScrollInfoRef.current = nextInfo;
            }
        }
    },[onVirtualScroll, virtualScrollInfo]);


    // 比如选项A、B切换，选项A数据多把滚动条放在中间，切到B数据少未显示滚动条，切到A滚动条未更新，需要滚动下才正常
    // https://github.com/ant-design/ant-design/issues/28468
    const onUpdateVirtualScrollbar=useCallback((e: React.UIEvent<HTMLDivElement>)=>{
        const { scrollTop: newScrollTop } = e.currentTarget;
        // 更新虚拟滚动条（data container）的偏移量
        if(newScrollTop!==offsetTop){
            syncScrollTop(newScrollTop)
        }
        // 开发可能需要同步原生滚动事件
        onNativeScroll?.(e)
        // todo:横向滚动不会触发原生scroll事件
        // https://github.com/react-component/virtual-list/pull/214
        triggerVirtualScroll()
    },[offsetTop, onNativeScroll, syncScrollTop, triggerVirtualScroll])

    const verticalScrollBarRef = useRef<ScrollBarRef>();
    const horizontalScrollBarRef = useRef<ScrollBarRef>();
    // 非虚拟滚动时，模拟的滚动条和真实滚动条尺寸差距过大的bug
    // https://github.com/react-component/virtual-list/pull/252
    const getScrollbarSize=useCallback((containerSize=0,scrollRange=0)=>{
        let baseSize=(containerSize/scrollRange)*containerSize
        if(isNaN(baseSize)){
            baseSize=MIN_SCROLLBAR_SIZE
        }
        return Math.floor(baseSize)
    },[])

    const verticalScrollbarSize=useMemo(()=>{
        return getScrollbarSize(containerSize.height,itemScrollTop)
    },[containerSize.height, getScrollbarSize, itemScrollTop])

    const horizontalScrollbarSize=useMemo(()=>{
        return getScrollbarSize(containerSize.width,scrollWidth)
    },[containerSize.width, getScrollbarSize, scrollWidth])

    const delayHideScrollBar=useCallback(()=>{
        // 纵轴的滚动条
        verticalScrollBarRef.current?.delayHidden();
        // 横轴的滚动条
        horizontalScrollBarRef.current?.delayHidden();
    },[])

    return <div
        // fixme:为什么要加relative，子是fixed/absolute
        style={{position:'relative'}}
        className={className}
    >
        <ResizeObserver onResize={onUpdateContainerSize}>
            <Component
                style={componentStyle}
                ref={componentRef}
                /*原生scroll*/
                onScroll={onUpdateVirtualScrollbar}
                /* 注意这个 */
                onMouseEnter={delayHideScrollBar}
            >


            </Component>
        </ResizeObserver>
    </div>


}

export default VirtualList
