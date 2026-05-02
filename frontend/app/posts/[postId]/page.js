import AppShell from "@/components/layout/app-shell";
import PostDetailData from "@/components/data/post-detail-data";
import BackButton from "@/components/navigation/back-button";

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
