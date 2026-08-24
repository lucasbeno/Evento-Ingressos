import client from './client'
import type { CatalogEventResponse } from '../types'

export function searchCatalog(keyword: string) {
  return client
    .get<CatalogEventResponse[]>('/organizer/catalog/search', { params: { keyword } })
    .then((r) => r.data)
}
