import {Token} from "./HtmlTokenizer.ts";

export interface Tokenizer {
    next(): Token | null;
    clone(): Tokenizer;
}