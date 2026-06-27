import os
import numpy as np
import pandas as pd
import logging
import requests
import datetime
import psycopg2
from dotenv import load_dotenv
load_dotenv(override=True)
from psycopg2.extensions import register_adapter, AsIs
register_adapter(np.int64, AsIs)

PROJECT_ID = "um-ano-e-meio-de-musica"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def get_db_connection():
    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        dbname=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        port=os.environ.get('DB_PORT', 5432)
    )


def extract_music():
    logging.info("Requesting API data...")
    try:
        response = requests.get(f"https://1001albumsgenerator.com/api/v1/projects/{PROJECT_ID}")
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch data: {e}")
        return None, None

    data = response.json()

    # Current album
    current_album = data['currentAlbum']
    current = pd.DataFrame({
        'artist': current_album.get('artist', ''),
        'artistOrigin': current_album.get('artistOrigin', ''),
        'images': current_album['images'][0]['url'] if current_album.get('images') else '',
        'genres': [current_album.get('genres', [])],
        'subGenres': [current_album.get('subGenres', [])],
        'name': current_album.get('name', ''),
        'releaseDate': current_album.get('releaseDate', ''),
        'youtubeMusicId': current_album.get('youtubeMusicId', ''),
        'spotifyId': current_album.get('spotifyId', '')
    }, index=[0])

    logging.info(f"Extracted current album: {current['name'][0]} by {current['artist'][0]}")

    # Past albums
    history = pd.DataFrame(data['history'])
    past_albums = pd.DataFrame(history['album'].tolist())

    albums_df = pd.DataFrame()
    albums_df['artist'] = past_albums['artist']
    albums_df['name'] = past_albums['name']
    albums_df['artistOrigin'] = past_albums.get('artistOrigin', '')
    albums_df['releaseDate'] = past_albums['releaseDate']
    albums_df['images'] = past_albums['images'].apply(lambda x: x[0]['url'] if isinstance(x, list) and len(x) > 0 else '')
    albums_df['genres'] = past_albums['genres'].apply(lambda x: x if isinstance(x, list) else [])
    albums_df['subGenres'] = past_albums['subGenres'].apply(lambda x: x if isinstance(x, list) else [])
    albums_df['rating'] = history['rating']
    albums_df['globalRating'] = history['globalRating']
    albums_df['review'] = history['review']
    albums_df['youtubeMusicId'] = past_albums.get('youtubeMusicId', '')

    logging.info("Data extracted successfully.")
    return current, albums_df


def transform_music(df1, df2):
    logging.info("Transforming data...")

    for col in ['genres', 'subGenres']:
        df1[col] = df1[col].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)
        df2[col] = df2[col].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)

    df2['rating'] = pd.to_numeric(df2['rating'], errors='coerce').fillna(0).astype(int)

    logging.info("Data transformed successfully.")
    return df1, df2


def load_music(df1, df2):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        logging.info("Connected to database successfully.")

        df_combined = pd.concat([df1, df2], ignore_index=True)
        inserted_count = 0
        updated_count = 0

        for _, row in df_combined.iterrows():
            album_name = row.get('name', '')
            artist_name = row.get('artist', '')

            image_url = row.get('images', '')
            try:
                release_date = int(row.get('releaseDate'))
            except (ValueError, TypeError):
                release_date = datetime.datetime.now().year

            genre = row.get('genres', '')
            subgenres = row.get('subGenres', '')
            artist_origin = row.get('artistOrigin', '')
            description = row.get('review', '')
            current_date = datetime.datetime.now().strftime('%Y-%m-%d')

            cur.execute("SELECT id FROM cms_reviews WHERE album = %s AND artist = %s", (album_name, artist_name))
            existing_row = cur.fetchone()

            if existing_row:
                review_id = existing_row[0]

                cur.execute('''
                    UPDATE cms_reviews
                    SET image = %s, release_date = %s, genre = %s, subgenres = %s, description = %s, country = %s, updated_at = NOW()
                    WHERE id = %s
                ''', (image_url, release_date, genre, subgenres, description, artist_origin, review_id))

                cur.execute('''
                    UPDATE cms_list_meta
                    SET image = %s, year = %s, genres = %s, subgenres = %s, country = %s, description = %s
                    WHERE review_id = %s
                ''', (image_url, release_date, genre, subgenres, artist_origin, description, review_id))

                updated_count += 1

            else:
                cur.execute('''
                    INSERT INTO cms_reviews (
                        album, artist, image, release_date, genre, subgenres, description, country,
                        context, introduction, breakdown, conclusion,
                        similar_albums, comments, score, published,
                        tracklist, total_duration, producer, recorded_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, '', '', '[]', '', '[]', '[]', NULL, FALSE, '[]', '', '', '')
                    RETURNING id;
                ''', (album_name, artist_name, image_url, release_date, genre, subgenres, description, artist_origin))

                new_review_id = cur.fetchone()[0]

                cur.execute('''
                    INSERT INTO cms_list_meta (
                        review_id, album, artist, year, image, date, genres, subgenres, country, description, score, published
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NULL, FALSE)
                ''', (new_review_id, album_name, artist_name, release_date, image_url, current_date, genre, subgenres, artist_origin, description))

                inserted_count += 1

            conn.commit()

        logging.info(f"Successfully inserted {inserted_count} new albums and updated {updated_count} existing albums.")
        return {"inserted": inserted_count, "updated": updated_count}

    except Exception as e:
        logging.error(f"Failed to load data to database: {e}")
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def lambda_handler(event, context):
    """AWS Lambda entry point — triggered by EventBridge on a schedule."""
    logging.info("Lambda execution started.")

    df1_extracted, df2_extracted = extract_music()
    if df1_extracted is None or df2_extracted is None:
        return {"statusCode": 500, "body": "Failed to extract data from API"}

    transformed_df1, transformed_df2 = transform_music(df1_extracted, df2_extracted)
    result = load_music(transformed_df1, transformed_df2)

    logging.info("Lambda execution finished.")
    return {"statusCode": 200, "body": result}


# Local development entry point
if __name__ == "__main__":
    df1_extracted, df2_extracted = extract_music()
    if df1_extracted is not None and df2_extracted is not None:
        transformed_df1, transformed_df2 = transform_music(df1_extracted, df2_extracted)
        load_music(transformed_df1, transformed_df2)
