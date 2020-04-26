"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const DictionaryUtils = require("yaml-doc/utils/Dictionary");
const Doc_1 = require("yaml-doc/utils/Doc");
const File_1 = require("yaml-doc/utils/File");
const String_1 = require("yaml-doc/utils/String");
function applyBootstrapTemplate(project) {
    for (let fileId in project.files) {
        const file = project.files[fileId];
        writeFile(project, fileId, renderFile(file));
    }
}
exports.default = applyBootstrapTemplate;
function writeFile(project, fileId, html) {
    console.log(`Writing ${fileId}...`);
    const filePath = path.resolve(project.outputAbsolutePath, `${fileId}.html`);
    File_1.mkdir(filePath);
    fs.writeFileSync(filePath, html);
}
function renderFile(file) {
    const homeUrl = Doc_1.getRelativeUrl("", file.id), isTutorial = file.project.files.hasOwnProperty("tutorials/tutorial1");
    return `<!DOCTYPE html>
<html>
	<head>
		<title>${file.title}</title>
		<link rel="stylesheet" type="text/css" href="${Doc_1.getRelativeUrl("bootstrap.min.css", file.id)}">
		<link rel="stylesheet" type="text/css" href="${Doc_1.getRelativeUrl("styles.css", file.id)}">
	</head>
	<body>
		<nav class="doc-header navbar navbar-expand-lg navbar-dark bg-dark">
			${file.project.name ? `<a class="navbar-brand" href="${homeUrl}">${file.project.name}</a>` : ""}
			<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
				<span class="navbar-toggler-icon"></span>
			</button>
			<div class="collapse navbar-collapse" id="navbarSupportedContent">
				<ul class="navbar-nav mr-auto">
					<li class="nav-item">
						<a class="nav-link" href="${homeUrl}">Home</a>
					</li>
					${isTutorial ? `
						<li class="nav-item">
							<a class="nav-link dropdown-toggle" href="${Doc_1.getRelativeUrl("tutorials/tutorial1.html", file.id)}"
								data-dropdown="#tutorial-dropdown">Tutorial <span class="sr-only">(current)</span></a>
						</li>
					` : ''}
					<li class="nav-item">
						<a class="nav-link dropdown-toggle" href="${Doc_1.getRelativeUrl("doc.html", file.id)}"
							data-dropdown="#index-dropdown">${file.project.docTitle} <span class="sr-only">(current)</span></a>
					</li>
				</ul>
				<form class="form-inline my-2 my-lg-0">
					${file.isModule ? docToolbar : ''}
				</form>
			</div>
		</nav>
		<div class="doc-contents">
			${file.isModule ? `
				<nav class="doc-sidebar navbar navbar-light bg-light">
					<nav class="doc-index nav nav-pills flex-column">
						<a class="navbar-brand" href="#">${file.id}</a>
						${renderIndex(file)}
						<div class="py-3"></div>
					</nav>
				</nav>
				<div class="doc-main">
					<div class="container-fluid">
						<h1>${file.description ? "" : '<span id="default"></span>'}${file.id}</h1>
						${Doc_1.renderText(file.context, file.description)}
						<h3>Consumption</h3>
						<pre class="doc-consumption">${renderConsumption(file)}</pre>
						${renderSymbols(file)}
					</div>
					${docFooter}
				</div>
			` : `${Doc_1.renderText(file.context, file.description)}${docFooter}`}
		</div>
		${isTutorial ? `<div id="tutorial-dropdown" class="doc-dropdown" style="display: none">${Doc_1.renderText(file.context, "%%TutorialIndex")}</div>` : ''}
		<div id="index-dropdown" class="doc-dropdown" style="display: none">${Doc_1.renderText(file.context, "%%DocumentationIndex")}</div>
		<script type="text/javascript" src="${Doc_1.getRelativeUrl("jquery-3.2.1.min.js", file.id)}"></script>
		<script type="text/javascript" src="${Doc_1.getRelativeUrl("bootstrap.bundle.min.js", file.id)}"></script>
		<script type="text/javascript" src="${Doc_1.getRelativeUrl("scripts.js", file.id)}"></script>
	</body>
</html>`;
}
const docToolbar = `<div class="form-check text-light mr-2">
		<input class="form-check-input" type="checkbox" id="navbarShowInherited">
		<label class="form-check-label" for="navbarShowInherited">Expand inherited members</label>
	</div>`;
