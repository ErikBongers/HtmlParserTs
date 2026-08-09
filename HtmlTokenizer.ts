import {Cursor, CursorRange} from "./cursor";
import {Tokenizer} from "./tokenizer";

export type TokenType = "<" | ">" | "/>" | "</" | "IDENT" | "=" | "STRING" | "NUMBER" | "UNKNOWN";

export interface Token {
    type: TokenType;
    cursor: Cursor;
    pos: number;
    length: number;
}

export function getText(token: Token) {
    return token.cursor.getText(token.pos, token.length);
}

export class HtmlTokenizer implements Tokenizer {
    private cursor: Cursor;

    constructor(text: string) {
        this.cursor = new Cursor(text);
    }

    public setCursor(cursor: Cursor) {
        this.cursor = cursor;
    }

    public cloneCursor() {
        return Cursor.copy(this.cursor);
    }

    clone() {
        let theClone = new IndentTokenizer("");
        theClone.setCursor(this.cloneCursor());
        return theClone;
    }

    next(): Token | null {
        this.skipWhiteSpace();
        let char = this.cursor.next();
        let found: CursorRange | null;
        let id = this.eatId(char);
        if(id)
            return id;
        switch (char) {
            case "":
                return null;
            case '<':
                if(this.cursor.peek() == "/") {
                    this.cursor.next();
                    return {
                        type: "</",
                        cursor: this.cursor,
                        pos: this.cursor.pos-1,
                        length: 2,
                    }
                } else {
                    return {
                        type: "<",
                        cursor: this.cursor,
                        pos: this.cursor.pos,
                        length: 1,
                    };
                }
            case '>':
            case '=':
                return {
                    type: char as TokenType,
                    cursor: this.cursor,
                    pos: this.cursor.pos,
                    length: 1,
                };
            case "/":
                if(this.cursor.peek() == ">") {
                    this.cursor.next();
                    return {
                        type: "/>",
                        cursor: this.cursor,
                        pos: this.cursor.pos-1,
                        length: 2,
                    }
                } else {
                    return {
                        type: "UNKNOWN",
                        cursor: this.cursor,
                        pos: this.cursor.pos,
                        length: 1,
                    };
                }
            case '"':
                found = this.cursor.getTo('"');//todo: handle escape chars.
                if(found) {
                    return {
                        type: "STRING",
                        cursor: this.cursor,
                        pos: found.start,
                        length: found.length-1,
                    }
                }
                return {
                    type: "UNKNOWN",
                    cursor: this.cursor,
                    pos: this.cursor.pos,
                    length: 1,
                };
            case "'":
                found = this.cursor.getTo("'");//todo: handle escape chars.
                if(found) {
                    return {
                        type: "STRING",
                        cursor: this.cursor,
                        pos: found.start,
                        length: found.length-1,
                    }
                }
                return {
                    type: "UNKNOWN",
                    cursor: this.cursor,
                    pos: this.cursor.pos,
                    length: 1,
                };
            default:
                return {
                    type: "UNKNOWN",
                    cursor: this.cursor,
                    pos: this.cursor.pos,
                    length: 1,
                };
        }
    }

    private eatId(char: string) {
        let pos = this.cursor.pos;
        if(char.match(/[a-zA-Z\-]/)) {
            while (this.cursor.peek().match(/[a-zA-Z0-9_\-]/)) {
                this.cursor.next();
            }
            return {
                type: "ID",
                cursor: this.cursor,
                pos,
                length: this.cursor.pos - pos+1,
            } satisfies Token as Token;
        }
        return null;
    }

    private skipWhiteSpace() {
        while(this.cursor.peek().match(/[ \t\n\r]/)) {
            this.cursor.next();
        }
    }
}