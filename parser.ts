import {PeekingTokenizer} from "./PeekingTokenizer";
import {Token, TokenType} from "./HtmlTokenizer";

export type Nodes = (ElementDef | string)[];

export interface ElementDef {
    tag: string;
    nodes: Nodes;
    attributes: Map<string, string>;
}

export class Parser {
    tok: PeekingTokenizer;

    constructor(tok: PeekingTokenizer) {
        this.tok = tok;
    }

    parse() {
        let elements: ElementDef[] = [];
        while(true) {
            let element = this.parseElement();
            if(element == null)
                break;
            elements.push(element);
        }

        let next = this.tok.next();
        if(next)
            this.throwAt(`Unexpected token: ${next.type}`, next);
        return elements;
    }


    parseElement(): ElementDef | null {
        let t = this.tok.next();
        if(t == null)
            return null;
        if (t.type == "<") {
            t = this.match("IDENT");
            if(t == null)
                this.throwAt("Expected IDENT", t);
            let name = t.cursor.getText(t.pos, t.length);
            let attributes = this.parseAttributes();
            t = this.tok.next();
            if(t == null)
                this.throwAt("Unexpected EOF", null);
            if(this.match("/>")) {
                return {
                    tag: name,
                    nodes: [],
                    attributes,
                };
            }
            if (t.type != ">") {
                this.throwAt("Expected > or />", t);
            }
            let content = this.parseElementContent();
            this.parseClosingTag(t, name);
            return {
                tag: name,
                nodes: content,
                attributes,
            };
        }
        return null;
    }

    private parseClosingTag(t: Token, name: string) {
        if (this.match("</")) {
            let t = this.match("IDENT");
            let closeName = t?.cursor.getText(t.pos, t.length);
            if (closeName == null)
                this.throwAt("Expected IDENT", t);
            if (closeName != name)
                this.throwAt(`Expected </${name}>`, t);
            if (this.match(">"))
                return;
            this.throwAt("Expected >", t);
        }
        return t;
    }

    parseElementContent(): Nodes {
        let content: Nodes = [];
        while(true) {
            let t = this.tok.peek();
            if (t == null)
                this.throwAt("Unexpected EOF", null);
            if (t.type == "<") {
                let child = this.parseElement();
                if (child == null)
                    break;
                content.push(child);
            } else if (t.type == "</") {
                break;
            } else {
                let text = this.tok.next()!.cursor.getText(t.pos, t.length);
                content.push(text);
            }
        }
        return content;
    }

    parseAttributes(): Map<string, string> {
        let attrs: Map<string, string> = new Map();
        while(true) {
            let t = this.tok.peek();
            if (t == null)
                this.throwAt("Unexpected EOF", null);
            if (t.type == ">" || t.type == "/>")
                break;
            if (t.type == "IDENT") {
                let attrName = this.match("IDENT")!.cursor.getText(t.pos, t.length);
                let eq = this.match("=");
                if (eq == null)
                    this.throwAt("Expected =", t);
                t = this.match("STRING");
                if (t == null)
                    this.throwAt("Expected STRING", t);
                let attrValue = t.cursor.getText(t.pos, t.length);
                if (attrValue == null)
                    this.throwAt("Expected =", t);
                attrs.set(attrName, this.stripStringDelimiters(attrValue));
                continue;
            }
            this.throwAt("Expected IDENT", t);
        }
        return attrs;
    }

    match(expected: TokenType) {
        let peek = this.tok.peek();
        if (peek?.type == expected) {
            return this.tok.next()!;
        }

        return null;
    }

    stripStringDelimiters(text: string) {
        if (text[0] === "'" || text[0] === '"') {
            return text.substring(1, text.length - 1);
        }
        return text;
    }

    printLocation(token: Token) {
        let {line, col} = token.cursor.getLocation(token.pos);
        return `line ${line}, col ${col}\n${token.cursor.getLine(token.pos)}\n${" ".repeat(col-1)}^`;
    }

    throwAt(message: string, token: Token | null): never {
        if(token)
            throw new Error(`${message}\n  at ${this.printLocation(token)}`);
        else
            throw new Error(`${message}\n  at EOF`);
    }


}