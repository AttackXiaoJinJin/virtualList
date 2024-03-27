import {useEffect} from "react";
import

function useHeights(props:{getKey:any;}) {
    const {getKey}=props


    useEffect(()=>{

        // 关闭时清除计时器
        return ()=>{
            raf.cancel(collectRafRef.current);
        }
    },[])



}

export default useHeights
