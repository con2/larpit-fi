import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";

interface Props {
  input: string;
}

export default function Markdown({ input }: Props) {
  return (
    <ReactMarkdown
      rehypePlugins={[
        rehypeSanitize,
        [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
      ]}
    >
      {input}
    </ReactMarkdown>
  );
}
