import { Marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { JSDOM } from "jsdom";

interface Props {
  input: string;
}

const marked = new Marked();

function getDompurify() {
  const window = new JSDOM().window;
  const instance = DOMPurify(window);

  instance.addHook("afterSanitizeAttributes", (node) => {
    if (node.hasAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  return instance;
}

const dompurify = getDompurify();

export default async function Markdown({ input }: Props) {
  const html = dompurify.sanitize(await marked.parse(input));
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
