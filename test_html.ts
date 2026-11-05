import {getText, HtmlTokenizer, isToken, Token} from "./HtmlTokenizer";
import {ElementDef, Parser} from "./parser";
import {PeekingTokenizer} from "./PeekingTokenizer";

main();
// testRegex();

function main() {
    let text = "abcd";
    // let cursor = new Cursor(text);
    // let c = cursor.getUpTo("x");
    // if(c)
    //     console.log(cursor.getText(c.start, c.length));
    //
    // return;
    // text = "<div id='test' class='test2'>Hello {name} and <span>World</span></div>";
    // text = "<div id='DaAjdee' class='{DaClaz}'>Hello {DaNaym} and <span>World</span></div>";
    let zever="zever";
    text = "<div>Hello <img id='daImazz' src='{daSrc}'/></div>";
    text = `"<div>Hello <img id='daImazz' src='{daSrc} ' toggle brol='${zever}'></div>"`;
    console.log(text);
    // printTokens(text);
    // return;
    let parser = new Parser(new PeekingTokenizer(new HtmlTokenizer(text)));
    let elements = parser.parse();
    console.log(JSON.stringify(elements, null, 2));

    let placeholders = generateAllPlaceHolders(elements);
    console.log(JSON.stringify(placeholders, null, 2));

}

type PlaceHolderType = "content" | "attribute";
interface PlaceHolder {
    placeHolderId: string;
    elementId: string; //todo: bundle per element. ElementFiller contains a list of placeholders.
    type: PlaceHolderType;
    nodeIndex: number;  //todo: make this depend on type.
    attributeName: string; //todo: make this depend on type.
    textParts: string[]; //place placeholder text in between each array item.
}

function generateAllPlaceHolders(nodes: (ElementDef | string)[]) {
    let placeholders: PlaceHolder[] = [];
    //recursively generate placeholders.
    for(let i = 0; i < nodes.length; i++) {
        let element = nodes[i];
        if (typeof element == "string") {
            throw new Error("Top level text can't have placeholders.");
        } else
            generateElementPlaceHolders(element, placeholders);

    }
    return placeholders;
}

function generateElementPlaceHolders(element: ElementDef, placeHolders: PlaceHolder[]): void {
    let attDef = element.attributes.get("id");
    let id = attDef == null ? null : (attDef.value == null ? null : getText(attDef.value));
    // generate attribute placeholders.
    for (let [attributeName, attrValue] of element.attributes) {
        if (attrValue.value == null)
            continue;
        let attrValueText = getText(attrValue.value);
        if (attrValueText.includes("{")) {
            if (attDef == null)
                throw new Error("Element must have an id to use placeholders.");
            placeHolders.push(
                ...createTextPlaceholders(
                    attrValue.value,
                    "attribute",
                    id??"--no id--",
                    -1,
                    attributeName,
                )
            );
        }
    }
    // generate content placeholders.
    for (let [i, node] of element.nodes.entries()) {
        if (isToken(node)) {
            placeHolders.push(
                ...createTextPlaceholders(
                    node,
                    "content",
                    id??"--no id--",
                    i,
                    "",
                )
            );
        } else {
            generateElementPlaceHolders(node, placeHolders);
        }
    }
}

function createTextPlaceholders(token: Token, type: PlaceHolderType, elementId: string | undefined, nodeIndex: number, attributeName: string): PlaceHolder[] {
    let text = token.cursor.getText(token.pos, token.length);
    if (!text.includes("{")) {
        return [];
    }
    if (elementId == null)
        throw new Error("Element must have an id to use placeholders.");

    let placeholders: PlaceHolder[] = [];
    let rx = /{(\S+)}/gm;
    let match: RegExpExecArray | null;
    while((match = rx.exec(text)) != null) {
        let name = match[1];
        placeholders.push({
            placeHolderId: match[1],
            elementId,
            type,
            nodeIndex,
            attributeName,
            textParts: text.split(match[0]),
        });
    }

    return placeholders;
}

function testRegex() {
    let text = "Hello name and age...";
    let rx = /{(\S+)}/gm;
    let match: RegExpExecArray | null;
    while((match = rx.exec(text)) != null) {
        console.log(match[0], match[1]);
    }
}

function printTokens(text: string) {
    let tok  = new HtmlTokenizer(text);
    while (true) {
        let t = tok.next();
        if (t == null)
            break;
        let txt = getText(t);
        if (txt == ">" || txt == "/>")
            console.log(`|${txt}`);
        else
            process.stdout.write(`|${txt}`);
    }
}
