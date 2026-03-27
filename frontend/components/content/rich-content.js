import Link from "next/link";

const ENTITY_PATTERN = /([#@][A-Za-z0-9_]+)/g;

function renderLine(line, lineIndex) {
  const parts = line.split(ENTITY_PATTERN);

  return parts.map((part, partIndex) => {
    if (!part) {
      return null;
    }

    const key = `${lineIndex}-${partIndex}-${part}`;

    if (part.startsWith("#")) {
      return (
        <Link
          key={key}
          href={`/search?q=${encodeURIComponent(part)}`}
          className="font-medium text-accent transition hover:text-white"
        >
          {part}
        </Link>
      );
    }

    if (part.startsWith("@")) {
      const username = part.slice(1);

      return (
        <Link
          key={key}
          href={`/profile/${encodeURIComponent(username)}`}
          className="font-medium text-accent transition hover:text-white"
        >
          {part}
        </Link>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

export default function RichContent({ content = "", className = "" }) {
  const lines = String(content || "").split("\n");

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <span key={`${index}-${line}`} className="block">
          {renderLine(line, index)}
        </span>
      ))}
    </div>
  );
}
