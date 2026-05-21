import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.msg || err.message || '网络错误'
    console.error('[API Error]', msg)
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
    }
    return Promise.reject(err)
  }
)

export default api
