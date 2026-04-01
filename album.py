import numpy as np
import pandas as pd
import logging
import requests
import datetime
import psycopg2
from psycopg2.extensions import register_adapter, AsIs
register_adapter(np.int64, AsIs)

hostname = 'localhost'
database = 'music_blog'
username = 'postgres'
pwd = 'password'
port_id = 5432

conn = None
cur = None

file = open("log.txt", "a")
file.write(f"Admin Task executed at {datetime.datetime.now()}\n")
file.close()

PROJECT_ID = "um-ano-e-meio-de-musica"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
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

    # Convert list columns to strings
    for col in ['genres', 'subGenres']:
        df1[col] = df1[col].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)
        df2[col] = df2[col].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)

    # THE FIX: Coerce bad strings to NaN, fill them with 0, and KEEP the row!
    df2['rating'] = pd.to_numeric(df2['rating'], errors='coerce').fillna(0).astype(int)

    logging.info("Data transformed successfully.")
    return df1, df2


def load_music(df1, df2):
    """
    Loads transformed data into the PostgreSQL CMS tables as unpublished drafts.
    """
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(
            host=hostname, dbname=database, user=username, password=pwd, port=port_id
        )
        cur = conn.cursor()
        logging.info("Connected to database successfully.")

        df_combined = pd.concat([df1, df2], ignore_index=True)

        insert_review_query = '''
            INSERT INTO cms_reviews (
                album, artist, image, release_date, genre, subgenres,
                description, context, introduction, breakdown, conclusion,
                similar_albums, comments, score, published
            ) VALUES (%s, %s, %s, %s, %s, %s, '', '', '', '[]', '', '[]', '[]', NULL, FALSE)
            RETURNING id;
        '''

        insert_meta_query = '''
            INSERT INTO cms_list_meta (
                review_id, album, artist, year, image, description, date, genres, subgenres, country, score, published
            ) VALUES (%s, %s, %s, %s, %s, '', %s, %s, %s, %s, NULL, FALSE)
            ON CONFLICT (review_id) DO NOTHING;
        '''

        inserted_count = 0

        for _, row in df_combined.iterrows():
            album_name = row.get('name', '')
            artist_name = row.get('artist', '')

            cur.execute("SELECT id FROM cms_reviews WHERE album = %s AND artist = %s", (album_name, artist_name))
            if cur.fetchone():
                continue 

            image_url = row.get('images', '')
            try:
                release_date = int(row.get('releaseDate'))
            except (ValueError, TypeError):
                release_date = datetime.datetime.now().year
                
            genre = row.get('genres', '')        # ONLY Main Genres
            subgenres = row.get('subGenres', '') # ONLY Subgenres
            artist_origin = row.get('artistOrigin', '')
            current_date = datetime.datetime.now().strftime('%Y-%m-%d')

            # Insert into main table
            cur.execute(insert_review_query, (
                album_name, artist_name, image_url, release_date, genre, subgenres
            ))
            new_review_id = cur.fetchone()[0]

            # Insert into meta table
            cur.execute(insert_meta_query, (
                new_review_id, album_name, artist_name, release_date, image_url, current_date, genre, subgenres, artist_origin
            ))
            
            inserted_count += 1
            conn.commit()

        logging.info(f"Successfully drafted {inserted_count} new albums into the Angular CMS.")

    except Exception as e:
        logging.error(f"Failed to load data to database: {e}")
        if conn is not None:
            conn.rollback()
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    df1_extracted, df2_extracted = extract_music()
    if df1_extracted is not None and df2_extracted is not None:
        transformed_df1, transformed_df2 = transform_music(df1_extracted, df2_extracted)
        load_music(transformed_df1, transformed_df2)