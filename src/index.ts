#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import parseProject from "./parseProject";
import bootstrapTemplate from "./templates/bootstrap";
import * as FileUtils from "./utils/File";
import yargs = require("yargs");

const argv = yargs
	.detectLocale(false)
	.command<{file: string}>("$0 <file>", "compile documentation", y => {
		y.positional("file", {
			desc: "project documentation .yaml file"
		});
	})
	.version(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8")).version)
	.strict()
	.parse();

const project = parseProject(path.resolve(process.cwd(), argv.file));
FileUtils.unlink(project.outputAbsolutePath);
fs.mkdirSync(project.outputAbsolutePath);

// TODO: Are statics really necessary? May be it is enough to use Bash cp command?
project.statics.forEach(definition => {
	FileUtils.copy(
		project.getAbsolutePath(definition.src),
		path.resolve(project.outputAbsolutePath, definition.dest),
		definition.rename ? dest => dest + ".txt" : undefined);
});

// TODO: Apply template by calling code above as a library function? Or implement templates as plugins?
bootstrapTemplate(project);

// TODO: Add tests.
