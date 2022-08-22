CREATE STREAM youtube_videos (
  video_id VARCHAR KEY,
  title VARCHAR,
  views INTEGER,
  comments INTEGER,
  likes INTEGER
) WITH (
  KAFKA_TOPIC = 'youtube_videos',
  PARTITIONS = 1,
  VALUE_FORMAT = 'avro'
);

CREATE TABLE youtube_changes WITH (KAFKA_TOPIC='youtube_changes') AS SELECT
  video_id,
  latest_by_offset(title) AS title,
  latest_by_offset(comments, 2)[1] AS comments_previous,
  latest_by_offset(comments, 2)[2] AS comments_current,
  latest_by_offset(views, 2)[1] AS views_previous,
  latest_by_offset(views, 2)[2] AS views_current,
  latest_by_offset(likes, 2)[1] AS likes_previous,
  latest_by_offset(likes, 2)[2] AS likes_current
FROM youtube_videos
GROUP BY video_id
EMIT CHANGES;

CREATE STREAM youtube_changes_stream WITH (KAFKA_TOPIC='youtube_changes', VALUE_FORMAT='avro');

INSERT INTO telegram_outbox
SELECT
  '<your chat id>' AS `chat_id`,
  CONCAT(
    'Likes changed: ',
    CAST(likes_previous AS STRING),
    ' => ',
    CAST(likes_current AS STRING),
    '. ',
    title
  ) AS `text`
FROM youtube_changes_stream
WHERE likes_current <> likes_previous;

INSERT INTO telegram_outbox
SELECT
  '<your chat id>' AS `chat_id`,
  CONCAT(
    'Comments changed: ',
    CAST(comments_previous AS STRING),
    ' => ',
    CAST(comments_current AS STRING),
    '. ',
    title
  ) AS `text`
FROM youtube_changes_stream
WHERE comments_current <> likes_previous;

-- A views notification would be too chatty. Only send an alert if we
--  pass through a multiple of 200 views.
INSERT INTO telegram_outbox
SELECT
  '<your chat id>' AS `chat_id`,
  CONCAT(
    'Views changed: ',
    CAST(views_previous AS STRING),
    ' => ',
    CAST(views_current AS STRING),
    '. ',
    title
  ) AS `text`
FROM youtube_changes_stream
WHERE
  round(views_current / 200) * 200
  <>
  round(views_previous / 200) * 200
;
