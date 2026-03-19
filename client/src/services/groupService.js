import api from './api'

const groupService = {
  // Get all groups
  getAllGroups: async () => {
    const response = await api.get('/groups')
    return response.data
  },

  // Get paginated groups
  getPaginatedGroups: async (page = 1, limit = 10, search = '') => {
    const response = await api.get(`/groups/paginated?page=${page}&limit=${limit}&search=${search}`)
    return response.data
  },

  // Get single group
  getGroup: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`)
    return response.data
  },

  // Create group
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData)
    return response.data
  },

  // Update group
  updateGroup: async (groupId, groupData) => {
    const response = await api.put(`/groups/${groupId}`, groupData)
    return response.data
  },

  // Delete group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`)
    return response.data
  },

  // Get group statistics
  getGroupStats: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/stats`)
    return response.data
  },

  // Export groups
  exportGroups: async (format = 'csv') => {
    const response = await api.get(`/groups/export?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Bulk create groups
  bulkCreateGroups: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/groups/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

export default groupService