var mWorker;
var running = false;
function analyze() {
    try {
        const text = formula.value;
        if (running && confirm("上一次的真值表计算尚未完成，是否立即终止？")) {
            if (mWorker) mWorker.terminate();
            mWorker = undefined;
        }
        if (!mWorker) {
            mWorker = new Worker("worker.js");
            mWorker.onerror = (ev) => { throw ev.message; };
            mWorker.onmessage = (ev) => {
                let data = ev.data;
                switch (data.type) {
                    case "gen_post":
                        $$$("re-polish").innerText = data.msg;
                        break;
                    case "gen_pre":
                        $$$("polish").innerText = data.msg;
                    case "finish":
                        //TODO
                        break;
                    case "error":

                        alert("错误：" + data.msg);
                }
                running = false;
            }
        }
        mWorker.postMessage(text);
        running = true;



    } catch (e) {
        alert("错误：" + e);
    }

}