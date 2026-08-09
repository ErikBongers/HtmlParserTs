import {PeekingTokenizer} from "./PeekingTokenizer";
import {getText, Token, TokenType} from "./indentTokenizer";


export class Parser {
    tok: PeekingTokenizer;

    constructor(tok: PeekingTokenizer) {
        this.tok = tok;
    }

    parse() {
        let res = this.parsePlus(0);
        let next = this.tok.next();
        if(next)
            this.throwAt(`Unexpected token: ${next.type}`, next);
        return res;
    }


    parseElement(currentIndent: number): ElementDef {
        let tag = this.tok.next();
        let id = undefined;
        let atts: AttDef[] = [];
        let classList: string[] = [];
        let innerText: string | undefined = undefined;

        if (!tag) {
            this.throwAt("Unexpected end of stream. Tag expected.", tag);
        }

        while (this.tok.peek()) {
            if (this.match(".")) {
                let className = this.tok.next();
                if (!className) {
                    this.throwAt("Unexpected end of stream. Class name expected.", className);
                }
                classList.push(getText(className));
                continue;
            }
            if (this.match("[")) {
                atts = this.parseAttributes(currentIndent);
                continue;
            }
            if (this.match("#")) {
                let idToken = this.tok.next();
                if (!idToken) {
                    this.throwAt("Unexpected end of stream. ID expected.", idToken);
                }
                id = getText(idToken);
                continue;
            }
            let textToken = this.match("TEXT");
            if (textToken) {
                innerText = getText(textToken);
                continue;
            }
            break;
        }
        return {
            tag: getText(tag),
            id,
            atts,
            classList,
            innerText,
            child: this.parseDown(currentIndent),
        };
    }

    // parse >...
    parseDown(currentIndent: number): EmmetNode | undefined {
        if (this.match(">")) {
            return this.parsePlus(currentIndent);
        }
        let indentToken = this.tok.peek();
        if(indentToken?.type == "INDENT" && indentToken?.length > currentIndent) {
            this.tok.next();
            return this.parsePlus(indentToken?.length);
        }
        return undefined;
    }

    parseAttributes(currentIndent: number) {
        let attDefs: AttDef[] = [];
        while (true) {
            if (this.match("]")) {
                break;
            }
            let att = this.parseAttribute(currentIndent);
            if (att) {
                attDefs.push(att);
            } else {
                break;
            }
        }
        return attDefs;
    }

    parseAttribute(currentIndent: number) {
        let nameToken = this.tok.next();
        if (!nameToken) {
            return null;
        }
        let name = getText(nameToken);
        if (name[0] === ",") {
            this.throwAt("Unexpected ',' - don't separate attributes with ','.", nameToken);
        }
        let eq = this.tok.next();
        if (!eq) {
            this.throwAt("Unexpected end of stream. '=' expected.", eq);
        }
        let subToken: Token | null;
        let sub: string = "";
        if (eq.type === ".") {
            subToken = this.tok.next();
            if (subToken) {
                sub = getText(subToken);
            }
            eq = this.tok.next();
        }
        if (eq?.type != "=") {
            this.throwAt("Equal sign expected.", eq);
        }
        let valueToken = this.tok.next();
        if (!valueToken) {
            this.throwAt("Value expected", valueToken);
        }
        if(valueToken.type != "STRING" && valueToken.type != "NUMBER") {
            this.throwAt(`Value should be STRING or NUMBER. Found ${valueToken.type}.`, valueToken);
        }
        let value = getText(valueToken);
        if (value[0] === '"') {
            value = this.stripStringDelimiters(value);
        }
        return { name, sub, value } satisfies AttDef as AttDef;
    }

    match(expected: TokenType) {
        let peek = this.tok.peek();
        if (peek?.type == expected) {
            return this.tok.next()!;
        }

        return null;
    }

    stripStringDelimiters(text: string) {
        if (text[0] === "'" || text[0] === '"' || text[0] === "{") {
            return text.substring(1, text.length - 1);
        }
        return text;
    }

    printLocation(token: Token) {
        let {line, col} = token.cursor.getLocation(token.pos);
        return `line ${line}, col ${col}\n${token.cursor.getLine(token.pos)}\n${" ".repeat(col-1)}^`;
    }

    throwAt(mesagee: string, token: Token | null): never {
        if(token)
            throw new Error(`${mesagee}\n  at ${this.printLocation(token)}`);
        else
            throw new Error(`${mesagee}\n  at EOF`);
    }


}