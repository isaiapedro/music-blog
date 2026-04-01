def run():
    data = fetch_album_list()
    if not data:
        logging.warning("No API data; keeping existing reviews.json if present.")
        return

    history = data.get("history") or []
    all_albums = []
    for h in history:
        alb = h.get("album")
        if alb:
            all_albums.append((alb, h))

    # --- 1. LOAD EXISTING EDITS ---
    # Read the existing reviews.json so we don't overwrite your manual work
    existing_reviews = {}
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                for r in old_data.get("reviews", []):
                    # Use Album + Artist as a unique identifier key
                    key = f"{r.get('album', '')}---{r.get('artist', '')}"
                    existing_reviews[key] = r
        except Exception as e:
            logging.error("Could not load existing reviews.json: %s", e)

    list_meta = []
    reviews = []

    for idx, (album, history_row) in enumerate(all_albums):
        key = f"{album.get('name', '')}---{album.get('artist', '')}"
        old_review = existing_reviews.get(key, {})

        # --- 2. BUILD BASE DATA ---
        meta = album_to_list_meta(album, idx, history_row)
        review = album_to_review_content(album, idx, history_row)
        review["similarAlbums"] = build_similar_albums([a for a, _ in all_albums], idx)

        # --- 3. MERGE MANUAL EDITS ---
        # Keep existing manual inputs, or initialize defaults for new albums
        meta["published"] = old_review.get("published", False)
        review["published"] = old_review.get("published", False)
        review["score"] = old_review.get("score", None)
        review["introduction"] = old_review.get("introduction", "")
        review["conclusion"] = old_review.get("conclusion", "")
        
        # Preserve custom breakdown blocks if you edited them
        if old_review.get("breakdown"):
            review["breakdown"] = old_review["breakdown"]

        list_meta.append(meta)
        reviews.append(review)

    payload = {"reviews": reviews, "listMeta": list_meta}
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    logging.info("Exported %s reviews to %s", len(reviews), OUTPUT_FILE)