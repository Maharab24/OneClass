import axiosInstance from './axiosInstance'

export const registerUser = (payload) =>
  axiosInstance.post('/auth/register', payload).then((res) => res.data)

export const loginUser = (payload) =>
  axiosInstance.post('/auth/login', payload).then((res) => res.data)
