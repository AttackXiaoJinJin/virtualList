import {css,cx} from "@emotion/css";
import {useEffect,useCallback, useMemo, useRef, useState} from "react";

const styles={
    thumb:css`
    
    `,
    thumbMoving:css`
    
    `,
    scrollbar:css`
    
    `,
    horizontal:css`
    
    `,
    vertical:css`
    `,
    visible:css``,
}

function getPageXY(
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
    horizontal: boolean,
) {
    // touches是触摸事件，是手机端
    // const obj = 'touches' in e ? e.touches[0] : e;
    // pageX/pageY返回触摸点到文档的距离
    // return obj[horizontal ? 'pageX' : 'pageY'];
    return e[horizontal ? 'pageX' : 'pageY'];
}

interface ScrollbarProps {
    // 是否是横向滚动条
    horizontal?:boolean
    onScrollbarStartMove:()=>void;
}

function Scrollbar(props:ScrollbarProps) {
    const {horizontal,onScrollbarStartMove,onScrollbarStopMove,}=props

    const thumbRef = useRef<HTMLDivElement>();
    const scrollbarRef = useRef<HTMLDivElement>();

    const [dragging, setDragging] = useState(false);
    const [pageXY, setPageXY] = useState<number | null>(null);
    const [startTop, setStartTop] = useState<number | null>(null);

    const [visible,setVisible]=useState(false)
    const visibleTimeoutIdRef=useRef<ReturnType<typeof setTimeout>>()
    // 鼠标在滚动条上拖动时，触发
    const delayHidden=useCallback(()=>{
        clearTimeout(visibleTimeoutIdRef.current)
        setVisible(true)
        visibleTimeoutIdRef.current=setTimeout(()=>{
            setVisible(false)
            // 3s后隐藏滚动条
        },3000)


    },[])


    const {style,thumbStyle}=useMemo(()=>{
        const style:React.CSSProperties={
            position:'absolute',
            visibility:visible?null:'hidden'
        }
        const thumbStyle:React.CSSProperties={
            position:'absolute',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 99,
            cursor: 'pointer',
            // fixme:是啥意思
            userSelect: 'none',
        }
        if(horizontal){
            // fixme:为啥是8
            style.height=8
            style.left=0
            style.right=0
            style.bottom=0

            thumbStyle.height='100%'
            thumbStyle.width=scrollbarSize

            thumbStyle.left=top
        }else{
            style.width = 8;
            style.top = 0;
            style.bottom = 0;
            style.right=0

            thumbStyle.width = '100%';
            thumbStyle.height = scrollbarSize;
            thumbStyle.top = top;
        }


        return {
            style,
            thumbStyle,
        }
    },[horizontal, visible])

    const stateRef = useRef({ top, dragging, pageY: pageXY, startTop });
    stateRef.current = { top, dragging, pageY: pageXY, startTop };


    const onThumbMouseDown=useCallback((e:React.MouseEvent<HTMLDivElement>)=>{
        setDragging(true)
        setPageXY(getPageXY(e, horizontal));
        // 刚按住滚动条时记录顶部距离
        setStartTop(stateRef.current.top);
        // 通知外面开始滚动
        onScrollbarStartMove()
        e.stopPropagation();
        e.preventDefault();
    },[horizontal, onScrollbarStartMove])

    useEffect(() => {
        delayHidden();
    }, [delayHidden]);

    return <div
        ref={scrollbarRef}
        className={cx(styles.scrollbar,horizontal?styles.horizontal:styles.vertical,visible&&styles.visible)}
        style={style}
        onMouseDown={(e)=>{
            e.stopPropagation()
            e.preventDefault()
        }}
        // 鼠标移出时隐藏滚动条
        onMouseMove={delayHidden}
    >
        {/* fixme:里面的滚动条？ */}
        <div
            ref={thumbRef}
            className={cx(styles.thumb,dragging&&styles.thumbMoving)}
            style={thumbStyle}
            onMouseDown={onThumbMouseDown}
        />
    </div>
}

export default Scrollbar
