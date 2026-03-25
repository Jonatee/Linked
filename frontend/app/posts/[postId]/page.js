import AppShell from "@/components/layout/app-shell";
import PostDetailData from "@/components/data/post-detail-data";
import BackButton from "@/components/navigation/back-button";

export default async function PostDetailPage({ params }) {
  const { postId } = await params;

  return (
    <AppShell>
      <BackButton />
      <PostDetailData postId={postId} />
    </AppShell>
  );
}
