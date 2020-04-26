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

Create yaml-doc-compatible project.yaml in the same folder. To compile the documentation, run:

  node compile.js

Project license is [MIT](https://github.com/enepomnyaschih/yaml-doc/blob/master/LICENSE).
