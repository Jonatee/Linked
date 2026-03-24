import AppShell from "@/components/layout/app-shell";
import PostDetailData from "@/components/data/post-detail-data";

export default async function PostDetailPage({ params }) {
  const { postId } = await params;

  return (
    <AppShell>
      <PostDetailData postId={postId} />
    </AppShell>
  );
}
