import {css,cx} from "@emotion/css";
import {useMemo} from "react";

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


function Scrollbar() {

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
    },[])

    return <div
        ref={scrollbarRef}
        className={cx(styles.scrollbar,horizontal?styles.horizontal:styles.vertical,visible&&styles.visible)}
        style={style}
    >
        {/* fixme:里面的滚动条？ */}
        <div
            ref={thumbRef}
            className={cx(styles.thumb,dragging&&styles.thumbMoving)}
            style={thumbStyle}
        />
    </div>
}

export default Scrollbar
