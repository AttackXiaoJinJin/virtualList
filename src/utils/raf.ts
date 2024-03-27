
// 模拟1帧的延迟执行
/* 和requestAnimationFrame不同的是，requestAnimationFrame能够保证回调函数在浏览器的下一次重绘之前执行，而不是简单地延迟执行 */
// 宏任务(setTimeout/setInterval)->微任务->requestAnimationFrame->重排->重绘->requestIdleCallback
let raf = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16);
}
let caf = (num: number) => clearTimeout(num);

if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    raf = (callback: FrameRequestCallback) =>
        window.requestAnimationFrame(callback);
    caf = (handle: number) => window.cancelAnimationFrame(handle);
}

let rafUUID = 0;

const rafIds = new Map<number, number>();

function cleanup(id: number) {
    rafIds.delete(id);
}

const wrapperRaf = (callback: () => void, times = 1): number => {
    rafUUID += 1;
    const id = rafUUID;

    function callRef(leftTimes: number) {
        if (leftTimes === 0) {
            // Clean up
            cleanup(id);

            // Trigger
            callback();
        } else {
            // Next raf
            const realId = raf(() => {
                callRef(leftTimes - 1);
            });

            // Bind real raf id
            rafIds.set(id, realId);
        }
    }

    callRef(times);

    return id;
};

wrapperRaf.cancel = (id: number) => {
    const realId = rafIds.get(id);
    cleanup(id);
    return caf(realId);
};

if (process.env.NODE_ENV !== 'production') {
    wrapperRaf.ids = () => rafIds;
}

export default wrapperRaf;
