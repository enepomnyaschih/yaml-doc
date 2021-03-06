import Context from "./Context";
import Dictionary from "./Dictionary";
import Reference from "./models/Reference";
import parseSymbol from "./parseSymbol";
import Project from "./Project";
import ISymbol from "./symbols/ISymbol";
import StructSymbol from "./symbols/Struct";
import * as DictionaryUtils from "./utils/Dictionary";

// TODO: Probably it makes sense to extract base class for tutorials (for now, empty symbol list indicates tutorial).
export default class SourceFile {

	readonly title: string;
	readonly expandImports: boolean;
	readonly description: string;
	readonly symbols: Dictionary<ISymbol>;
	readonly groupTitles: Dictionary<string> = {};
	readonly groups: Dictionary<string[]> = {};
	readonly structs: Dictionary<StructSymbol> = {};
	readonly tokens: string[];
	readonly context: Context;

	currentGroupId: string = "";

	constructor(readonly project: Project, readonly id: string, json: SourceFileJson) {
		this.title = json.title || `${id}${project.name ? ` - ${project.name}` : ""}`;
		this.description = json.description;
		this.tokens = this.id.split('/');
		this.context = new SourceFileContext(this, json.references);
		this.symbols = DictionaryUtils.map(json.symbols, (symbolJson, key) => parseSymbol(this, key, symbolJson)) || {};
		this.expandImports = (json.expandImports != null) ? json.expandImports : (this.symbols.default != null);
	}

	get url() {
		return `${this.id}.html`;
	}

	get token() {
		return this.tokens[this.tokens.length - 1];
	}

	get isModule() {
		return !DictionaryUtils.isEmpty(this.symbols);
	}

	link() {
		DictionaryUtils.forEach(this.structs, (struct) => struct.link());
	}

	inheritMembers() {
		DictionaryUtils.forEach(this.structs, (struct) => struct.inheritMembers());
	}
}

export interface SourceFileJson {

	readonly title?: string;
	readonly expandImports?: boolean;
	readonly description?: string;
	readonly symbols?: any;
	readonly references?: Dictionary<Reference>;
}

class SourceFileContext extends Context {

	constructor(readonly sourceFile: SourceFile, references: Dictionary<Reference>) {
		super(references);
	}

	get parent(): Context {
		return this.sourceFile.project.context;
	}

	get project(): Project {
		return this.sourceFile.project;
	}

	get fileId(): string {
		return this.sourceFile.id;
	}

	protected get name(): string {
		return this.sourceFile.id;
	}

	protected getDefaultReference(key: string): Reference {
		if (key === this.sourceFile.token && this.sourceFile.isModule) {
			return {};
		}
		const symbol = this.sourceFile.symbols[key];
		return symbol ? symbol.selfReference : null;
	}
}
