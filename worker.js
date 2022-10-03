/**
 * @author class27-xzh
 */
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
    /**@type {node} */
    this.f = f;
}

let vars = [];
let var_index = {};
function init() {
    vars = [];
    var_index = {};
}

function build_tree(text, start) {
    let end = -1;
    let last = 0;//last char is character or operator
    let n = new node;
    /**@type {node} */
    let last_n;
    //change!
    let sig_not = false;
    let root = n;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '(') {
            let r = build_tree(text, i + 1);
            i = r.end;
            r.root.f = n;
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
            continue;
        }
        if (op_table[text[i]]) {
            if (last === 1) throw new SyntaxError;
            last = 1;
            if (n.left) {
                n.op = op_table[text[i]];
            } else if (last_n) {
                n.op = op_table[text[i]];
                if (n.op.w < last_n.op.w) { //new op has higher priority
                    n.left = last_n.right;
                    last_n.right.f = n;
                    last_n.right = n;
                    n.f = last_n;
                } else { //lower or equal priority
                    n.left = last_n;
                    if (last_n.f) {
                        last_n.f.right = n;
                    } else { //last_n is root
                        root = n;
                    }
                    last_n.f = n;
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
                //TODO
                if (sig_not) new_node = new node(new_node, undefined, operator.not);
                if (n.left) {
                    n.right = new_node;
                    last_n = n;
                    n = new node;
                } else {
                    n.left = new_node;
                }
                new_node.f = n;
            } else {
                throw new SyntaxError;
            }

        }
    }
    return { root: root, end: end };
}

/**
 * @param {node} root
 * @param {string[]} text
 */
function generate_post(root, text) {
    if (root.left) {
        if (root.left instanceof node) generate_post(root.left, text);
        else text.push(root.left.n);
    }
    if (root.right) {
        if (root.right instanceof node) generate_post(root.right, text);
        else text.push(root.right.n);
    }
    text.push(root.op.v);
}

/**
 * @param {node} root
 * @param {string[]} text
 */
function generate_pre(root, text) {
    text.push(root.op.v);
    if (root.left) {
        if (root.left instanceof node) generate_pre(root.left, text);
        else text.push(root.left.n);
    }
    if (root.right) {
        if (root.right instanceof node) generate_pre(root.right, text);
        else text.push(root.right.n);
    }
}

self.onmessage = (ev) => {
    //caution:memory leak
    const text = ev.data;
    try {
        init();
        let res = build_tree(text, 0);
        if (res.end !== -1) throw new SyntaxError;
        //后缀表达式
        let list = [];
        generate_post(res.root, list);
        //TODO ref
        self.postMessage({ type: "gen_post", msg: list.join('') });
        list = [];
        generate_pre(res.root, list);
        self.postMessage({ type: "gen_pre", msg: list.join('') });

    } catch (e) {
        if (e instanceof SyntaxError) self.postMessage({ type: "error", msg: "请检查公式是否输入正确！" });
        else self.postMessage({ type: "error", msg: "发生错误：\n" + e.message });
    }


}