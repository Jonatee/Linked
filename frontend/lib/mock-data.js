export const sampleFeed = [
  {
    id: "post-1",
    author: { name: "Ada", username: "ada", initials: "AD" },
    content: "LInked is taking shape with a modular backend, square identity system, and fast-feeling feed interactions.",
    createdAtLabel: "2m",
    media: [],
    stats: { likeCount: 18, commentCount: 6, repostCount: 3, bookmarkCount: 9 }
  },
  {
    id: "post-2",
    author: { name: "Tunde", username: "tunde", initials: "TU" },
    content: "Content review tools should feel intentional, not bolted on. Building the moderator workflow directly into phase one makes the product safer as it grows.",
    createdAtLabel: "19m",
    media: [
      { id: "media-1", type: "image", url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80" }
    ],
    stats: { likeCount: 42, commentCount: 12, repostCount: 11, bookmarkCount: 14 }
  }
];

export const sampleComments = [
  {
    id: "comment-1",
    author: { name: "Maya", initials: "MA" },
    content: "The square avatar treatment feels distinct. It gives the product an identity immediately."
  },
  {
    id: "comment-2",
    author: { name: "Seun", initials: "SE" },
    content: "Would love optimistic repost and bookmark interactions next."
  }
];

export const sampleNotifications = [
  {
    id: "notification-1",
    actor: { name: "Tunde", initials: "TU" },
    message: "liked your post about moderation tooling"
  },
  {
    id: "notification-2",
    actor: { name: "Ada", initials: "AD" },
    message: "followed you"
  }
];

