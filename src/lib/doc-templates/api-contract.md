# API Contract

> Define the interface between clients and services for integration and testing.

## Base URL & Versioning

<!-- Guiding question: Where is the API hosted? How do we version it? -->

*Document base URL(s), versioning strategy (path, header, or query), and environment differences.*

## Authentication

<!-- Guiding question: How do clients authenticate? What tokens or keys are required? -->

*Describe auth method: API key, OAuth, JWT, etc. Include header names and example values.*

## Endpoints

<!-- Guiding question: What operations are available? What are the routes and methods? -->

| Method | Path | Description |
|--------|------|-------------|
| *GET* | *`/resource`* | *List or retrieve resources* |
| *POST* | *`/resource`* | *Create a new resource* |
| *PUT* | *`/resource/:id`* | *Update a resource* |
| *DELETE* | *`/resource/:id`* | *Remove a resource* |

## Request & Response Schemas

<!-- Guiding question: What does each endpoint expect and return? -->

*Include example payloads, field types, required vs optional, and nested structures.*

## Error Codes

<!-- Guiding question: What errors can occur? How are they structured? -->

*Document HTTP status codes, error response format, and meaning of each code (e.g., 400 validation, 401 unauthorized, 404 not found).*
