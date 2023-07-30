import {effect} from "./sig";
import {parser} from "./parser";

type IndividualTemplateValue = Node | string | number | null | undefined;
type StaticTemplateValue = IndividualTemplateValue | IndividualTemplateValue[];
type ReactiveTemplateValue = StaticTemplateValue | (() => StaticTemplateValue);

const IS_NODE = <T extends Node = Node>(v: any): v is T => !!v.parentNode;
const IS_ARRAY = <T>(v: T | T[]): v is T[] => !!v[0];
const IS_FN = (v: any): v is Function => !!v.bind;
const IS_STR = (v: any): v is string => !!v.big;

export const html = <T extends Node = ChildNode>(
	strings: TemplateStringsArray,
	...values: ReactiveTemplateValue[]
) => {
	let id = 0;
	const idVals = values.map((v) => ["a" + id++, v] as const);

	let str = "";
	let si = 0,
		vi = 0;
	while (si < strings.length || vi < idVals.length) {
		if (si < strings.length) str += strings[si++];
		if (vi < idVals.length) str += `<${idVals[vi++][0]}/>`;
	}

	// parse tree
	const tree = parser(str).find(IS_NODE<Element>);
	// if your tree contains no elements literally explode

	// i think multiple top-level elems is unnecessary for now
	///const trees = [...root.children];
	//for (const tree of trees) {

	for (const [id, val] of idVals) {
		const [el] = tree.getElementsByTagName(id);
		if (el) {
			let prev: Node[] = [el];
			const react = () => {
				let last: Node;
				while (prev[0]) {
					last?.parentNode?.removeChild(last);
					last = prev.shift();
				}

				const unwrapped = IS_FN(val) ? val() : val;
				const nodes = IS_ARRAY(unwrapped) ? unwrapped : [unwrapped];

				prev = nodes
					.filter((n) => n != null && (IS_STR(n) ? n.trim() : true))
					.map((v) => (IS_NODE(v) ? v : new Text(v as any)));

				prev[0] ??= new Text();

				prev.map((n) => last.parentNode?.insertBefore(n, last));
				last.parentNode?.removeChild(last);
			};
			effect(react);
		}
	}

	//}

	/*return ([...root.childNodes].find((n) => !(n instanceof Text) || n.textContent.trim()) ??
		root.firstChild) as any as T;*/
	return tree as any as T;
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
				IS_FN(attrs[i + 1]) ? attrs[i + 1]() : attrs[i + 1]
			)
		);

	return node;
};
