export type InlineMark = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
};

export type RichBlock =
  | { type: "heading"; level: 2 | 3; children: InlineMark[] }
  | { type: "paragraph"; children: InlineMark[] }
  | { type: "list"; ordered: boolean; items: InlineMark[][] }
  | { type: "image"; src: string };

const EMPTY_HTML = new Set(["", "<p></p>", "<p><br></p>", "<p><br/></p>"]);

export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const trimmed = html.trim();
  if (EMPTY_HTML.has(trimmed)) return true;
  if (/<img\s/i.test(trimmed)) return false;
  return trimmed.replace(/<[^>]+>/g, "").trim() === "";
}

export function parseRichText(html: string): RichBlock[] {
  if (typeof window === "undefined" || isRichTextEmpty(html)) return [];

  const document = new DOMParser().parseFromString(html, "text/html");
  const blocks: RichBlock[] = [];

  for (const node of Array.from(document.body.childNodes)) {
    const parsed = parseBlock(node);
    if (parsed) blocks.push(...parsed);
  }

  return blocks;
}

function parseBlock(node: ChildNode): RichBlock[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? [{ type: "paragraph", children: [{ text }] }] : [];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  if (tag === "h2" || tag === "h3") {
    return [
      {
        type: "heading",
        level: tag === "h2" ? 2 : 3,
        children: collectInline(element),
      },
    ];
  }
  if (tag === "p") {
    const image = element.querySelector("img");
    if (image?.getAttribute("src")) {
      return [{ type: "image", src: image.getAttribute("src") ?? "" }];
    }
    const children = collectInline(element);
    return children.length > 0 ? [{ type: "paragraph", children }] : [];
  }
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(element.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((item) => collectInline(item));
    return items.length > 0 ? [{ type: "list", ordered: tag === "ol", items }] : [];
  }
  if (tag === "img") {
    const src = element.getAttribute("src");
    return src ? [{ type: "image", src }] : [];
  }
  if (tag === "blockquote" || tag === "div") {
    return Array.from(element.childNodes).flatMap(parseBlock);
  }

  const children = collectInline(element);
  return children.length > 0 ? [{ type: "paragraph", children }] : [];
}

function collectInline(element: Element): InlineMark[] {
  const marks: InlineMark[] = [];

  const walk = (node: ChildNode, bold: boolean, italic: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0) marks.push({ text, bold, italic });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const child = node as HTMLElement;
    const tag = child.tagName.toLowerCase();
    if (tag === "br") {
      marks.push({ text: "\n", bold, italic });
      return;
    }
    if (tag === "img") return;
    if (tag === "a") {
      const href = child.getAttribute("href") ?? "";
      const text = child.textContent ?? href;
      if (text) marks.push({ text, bold, italic, href });
      return;
    }

    const nextBold = bold || tag === "strong" || tag === "b";
    const nextItalic = italic || tag === "em" || tag === "i";
    Array.from(child.childNodes).forEach((nested) => walk(nested, nextBold, nextItalic));
  };

  Array.from(element.childNodes).forEach((node) => walk(node, false, false));
  return marks.filter((mark) => mark.text.length > 0);
}

export function isPdfSafeImage(src: string): boolean {
  if (/^data:image\/(png|jpeg|jpg);/i.test(src)) return true;
  if (/^https?:\/\/.+\.(png|jpe?g)(\?|#|$)/i.test(src)) return true;
  return /^https?:\/\/[^/]*supabase\.(co|in)\/storage\/v1\/object\/public\//i.test(src)
    && /(?:png|jpe?g)/i.test(src);
}
