// backend/services/searchService.js
import { searchByKeyword } from '../repositories/searchRepository.js';

export function searchPosts(db, query) {
  return searchByKeyword(db, query);
}
