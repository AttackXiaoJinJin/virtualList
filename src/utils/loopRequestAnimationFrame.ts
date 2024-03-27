
// 模拟1帧的延迟执行
/* 和requestAnimationFrame不同的是，requestAnimationFrame能够保证回调函数在浏览器的下一次重绘之前执行，而不是简单地延迟执行 */
// 宏任务(setTimeout/setInterval)->微任务->requestAnimationFrame->重排->重绘->requestIdleCallback
let mockRequestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16);
}
let mockCancelAnimationFrame = (num: number) => clearTimeout(num);

if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    mockRequestAnimationFrame = (callback: FrameRequestCallback) =>
        window.requestAnimationFrame(callback);
    mockCancelAnimationFrame = (handle: number) => window.cancelAnimationFrame(handle);
}

let requestAnimationFrameUuid = 0;

const requestAnimationFrameIds = new Map<number, number>();

function cleanup(id: number) {
    requestAnimationFrameIds.delete(id);
}
// 每次 requestAnimationFrame 时执行 times 次 callback
const loopRequestAnimationFrame = (callback: () => void, times = 1): number => {
    requestAnimationFrameUuid += 1;
    // 因为递归会形成闭包，所以这里要赋值，避免 uuid 变掉了
    const id = requestAnimationFrameUuid;

    function callRef(leftTimes: number) {
        if (leftTimes === 0) {
            // Clean up
            cleanup(id);

            // Trigger
            callback();
        } else {
            // Next mockRequestAnimationFrame
            const realId = mockRequestAnimationFrame(() => {
                callRef(leftTimes - 1);
            });

            // Bind real loopRequestAnimationFrame id
            requestAnimationFrameIds.set(id, realId);
        }
    }

    callRef(times);

    return id;
};

loopRequestAnimationFrame.cancel = (id: number) => {
    const realId = requestAnimationFrameIds.get(id);
    cleanup(id);
    return mockCancelAnimationFrame(realId);
};
// 不适合vite
// if (process.env.NODE_ENV !== 'production') {
//     loopRequestAnimationFrame.ids = () => requestAnimationFrameIds;
// }

export default loopRequestAnimationFrame;
