import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import PostCard from '@/components/community/PostCard'
import CategoryFilter from '@/components/community/CategoryFilter'
import postsData from '@/content/posts.json'
import communityData from '@/content/community.json'
import type { Post } from '@/lib/types'

export default function CommunityPage() {
  const posts = postsData as Post[]
  const pinned = posts.filter(p => p.pinned)
  const feed = posts.filter(p => !p.pinned)

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Feed */}
          <div className="flex-1 min-w-0">
            {/* Write a post bar */}
            <div className="post-card p-4 mb-4 flex items-center gap-3">
              <div className="avatar w-9 h-9 bg-brand-100 text-brand-600 text-sm font-semibold">
                {communityData.owner.name.charAt(0)}
              </div>
              <button className="flex-1 text-left text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-2.5 hover:bg-gray-100 transition">
                Escribe algo...
              </button>
            </div>

            {/* Category filters */}
            <CategoryFilter categories={communityData.categories} />

            {/* Posts */}
            <div className="space-y-3 mt-4">
              {pinned.map(post => <PostCard key={post.id} post={post} />)}
              {feed.map(post => <PostCard key={post.id} post={post} />)}
              {posts.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="font-medium">Aún no hay publicaciones</p>
                  <p className="text-sm mt-1">¡Sé la primera en compartir algo!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </main>
    </>
  )
}
