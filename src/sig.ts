export type Sig<T> = (newVal?: T) => T;

let effectStack: (0 | (() => void))[] = [];

export const sig = <T>(val?: T): Sig<T> => {
	const subs = new Set<() => void>();

	return (...nv: [T]) => {
		if (nv.length) {
			val = nv[0];
			subs.forEach((e) => e());
		} else if (effectStack[0]) {
			subs.add(effectStack[0]);
		}
		return val;
	};
};

export const effect = (cb: () => void) => {
	let cancel = false;
	const run = () => {
		if (cancel) return;

		// push and pop are much more performant than unshift and shift
		// however it makes the effect truthiness check in sig() much smaller
		effectStack.unshift(run);
		cb();
		effectStack.shift();
	};
	run();

	return () => {
		cancel = true;
	};
};

export const untrack = <T>(cb: () => T) => {
	effectStack.unshift(0);
	const v = cb();
	effectStack.shift();
	return v;
};

export const memo = <T>(cb: () => T) => {
	const val = sig<T>();
	effect(() => {
		const value = cb();
		if (untrack(val) !== value) val(value);
	});
	return () => val();
};