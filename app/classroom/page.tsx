import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import coursesData from '@/content/courses.json'
import { PlayCircle, Clock, Lock, CheckCircle, ChevronDown } from 'lucide-react'
import type { Course } from '@/lib/types'

export default function ClassroomPage() {
  const courses = coursesData as Course[]

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">Classroom</h1>
            <p className="text-sm text-gray-500 mb-6">Tu espacio de aprendizaje — accede a todos los cursos y lecciones.</p>

            <div className="space-y-4">
              {courses.map((course) => (
                <CourseAccordion key={course.id} course={course} />
              ))}
            </div>

            {/* Empty state placeholder */}
            {courses.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📚</div>
                <p className="font-medium">Próximamente...</p>
                <p className="text-sm mt-1">Los cursos estarán disponibles muy pronto.</p>
              </div>
            )}
          </div>
          <Sidebar />
        </div>
      </main>
    </>
  )
}

function CourseAccordion({ course }: { course: Course }) {
  return (
    <details className="post-card overflow-hidden group" open={course.id === 'course-1'}>
      <summary className="flex items-center gap-4 p-4 cursor-pointer list-none select-none hover:bg-gray-50 transition">
        {/* Thumbnail placeholder */}
        <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
          <PlayCircle size={22} className="text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{course.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
          <p className="text-xs text-gray-400 mt-1">{course.modules.length} lecciones</p>
        </div>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>

      {/* Modules list */}
      <div className="border-t border-gray-100">
        {course.modules.map((mod, idx) => (
          <div key={mod.id}
            className={`flex items-center gap-3 px-4 py-3 text-sm transition
              ${mod.type === 'coming-soon' ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-500">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{mod.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{mod.description}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {mod.duration && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  {mod.duration}
                </span>
              )}
              {mod.free ? (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">Gratis</span>
              ) : mod.type !== 'coming-soon' ? (
                <Lock size={13} className="text-gray-400" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
