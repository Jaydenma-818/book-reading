import { auth } from './firebase'

/**
 * Calls the backend with the current user's Firebase ID token attached. The
 * backend verifies that token and derives the row owner from it, so no request
 * from here ever carries a user id of its own.
 */
async function request(path, { method = 'GET', body } = {}) {
  const user = auth?.currentUser
  if (!user) throw new Error('You are signed out. Please sign in again.')

  // Returns a cached token, refreshing only when it is close to expiring.
  const token = await user.getIdToken()

  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`)
  }
  return data
}

export function listBooks(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/books${query}`)
}

export function createBook(book) {
  return request('/books', { method: 'POST', body: book })
}

export function updateBook(id, book) {
  return request(`/books/${id}`, { method: 'PUT', body: book })
}

export function deleteBook(id) {
  return request(`/books/${id}`, { method: 'DELETE' })
}
