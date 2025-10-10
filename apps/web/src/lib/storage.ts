const ACCESS = 'hefa_access_token'
const REFRESH = 'hefa_refresh_token'

export function saveTokens(a?: string, r?: string) {
  if (a) localStorage.setItem(ACCESS, a)
  if (r) localStorage.setItem(REFRESH, r)
}

export function getAccess() {
  return localStorage.getItem(ACCESS) || ''
}
export function getRefresh() {
  return localStorage.getItem(REFRESH) || ''
}
export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}
