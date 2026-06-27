import os
import json
import time
import logging
import requests
import psycopg2
from dotenv import load_dotenv
load_dotenv(override=True)

MB_BASE_URL = "https://musicbrainz.org/ws/2"
MB_INC = "recordings+labels+artist-rels+place-rels+media"
MB_RATE_LIMIT_SLEEP = 1.1
MB_RETRY_SLEEP = 5
DEFAULT_BATCH_SIZE = 25
REQUEST_TIMEOUT = 15

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def get_db_connection():
    host = os.environ['DB_HOST']
    sslmode = 'disable' if host in ('localhost', '127.0.0.1') else 'require'
    return psycopg2.connect(
        host=host,
        dbname=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        port=os.environ.get('DB_PORT', 5432),
        sslmode=sslmode,
        connect_timeout=10
    )


def build_user_agent():
    name = os.environ.get('MUSICBRAINZ_USER_AGENT', 'MusicBlogEnricher/1.0')
    contact = os.environ.get('MUSICBRAINZ_CONTACT_EMAIL', '').strip()
    if contact:
        return f"{name} ( {contact} )"
    return name


def build_session():
    session = requests.Session()
    session.headers.update({
        'User-Agent': build_user_agent(),
        'Accept': 'application/json'
    })
    return session


def find_candidates(cur, limit):
    cur.execute(
        """
        SELECT id, album, artist
        FROM cms_reviews
        WHERE musicbrainz_mbid IS NULL
          AND (
            label IS NULL OR label = ''
            OR tracklist IS NULL OR tracklist = '[]'::jsonb
          )
        ORDER BY id ASC
        LIMIT %s
        """,
        (limit,)
    )
    return cur.fetchall()


def mb_get(session, path, params):
    url = f"{MB_BASE_URL}/{path}"
    response = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
    if response.status_code == 503:
        time.sleep(MB_RETRY_SLEEP)
        response = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json()


def escape_lucene(value):
    return value.replace('\\', '\\\\').replace('"', '\\"')


def search_release(session, artist, album):
    if not artist or not album:
        return None
    query = f'artist:"{escape_lucene(artist)}" AND release:"{escape_lucene(album)}"'
    data = mb_get(session, 'release', {'query': query, 'fmt': 'json', 'limit': 5})
    releases = data.get('releases') or []
    if not releases:
        return None
    return releases[0].get('id')


def fetch_release(session, mbid):
    return mb_get(session, f'release/{mbid}', {'inc': MB_INC, 'fmt': 'json'})


