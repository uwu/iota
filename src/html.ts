import {effect} from "./sig";

type IndividualTemplateValue = Node | string | number | null | undefined;
type StaticTemplateValue = IndividualTemplateValue | IndividualTemplateValue[];
type ReactiveTemplateValue = StaticTemplateValue | (() => StaticTemplateValue);

function fixNS(node: Element) {
	const htmlNode = document.createElement(node.tagName);
	for (const attr of node.attributes) htmlNode.setAttribute(attr.name, attr.value);
	htmlNode.replaceChildren(...node.childNodes);
	node.replaceWith(htmlNode);
	[...htmlNode.children].forEach(fixNS);
}

export const html = <T extends Node = ChildNode>(
	strings: TemplateStringsArray,
	...values: ReactiveTemplateValue[]
) => {
	const idVals = values.map((v) => ["a" + Math.random(), v] as const);

	let str = "";
	let si = 0,
		vi = 0;
	while (si < strings.length || vi < idVals.length) {
		if (si < strings.length) str += strings[si++];
		if (vi < idVals.length) str += `<${idVals[vi][0]}></${idVals[vi++][0]}>`;
	}

	// parse tree
	// fix ns
	const root = document.createElement("_");
	root.append(new DOMParser().parseFromString(str, "text/xml").documentElement);
	fixNS(root.firstElementChild);
	const tree = root.firstElementChild;

	// i think multiple top-level elems is unnecessary for now
	///const trees = [...root.children];
	//for (const tree of trees) {

	for (const [id, val] of idVals) {
		const [el] = tree.getElementsByTagName(id);
		if (el) {
			let prev: Node[] = [el];
			const react = () => {
				let last: Node;
				while (prev.length) {
					last?.parentNode?.removeChild(last);
					last = prev.shift();
				}

				const unwrapped = typeof val === "function" ? val() : val;
				const nodes = Array.isArray(unwrapped) ? unwrapped : [unwrapped];

				prev = nodes
					.filter((n) => n != null && (typeof n === "string" ? n.trim() : true))
					.map((v) => (v instanceof Node ? v : document.createTextNode(v as any)));

				prev[0] ??= document.createTextNode("");

				prev.forEach((n) => last.parentNode?.insertBefore(n, last));
				last.parentNode?.removeChild(last);
			};
			effect(react);
		}
	}

	//}

	return ([...root.childNodes].find((n) => !(n instanceof Text) || n.textContent.trim()) ??
		root.firstChild) as any as T;
};

export const ev = <T extends Node>(node: T, ...evs: (string | ((ev: Event) => void))[]) => {
	for (let i = 0; i + 1 < evs.length; i += 2)
		node.addEventListener(evs[i] as string, evs[i + 1] as any);

	return node;
};

export const attrs = <T extends Element>(node: T, ...attrs: any[]) => {
	for (let i = 0; i + 1 < attrs.length; i += 2)
		effect(() =>
			node.setAttribute(
				attrs[i],
				typeof attrs[i + 1] === "function" ? attrs[i + 1]() : attrs[i + 1]
			)
		);

	return node;
};