const docFooter = '<footer>&copy; <script>document.write(new Date().getFullYear())</script> Copyright: Egor Nepomnyaschih</footer>';
// Search field - for future implementation
// <input class="form-control mr-sm-2" disabled type="search" placeholder="Search" aria-label="Search">
// <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
function renderIndex(file) {
    return DictionaryUtils.join(DictionaryUtils.map(file.groups, (group, key) => (key ? renderIndexGroup(file, group, key) : renderIndexSymbols(file, group))), "\n");
}
function renderIndexGroup(file, group, key) {
    return `
<a class="nav-link" href="#${key}">${file.groupTitles[key]}</a>
<nav class="nav nav-pills flex-column">${renderIndexSymbols(file, group)}</nav>`;
}
function renderIndexSymbols(file, group) {
    return group.map((id) => renderIndexSymbol(file, id)).join("\n");
}
function renderIndexSymbol(file, id) {
    const symbol = file.symbols[id];
    const url = Doc_1.getReferenceUrl(symbol.selfReference, file.id);
    return `
<a class="nav-link" href="${url}">${renderId(symbol)}</a>
${symbol.visit(symbolIndexRenderVisitor)}`;
}
const symbolIndexRenderVisitor = {
    visitHeader(_symbol) {
        return "";
    },
    visitValue(_symbol) {
        return "";
    },
    visitFunction(symbol) {
        return renderTopicIndex(symbol.topics);
    },
    visitStruct(symbol) {
        return `
<nav class="nav nav-pills flex-column">
${symbol.simple ? "" : `<a class="nav-link" href="#${symbol.hash}---hierarchy">Hierarchy</a>`}
${symbol.simple ? "" : `<a class="nav-link" href="#${symbol.hash}---description">Description</a>`}
${symbol.simple ? "" : renderTopicIndex(symbol.topics)}
${symbol._constructor ? `<a class="nav-link" href="#${symbol.hash}---constructor">Constructor</a>` : ""}
${renderIndexDictionary(symbol, symbol.properties, "properties", "Properties")}
${renderIndexDictionary(symbol, symbol.methods, "methods", "Methods")}
${renderIndexDictionary(symbol, symbol.staticProperties, "staticProperties", "Static properties")}
${renderIndexDictionary(symbol, symbol.staticMethods, "staticMethods", "Static methods")}
</nav>`;
    }
};
function renderIndexDictionary(struct, dict, key, title) {
    if (DictionaryUtils.isEmpty(dict)) {
        return "";
    }
    const members = DictionaryUtils.join(DictionaryUtils.map(dict, renderIndexMember), "\n");
    return struct.simple ? members : `
<a class="nav-link" href="#${struct.hash}---${key}">${title}</a>
<nav class="nav nav-pills flex-column">${members}</nav>`;
}
function renderIndexMember(member) {
    return `<a class="nav-link${member.isInherited ? " font-italic" : ""}" href="#${member.hash}">${member.id}</a>`;
}
function renderTopicIndex(topics) {
    return DictionaryUtils.isEmpty(topics) ? "" : '<nav class="nav nav-pills flex-column">' +
        DictionaryUtils.join(DictionaryUtils.map(topics, (topic, key) => (`<a class="nav-link" href="#${key}">${topic.header}</a>`)), "\n") +
        '</nav>';
}
function renderConsumption(file) {
    if (!file.expandImports) {
        return `import * as ${file.token} from "${file.id}";`;
    }
    const imports = Object.keys(file.symbols).filter(key => key !== 'default' && key.indexOf('.') === -1);
    return `import ${[
        file.symbols.default ? file.symbols.default.objectName : '',
        imports.length ? '{' + imports.join(', ') + '}' : ''
    ].filter(Boolean).join(', ')} from "${file.id}";`;
}
function renderSymbols(file) {
    let buffer = "";
    for (let key in file.symbols) {
        if (file.symbols.hasOwnProperty(key)) {
            buffer += file.symbols[key].visit(symbolRenderVisitor);
        }
    }
    return buffer;
}
const symbolRenderVisitor = {
    visitHeader(symbol) {
        return `
${renderHeader("h2", symbol.hash, String_1.htmlEncode(symbol.header))}
${Doc_1.renderText(symbol.context, symbol.description)}`;
    },
    visitValue(symbol) {
        return `
${renderHeader("h3", symbol.hash, renderId(symbol))}
<div class="doc-section">
<p><code>${symbol.objectName}: ${Doc_1.renderText(symbol.context, symbol.type)}</code></p>
${Doc_1.renderText(symbol.context, symbol.description)}
</div>`;
    },
    visitFunction(symbol) {
        return `
${renderHeader("h3", symbol.hash, renderId(symbol))}
<div class="doc-section">
<p><code>${Doc_1.renderText(symbol.context, symbol.signature)}</code></p>
${Doc_1.renderParams(symbol.context, symbol.params, symbol.returns)}
${Doc_1.renderText(symbol.context, symbol.description)}
${renderTopics(symbol.topics)}
</div>`;
    },
    visitStruct(symbol) {
        return `
${renderHeader("h3", symbol.hash, renderId(symbol))}
<div class="doc-section">
${symbol.simple ? "" : renderHierarchy(symbol)}
${symbol.simple ? "" : renderHeader("h4", `${symbol.hash}---description`, "Description")}
${renderTypeVarDefinitions(symbol)}
${Doc_1.renderText(symbol.context, symbol.description)}
${renderTopics(symbol.topics)}
${renderConstructor(symbol._constructor)}
${renderMembers(symbol, symbol.properties, "properties", "Fields", renderProperty)}
${renderMembers(symbol, symbol.methods, "methods", "Methods", renderMethod)}
${renderMembers(symbol, symbol.staticProperties, "staticProperties", "Static fields", renderProperty)}
${renderMembers(symbol, symbol.staticMethods, "staticMethods", "Static methods", renderMethod)}
</div>`;
    }
};
function renderId(symbol) {
    return (symbol.id === "default") ? "Default export" : symbol.id;
}
function renderHierarchy(struct) {
    if (struct.simple) {
        return "";
    }
    const cache = [];
    return `
${renderHeader("h4", `${struct.hash}---hierarchy`, "Hierarchy")}
<ul class="doc-hierarchy">
${renderHierarchyHead(struct, struct.inheritanceLevel - 1, cache)}
<li>${renderTab(struct.inheritanceLevel)}${struct.kind} <b>${struct.objectName}</b>${renderTypeVarsWithExtensions(struct)}</li>
${renderHierarchyTail(struct, struct.inheritanceLevel + 1, cache)}
</ul>`;
}
function renderHierarchyHead(struct, level, cache) {
    return struct.extending.map((extension) => {
        const extendedStruct = struct.project.getStructByExtension(extension);
        if (cache.indexOf(extendedStruct) !== -1) {
            return "";
        }
        cache.push(extendedStruct);
        return `
${renderHierarchyHead(extendedStruct, level - 1, cache)}
<li>${renderTab(level)}${extendedStruct.kind} ${Doc_1.renderStructReference(extendedStruct, struct.file.id)}${renderTypeVars(extendedStruct)}</li>`;
    }).join("");
}
function renderHierarchyTail(struct, level, cache, levelsLeft) {
    if (levelsLeft == null) {
        levelsLeft = struct.showInheritanceLevels;
    }
    else if (struct.showInheritanceLevels != null) {
        levelsLeft = Math.min(levelsLeft, struct.showInheritanceLevels);
    }
    if (levelsLeft != null && levelsLeft <= 0) {
        return "";
    }
    return struct.extendedBy.map((extendingStruct) => {
        if (cache.indexOf(extendingStruct) !== -1) {
            return "";
        }
        cache.push(extendingStruct);
        return `
<li>${renderTab(level)}${extendingStruct.kind} ${Doc_1.renderStructReference(extendingStruct, struct.file.id)}${renderTypeVars(extendingStruct)}</li>
${renderHierarchyTail(extendingStruct, level + 1, cache, levelsLeft != null ? levelsLeft - 1 : null)}`;
    }).join("");
}
function renderTypeVars(struct) {
    if (DictionaryUtils.isEmpty(struct.typevars)) {
        return "";
    }
    return `<span class="monospace">&lt;${Object.keys(struct.typevars).join(", ")}&gt;</span>`;
}
function renderTypeVarsWithExtensions(struct) {
    if (DictionaryUtils.isEmpty(struct.typevars)) {
        return "";
    }
    return `<span class="monospace">&lt;${DictionaryUtils.join(DictionaryUtils.map(struct.typevars, (typevar, key) => (key + (typevar.extends.length ? ` ${renderTypeVarExtensions(struct, typevar)}` : ""))), ", ")}&gt;</span>`;
}
function renderTypeVarDefinitions(struct) {
    return Doc_1.renderDefinitions(struct.context, DictionaryUtils.map(struct.typevars, typevar => ((typevar.extends.length ? `(${renderTypeVarExtensions(struct, typevar)}) ` : "") + typevar.description)));
}
function renderTypeVarExtensions(struct, typevar) {
    return `extends ${typevar.extends.map(extension => (Doc_1.renderStructReference(struct.project.getStructByExtension({
        file: extension.file,
        symbol: extension.symbol
    }), struct.file.id))).join(" & ")}`;
}
function renderTopics(topics) {
    return DictionaryUtils.join(DictionaryUtils.map(topics, (topic, key) => `
		${renderHeader("h5", key, topic.header)}
		${Doc_1.renderText(topic.context, topic.text)}
	`), "\n");
}
function renderConstructor(constr) {
    if (!constr) {
        return "";
    }
    return `
${renderHeader("h4", `${constr.struct.hash}---constructor`, "Constructor")}
<p><code>new ${constr.struct.objectName}${renderTypeVars(constr.struct)}${Doc_1.renderText(constr.context, constr.signature)}</code></p>
${Doc_1.renderDefinitions(constr.context, constr.params)}
${Doc_1.renderText(constr.context, constr.description)}`;
}
function renderMembers(struct, members, key, title, renderer) {
    if (DictionaryUtils.isEmpty(members)) {
        return "";
    }
    const strDict = DictionaryUtils.map(members, renderer);
    return `
${struct.simple ? "" : `${renderHeader("h4", `${struct.hash}---${key}`, title)}`}
${DictionaryUtils.join(strDict, "\n")}`;
}
function renderProperty(property) {
    return `
${renderMemberHeader(property)}
<div class="doc-member${property.isInherited ? " doc-inherited" : ""}">
<p><code>${property.modifiers ? property.modifiers + " " : ""}${property.id}${property.optional ? "?" : ""}: ${Doc_1.renderText(property.context, String_1.htmlEncode(property.type))}</code></p>
${Doc_1.renderText(property.context, property.description)}
</div>`;
}
function renderMethod(method) {
    return `
${renderMemberHeader(method)}
<div class="doc-member${method.isInherited ? " doc-inherited" : ""}">
<p><code>${method.modifiers ? method.modifiers + " " : ""}${Doc_1.renderText(method.context, String_1.htmlEncode(method.signature))}</code></p>
${Doc_1.renderParams(method.context, method.params, method.returns)}
${Doc_1.renderText(method.context, method.description)}
</div>`;
}
function renderMemberHeader(member) {
    const text = !member.isInherited ? member.id :
        `<i>${member.id}</i> <span class="doc-inherit-mark">(inherited from ${Doc_1.renderReference(member.inheritedFrom.selfReference, member.file.id)})</span>`;
    return renderHeader("h5", member.hash, text);
}
function renderHeader(tag, id, title) {
    return `<${tag}><span id="${id}"></span>${title}<a class="anchorjs-link" href="#${id}" aria-label="Anchor" style="padding-left: 0.375em;">#</a></${tag}>`;
}
function renderTab(level) {
    return `<span style="margin-left: ${2 * level}em"></span>`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBeUI7QUFDekIsNkJBQTZCO0FBZTdCLDZEQUE2RDtBQUM3RCw0Q0FRNEI7QUFDNUIsOENBQTBDO0FBQzFDLGtEQUFpRDtBQUVqRCxTQUF3QixzQkFBc0IsQ0FBQyxPQUFnQjtJQUM5RCxLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDakMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxTQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUM3QztBQUNGLENBQUM7QUFMRCx5Q0FLQztBQUVELFNBQVMsU0FBUyxDQUFDLE9BQWdCLEVBQUUsTUFBYyxFQUFFLElBQVk7SUFDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLE1BQU0sS0FBSyxDQUFDLENBQUM7SUFDcEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxDQUFDO0lBQzVFLFlBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoQixFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsSUFBZ0I7SUFDbkMsTUFBTSxPQUFPLEdBQUcsb0JBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUMxQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDdkUsT0FBTzs7O1dBR0csSUFBSSxDQUFDLEtBQUs7aURBQzRCLG9CQUFjLENBQUMsbUJBQW1C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QUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sTUFBTSxDQUFDLEVBQUUsdURBQXVELHFCQUFlLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0lBQ3JKLE9BQU8sWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQUUsRUFBVSxFQUFFLEtBQWE7SUFDM0QsT0FBTyxJQUFJLEdBQUcsY0FBYyxFQUFFLFlBQVksS0FBSyxtQ0FBbUMsRUFBRSwrREFBK0QsR0FBRyxHQUFHLENBQUM7QUFDM0osQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLEtBQWE7SUFDL0IsT0FBTyw2QkFBNkIsQ0FBQyxHQUFHLEtBQUssYUFBYSxDQUFDO0FBQzVELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBDb25zdHJ1Y3RvciBmcm9tIFwieWFtbC1kb2MvQ29uc3RydWN0b3JcIjtcbmltcG9ydCBEaWN0aW9uYXJ5IGZyb20gXCJ5YW1sLWRvYy9EaWN0aW9uYXJ5XCI7XG5pbXBvcnQgSU1lbWJlciBmcm9tIFwieWFtbC1kb2MvbWVtYmVycy9JTWVtYmVyXCI7XG5pbXBvcnQgTWV0aG9kTWVtYmVyIGZyb20gXCJ5YW1sLWRvYy9tZW1iZXJzL01ldGhvZFwiO1xuaW1wb3J0IFByb3BlcnR5TWVtYmVyIGZyb20gXCJ5YW1sLWRvYy9tZW1iZXJzL1Byb3BlcnR5XCI7XG5pbXBvcnQgUHJvamVjdCBmcm9tIFwieWFtbC1kb2MvUHJvamVjdFwiO1xuaW1wb3J0IFNvdXJjZUZpbGUgZnJvbSBcInlhbWwtZG9jL1NvdXJjZUZpbGVcIjtcbmltcG9ydCBGdW5jdGlvblN5bWJvbCBmcm9tIFwieWFtbC1kb2Mvc3ltYm9scy9GdW5jdGlvblwiO1xuaW1wb3J0IEhlYWRlclN5bWJvbCBmcm9tIFwieWFtbC1kb2Mvc3ltYm9scy9IZWFkZXJcIjtcbmltcG9ydCBJU3ltYm9sIGZyb20gXCJ5YW1sLWRvYy9zeW1ib2xzL0lTeW1ib2xcIjtcbmltcG9ydCBTdHJ1Y3RTeW1ib2wsIHtUeXBlVmFyfSBmcm9tIFwieWFtbC1kb2Mvc3ltYm9scy9TdHJ1Y3RcIjtcbmltcG9ydCBWYWx1ZVN5bWJvbCBmcm9tIFwieWFtbC1kb2Mvc3ltYm9scy9WYWx1ZVwiO1xuaW1wb3J0IFN5bWJvbFZpc2l0b3IgZnJvbSBcInlhbWwtZG9jL1N5bWJvbFZpc2l0b3JcIjtcbmltcG9ydCBUb3BpYyBmcm9tIFwieWFtbC1kb2MvVG9waWNcIjtcbmltcG9ydCAqIGFzIERpY3Rpb25hcnlVdGlscyBmcm9tIFwieWFtbC1kb2MvdXRpbHMvRGljdGlvbmFyeVwiO1xuaW1wb3J0IHtcblx0Z2V0UmVmZXJlbmNlVXJsLFxuXHRnZXRSZWxhdGl2ZVVybCxcblx0cmVuZGVyRGVmaW5pdGlvbnMsXG5cdHJlbmRlclBhcmFtcyxcblx0cmVuZGVyUmVmZXJlbmNlLFxuXHRyZW5kZXJTdHJ1Y3RSZWZlcmVuY2UsXG5cdHJlbmRlclRleHRcbn0gZnJvbSBcInlhbWwtZG9jL3V0aWxzL0RvY1wiO1xuaW1wb3J0IHtta2Rpcn0gZnJvbSBcInlhbWwtZG9jL3V0aWxzL0ZpbGVcIjtcbmltcG9ydCB7aHRtbEVuY29kZX0gZnJvbSBcInlhbWwtZG9jL3V0aWxzL1N0cmluZ1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBhcHBseUJvb3RzdHJhcFRlbXBsYXRlKHByb2plY3Q6IFByb2plY3QpIHtcblx0Zm9yIChsZXQgZmlsZUlkIGluIHByb2plY3QuZmlsZXMpIHtcblx0XHRjb25zdCBmaWxlID0gcHJvamVjdC5maWxlc1tmaWxlSWRdO1xuXHRcdHdyaXRlRmlsZShwcm9qZWN0LCBmaWxlSWQsIHJlbmRlckZpbGUoZmlsZSkpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHdyaXRlRmlsZShwcm9qZWN0OiBQcm9qZWN0LCBmaWxlSWQ6IHN0cmluZywgaHRtbDogc3RyaW5nKSB7XG5cdGNvbnNvbGUubG9nKGBXcml0aW5nICR7ZmlsZUlkfS4uLmApO1xuXHRjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9qZWN0Lm91dHB1dEFic29sdXRlUGF0aCwgYCR7ZmlsZUlkfS5odG1sYCk7XG5cdG1rZGlyKGZpbGVQYXRoKTtcblx0ZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgaHRtbCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckZpbGUoZmlsZTogU291cmNlRmlsZSkge1xuXHRjb25zdCBob21lVXJsID0gZ2V0UmVsYXRpdmVVcmwoXCJcIiwgZmlsZS5pZCksXG5cdFx0aXNUdXRvcmlhbCA9IGZpbGUucHJvamVjdC5maWxlcy5oYXNPd25Qcm9wZXJ0eShcInR1dG9yaWFscy90dXRvcmlhbDFcIik7XG5cdHJldHVybiBgPCFET0NUWVBFIGh0bWw+XG48aHRtbD5cblx0PGhlYWQ+XG5cdFx0PHRpdGxlPiR7ZmlsZS50aXRsZX08L3RpdGxlPlxuXHRcdDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiJHtnZXRSZWxhdGl2ZVVybChcImJvb3RzdHJhcC5taW4uY3NzXCIsIGZpbGUuaWQpfVwiPlxuXHRcdDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiJHtnZXRSZWxhdGl2ZVVybChcInN0eWxlcy5jc3NcIiwgZmlsZS5pZCl9XCI+XG5cdDwvaGVhZD5cblx0PGJvZHk+XG5cdFx0PG5hdiBjbGFzcz1cImRvYy1oZWFkZXIgbmF2YmFyIG5hdmJhci1leHBhbmQtbGcgbmF2YmFyLWRhcmsgYmctZGFya1wiPlxuXHRcdFx0JHtmaWxlLnByb2plY3QubmFtZSA/IGA8YSBjbGFzcz1cIm5hdmJhci1icmFuZFwiIGhyZWY9XCIke2hvbWVVcmx9XCI+JHtmaWxlLnByb2plY3QubmFtZX08L2E+YCA6IFwiXCJ9XG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVwibmF2YmFyLXRvZ2dsZXJcIiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiIGRhdGEtdGFyZ2V0PVwiI25hdmJhclN1cHBvcnRlZENvbnRlbnRcIiBhcmlhLWNvbnRyb2xzPVwibmF2YmFyU3VwcG9ydGVkQ29udGVudFwiIGFyaWEtZXhwYW5kZWQ9XCJmYWxzZVwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgbmF2aWdhdGlvblwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5hdmJhci10b2dnbGVyLWljb25cIj48L3NwYW4+XG5cdFx0XHQ8L2J1dHRvbj5cblx0XHRcdDxkaXYgY2xhc3M9XCJjb2xsYXBzZSBuYXZiYXItY29sbGFwc2VcIiBpZD1cIm5hdmJhclN1cHBvcnRlZENvbnRlbnRcIj5cblx0XHRcdFx0PHVsIGNsYXNzPVwibmF2YmFyLW5hdiBtci1hdXRvXCI+XG5cdFx0XHRcdFx0PGxpIGNsYXNzPVwibmF2LWl0ZW1cIj5cblx0XHRcdFx0XHRcdDxhIGNsYXNzPVwibmF2LWxpbmtcIiBocmVmPVwiJHtob21lVXJsfVwiPkhvbWU8L2E+XG5cdFx0XHRcdFx0PC9saT5cblx0XHRcdFx0XHQke2lzVHV0b3JpYWwgPyBgXG5cdFx0XHRcdFx0XHQ8bGkgY2xhc3M9XCJuYXYtaXRlbVwiPlxuXHRcdFx0XHRcdFx0XHQ8YSBjbGFzcz1cIm5hdi1saW5rIGRyb3Bkb3duLXRvZ2dsZVwiIGhyZWY9XCIke2dldFJlbGF0aXZlVXJsKFwidHV0b3JpYWxzL3R1dG9yaWFsMS5odG1sXCIsIGZpbGUuaWQpfVwiXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YS1kcm9wZG93bj1cIiN0dXRvcmlhbC1kcm9wZG93blwiPlR1dG9yaWFsIDxzcGFuIGNsYXNzPVwic3Itb25seVwiPihjdXJyZW50KTwvc3Bhbj48L2E+XG5cdFx0XHRcdFx0XHQ8L2xpPlxuXHRcdFx0XHRcdGAgOiAnJ31cblx0XHRcdFx0XHQ8bGkgY2xhc3M9XCJuYXYtaXRlbVwiPlxuXHRcdFx0XHRcdFx0PGEgY2xhc3M9XCJuYXYtbGluayBkcm9wZG93bi10b2dnbGVcIiBocmVmPVwiJHtnZXRSZWxhdGl2ZVVybChcImRvYy5odG1sXCIsIGZpbGUuaWQpfVwiXG5cdFx0XHRcdFx0XHRcdGRhdGEtZHJvcGRvd249XCIjaW5kZXgtZHJvcGRvd25cIj4ke2ZpbGUucHJvamVjdC5kb2NUaXRsZX0gPHNwYW4gY2xhc3M9XCJzci1vbmx5XCI+KGN1cnJlbnQpPC9zcGFuPjwvYT5cblx0XHRcdFx0XHQ8L2xpPlxuXHRcdFx0XHQ8L3VsPlxuXHRcdFx0XHQ8Zm9ybSBjbGFzcz1cImZvcm0taW5saW5lIG15LTIgbXktbGctMFwiPlxuXHRcdFx0XHRcdCR7ZmlsZS5pc01vZHVsZSA/IGRvY1Rvb2xiYXIgOiAnJ31cblx0XHRcdFx0PC9mb3JtPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9uYXY+XG5cdFx0PGRpdiBjbGFzcz1cImRvYy1jb250ZW50c1wiPlxuXHRcdFx0JHtmaWxlLmlzTW9kdWxlID8gYFxuXHRcdFx0XHQ8bmF2IGNsYXNzPVwiZG9jLXNpZGViYXIgbmF2YmFyIG5hdmJhci1saWdodCBiZy1saWdodFwiPlxuXHRcdFx0XHRcdDxuYXYgY2xhc3M9XCJkb2MtaW5kZXggbmF2IG5hdi1waWxscyBmbGV4LWNvbHVtblwiPlxuXHRcdFx0XHRcdFx0PGEgY2xhc3M9XCJuYXZiYXItYnJhbmRcIiBocmVmPVwiI1wiPiR7ZmlsZS5pZH08L2E+XG5cdFx0XHRcdFx0XHQke3JlbmRlckluZGV4KGZpbGUpfVxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzcz1cInB5LTNcIj48L2Rpdj5cblx0XHRcdFx0XHQ8L25hdj5cblx0XHRcdFx0PC9uYXY+XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJkb2MtbWFpblwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJjb250YWluZXItZmx1aWRcIj5cblx0XHRcdFx0XHRcdDxoMT4ke2ZpbGUuZGVzY3JpcHRpb24gPyBcIlwiIDogJzxzcGFuIGlkPVwiZGVmYXVsdFwiPjwvc3Bhbj4nfSR7ZmlsZS5pZH08L2gxPlxuXHRcdFx0XHRcdFx0JHtyZW5kZXJUZXh0KGZpbGUuY29udGV4dCwgZmlsZS5kZXNjcmlwdGlvbil9XG5cdFx0XHRcdFx0XHQ8aDM+Q29uc3VtcHRpb248L2gzPlxuXHRcdFx0XHRcdFx0PHByZSBjbGFzcz1cImRvYy1jb25zdW1wdGlvblwiPiR7cmVuZGVyQ29uc3VtcHRpb24oZmlsZSl9PC9wcmU+XG5cdFx0XHRcdFx0XHQke3JlbmRlclN5bWJvbHMoZmlsZSl9XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0JHtkb2NGb290ZXJ9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0YCA6IGAke3JlbmRlclRleHQoZmlsZS5jb250ZXh0LCBmaWxlLmRlc2NyaXB0aW9uKX0ke2RvY0Zvb3Rlcn1gfVxuXHRcdDwvZGl2PlxuXHRcdCR7aXNUdXRvcmlhbCA/IGA8ZGl2IGlkPVwidHV0b3JpYWwtZHJvcGRvd25cIiBjbGFzcz1cImRvYy1kcm9wZG93blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPiR7cmVuZGVyVGV4dChmaWxlLmNvbnRleHQsIFwiJSVUdXRvcmlhbEluZGV4XCIpfTwvZGl2PmAgOiAnJ31cblx0XHQ8ZGl2IGlkPVwiaW5kZXgtZHJvcGRvd25cIiBjbGFzcz1cImRvYy1kcm9wZG93blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPiR7cmVuZGVyVGV4dChmaWxlLmNvbnRleHQsIFwiJSVEb2N1bWVudGF0aW9uSW5kZXhcIil9PC9kaXY+XG5cdFx0PHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiJHtnZXRSZWxhdGl2ZVVybChcImpxdWVyeS0zLjIuMS5taW4uanNcIiwgZmlsZS5pZCl9XCI+PC9zY3JpcHQ+XG5cdFx0PHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiJHtnZXRSZWxhdGl2ZVVybChcImJvb3RzdHJhcC5idW5kbGUubWluLmpzXCIsIGZpbGUuaWQpfVwiPjwvc2NyaXB0PlxuXHRcdDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIiR7Z2V0UmVsYXRpdmVVcmwoXCJzY3JpcHRzLmpzXCIsIGZpbGUuaWQpfVwiPjwvc2NyaXB0PlxuXHQ8L2JvZHk+XG48L2h0bWw+YDtcbn1cblxuY29uc3QgZG9jVG9vbGJhciA9XG5cdGA8ZGl2IGNsYXNzPVwiZm9ybS1jaGVjayB0ZXh0LWxpZ2h0IG1yLTJcIj5cblx0XHQ8aW5wdXQgY2xhc3M9XCJmb3JtLWNoZWNrLWlucHV0XCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJuYXZiYXJTaG93SW5oZXJpdGVkXCI+XG5cdFx0PGxhYmVsIGNsYXNzPVwiZm9ybS1jaGVjay1sYWJlbFwiIGZvcj1cIm5hdmJhclNob3dJbmhlcml0ZWRcIj5FeHBhbmQgaW5oZXJpdGVkIG1lbWJlcnM8L2xhYmVsPlxuXHQ8L2Rpdj5gO1xuXG5jb25zdCBkb2NGb290ZXIgPVxuXHQnPGZvb3Rlcj4mY29weTsgPHNjcmlwdD5kb2N1bWVudC53cml0ZShuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpPC9zY3JpcHQ+IENvcHlyaWdodDogRWdvciBOZXBvbW55YXNjaGloPC9mb290ZXI+JztcblxuLy8gU2VhcmNoIGZpZWxkIC0gZm9yIGZ1dHVyZSBpbXBsZW1lbnRhdGlvblxuLy8gPGlucHV0IGNsYXNzPVwiZm9ybS1jb250cm9sIG1yLXNtLTJcIiBkaXNhYmxlZCB0eXBlPVwic2VhcmNoXCIgcGxhY2Vob2xkZXI9XCJTZWFyY2hcIiBhcmlhLWxhYmVsPVwiU2VhcmNoXCI+XG4vLyA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1vdXRsaW5lLXN1Y2Nlc3MgbXktMiBteS1zbS0wXCIgdHlwZT1cInN1Ym1pdFwiPlNlYXJjaDwvYnV0dG9uPlxuXG5mdW5jdGlvbiByZW5kZXJJbmRleChmaWxlOiBTb3VyY2VGaWxlKSB7XG5cdHJldHVybiBEaWN0aW9uYXJ5VXRpbHMuam9pbihEaWN0aW9uYXJ5VXRpbHMubWFwKGZpbGUuZ3JvdXBzLCAoZ3JvdXAsIGtleSkgPT4gKFxuXHRcdGtleSA/IHJlbmRlckluZGV4R3JvdXAoZmlsZSwgZ3JvdXAsIGtleSkgOiByZW5kZXJJbmRleFN5bWJvbHMoZmlsZSwgZ3JvdXApXG5cdCkpLCBcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVySW5kZXhHcm91cChmaWxlOiBTb3VyY2VGaWxlLCBncm91cDogc3RyaW5nW10sIGtleTogc3RyaW5nKSB7XG5cdHJldHVybiBgXG48YSBjbGFzcz1cIm5hdi1saW5rXCIgaHJlZj1cIiMke2tleX1cIj4ke2ZpbGUuZ3JvdXBUaXRsZXNba2V5XX08L2E+XG48bmF2IGNsYXNzPVwibmF2IG5hdi1waWxscyBmbGV4LWNvbHVtblwiPiR7cmVuZGVySW5kZXhTeW1ib2xzKGZpbGUsIGdyb3VwKX08L25hdj5gXG59XG5cbmZ1bmN0aW9uIHJlbmRlckluZGV4U3ltYm9scyhmaWxlOiBTb3VyY2VGaWxlLCBncm91cDogc3RyaW5nW10pIHtcblx0cmV0dXJuIGdyb3VwLm1hcCgoaWQpID0+IHJlbmRlckluZGV4U3ltYm9sKGZpbGUsIGlkKSkuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVySW5kZXhTeW1ib2woZmlsZTogU291cmNlRmlsZSwgaWQ6IHN0cmluZykge1xuXHRjb25zdCBzeW1ib2wgPSBmaWxlLnN5bWJvbHNbaWRdO1xuXHRjb25zdCB1cmwgPSBnZXRSZWZlcmVuY2VVcmwoc3ltYm9sLnNlbGZSZWZlcmVuY2UsIGZpbGUuaWQpO1xuXHRyZXR1cm4gYFxuPGEgY2xhc3M9XCJuYXYtbGlua1wiIGhyZWY9XCIke3VybH1cIj4ke3JlbmRlcklkKHN5bWJvbCl9PC9hPlxuJHtzeW1ib2wudmlzaXQoc3ltYm9sSW5kZXhSZW5kZXJWaXNpdG9yKX1gO1xufVxuXG5jb25zdCBzeW1ib2xJbmRleFJlbmRlclZpc2l0b3I6IFN5bWJvbFZpc2l0b3I8c3RyaW5nPiA9IHtcblxuXHR2aXNpdEhlYWRlcihfc3ltYm9sOiBIZWFkZXJTeW1ib2wpOiBzdHJpbmcge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9LFxuXG5cdHZpc2l0VmFsdWUoX3N5bWJvbDogVmFsdWVTeW1ib2wpOiBzdHJpbmcge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9LFxuXG5cdHZpc2l0RnVuY3Rpb24oc3ltYm9sOiBGdW5jdGlvblN5bWJvbCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHJlbmRlclRvcGljSW5kZXgoc3ltYm9sLnRvcGljcyk7XG5cdH0sXG5cblx0dmlzaXRTdHJ1Y3Qoc3ltYm9sOiBTdHJ1Y3RTeW1ib2wpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgXG48bmF2IGNsYXNzPVwibmF2IG5hdi1waWxscyBmbGV4LWNvbHVtblwiPlxuJHtzeW1ib2wuc2ltcGxlID8gXCJcIiA6IGA8YSBjbGFzcz1cIm5hdi1saW5rXCIgaHJlZj1cIiMke3N5bWJvbC5oYXNofS0tLWhpZXJhcmNoeVwiPkhpZXJhcmNoeTwvYT5gfVxuJHtzeW1ib2wuc2ltcGxlID8gXCJcIiA6IGA8YSBjbGFzcz1cIm5hdi1saW5rXCIgaHJlZj1cIiMke3N5bWJvbC5oYXNofS0tLWRlc2NyaXB0aW9uXCI+RGVzY3JpcHRpb248L2E+YH1cbiR7c3ltYm9sLnNpbXBsZSA/IFwiXCIgOiByZW5kZXJUb3BpY0luZGV4KHN5bWJvbC50b3BpY3MpfVxuJHtzeW1ib2wuX2NvbnN0cnVjdG9yID8gYDxhIGNsYXNzPVwibmF2LWxpbmtcIiBocmVmPVwiIyR7c3ltYm9sLmhhc2h9LS0tY29uc3RydWN0b3JcIj5Db25zdHJ1Y3RvcjwvYT5gIDogXCJcIn1cbiR7cmVuZGVySW5kZXhEaWN0aW9uYXJ5KHN5bWJvbCwgc3ltYm9sLnByb3BlcnRpZXMsIFwicHJvcGVydGllc1wiLCBcIlByb3BlcnRpZXNcIil9XG4ke3JlbmRlckluZGV4RGljdGlvbmFyeShzeW1ib2wsIHN5bWJvbC5tZXRob2RzLCBcIm1ldGhvZHNcIiwgXCJNZXRob2RzXCIpfVxuJHtyZW5kZXJJbmRleERpY3Rpb25hcnkoc3ltYm9sLCBzeW1ib2wuc3RhdGljUHJvcGVydGllcywgXCJzdGF0aWNQcm9wZXJ0aWVzXCIsIFwiU3RhdGljIHByb3BlcnRpZXNcIil9XG4ke3JlbmRlckluZGV4RGljdGlvbmFyeShzeW1ib2wsIHN5bWJvbC5zdGF0aWNNZXRob2RzLCBcInN0YXRpY01ldGhvZHNcIiwgXCJTdGF0aWMgbWV0aG9kc1wiKX1cbjwvbmF2PmBcblx0fVxufVxuXG5mdW5jdGlvbiByZW5kZXJJbmRleERpY3Rpb25hcnkoc3RydWN0OiBTdHJ1Y3RTeW1ib2wsIGRpY3Q6IERpY3Rpb25hcnk8SU1lbWJlcj4sIGtleTogc3RyaW5nLCB0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcblx0aWYgKERpY3Rpb25hcnlVdGlscy5pc0VtcHR5KGRpY3QpKSB7XG5cdFx0cmV0dXJuIFwiXCI7XG5cdH1cblx0Y29uc3QgbWVtYmVycyA9IERpY3Rpb25hcnlVdGlscy5qb2luKERpY3Rpb25hcnlVdGlscy5tYXAoZGljdCwgcmVuZGVySW5kZXhNZW1iZXIpLCBcIlxcblwiKTtcblx0cmV0dXJuIHN0cnVjdC5zaW1wbGUgPyBtZW1iZXJzIDogYFxuPGEgY2xhc3M9XCJuYXYtbGlua1wiIGhyZWY9XCIjJHtzdHJ1Y3QuaGFzaH0tLS0ke2tleX1cIj4ke3RpdGxlfTwvYT5cbjxuYXYgY2xhc3M9XCJuYXYgbmF2LXBpbGxzIGZsZXgtY29sdW1uXCI+JHttZW1iZXJzfTwvbmF2PmA7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckluZGV4TWVtYmVyKG1lbWJlcjogSU1lbWJlcikge1xuXHRyZXR1cm4gYDxhIGNsYXNzPVwibmF2LWxpbmske21lbWJlci5pc0luaGVyaXRlZCA/IFwiIGZvbnQtaXRhbGljXCIgOiBcIlwifVwiIGhyZWY9XCIjJHttZW1iZXIuaGFzaH1cIj4ke21lbWJlci5pZH08L2E+YDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVG9waWNJbmRleCh0b3BpY3M6IERpY3Rpb25hcnk8VG9waWM+KSB7XG5cdHJldHVybiBEaWN0aW9uYXJ5VXRpbHMuaXNFbXB0eSh0b3BpY3MpID8gXCJcIiA6ICc8bmF2IGNsYXNzPVwibmF2IG5hdi1waWxscyBmbGV4LWNvbHVtblwiPicgK1xuXHRcdERpY3Rpb25hcnlVdGlscy5qb2luKERpY3Rpb25hcnlVdGlscy5tYXAodG9waWNzLCAodG9waWMsIGtleSkgPT4gKFxuXHRcdFx0YDxhIGNsYXNzPVwibmF2LWxpbmtcIiBocmVmPVwiIyR7a2V5fVwiPiR7dG9waWMuaGVhZGVyfTwvYT5gXG5cdFx0KSksIFwiXFxuXCIpICtcblx0XHQnPC9uYXY+Jztcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29uc3VtcHRpb24oZmlsZTogU291cmNlRmlsZSkge1xuXHRpZiAoIWZpbGUuZXhwYW5kSW1wb3J0cykge1xuXHRcdHJldHVybiBgaW1wb3J0ICogYXMgJHtmaWxlLnRva2VufSBmcm9tIFwiJHtmaWxlLmlkfVwiO2A7XG5cdH1cblx0Y29uc3QgaW1wb3J0cyA9IE9iamVjdC5rZXlzKGZpbGUuc3ltYm9scykuZmlsdGVyKGtleSA9PiBrZXkgIT09ICdkZWZhdWx0JyAmJiBrZXkuaW5kZXhPZignLicpID09PSAtMSk7XG5cdHJldHVybiBgaW1wb3J0ICR7W1xuXHRcdGZpbGUuc3ltYm9scy5kZWZhdWx0ID8gZmlsZS5zeW1ib2xzLmRlZmF1bHQub2JqZWN0TmFtZSA6ICcnLFxuXHRcdGltcG9ydHMubGVuZ3RoID8gJ3snICsgaW1wb3J0cy5qb2luKCcsICcpICsgJ30nIDogJydcblx0XS5maWx0ZXIoQm9vbGVhbikuam9pbignLCAnKX0gZnJvbSBcIiR7ZmlsZS5pZH1cIjtgO1xufVxuXG5mdW5jdGlvbiByZW5kZXJTeW1ib2xzKGZpbGU6IFNvdXJjZUZpbGUpIHtcblx0bGV0IGJ1ZmZlciA9IFwiXCI7XG5cdGZvciAobGV0IGtleSBpbiBmaWxlLnN5bWJvbHMpIHtcblx0XHRpZiAoZmlsZS5zeW1ib2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdGJ1ZmZlciArPSBmaWxlLnN5bWJvbHNba2V5XS52aXNpdChzeW1ib2xSZW5kZXJWaXNpdG9yKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGJ1ZmZlcjtcbn1cblxuY29uc3Qgc3ltYm9sUmVuZGVyVmlzaXRvcjogU3ltYm9sVmlzaXRvcjxzdHJpbmc+ID0ge1xuXG5cdHZpc2l0SGVhZGVyKHN5bWJvbDogSGVhZGVyU3ltYm9sKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gYFxuJHtyZW5kZXJIZWFkZXIoXCJoMlwiLCBzeW1ib2wuaGFzaCwgaHRtbEVuY29kZShzeW1ib2wuaGVhZGVyKSl9XG4ke3JlbmRlclRleHQoc3ltYm9sLmNvbnRleHQsIHN5bWJvbC5kZXNjcmlwdGlvbil9YDtcblx0fSxcblxuXHR2aXNpdFZhbHVlKHN5bWJvbDogVmFsdWVTeW1ib2wpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgXG4ke3JlbmRlckhlYWRlcihcImgzXCIsIHN5bWJvbC5oYXNoLCByZW5kZXJJZChzeW1ib2wpKX1cbjxkaXYgY2xhc3M9XCJkb2Mtc2VjdGlvblwiPlxuPHA+PGNvZGU+JHtzeW1ib2wub2JqZWN0TmFtZX06ICR7cmVuZGVyVGV4dChzeW1ib2wuY29udGV4dCwgc3ltYm9sLnR5cGUpfTwvY29kZT48L3A+XG4ke3JlbmRlclRleHQoc3ltYm9sLmNvbnRleHQsIHN5bWJvbC5kZXNjcmlwdGlvbil9XG48L2Rpdj5gO1xuXHR9LFxuXG5cdHZpc2l0RnVuY3Rpb24oc3ltYm9sOiBGdW5jdGlvblN5bWJvbCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIGBcbiR7cmVuZGVySGVhZGVyKFwiaDNcIiwgc3ltYm9sLmhhc2gsIHJlbmRlcklkKHN5bWJvbCkpfVxuPGRpdiBjbGFzcz1cImRvYy1zZWN0aW9uXCI+XG48cD48Y29kZT4ke3JlbmRlclRleHQoc3ltYm9sLmNvbnRleHQsIHN5bWJvbC5zaWduYXR1cmUpfTwvY29kZT48L3A+XG4ke3JlbmRlclBhcmFtcyhzeW1ib2wuY29udGV4dCwgc3ltYm9sLnBhcmFtcywgc3ltYm9sLnJldHVybnMpfVxuJHtyZW5kZXJUZXh0KHN5bWJvbC5jb250ZXh0LCBzeW1ib2wuZGVzY3JpcHRpb24pfVxuJHtyZW5kZXJUb3BpY3Moc3ltYm9sLnRvcGljcyl9XG48L2Rpdj5gO1xuXHR9LFxuXG5cdHZpc2l0U3RydWN0KHN5bWJvbDogU3RydWN0U3ltYm9sKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gYFxuJHtyZW5kZXJIZWFkZXIoXCJoM1wiLCBzeW1ib2wuaGFzaCwgcmVuZGVySWQoc3ltYm9sKSl9XG48ZGl2IGNsYXNzPVwiZG9jLXNlY3Rpb25cIj5cbiR7c3ltYm9sLnNpbXBsZSA/IFwiXCIgOiByZW5kZXJIaWVyYXJjaHkoc3ltYm9sKX1cbiR7c3ltYm9sLnNpbXBsZSA/IFwiXCIgOiByZW5kZXJIZWFkZXIoXCJoNFwiLCBgJHtzeW1ib2wuaGFzaH0tLS1kZXNjcmlwdGlvbmAsIFwiRGVzY3JpcHRpb25cIil9XG4ke3JlbmRlclR5cGVWYXJEZWZpbml0aW9ucyhzeW1ib2wpfVxuJHtyZW5kZXJUZXh0KHN5bWJvbC5jb250ZXh0LCBzeW1ib2wuZGVzY3JpcHRpb24pfVxuJHtyZW5kZXJUb3BpY3Moc3ltYm9sLnRvcGljcyl9XG4ke3JlbmRlckNvbnN0cnVjdG9yKHN5bWJvbC5fY29uc3RydWN0b3IpfVxuJHtyZW5kZXJNZW1iZXJzKHN5bWJvbCwgc3ltYm9sLnByb3BlcnRpZXMsIFwicHJvcGVydGllc1wiLCBcIkZpZWxkc1wiLCByZW5kZXJQcm9wZXJ0eSl9XG4ke3JlbmRlck1lbWJlcnMoc3ltYm9sLCBzeW1ib2wubWV0aG9kcywgXCJtZXRob2RzXCIsIFwiTWV0aG9kc1wiLCByZW5kZXJNZXRob2QpfVxuJHtyZW5kZXJNZW1iZXJzKHN5bWJvbCwgc3ltYm9sLnN0YXRpY1Byb3BlcnRpZXMsIFwic3RhdGljUHJvcGVydGllc1wiLCBcIlN0YXRpYyBmaWVsZHNcIiwgcmVuZGVyUHJvcGVydHkpfVxuJHtyZW5kZXJNZW1iZXJzKHN5bWJvbCwgc3ltYm9sLnN0YXRpY01ldGhvZHMsIFwic3RhdGljTWV0aG9kc1wiLCBcIlN0YXRpYyBtZXRob2RzXCIsIHJlbmRlck1ldGhvZCl9XG48L2Rpdj5gXG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJlbmRlcklkKHN5bWJvbDogSVN5bWJvbCkge1xuXHRyZXR1cm4gKHN5bWJvbC5pZCA9PT0gXCJkZWZhdWx0XCIpID8gXCJEZWZhdWx0IGV4cG9ydFwiIDogc3ltYm9sLmlkO1xufVxuXG5mdW5jdGlvbiByZW5kZXJIaWVyYXJjaHkoc3RydWN0OiBTdHJ1Y3RTeW1ib2wpIHtcblx0aWYgKHN0cnVjdC5zaW1wbGUpIHtcblx0XHRyZXR1cm4gXCJcIjtcblx0fVxuXHRjb25zdCBjYWNoZTogU3RydWN0U3ltYm9sW10gPSBbXTtcblx0cmV0dXJuIGBcbiR7cmVuZGVySGVhZGVyKFwiaDRcIiwgYCR7c3RydWN0Lmhhc2h9LS0taGllcmFyY2h5YCwgXCJIaWVyYXJjaHlcIil9XG48dWwgY2xhc3M9XCJkb2MtaGllcmFyY2h5XCI+XG4ke3JlbmRlckhpZXJhcmNoeUhlYWQoc3RydWN0LCBzdHJ1Y3QuaW5oZXJpdGFuY2VMZXZlbCAtIDEsIGNhY2hlKX1cbjxsaT4ke3JlbmRlclRhYihzdHJ1Y3QuaW5oZXJpdGFuY2VMZXZlbCl9JHtzdHJ1Y3Qua2luZH0gPGI+JHtzdHJ1Y3Qub2JqZWN0TmFtZX08L2I+JHtyZW5kZXJUeXBlVmFyc1dpdGhFeHRlbnNpb25zKHN0cnVjdCl9PC9saT5cbiR7cmVuZGVySGllcmFyY2h5VGFpbChzdHJ1Y3QsIHN0cnVjdC5pbmhlcml0YW5jZUxldmVsICsgMSwgY2FjaGUpfVxuPC91bD5gXG59XG5cbmZ1bmN0aW9uIHJlbmRlckhpZXJhcmNoeUhlYWQoc3RydWN0OiBTdHJ1Y3RTeW1ib2wsIGxldmVsOiBudW1iZXIsIGNhY2hlOiBTdHJ1Y3RTeW1ib2xbXSk6IHN0cmluZyB7XG5cdHJldHVybiBzdHJ1Y3QuZXh0ZW5kaW5nLm1hcCgoZXh0ZW5zaW9uKSA9PiB7XG5cdFx0Y29uc3QgZXh0ZW5kZWRTdHJ1Y3QgPSBzdHJ1Y3QucHJvamVjdC5nZXRTdHJ1Y3RCeUV4dGVuc2lvbihleHRlbnNpb24pO1xuXHRcdGlmIChjYWNoZS5pbmRleE9mKGV4dGVuZGVkU3RydWN0KSAhPT0gLTEpIHtcblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdH1cblx0XHRjYWNoZS5wdXNoKGV4dGVuZGVkU3RydWN0KTtcblx0XHRyZXR1cm4gYFxuJHtyZW5kZXJIaWVyYXJjaHlIZWFkKGV4dGVuZGVkU3RydWN0LCBsZXZlbCAtIDEsIGNhY2hlKX1cbjxsaT4ke3JlbmRlclRhYihsZXZlbCl9JHtleHRlbmRlZFN0cnVjdC5raW5kfSAke3JlbmRlclN0cnVjdFJlZmVyZW5jZShleHRlbmRlZFN0cnVjdCwgc3RydWN0LmZpbGUuaWQpfSR7cmVuZGVyVHlwZVZhcnMoZXh0ZW5kZWRTdHJ1Y3QpfTwvbGk+YDtcblx0fSkuam9pbihcIlwiKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVySGllcmFyY2h5VGFpbChzdHJ1Y3Q6IFN0cnVjdFN5bWJvbCwgbGV2ZWw6IG51bWJlciwgY2FjaGU6IFN0cnVjdFN5bWJvbFtdLCBsZXZlbHNMZWZ0PzogbnVtYmVyKTogc3RyaW5nIHtcblx0aWYgKGxldmVsc0xlZnQgPT0gbnVsbCkge1xuXHRcdGxldmVsc0xlZnQgPSBzdHJ1Y3Quc2hvd0luaGVyaXRhbmNlTGV2ZWxzO1xuXHR9IGVsc2UgaWYgKHN0cnVjdC5zaG93SW5oZXJpdGFuY2VMZXZlbHMgIT0gbnVsbCkge1xuXHRcdGxldmVsc0xlZnQgPSBNYXRoLm1pbihsZXZlbHNMZWZ0LCBzdHJ1Y3Quc2hvd0luaGVyaXRhbmNlTGV2ZWxzKTtcblx0fVxuXHRpZiAobGV2ZWxzTGVmdCAhPSBudWxsICYmIGxldmVsc0xlZnQgPD0gMCkge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9XG5cdHJldHVybiBzdHJ1Y3QuZXh0ZW5kZWRCeS5tYXAoKGV4dGVuZGluZ1N0cnVjdCkgPT4ge1xuXHRcdGlmIChjYWNoZS5pbmRleE9mKGV4dGVuZGluZ1N0cnVjdCkgIT09IC0xKSB7XG5cdFx0XHRyZXR1cm4gXCJcIjtcblx0XHR9XG5cdFx0Y2FjaGUucHVzaChleHRlbmRpbmdTdHJ1Y3QpO1xuXHRcdHJldHVybiBgXG48bGk+JHtyZW5kZXJUYWIobGV2ZWwpfSR7ZXh0ZW5kaW5nU3RydWN0LmtpbmR9ICR7cmVuZGVyU3RydWN0UmVmZXJlbmNlKGV4dGVuZGluZ1N0cnVjdCwgc3RydWN0LmZpbGUuaWQpfSR7cmVuZGVyVHlwZVZhcnMoZXh0ZW5kaW5nU3RydWN0KX08L2xpPlxuJHtyZW5kZXJIaWVyYXJjaHlUYWlsKGV4dGVuZGluZ1N0cnVjdCwgbGV2ZWwgKyAxLCBjYWNoZSwgbGV2ZWxzTGVmdCAhPSBudWxsID8gbGV2ZWxzTGVmdCAtIDEgOiBudWxsKX1gO1xuXHR9KS5qb2luKFwiXCIpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJUeXBlVmFycyhzdHJ1Y3Q6IFN0cnVjdFN5bWJvbCkge1xuXHRpZiAoRGljdGlvbmFyeVV0aWxzLmlzRW1wdHkoc3RydWN0LnR5cGV2YXJzKSkge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9XG5cdHJldHVybiBgPHNwYW4gY2xhc3M9XCJtb25vc3BhY2VcIj4mbHQ7JHtPYmplY3Qua2V5cyhzdHJ1Y3QudHlwZXZhcnMpLmpvaW4oXCIsIFwiKX0mZ3Q7PC9zcGFuPmA7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclR5cGVWYXJzV2l0aEV4dGVuc2lvbnMoc3RydWN0OiBTdHJ1Y3RTeW1ib2wpIHtcblx0aWYgKERpY3Rpb25hcnlVdGlscy5pc0VtcHR5KHN0cnVjdC50eXBldmFycykpIHtcblx0XHRyZXR1cm4gXCJcIjtcblx0fVxuXHRyZXR1cm4gYDxzcGFuIGNsYXNzPVwibW9ub3NwYWNlXCI+Jmx0OyR7RGljdGlvbmFyeVV0aWxzLmpvaW4oRGljdGlvbmFyeVV0aWxzLm1hcChzdHJ1Y3QudHlwZXZhcnMsICh0eXBldmFyLCBrZXkpID0+IChcblx0XHRrZXkgKyAodHlwZXZhci5leHRlbmRzLmxlbmd0aCA/IGAgJHtyZW5kZXJUeXBlVmFyRXh0ZW5zaW9ucyhzdHJ1Y3QsIHR5cGV2YXIpfWAgOiBcIlwiKVxuXHQpKSwgXCIsIFwiKX0mZ3Q7PC9zcGFuPmA7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclR5cGVWYXJEZWZpbml0aW9ucyhzdHJ1Y3Q6IFN0cnVjdFN5bWJvbCk6IHN0cmluZyB7XG5cdHJldHVybiByZW5kZXJEZWZpbml0aW9ucyhzdHJ1Y3QuY29udGV4dCwgRGljdGlvbmFyeVV0aWxzLm1hcChzdHJ1Y3QudHlwZXZhcnMsIHR5cGV2YXIgPT4gKFxuXHRcdCh0eXBldmFyLmV4dGVuZHMubGVuZ3RoID8gYCgke3JlbmRlclR5cGVWYXJFeHRlbnNpb25zKHN0cnVjdCwgdHlwZXZhcil9KSBgIDogXCJcIikgKyB0eXBldmFyLmRlc2NyaXB0aW9uXG5cdCkpKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHlwZVZhckV4dGVuc2lvbnMoc3RydWN0OiBTdHJ1Y3RTeW1ib2wsIHR5cGV2YXI6IFR5cGVWYXIpIHtcblx0cmV0dXJuIGBleHRlbmRzICR7dHlwZXZhci5leHRlbmRzLm1hcChleHRlbnNpb24gPT4gKFxuXHRcdHJlbmRlclN0cnVjdFJlZmVyZW5jZShzdHJ1Y3QucHJvamVjdC5nZXRTdHJ1Y3RCeUV4dGVuc2lvbih7XG5cdFx0XHRmaWxlOiBleHRlbnNpb24uZmlsZSxcblx0XHRcdHN5bWJvbDogZXh0ZW5zaW9uLnN5bWJvbFxuXHRcdH0pLCBzdHJ1Y3QuZmlsZS5pZClcblx0KSkuam9pbihcIiAmIFwiKX1gO1xufVxuXG5mdW5jdGlvbiByZW5kZXJUb3BpY3ModG9waWNzOiBEaWN0aW9uYXJ5PFRvcGljPik6IHN0cmluZyB7XG5cdHJldHVybiBEaWN0aW9uYXJ5VXRpbHMuam9pbihEaWN0aW9uYXJ5VXRpbHMubWFwKHRvcGljcywgKHRvcGljLCBrZXkpID0+IGBcblx0XHQke3JlbmRlckhlYWRlcihcImg1XCIsIGtleSwgdG9waWMuaGVhZGVyKX1cblx0XHQke3JlbmRlclRleHQodG9waWMuY29udGV4dCwgdG9waWMudGV4dCl9XG5cdGApLCBcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29uc3RydWN0b3IoY29uc3RyOiBDb25zdHJ1Y3Rvcikge1xuXHRpZiAoIWNvbnN0cikge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9XG5cdHJldHVybiBgXG4ke3JlbmRlckhlYWRlcihcImg0XCIsIGAke2NvbnN0ci5zdHJ1Y3QuaGFzaH0tLS1jb25zdHJ1Y3RvcmAsIFwiQ29uc3RydWN0b3JcIil9XG48cD48Y29kZT5uZXcgJHtjb25zdHIuc3RydWN0Lm9iamVjdE5hbWV9JHtyZW5kZXJUeXBlVmFycyhjb25zdHIuc3RydWN0KX0ke3JlbmRlclRleHQoY29uc3RyLmNvbnRleHQsIGNvbnN0ci5zaWduYXR1cmUpfTwvY29kZT48L3A+XG4ke3JlbmRlckRlZmluaXRpb25zKGNvbnN0ci5jb250ZXh0LCBjb25zdHIucGFyYW1zKX1cbiR7cmVuZGVyVGV4dChjb25zdHIuY29udGV4dCwgY29uc3RyLmRlc2NyaXB0aW9uKX1gO1xufVxuXG5mdW5jdGlvbiByZW5kZXJNZW1iZXJzPFQgZXh0ZW5kcyBJTWVtYmVyPihzdHJ1Y3Q6IFN0cnVjdFN5bWJvbCwgbWVtYmVyczogRGljdGlvbmFyeTxUPiwga2V5OiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlcjogKG1lbWJlcjogVCkgPT4gc3RyaW5nKSB7XG5cdGlmIChEaWN0aW9uYXJ5VXRpbHMuaXNFbXB0eShtZW1iZXJzKSkge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9XG5cdGNvbnN0IHN0ckRpY3QgPSBEaWN0aW9uYXJ5VXRpbHMubWFwKG1lbWJlcnMsIHJlbmRlcmVyKTtcblx0cmV0dXJuIGBcbiR7c3RydWN0LnNpbXBsZSA/IFwiXCIgOiBgJHtyZW5kZXJIZWFkZXIoXCJoNFwiLCBgJHtzdHJ1Y3QuaGFzaH0tLS0ke2tleX1gLCB0aXRsZSl9YH1cbiR7RGljdGlvbmFyeVV0aWxzLmpvaW4oc3RyRGljdCwgXCJcXG5cIil9YDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyUHJvcGVydHkocHJvcGVydHk6IFByb3BlcnR5TWVtYmVyKSB7XG5cdHJldHVybiBgXG4ke3JlbmRlck1lbWJlckhlYWRlcihwcm9wZXJ0eSl9XG48ZGl2IGNsYXNzPVwiZG9jLW1lbWJlciR7cHJvcGVydHkuaXNJbmhlcml0ZWQgPyBcIiBkb2MtaW5oZXJpdGVkXCIgOiBcIlwifVwiPlxuPHA+PGNvZGU+JHtwcm9wZXJ0eS5tb2RpZmllcnMgPyBwcm9wZXJ0eS5tb2RpZmllcnMgKyBcIiBcIiA6IFwiXCJ9JHtwcm9wZXJ0eS5pZH0ke3Byb3BlcnR5Lm9wdGlvbmFsID8gXCI/XCIgOiBcIlwifTogJHtyZW5kZXJUZXh0KHByb3BlcnR5LmNvbnRleHQsIGh0bWxFbmNvZGUocHJvcGVydHkudHlwZSkpfTwvY29kZT48L3A+XG4ke3JlbmRlclRleHQocHJvcGVydHkuY29udGV4dCwgcHJvcGVydHkuZGVzY3JpcHRpb24pfVxuPC9kaXY+YDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyTWV0aG9kKG1ldGhvZDogTWV0aG9kTWVtYmVyKSB7XG5cdHJldHVybiBgXG4ke3JlbmRlck1lbWJlckhlYWRlcihtZXRob2QpfVxuPGRpdiBjbGFzcz1cImRvYy1tZW1iZXIke21ldGhvZC5pc0luaGVyaXRlZCA/IFwiIGRvYy1pbmhlcml0ZWRcIiA6IFwiXCJ9XCI+XG48cD48Y29kZT4ke21ldGhvZC5tb2RpZmllcnMgPyBtZXRob2QubW9kaWZpZXJzICsgXCIgXCIgOiBcIlwifSR7cmVuZGVyVGV4dChtZXRob2QuY29udGV4dCwgaHRtbEVuY29kZShtZXRob2Quc2lnbmF0dXJlKSl9PC9jb2RlPjwvcD5cbiR7cmVuZGVyUGFyYW1zKG1ldGhvZC5jb250ZXh0LCBtZXRob2QucGFyYW1zLCBtZXRob2QucmV0dXJucyl9XG4ke3JlbmRlclRleHQobWV0aG9kLmNvbnRleHQsIG1ldGhvZC5kZXNjcmlwdGlvbil9XG48L2Rpdj5gO1xufVxuXG5mdW5jdGlvbiByZW5kZXJNZW1iZXJIZWFkZXIobWVtYmVyOiBJTWVtYmVyKSB7XG5cdGNvbnN0IHRleHQgPSAhbWVtYmVyLmlzSW5oZXJpdGVkID8gbWVtYmVyLmlkIDpcblx0XHRgPGk+JHttZW1iZXIuaWR9PC9pPiA8c3BhbiBjbGFzcz1cImRvYy1pbmhlcml0LW1hcmtcIj4oaW5oZXJpdGVkIGZyb20gJHtyZW5kZXJSZWZlcmVuY2UobWVtYmVyLmluaGVyaXRlZEZyb20uc2VsZlJlZmVyZW5jZSwgbWVtYmVyLmZpbGUuaWQpfSk8L3NwYW4+YDtcblx0cmV0dXJuIHJlbmRlckhlYWRlcihcImg1XCIsIG1lbWJlci5oYXNoLCB0ZXh0KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVySGVhZGVyKHRhZzogc3RyaW5nLCBpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nKSB7XG5cdHJldHVybiBgPCR7dGFnfT48c3BhbiBpZD1cIiR7aWR9XCI+PC9zcGFuPiR7dGl0bGV9PGEgY2xhc3M9XCJhbmNob3Jqcy1saW5rXCIgaHJlZj1cIiMke2lkfVwiIGFyaWEtbGFiZWw9XCJBbmNob3JcIiBzdHlsZT1cInBhZGRpbmctbGVmdDogMC4zNzVlbTtcIj4jPC9hPjwvJHt0YWd9PmA7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclRhYihsZXZlbDogbnVtYmVyKSB7XG5cdHJldHVybiBgPHNwYW4gc3R5bGU9XCJtYXJnaW4tbGVmdDogJHsyICogbGV2ZWx9ZW1cIj48L3NwYW4+YDtcbn1cbiJdfQ==