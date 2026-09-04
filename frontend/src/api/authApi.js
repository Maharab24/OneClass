import axiosInstance from './axiosInstance'

export const registerUser = (payload) =>
  axiosInstance.post('/auth/register', payload).then((res) => res.data)

export const loginUser = (payload) =>
  axiosInstance.post('/auth/login', payload).then((res) => res.data)

export const verifyOtp = (payload) =>
  axiosInstance.post('/auth/verify-otp', payload).then((res) => res.data)

export const resendOtp = (payload) =>
  axiosInstance.post('/auth/resend-otp', payload).then((res) => res.data)
