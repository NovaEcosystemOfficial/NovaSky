# 10 - Database futuro

## Obiettivo

NovaSky deve conservare dati locali affidabili: cataloghi, preferenze, sessioni, luoghi, scoring cache e storico risultati.

## Tecnologia

Room su SQLite.

Motivo: e standard Android, stabile, testabile, ottimo per offline-first e query locali.

## Entita principali

### observing_sites

- id
- name
- latitude
- longitude
- elevation
- bortle_class
- timezone
- notes

### telescope_profiles

- id
- model
- aperture_mm
- focal_length_mm
- sensor_width_px
- sensor_height_px
- pixel_size_um
- storage_gb
- notes

### targets

- id
- catalog
- catalog_id
- name
- type
- ra
- dec
- magnitude
- angular_size
- season
- recommended_filter
- tags

### target_user_notes

- id
- target_id
- rating
- notes
- favorite
- avoid_reason

### night_plans

- id
- site_id
- telescope_profile_id
- date
- status
- created_at

### night_plan_items

- id
- plan_id
- target_id
- start_time
- end_time
- priority
- recommended_duration_min
- filter
- notes

### sessions

- id
- plan_id
- site_id
- telescope_profile_id
- started_at
- ended_at
- sky_quality
- moon_phase
- weather_summary
- notes

### capture_runs

- id
- session_id
- target_id
- started_at
- ended_at
- exposure_count
- exposure_seconds
- filter
- mode
- result_rating
- file_reference

### weather_snapshots

- id
- site_id
- timestamp
- cloud_cover
- seeing
- transparency
- humidity
- temperature
- wind_speed
- dew_point
- source

### device_events

- id
- session_id
- timestamp
- device_model
- event_type
- payload_json

## Cache

Tabelle cache:

- ephemeris_cache;
- visibility_cache;
- novascore_cache;
- api_response_cache.

Motivo: molte query dipendono da data, luogo e target; cache riduce consumo API e migliora uso offline.

## Migrazioni

Ogni versione database deve avere migration esplicita. Non usare fallback distruttivo in release.

## Privacy

La posizione dell'utente e sensibile. Default:

- dati locali;
- export manuale;
- sync opzionale futura;
- cancellazione completa semplice.

## Evoluzione cloud

Fase futura:

- sync cifrata;
- profilo utente;
- backup logbook;
- piani condivisibili;
- community recipes.

Il modello locale deve restare autoritativo per evitare dipendenza cloud.
