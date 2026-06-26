import { cookies } from 'next/headers'
import { verifyJWT } from './jwt'

export async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    return null
  }
  
  return verifyJWT(token)
}
