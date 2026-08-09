import {getText, HtmlTokenizer} from "./HtmlTokenizer";

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

}