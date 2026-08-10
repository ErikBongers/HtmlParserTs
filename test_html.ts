import {getText, HtmlTokenizer} from "./HtmlTokenizer";
import {Parser} from "./parser";
import {PeekingTokenizer} from "./PeekingTokenizer";

main();

function main() {
    let text = "<div id='test'></div>";
    let tok  = new HtmlTokenizer(text);
    console.log(text);
    while(true) {
        let t = tok.next();
        if(t == null)
            break;
        let txt = getText(t);
        if(txt == ">" || txt == "/>")
            console.log(txt);
        else
            process.stdout.write(txt+" ");
    }

    let parser = new Parser(new PeekingTokenizer(new HtmlTokenizer(text)));
    let elements = parser.parse();
    console.log(elements);

    text = "<div id='test' class='test2'>Hello</div>";
    parser = new Parser(new PeekingTokenizer(new HtmlTokenizer(text)));
    elements = parser.parse();
    console.log(elements);

    text = "<div id='test' class='test2'>Hello <span>World</span></div>";
    parser = new Parser(new PeekingTokenizer(new HtmlTokenizer(text)));
    elements = parser.parse();
    console.log(JSON.stringify(elements, null, 2));

}