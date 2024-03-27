import {useCallback, useMemo,useState} from 'react'
import type { ResizeObserverProps } from 'rc-resize-observer';
import ResizeObserver from 'rc-resize-observer';
import useViewHeights from "./hooks/useViewHeights";
import useViewChildren from "./hooks/useViewChildren";

interface VirtualListProps {
    getDataKey:string|((item:any)=>string);
    height?:number;
    itemHeight?:number;
    data:any[];
    scrollWidth?:number;
}

function VirtualList(props:VirtualListProps) {
    const {
        getDataKey:_getDataKey,
        height,
        itemHeight,
        data,
        scrollWidth,
    }=props

    const useVirtual = Boolean(height && itemHeight);
    const inVirtual = useVirtual && data && (itemHeight! * data.length > height! || Boolean(scrollWidth));

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

    // 计算需要滚动的高度，开始index，最后index，滚动的偏移量==============



    //渲染每个item===================
    const renderedRefChildren=useViewChildren({
        scrollWidth,
        list,
        startIndex,
        endIndex,
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
    },[height, scrollMoving, scrollWidth, useVirtual])

    return <div
        // fixme:为什么要加relative，子是fixed/absolute
        style={{position:'relative'}}
    >




    </div>


}

export default VirtualList
