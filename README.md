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
* Static file support.
* TypeScript-based templating engine.

Examples of output:

* [jWidget documentation](https://enepomnyaschih.github.io/jwidget/2.1/)
* [ts-time documentation](https://enepomnyaschih.github.io/ts-time/)

yaml-doc is available as [npm package](https://www.npmjs.com/package/yaml-doc).

    npm i yaml-doc

Project license is [MIT](https://github.com/enepomnyaschih/yaml-doc/blob/master/LICENSE).
