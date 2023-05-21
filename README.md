# ιota JS

ιota is a tiny UI library for JS. Its one and only focus is bundle size.

How small is small?

It has a basic reactivity system (no batching etc.), and uses template strings to build UIs.

Should you use this for your app? Almost certainly no.
[Solid](https://solidjs.com), [Vue](https://vuejs.org), [Svelte](https://svelte.dev),
[ArrowJS](https://arrow-js.com), [Alpine](https://alpinejs.dev),
[petite-vue](https://github.com/vuejs/petite-vue).

When should you use this? In the specific case that you want to render your app from Javascript
(if you're looking to spice up HTML, try alpine or petite-vue!), and bundle size is the thing that
matters most.

You are likely to achieve smaller size than naive Vanilla JS, however if you were to abandon
reactivity,
then your `html` implementation would become so trivial that you could DIY and beat this library by
a wide margin -
the benefit of ιota is that non-reactive UI results in often disgustingly bad code.

## Goals

- work predictably
- be very small
- have enough better than vanilla JS DX to justify using

## Non-goals

- highly flexible / controllable reactivity
- JSX
- fancier templating [arrowjs-style](https://www.arrow-js.com/) (templating into events and attrs)

## Usage: reactivity

### `sig`: Signals

Import `sig` from ιota to create a signal: `const mySig = sig(0);`

You can access the value of the signal by calling it: `mySig()`, or update the value of it by
passing a value: `mySig(1)`.

Note that you *can* pass `mySig(undefined)` and all will still set the signal as expected:
choosing to set or not is based on the length of the arguments, not on the value of the first
argument.

### `effect`: Effects

To make things happen when the signal changes, you can use `effect`.
When you access the contents of your signal in the effect, the effect will subscribe to that
signal.:

```js
const count = sig(0);
effect(() => console.log(count())); // log: 0
count(1); // log: 1
```

If you need to access a signal in an effect without creating a subscription, use `untrack`:

```js
const count = sig(0);
effect(() => {
	const countValue = untrack(count);
	const doubleCount = untrack(() => count() * 2);
});
```

### Derivations & Memos

And with just these three ingredients, we can build basically all reactive patterns!

If this was a heavier weight framework, things like microtask based or batched updates would be a
thing,
however, we are not. If you want performance first, go and use solid!

Derived values should just be functions:

```js
const count = sig(0);
const doubleCount = () => count() * 2;
```

The final utility we export is useful if you have a very slow to calc reactive value and want to
cache the value: `memo`.
In most cases `memo` is likely to slow you down though, and if nothing else, its extra bundle size.

## Usage: UI

### `html`: Templating

ιota also provides minimal tools for building user interfaces: the `html`, `ev`, and `attrs`
functions.

You can create a basic template using `html`:

```js
const myElem = html`<div style="width: 1rem"> <img src="cat.gif" /> </div>`;
document.body.append(myElem);
```

You may template static values into your HTML, ***BE VERY CAREFUL!:** ιota supports templating in
entire DOM nodes,
but not attributes (see [`attrs`](#attrs-applying-attributes))!:

```js
// all will go well:
const expectedUI = html`<div>
	${1 + 3}
	${"woah!".toUpperCase()}
	${document.createElement("button")}
	${showButton ? html`<button />` : null}
	</div>`;

// this should not be expected to throw, however your output is likely to be garbled or unusable
const brokenUI = html`<img alt="a cool img" src="${myImg}" />`;
```

You may template in the following types:

- strings
- numbers (auto-converted to strings)
- DOM Nodes
- arrays of these types
- `null` & `undefined`

You should only use one top-level node in your template.
The `html` function only returns the first node at the top level,
so make sure to manually use an array of templates instead.

```js
const justTheButton = html`<button /> <div>I get entirely dropped!</div>`;
```

### Reactivity

The key reason to use `html`, however, is that it supports reactivity.

ιota makes the disctinction between static and reactive values in templates very clear:
if its a function, its reactive (remember that signals are functions!).

You can template in a function that returns any templatable value, like this:

```js
const count = sig(0);
const ui = html`<div>
		The count is ${count} <br />
		Doubled, that's ${() => count() * 2}
	</div>`;
```

### `attrs`: Applying attributes

Before you mentally go "ew, why is this like this" at `attrs` and `ev`,
remember that this framework is optimized for bundle size.
These being separate, at the expense of comfort, allows the templating implementation (and therefore
the bundle size)
to be much smaller.
Keep in mind that this framework is not intended for applications, its for applications where size
matters primarily.

`attrs` is a utility that allows you to assign attributes to elements (reasonably) cleanly in your
template:

```js
// image from before:
const myImage = attr(html`<img alt="a cool img" />`, "src", myImg);

// use it in a template:
const myUi = html`
	<div id="image-wrap">
	${attrs(
		html`<img alt="a cool img" />`,
		"src", myImg
	)}
	</div>
`;
```

`attrs` can apply multiple attributes in a single
call: `attrs(myimg, "src", catImageSrc, "alt", catImageAlt)`;

`attrs` is also reactive: you can provide a signal / function returning a string:

```js
const width = sig(500);
const resizableDiv = attrs(html`<div/>`, "style", () => `width: ${width()}px`);
```

## `ev`: Event handling

Introducing `attrs`' close cousin: `ev`, which adds event handlers to an element.:

```js
const count = sig(0);
const ui = ev(html`<button>I have been clicked ${count} times</button>`, "click", () => count(count() + 1));
```

## Components

Use a function:

```js
const MyBtn = (content, onClick) =>
	ev(html`<button class="my-btn">${content}</button>`, "click", onClick);

const count = sig(0);
const ui = html`
	<div>
		<h1>My Cool app</h1>
		${MyBtn("say hi!", () => alert("hi there!"))}
		<br />
		${MyBtn(() => `a count of ${count()}`, () => count(count() + 1))}
	</div>`;
```

## Loops

Use a nested template:
```js
html`
	<div>
		${names.map(n => ev(
				html`<button>Say hi to ${n}!</button>`,
				"click", () => alert(`hi ${n}!`))
		)}
	</div>
`;
```

## Shoutouts

- [ArrowJS](https://arrow-js.com) - the inspiration of this library.
  If you want something like ιota but a lil bigger and with better DX, try Arrow! It's cool!
- [Solid](https://solidjs.com) - inspired the use of signals.
  If you want to build a full app or website, this is 100% my best recommendation. It just *rocks!*
- You! - thanks for using my software. If you notice a bug, or want an extra feature that doesn't
  fall under the non-goals, feel free to open an issue or PR :)
  If you particularly like this or, any other of my software, feel free to buy me a coffee ;)