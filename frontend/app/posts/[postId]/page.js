import AppShell from "@/components/layout/app-shell";
import PostDetailData from "@/components/data/post-detail-data";
import BackButton from "@/components/navigation/back-button";
import { LINKED_LOGO_URL } from "@/lib/brand";

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

function getMetadataBase() {
  try {
    return new URL(APP_ORIGIN);
  } catch {
    return new URL("http://localhost:3000");
  }
}

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function truncateText(value = "", maxLength = 180) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getPreviewImage(post) {
  const mediaItems = [...(post?.media || []), ...(post?.originalPost?.media || [])];
  const target = mediaItems.find((item) => item?.thumbnailUrl || item?.secureUrl);

  if (!target) {
    return `${APP_ORIGIN}${LINKED_LOGO_URL}`;
  }

  return target.thumbnailUrl || target.secureUrl || `${APP_ORIGIN}${LINKED_LOGO_URL}`;
}

async function getPostPreview(postId) {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { postId } = await params;
  const post = await getPostPreview(postId);
  const authorName =
    post?.author?.profile?.displayName ||
    post?.author?.usernameDisplay ||
    post?.author?.username ||
    "Someone";
  const previewText = truncateText(
    post?.content || post?.quoteText || post?.originalPost?.content || post?.originalPost?.quoteText || ""
  );
  const title = `${authorName} on LInked`;
  const description = previewText || "See this post on LInked.";
  const imageUrl = getPreviewImage(post);
  const canonicalPath = `/posts/${postId}`;

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: "article",
      url: canonicalPath,
      title,
      description,
      siteName: "LInked",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: previewText || `Post by ${authorName}`
            }
          ]
        : []
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : []
    }
  };
}

export default async function PostDetailPage({ params }) {
  const { postId } = await params;

  return (
    <AppShell requireAuth={false}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/home" className="hidden lg:inline-flex" />
          <h1 className="editorial-title text-2xl font-black text-white">Post</h1>
        </div>
        <PostDetailData postId={postId} />
      </div>
    </AppShell>
  );
}
