// iota html parser
// based on developit/htm/mini, but with all templating and caching removed
// the code this is based on is licensed under Apache-2.0.
// https://github.com/developit/htm/blob/master/LICENSE

const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_COMMENT = 4;
const MODE_PROP_SET = 5;
const MODE_PROP_APPEND = 6;

export function parser(h, html) {
	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let current = [0]; // the typing devil
	let char, propName;

	const commit = () => {
		if (mode === MODE_TEXT && ((buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, '')))) {
			current.push(buffer);
		} else if (mode === MODE_TAGNAME && buffer) {
			current[1] = buffer;
			mode = MODE_WHITESPACE;
		} else {
			if (mode === MODE_WHITESPACE && buffer) {
				(current[2] = current[2] || {})[buffer] = true;
			} else if (mode >= MODE_PROP_SET) {
				if (mode === MODE_PROP_SET) {
					(current[2] = current[2] || {})[propName] = buffer;
					mode = MODE_PROP_APPEND;
				} else if (buffer) {
					current[2][propName] += buffer;
				}
			}
		}

		buffer = '';
	};

	for (let j = 0; j < html.length; j++) {
		char = html[j];

		if (mode === MODE_TEXT) {
			if (char === '<') {
				// commit buffer
				commit();
				current = [current, '', null];
				mode = MODE_TAGNAME;
			} else {
				buffer += char;
			}
		} else if (mode === MODE_COMMENT) {
			// Ignore everything until the last three characters are '-', '-' and '>'
			if (buffer === '--' && char === '>') {
				mode = MODE_TEXT;
				buffer = '';
			} else {
				buffer = char + buffer[0];
			}
		} else if (quote) {
			if (char === quote) {
				quote = '';
			} else {
				buffer += char;
			}
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === '>') {
			commit();
			mode = MODE_TEXT;
		} else if (!mode) {
			// Ignore everything until the tag ends
		} else if (char === '=') {
			mode = MODE_PROP_SET;
			propName = buffer;
			buffer = '';
		} else if (char === '/' && (mode < MODE_PROP_SET || html[j + 1] === '>')) {
			commit();
			if (mode === MODE_TAGNAME) {
				current = current[0];
			}
			mode = current;
			(current = current[0]).push(h.apply(null, mode.slice(1)));
			mode = MODE_SLASH;
		} else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
			// <a disabled>
			commit();
			mode = MODE_WHITESPACE;
		} else {
			buffer += char;
		}

		if (mode === MODE_TAGNAME && buffer === '!--') {
			mode = MODE_COMMENT;
			current = current[0];
		}
	}
	commit();

	// my use case this is fine
	return current.slice(1);
	//return current.length > 2 ? current.slice(1) : current[1];
}