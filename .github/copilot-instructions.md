# Rota Econômica

- The frontend is a standalone Angular application in `frontend/`; user-facing copy is Brazilian Portuguese.
- The REST API is Java 21 with Spring Boot in `backend/`; money values use `BigDecimal`.
- PostgreSQL schema changes are versioned in `backend/src/main/resources/db/migration` and Hibernate schema generation stays disabled.
- Fuel economy measurements use full-tank-to-full-tank odometer intervals. Do not infer that additive fuel is more economical without measured cost-per-kilometer data.
- Live station search, geolocation, authentication, and cloud synchronization require explicit provider credentials/configuration; do not present demo/local data as live or synced.
