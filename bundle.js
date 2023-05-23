// src/sig.ts
var effectStack = [];
var sig = (val) => {
  const subs = /* @__PURE__ */ new Set();
  return (...nv) => {
    if (nv.at(-1)) {
      val = nv.at(-1);
      subs.forEach((e) => e());
    } else if (effectStack[0]) {
      subs.add(effectStack[0]);
    }
    return val;
  };
};
var effect = (cb) => {
  let cancel = false;
  const run = () => {
    if (cancel)
      return;
    effectStack.push(run);
    cb();
    effectStack.pop();
  };
  run();
  return () => {
    cancel = true;
  };
};
var untrack = (cb) => {
  effectStack.push(0);
  const v = cb();
  effectStack.pop();
  return v;
};
var memo = (cb) => {
  const val = sig();
  effect(() => {
    const value = cb();
    if (untrack(val) !== value)
      val(value);
  });
  return () => val();
};

// src/html.ts
var html = (strings, ...values) => {
  const root = document.createElement("_");
  const idVals = values.map((v) => ["a" + Math.random(), v]);
  let str = "";
  let si = 0, vi = 0;
  while (si < strings.length || vi < idVals.length) {
    if (si < strings.length)
      str += strings[si++];
    if (vi < idVals.length)
      str += `<${idVals[vi][0]}></${idVals[vi++][0]}>`;
  }
  root.innerHTML = str;
  const tree = root.firstElementChild;
  for (const [id, val] of idVals) {
    const [el] = tree.getElementsByTagName(id);
    if (el) {
      let prev = [el];
      const react = () => {
        let last;
        while (prev.length) {
          last?.parentNode?.removeChild(last);
          last = prev.shift();
        }
        const unwrapped = typeof val === "function" ? val() : val;
        const nodes = Array.isArray(unwrapped) ? unwrapped : [unwrapped];
        prev = nodes.filter((n) => n != null && (typeof n === "string" ? n.trim() : true)).map((v) => v instanceof Node ? v : document.createTextNode(v));
        prev[0] ??= document.createTextNode("");
        prev.forEach((n) => last.parentNode?.insertBefore(n, last));
        last.parentNode?.removeChild(last);
      };
      effect(react);
    }
  }
  return [...root.childNodes].find((n) => !(n instanceof Text) || n.textContent.trim()) ?? root.firstChild;
};
var ev = (node, ...evs) => {
  for (let i = 0; i + 1 < evs.length; i += 2)
    node.addEventListener(evs[i], evs[i + 1]);
  return node;
};
var attrs = (node, ...attrs2) => {
  for (let i = 0; i + 1 < attrs2.length; i += 2)
    effect(
      () => node.setAttribute(
        attrs2[i],
        typeof attrs2[i + 1] === "function" ? attrs2[i + 1]() : attrs2[i + 1]
      )
    );
  return node;
};
export {
  attrs,
  effect,
  ev,
  html,
  memo,
  sig,
  untrack
};
