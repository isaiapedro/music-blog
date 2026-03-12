import json
import logging
import os
import requests
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

PROJECT_ID = os.environ.get("ALBUMS_PROJECT_ID", "um-ano-e-meio-de-musica")
API_BASE = "https://1001albumsgenerator.com/api/v1"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "cms"
OUTPUT_FILE = OUTPUT_DIR / "reviews.json"


def fetch_album_list():
    try:
        url = f"{API_BASE}/projects/{PROJECT_ID}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error("Failed to fetch API data: %s", e)
        return None


def album_to_list_meta(album, index, history_row=None):
    images = album.get("images") or []
    image_url = images[0]["url"] if images else ""
    genres = album.get("genres") or []
    subgenres = album.get("subGenres") or []
    genre_str = ", ".join(genres) if isinstance(genres, list) else str(genres)
    sub_str = ", ".join(subgenres) if isinstance(subgenres, list) else str(subgenres)
    return {
        "id": index + 1,
        "album": album.get("name", ""),
        "artist": album.get("artist", ""),
        "year": album.get("releaseDate") or 0,
        "image": image_url,
        "description": (history_row.get("review") or "")[:300] if history_row else "",
        "date": history_row.get("completedDate", "") if history_row else "",
        "genres": genre_str,
        "subgenres": sub_str,
        "country": album.get("artistOrigin", ""),
    }


def album_to_review_content(album, index, history_row=None):
    images = album.get("images") or []
    image_url = images[0]["url"] if images else ""
    genres = album.get("genres") or []
    subgenres = album.get("subGenres") or []
    genre_str = ", ".join(genres) if isinstance(genres, list) else str(genres)
    review_text = (history_row.get("review") or "").strip() if history_row else ""

    breakdown = []
    if review_text:
        breakdown.append({
            "type": "paragraph",
            "content": review_text,
        })

    spotify_id = album.get("spotifyId") or ""
    youtube_id = album.get("youtubeMusicId") or ""
    if spotify_id or youtube_id:
        breakdown.append({
            "type": "music",
            "title": album.get("name", ""),
            "spotifyId": spotify_id if spotify_id else None,
            "youtubeMusicId": youtube_id if youtube_id else None,
            "content": "",
        })

    return {
        "id": index + 1,
        "album": album.get("name", ""),
        "artist": album.get("artist", ""),
        "image": image_url,
        "releaseDate": album.get("releaseDate") or 0,
        "label": "",
        "genre": genre_str,
        "description": (review_text[:200] + "..." if len(review_text) > 200 else review_text) or "No description.",
        "context": "",
        "introduction": "",
        "breakdown": breakdown,
        "conclusion": "",
        "similarAlbums": [],
        "comments": [],
    }


def build_similar_albums(albums, current_index, limit=3):
    similar = []
    indices = [
        (current_index - 2) % len(albums),
        (current_index + 1) % len(albums),
        (current_index + 2) % len(albums),
    ]
    for i in indices[:limit]:
        if 0 <= i < len(albums):
            a = albums[i]
            images = a.get("images") or []
            similar.append({
                "id": i + 1,
                "album": a.get("name", ""),
                "artist": a.get("artist", ""),
                "image": images[0]["url"] if images else "",
            })
    return similar


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

    list_meta = []
    reviews = []

    for idx, (album, history_row) in enumerate(all_albums):
        list_meta.append(album_to_list_meta(album, idx, history_row))
        review = album_to_review_content(album, idx, history_row)
        review["similarAlbums"] = build_similar_albums([a for a, _ in all_albums], idx)
        reviews.append(review)

    payload = {"reviews": reviews, "listMeta": list_meta}
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    logging.info("Exported %s reviews to %s", len(reviews), OUTPUT_FILE)


if __name__ == "__main__":
    run()