def format_ms(ms):
    if not ms:
        return ''
    total_seconds = int(round(ms / 1000))
    hours, rem = divmod(total_seconds, 3600)
    minutes, seconds = divmod(rem, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def parse_enrichment(release):
    labels = []
    for entry in release.get('label-info') or []:
        label = entry.get('label') or {}
        name = label.get('name')
        if name and name not in labels:
            labels.append(name)

    tracklist = []
    total_ms = 0
    seen_titles = set()

    def normalize(title):
        return title.lower().strip()

    def add_medium(medium, offset=0):
        for track in medium.get('tracks') or []:
            length = track.get('length') or 0
            total_ms_ref[0] += length
            position = track.get('position')
            try:
                number = int(position) if position is not None else len(tracklist) + 1
            except (TypeError, ValueError):
                number = len(tracklist) + 1
            title = track.get('title', '')
            seen_titles.add(normalize(title))
            tracklist.append({
                'number': number + offset,
                'title': title,
                'duration': format_ms(length)
            })

    total_ms_ref = [0]
    media = release.get('media') or []
    for i, medium in enumerate(media):
        if i == 0:
            add_medium(medium)
        else:
            tracks = medium.get('tracks') or []
            new_titles = [t.get('title', '') for t in tracks]
            overlap = sum(1 for t in new_titles if normalize(t) in seen_titles)
            # skip if >50% of tracks already seen (format variant like SACD/vinyl/remaster)
            if tracks and overlap / len(tracks) > 0.5:
                continue
            add_medium(medium, offset=len(tracklist))

    total_ms = total_ms_ref[0]

    producers = []
    recorded_at = []
    for rel in release.get('relations') or []:
        rel_type = rel.get('type')
        if rel_type == 'producer':
            name = (rel.get('artist') or {}).get('name')
            if name and name not in producers:
                producers.append(name)
        elif rel_type == 'recorded at':
            name = (rel.get('place') or {}).get('name')
            if name and name not in recorded_at:
                recorded_at.append(name)

    return {
        'label': ', '.join(labels),
        'tracklist': tracklist,
        'total_duration': format_ms(total_ms) if total_ms else '',
        'producer': ', '.join(producers),
        'recorded_at': ', '.join(recorded_at)
    }


def update_review(cur, review_id, mbid, data):
    cur.execute(
        """
        UPDATE cms_reviews
        SET label = %s,
            tracklist = %s::jsonb,
            total_duration = %s,
            producer = %s,
            recorded_at = %s,
            musicbrainz_mbid = %s,
            enriched_at = NOW(),
            updated_at = NOW()
        WHERE id = %s
        """,
        (
            data['label'],
            json.dumps(data['tracklist']),
            data['total_duration'],
            data['producer'],
            data['recorded_at'],
            mbid,
            review_id
        )
    )


def mark_mbid_only(cur, review_id, mbid):
    cur.execute(
        """
        UPDATE cms_reviews
        SET musicbrainz_mbid = %s,
            enriched_at = NOW(),
            updated_at = NOW()
        WHERE id = %s
        """,
        (mbid, review_id)
    )


def has_enrichment(data):
    return any([
        data['label'],
        data['tracklist'],
        data['total_duration'],
        data['producer'],
        data['recorded_at']
    ])


def enrich_batch(batch_size=None):
    batch_size = batch_size or int(os.environ.get('ENRICH_BATCH_SIZE', DEFAULT_BATCH_SIZE))
    session = build_session()
    conn = None
    cur = None
    processed = 0
    updated = 0
    skipped = 0
    errors = 0

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        candidates = find_candidates(cur, batch_size)
        logging.info(f"Found {len(candidates)} candidates for enrichment (batch size {batch_size}).")

        for review_id, album, artist in candidates:
            processed += 1
            logging.info(f"[{processed}/{len(candidates)}] Enriching '{album}' by '{artist}' (id={review_id})")

            try:
                mbid = search_release(session, artist or '', album or '')
                time.sleep(MB_RATE_LIMIT_SLEEP)

                if not mbid:
                    logging.warning(f"No MusicBrainz match for '{album}' by '{artist}' - leaving mbid NULL for retry.")
                    skipped += 1
                    continue

                release = fetch_release(session, mbid)
                time.sleep(MB_RATE_LIMIT_SLEEP)

                data = parse_enrichment(release)
                if has_enrichment(data):
                    update_review(cur, review_id, mbid, data)
                    updated += 1
                    logging.info(f"Updated id={review_id} with mbid={mbid}")
                else:
                    mark_mbid_only(cur, review_id, mbid)
                    skipped += 1
                    logging.info(f"MusicBrainz returned no usable fields for id={review_id}; stored mbid={mbid} to avoid re-query.")

                conn.commit()

            except requests.exceptions.RequestException as e:
                errors += 1
                logging.error(f"MusicBrainz error for id={review_id}: {e}")
                conn.rollback()
            except Exception as e:
                errors += 1
                logging.error(f"Enrichment failed for id={review_id}: {e}")
                conn.rollback()

        result = {
            'processed': processed,
            'updated': updated,
            'skipped': skipped,
            'errors': errors
        }
        logging.info(f"Enrichment batch complete: {result}")
        return result

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def lambda_handler(event, context):
    logging.info("album_enrich lambda execution started.")
    batch_size = None
    if isinstance(event, dict) and 'batch_size' in event:
        try:
            batch_size = int(event['batch_size'])
        except (TypeError, ValueError):
            batch_size = None
    result = enrich_batch(batch_size)
    logging.info("album_enrich lambda execution finished.")
    return {'statusCode': 200, 'body': result}


if __name__ == "__main__":
    enrich_batch()
