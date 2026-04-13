export interface Post {
  id: string
  title: string
  content: string
  category: string
  author: {
    name: string
    avatar: string
    level: number
    isOwner?: boolean
  }
  pinned: boolean
  likes: number
  comments: number
  createdAt: string
  image: string | null
  videoUrl: string | null
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  modules: CourseModule[]
}

export interface CourseModule {
  id: string
  title: string
  duration: string
  type: 'video' | 'activity' | 'coming-soon'
  videoUrl: string | null
  description: string
  free: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  timezone: string
  duration: string
  type: 'live' | 'meditation' | 'workshop'
  meetingUrl: string
  recurring: boolean
  recurringDay?: string
}
