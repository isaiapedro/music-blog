function rowToReview(row) {
  return {
    // ... keep your existing mappings ...
    comments: Array.isArray(row.comments) ? row.comments : [],
    score: row.score != null ? Number(row.score) : null,
    published: Boolean(row.published),
  };
}

function rowToListMeta(row) {
  return {
    // ... keep your existing mappings ...
    country: row.country || '',
    score: row.score != null ? Number(row.score) : null,
    published: Boolean(row.published),
  };
}