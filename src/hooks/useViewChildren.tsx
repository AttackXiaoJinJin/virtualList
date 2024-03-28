import React from 'react'

// useHeight中需要计算高度，所以外层需要获取到dom，进而获取到height
// 每个item的height可以是不固定不一样的
function ItemRef({children,setRef}:{
    children: React.ReactElement;
    setRef: (element: HTMLElement) => void;
}) {
    return React.cloneElement(children,{
        ref:setRef
    })
}

// 渲染可视区域内的item
function useViewChildren(props:{
    list:any[];
    // 可视区域item开始下标
    viewStartIndex:number;
    // 可视区域item末尾下标
    viewEndIndex:number;
    setRef: (item:any,element: HTMLElement) => void;
    scrollWidth: number;
    getDataKey:any;
    renderFunc:(
        item: any,
        index: number,
        props: { style?: React.CSSProperties },
    ) => React.ReactNode;

}) {
    // scrollWidth指定滚动宽度
    const {scrollWidth,list,viewStartIndex,viewEndIndex,getDataKey,renderFunc,setRef}=props

    return list.reduce((total,current,currIndex)=>{
       if(currIndex<viewStartIndex || currIndex>viewEndIndex + 1){
           return total
       }
       const key = getDataKey(current);
       const itemElement = renderFunc(current, currIndex, {
           style: { width: scrollWidth }
        }) as React.ReactElement;
       total.push( <ItemRef key={key} setRef={(ele) => setRef(current, ele)}>
           {itemElement}
       </ItemRef>)
    },[])
}


export default useViewChildren
