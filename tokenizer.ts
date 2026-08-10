import {Token} from "./HtmlTokenizer";

export interface Tokenizer {
    next(): Token | null;
    clone(): Tokenizer;
}