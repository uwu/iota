// partially pre-minifies the code with SWC
// mangling names and compressing whitespace,etc. is left to the library user's build tools
// yes, this results in pretty ugly output, but I don't trust other build tools to do a great job

// source -> esbuild 0.17.19 minify + bundle: 1371 bytes
// source -> this -> esbuild minify + bundle: 1369 bytes

// i checked, the difference was SWC swapping a `typeof == "string" ? trim() : true` for `typeof !== "string" || trim()`
// its a tiny difference here but shows that, applied to a larger range of build tools of varying newness
// this could be notable

import fg from "fast-glob";
import {transformFile} from "@swc/core";
import {writeFile} from "fs/promises";

for await (const file of fg.stream("dist/*.js"))
	await writeFile(
		file,
		(
			await transformFile(file, {
				minify: false,
				jsc: {
					minify: {
						compress: true,
						mangle: false,
					},
					target: "es2022",
				},
			})
		).code
	);