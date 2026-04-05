import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProjectsPage.css'

interface Project {
  id: number
  name: string
  description: string
  status: string
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ username: string } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token) {
      navigate('/login')
      return
    }

    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    // 模拟项目数据，实际应该从 API 获取
    setTimeout(() => {
      setProjects([
        { id: 1, name: '项目 A', description: '这是一个演示项目', status: '进行中' },
        { id: 2, name: '项目 B', description: '另一个演示项目', status: '已完成' },
        { id: 3, name: '项目 C', description: '第三个项目', status: '待开始' },
      ])
      setLoading(false)
    }, 500)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="projects-container">
      <header className="projects-header">
        <h1>项目管理</h1>
        <div className="header-right">
          <span className="user-info">欢迎, {user?.username || '用户'}</span>
          <button onClick={handleLogout} className="logout-button">
            退出登录
          </button>
        </div>
      </header>

      <main className="projects-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-description">{project.description}</p>
                <span className={`project-status status-${project.status}`}>
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ProjectsPage
