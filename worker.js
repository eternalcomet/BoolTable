var operator = {
    not: { v: '¬', w: 1 },
    and: { v: '∧', w: 2 },
    or: { v: '∨', w: 2 },
    xor: { v: '⊽', w: 2 },
    imply: { v: '→', w: 3 },
    equal: { v: '↔', w: 3 }
};
var op_table = {
    '∧': operator.and,
    '&': operator.and,
    '∨': operator.or,
    '|': operator.or,
    '⊽': operator.xor,
    '^': operator.xor,
    '→': operator.imply,
    '>': operator.imply,
    '↔': operator.equal,
    '~': operator.equal
}
function node(left, right, op, f) {
    this.left = left;
    this.right = right;
    this.op = op;
    this.f = f;
}

let vars = [];
let var_index = {};

function build_tree(text, start) {
    let end = -1;
    let last = 0;//last char is character or operator
    let n = new node;
    /**@type {node} */
    let last_n;
    let sig_not = false;
    let root = n;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '(') {
            let r = build_tree(text, i + 1);
            i = r.end;
            if (n.left) {
                n.right = r.root;
                last_n = n;
                n = new node;
            } else {
                n.left = r.root;
            }
            continue;
        }
        if (text[i] === ')') {
            end = i;
            break;
        }
        if (text[i] === '¬' || text[i] === '!') {
            if (sig_not) sig_not = false;
            else sig_not = true;
            //?
            if (last === 2) throw new SyntaxError;
        }
        if (op_table[text[i]]) {
            if (last === 1) throw new SyntaxError;
            last = 1;
            if (n.left) {
                n.op = op_table[text[i]];
            } else if (last_n) {
                n.op = op_table[text[i]];
                if (n.op.w < last_n.op.w) { //higher priority
                    n.left = last_n.right;
                    last_n.right = n;
                    last_n = n;
                    n = new node;
                } else { //lower priority
                    n.left = last_n;
                    last_n = n;
                    root = n;
                }
            } else {
                throw new SyntaxError;
            }
        } else {
            if (last === 2) throw new SyntaxError;
            last = 2;
            let c = text[i];
            if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                if (var_index[c] === undefined) {
                    var_index[c] = vars.length;
                    vars.push(0);
                }
                let new_node = { n: c, i: var_index[c] };
                if (sig_not) new_node = new node(new_node, new_node, operator.not);
                if (n.left) {
                    n.right = new_node;
                    last_n = n;
                    n = new node;
                } else {
                    n.left = new_node;
                }

            } else {
                throw new SyntaxError;
            }

        }
    }
    return { root: root, end: end };
}

self.onmessage = (ev) => {
    //caution:memory leak
    const text = ev.data;
    try {
        let res = build_tree(text, 0);
        if (res.end !== -1) throw new SyntaxError;

    } catch (e) {
        self.postMessage({ type: "error", msg: "请检查公式是否输入正确！" });
    }


}