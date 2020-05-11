### yaml-doc

YAML-based software documentation generator.

This NodeJS CLI application parses YAML source files of your documentation and generates HTML documentation files based
on them. The tool has been mainly designed to document library contents - in particular, TypeScript ones.

Features:

* Cascade documentation nodes:
  * Project
  * File: library module or just an article
  * Symbol: function, class, interface or value
  * Member: method or property
* Automated or manual cross-referencing between nodes.
* TypeScript-based templating engine.

yaml-doc is available as [npm package](https://www.npmjs.com/package/yaml-doc).

    npm i yaml-doc

### yaml-doc-bootstrap

Bootstrap template for [YAML-based software documentation generator](https://www.npmjs.com/package/yaml-doc).

Examples of output:

* [jWidget documentation](https://enepomnyaschih.github.io/jwidget/)
* [ts-time documentation](https://enepomnyaschih.github.io/ts-time/)

yaml-doc-bootstrap is available as [npm package](https://www.npmjs.com/package/yaml-doc-bootstrap).

    npm i yaml-doc-bootstrap

To apply the template, create a simple NodeJS script like this:

    const fs = require("fs"),
        path = require("path"),
        parseYamlDocProject = require("yaml-doc").default,
        applyBootstrapTemplate = require("yaml-doc-bootstrap").default;
    
    const project = parseYamlDocProject(path.resolve(__dirname, "project.yaml")),
        dist = path.resolve(__dirname, "dist");
    fs.rmdirSync(dist, {recursive: true});
    applyBootstrapTemplate(project, dist);

Create yaml-doc-compatible project.yaml in the same folder. To compile the documentation, run the script in NodeJS.

Project license is [MIT](https://github.com/enepomnyaschih/yaml-doc/blob/master/LICENSE).
